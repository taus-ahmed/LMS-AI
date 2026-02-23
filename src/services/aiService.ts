import type { StudentProfile, StudentProject, ProjectBrief, Milestone, CourseProgram } from '../types/student';
import { getCoursesByIds } from '../data/coursePrograms';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const MODEL = 'llama-3.3-70b-versatile';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callGroq(messages: GroqMessage[], temperature = 0.7, maxTokens = 2048): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Missing VITE_GROQ_API_KEY environment variable');
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens: maxTokens, stream: false }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('Groq API error:', res.status, body);
    throw new Error(`Groq API ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Helpers to serialise course data into text for the LLM ──────────

function serialiseCourses(courses: CourseProgram[]): string {
  return courses.map((c) => {
    const completed = c.weekModules.filter((w) => w.status === 'completed');
    const current = c.weekModules.find((w) => w.status === 'current');
    return `
COURSE: ${c.code} — ${c.title}
  Description: ${c.description}
  Completed modules (${completed.length}/${c.totalWeeks}):
${completed.map((w) => `    Week ${w.week}: ${w.title} (Score: ${w.score ?? 'N/A'}%) — Topics: ${w.topics.join(', ')}`).join('\n')}
  Current module: Week ${current?.week ?? '?'}: ${current?.title ?? 'N/A'} — Topics: ${current?.topics.join(', ') ?? 'N/A'}
  Skills:
${c.skills.map((s) => `    ${s.name}: ${s.score}/100 (${s.trend})`).join('\n')}
  Strong areas: ${c.skills.filter((s) => s.score >= 75).map((s) => s.name).join(', ') || 'none'}
  Weak areas: ${c.skills.filter((s) => s.score < 65).map((s) => s.name).join(', ') || 'none'}`;
  }).join('\n\n');
}

function serialiseProject(project: StudentProject, courses: CourseProgram[]): string {
  const courseNames = courses.map((c) => `${c.code} (${c.title})`).join(' + ');
  const b = project.brief;
  return `
PROJECT: "${b.title}"
  ID: ${project.id}
  Created: ${project.createdAt}
  Courses combined: ${courseNames}
  Problem Statement: ${b.problemStatement}
  Goals: ${b.goals.map((g, i) => `\n    ${i + 1}. ${g}`).join('')}
  Technical Requirements: ${b.technicalRequirements.map((r, i) => `\n    ${i + 1}. ${r}`).join('')}
  Constraints: ${b.constraints.join('; ')}
  Deliverables: ${b.deliverables.join('; ')}
  Milestones:
${b.milestones.map((m) => `    - ${m.title} (${m.status}) due ${m.dueDate}, ~${m.estimatedHours}h — deliverables: ${m.deliverables.join(', ')}`).join('\n')}
  Total estimated hours: ${b.totalEstimatedHours}`;
}

// ═══════════════════════════════════════════════════════════════════════
// PROJECT-SCOPED MENTOR
// ═══════════════════════════════════════════════════════════════════════

export async function getMentorResponse(
  student: StudentProfile,
  project: StudentProject,
  userMessage: string,
): Promise<string> {
  const courses = getCoursesByIds(project.selectedCourseIds);
  const courseData = serialiseCourses(courses);
  const projectData = serialiseProject(project, courses);

  const systemPrompt = `You are the dedicated AI Mentor for the project "${project.brief.title}". You are bound EXCLUSIVELY to this one project and the courses it was generated from. You have deep knowledge of the specific syllabus content, skill scores, and milestones listed below.

STRICT RULES — NEVER VIOLATE:
1. You ONLY discuss topics directly relevant to THIS project and ITS source courses listed below. If the user asks about something outside the scope of these courses, politely redirect them back to the project.
2. You NEVER invent information. Every technical fact you cite must be traceable to the course topics, skills, or project requirements listed in your context. If you're unsure, say so.
3. You NEVER write complete code solutions or give direct answers. You are Socratic — ask guiding questions, break problems into steps, point to relevant course weeks.
4. Reference specific course modules (by week number and title) when helping the user.
5. Reference specific milestones (by name and due date) when discussing timelines.
6. When the student has a weak skill (<65%), break guidance into smaller steps and offer encouragement.
7. When the student has a strong skill (≥80%), push with deeper questions and stretch challenges.
8. Keep responses concise: 1-3 paragraphs. No essays.

STUDENT: ${student.name} (${student.studentId}), GPA ${student.gpa}

SOURCE COURSES:
${courseData}

THIS PROJECT:
${projectData}

Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

  // Build message array from this project's chat history (last 20 msgs)
  const recent = project.chatHistory.slice(-20);
  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...recent.map((m) => ({
      role: (m.role === 'student' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  return callGroq(messages, 0.7, 1024);
}

// ═══════════════════════════════════════════════════════════════════════
// AI PROJECT GENERATION (multi-course)
// ═══════════════════════════════════════════════════════════════════════

export async function generateAIProject(
  student: StudentProfile,
  selectedCourseIds: string[],
): Promise<ProjectBrief> {
  const courses = getCoursesByIds(selectedCourseIds);
  const courseData = serialiseCourses(courses);

  const allSkills = courses.flatMap((c) => c.skills);
  const weak = allSkills.filter((s) => s.score < 65).map((s) => `${s.name} (${s.score}%)`);
  const strong = allSkills.filter((s) => s.score >= 75).map((s) => `${s.name} (${s.score}%)`);

  const maxWeeksLeft = Math.max(...courses.map((c) => c.totalWeeks - (c.weekModules.filter((w) => w.status === 'completed').length)));
  const today = new Date();

  const systemPrompt = `You are an expert engineering curriculum designer. Generate a personalized, industry-grade project brief that COMBINES knowledge from ALL the courses listed below into ONE integrated project.

CRITICAL REQUIREMENTS:
1. The project MUST integrate concepts from EVERY selected course. Not just one — ALL of them combined.
2. It must be realistic, modeled after actual industry or research problems.
3. It must be achievable within ${maxWeeksLeft} remaining weeks.
4. Weak skill areas (${weak.join(', ') || 'none'}) should receive scaffolded support in early milestones.
5. Strong skill areas (${strong.join(', ') || 'none'}) should be leveraged and challenged with stretch goals.
6. Every goal, requirement, and milestone must be traceable to specific course weeks and topics listed below. Do NOT invent topics that are not in the syllabus.
7. Milestones should build sequentially and reference actual course content.

Respond with ONLY valid JSON — no markdown, no backticks, no explanation text. The JSON schema:
{
  "title": "string",
  "context": "string (2-3 sentence industry scenario)",
  "problemStatement": "string (3-4 sentences)",
  "goals": ["string (reference specific course weeks)"],
  "constraints": ["string"],
  "technicalRequirements": ["string"],
  "deliverables": ["string"],
  "milestones": [
    {
      "id": "ms-1",
      "title": "string",
      "description": "string",
      "dueDate": "YYYY-MM-DD",
      "status": "upcoming",
      "estimatedHours": number,
      "deliverables": ["string"]
    }
  ],
  "totalEstimatedHours": number
}`;

  const userPrompt = `Generate a project for student ${student.name} (GPA ${student.gpa}) combining these courses:

${courseData}

Due dates should start from ${new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0]} and be spaced 7-10 days apart.
Generate 5-6 milestones. Total hours: 40-60.
The project must meaningfully integrate concepts from all ${courses.length} course(s): ${courses.map((c) => c.code).join(', ')}.`;

  const raw = await callGroq(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    0.6,
    3000,
  );

  let jsonStr = raw.trim();
  if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');

  const parsed = JSON.parse(jsonStr);

  const brief: ProjectBrief = {
    title: parsed.title ?? 'AI-Generated Project',
    context: parsed.context ?? '',
    problemStatement: parsed.problemStatement ?? '',
    goals: Array.isArray(parsed.goals) ? parsed.goals : [],
    constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
    technicalRequirements: Array.isArray(parsed.technicalRequirements) ? parsed.technicalRequirements : [],
    deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables : [],
    milestones: Array.isArray(parsed.milestones)
      ? parsed.milestones.map((m: Record<string, unknown>, i: number): Milestone => ({
          id: String(m.id ?? `ms-${i + 1}`),
          title: String(m.title ?? `Milestone ${i + 1}`),
          description: String(m.description ?? ''),
          dueDate: String(m.dueDate ?? ''),
          status: i === 0 ? 'in-progress' : 'upcoming',
          estimatedHours: Number(m.estimatedHours) || 8,
          deliverables: Array.isArray(m.deliverables) ? (m.deliverables as string[]) : [],
        }))
      : [],
    totalEstimatedHours: Number(parsed.totalEstimatedHours) ||
      (Array.isArray(parsed.milestones)
        ? parsed.milestones.reduce((s: number, m: Record<string, unknown>) => s + (Number(m.estimatedHours) || 8), 0)
        : 50),
  };

  return brief;
}
