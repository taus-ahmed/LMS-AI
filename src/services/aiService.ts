// src/services/aiService.ts
// ─── Groq LLM Integration Service ────────────────────────────────────
// Handles all AI communication for the AdaptLearn LMS platform.
// Uses Llama 3 70B via Groq for fast inference.

import type { StudentProfile, ProjectBrief, Milestone } from '../types/student';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY?.trim();
const MODEL = 'llama-3.3-70b-versatile';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callGroq(
  messages: GroqMessage[],
  temperature: number = 0.7,
  maxTokens: number = 2048
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Missing Groq API key. Set VITE_GROQ_API_KEY in your environment.');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Groq API error:', response.status, errorBody);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── Build context about the student for system prompts ──────────────
function buildStudentContext(student: StudentProfile): string {
  const completedModules = student.weekModules
    .filter((w) => w.status === 'completed')
    .map((w) => `  - Week ${w.week}: ${w.title} (Score: ${w.score}%) — Topics: ${w.topics.join(', ')}`)
    .join('\n');

  const currentModule = student.weekModules.find((w) => w.status === 'current');
  const upcomingModules = student.weekModules
    .filter((w) => w.status === 'locked')
    .map((w) => `  - Week ${w.week}: ${w.title} — Topics: ${w.topics.join(', ')}`)
    .join('\n');

  const skills = student.skills
    .map((s) => `  - ${s.name}: ${s.score}/100 (trend: ${s.trend})`)
    .join('\n');

  const strongSkills = student.skills
    .filter((s) => s.score >= 75)
    .map((s) => s.name)
    .join(', ');

  const weakSkills = student.skills
    .filter((s) => s.score < 65)
    .map((s) => s.name)
    .join(', ');

  return `
STUDENT PROFILE:
  Name: ${student.name}
  ID: ${student.studentId}
  Course: ${student.course} (${student.courseCode})
  Semester: ${student.semester}
  Current Week: ${student.currentWeek} of ${student.totalWeeks}
  Overall Progress: ${student.overallProgress}%
  GPA: ${student.gpa}

SKILL PROFICIENCY:
${skills}
  Strongest areas: ${strongSkills || 'N/A'}
  Weakest areas: ${weakSkills || 'N/A'}

COMPLETED MODULES:
${completedModules}

CURRENT MODULE:
  Week ${currentModule?.week}: ${currentModule?.title} — Topics: ${currentModule?.topics.join(', ')}

UPCOMING MODULES (syllabus preview):
${upcomingModules}
`.trim();
}

// ═══════════════════════════════════════════════════════════════════════
// MENTOR CHAT — Real-time conversational AI
// ═══════════════════════════════════════════════════════════════════════

const MENTOR_SYSTEM_PROMPT = `You are the AI Project Mentor for AdaptLearn, an adaptive learning management system for engineering students. Your name is "Mentor AI" and you guide students through their coursework and personalized industry projects.

YOUR ROLE & PERSONALITY:
- You are a supportive, knowledgeable engineering mentor with industry experience.
- You use the Socratic method — guide students to discover answers rather than giving direct solutions.
- You are warm but professional, encouraging but honest about gaps.
- You ask reflective questions to deepen understanding.
- You connect theoretical concepts to real-world engineering practice.
- You proactively remind students about upcoming milestones and deadlines.
- Keep responses concise (2-4 paragraphs max). Don't write essays.

YOUR CAPABILITIES:
- Clarify project requirements and expectations
- Guide students through engineering design decisions
- Explain technical concepts from the course syllabus
- Provide milestone-aligned feedback and reminders
- Help students think through trade-offs (not give answers)
- Encourage documentation of engineering decisions
- Suggest resources and approaches for weak areas

RULES:
- NEVER write code or give complete solutions. Guide the thinking process.
- ALWAYS relate advice back to their specific course content and skill levels.
- When a student is struggling (low scores in a skill), be extra supportive and break things into smaller steps.
- When a student excels, challenge them with deeper questions and stretch goals.
- Reference specific weeks/modules from their coursework when relevant.
- If the student has a project, reference its milestones and deliverables.
- Use markdown-like formatting sparingly: use **bold** for emphasis, bullet points for lists.`;

export async function getMentorResponse(
  student: StudentProfile,
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const studentContext = buildStudentContext(student);

  const projectContext = student.project
    ? `
CURRENT PROJECT: "${student.project.title}"
  Problem: ${student.project.problemStatement}
  Milestones:
${student.project.milestones.map((m) => `    - ${m.title} (${m.status}) — Due: ${m.dueDate}, ~${m.estimatedHours}h`).join('\n')}
  Total estimated hours: ${student.project.totalEstimatedHours}h
  Deliverables: ${student.project.deliverables.join(', ')}
`
    : '\nPROJECT: Not yet generated.';

  const systemMessage = `${MENTOR_SYSTEM_PROMPT}

${studentContext}
${projectContext}

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

  // Build message history (keep last 10 exchanges for context window)
  const recentHistory = conversationHistory.slice(-20);
  const messages: GroqMessage[] = [
    { role: 'system', content: systemMessage },
    ...recentHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await callGroq(messages, 0.7, 1024);
    return response;
  } catch (error) {
    console.error('Mentor AI error:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PROJECT GENERATION — AI-curated industry project
// ═══════════════════════════════════════════════════════════════════════

const PROJECT_GEN_SYSTEM_PROMPT = `You are an expert engineering curriculum designer and industry project architect. Your job is to generate a personalized, industry-grade project brief for an engineering student based on their course syllabus, demonstrated competencies, and skill gaps.

The project MUST:
1. Be realistic — modeled after actual industry problems
2. Be achievable within the remaining weeks of the semester
3. Challenge the student's weak areas while leveraging their strengths
4. Directly apply concepts from the completed course modules
5. Include professional deliverables (reports, schematics, code, presentations)
6. Have clear milestones with estimated hours

You must respond with ONLY valid JSON, no markdown, no backticks, no explanation. The JSON must match this exact structure:

{
  "title": "string - compelling project title",
  "context": "string - 2-3 sentence industry scenario that motivates the project",
  "problemStatement": "string - clear engineering problem statement (3-4 sentences)",
  "goals": ["string - 4-6 specific learning/engineering goals tied to course modules"],
  "constraints": ["string - 4-6 realistic project constraints (budget, size, power, etc.)"],
  "technicalRequirements": ["string - 6-8 specific technical requirements"],
  "deliverables": ["string - 5-7 professional deliverables"],
  "milestones": [
    {
      "id": "ms-1",
      "title": "string",
      "description": "string - what the student needs to accomplish",
      "dueDate": "YYYY-MM-DD",
      "status": "todo",
      "estimatedHours": number,
      "deliverables": ["string - 2-4 specific deliverables for this milestone"]
    }
  ],
  "totalEstimatedHours": number
}

IMPORTANT:
- Generate 5-6 milestones spread across the remaining weeks
- Each milestone should build on previous ones
- If a student has low scores in certain skills, add preparatory tasks in early milestones
- If a student excels in areas, include stretch goals and advanced requirements
- Total estimated hours should be 40-60 hours depending on complexity
- Due dates should start from next week and be spaced 1-2 weeks apart`;

export async function generateAIProject(student: StudentProfile): Promise<ProjectBrief> {
  const studentContext = buildStudentContext(student);

  const remainingWeeks = student.totalWeeks - student.currentWeek;
  const today = new Date();

  const userPrompt = `Generate a personalized industry-grade project for this student.

${studentContext}

IMPORTANT CONTEXT:
- There are ${remainingWeeks} weeks remaining in the semester
- Today's date is ${today.toISOString().split('T')[0]}
- Milestones should have due dates starting from ${new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- Space milestones approximately 7-10 days apart
- The project must integrate concepts from their COMPLETED modules (Weeks 1 through ${student.currentWeek - 1})
- Pay special attention to weak skills: ${student.skills.filter((s) => s.score < 65).map((s) => `${s.name} (${s.score}%)`).join(', ') || 'none identified'}
- Leverage strong skills: ${student.skills.filter((s) => s.score >= 75).map((s) => `${s.name} (${s.score}%)`).join(', ') || 'none identified'}
- The student's GPA is ${student.gpa}, calibrate difficulty accordingly

Generate the JSON now.`;

  const messages: GroqMessage[] = [
    { role: 'system', content: PROJECT_GEN_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  try {
    const raw = await callGroq(messages, 0.6, 3000);

    // Parse JSON from the response — handle possible markdown wrapping
    let jsonStr = raw.trim();
    // Strip markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(jsonStr);

    // Validate and normalize the response
    const project: ProjectBrief = {
      title: parsed.title || 'AI-Generated Engineering Project',
      context: parsed.context || '',
      problemStatement: parsed.problemStatement || '',
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
      technicalRequirements: Array.isArray(parsed.technicalRequirements)
        ? parsed.technicalRequirements
        : [],
      deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables : [],
      milestones: Array.isArray(parsed.milestones)
        ? parsed.milestones.map(
            (m: Record<string, unknown>, i: number): Milestone => ({
              id: (m.id as string) || `ms-${i + 1}`,
              title: (m.title as string) || `Milestone ${i + 1}`,
              description: (m.description as string) || '',
              dueDate: (m.dueDate as string) || '',
              status: i === 0 ? 'in-progress' : 'todo',
              estimatedHours: (m.estimatedHours as number) || 8,
              deliverables: Array.isArray(m.deliverables)
                ? (m.deliverables as string[])
                : [],
            })
          )
        : [],
      totalEstimatedHours:
        parsed.totalEstimatedHours ||
        (Array.isArray(parsed.milestones)
          ? parsed.milestones.reduce(
              (sum: number, m: Record<string, unknown>) =>
                sum + ((m.estimatedHours as number) || 8),
              0
            )
          : 50),
    };

    return project;
  } catch (error) {
    console.error('Project generation error:', error);
    throw error;
  }
}
