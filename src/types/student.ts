// ─── Base Building Blocks ────────────────────────────────────────────

export interface SkillArea {
  name: string;
  score: number; // 0-100
  trend: 'up' | 'down' | 'stable';
}

export interface WeekModule {
  week: number;
  title: string;
  topics: string[];
  status: 'completed' | 'current' | 'locked';
  score?: number;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  estimatedHours: number;
  deliverables: string[];
}

export interface ProjectBrief {
  title: string;
  context: string;
  problemStatement: string;
  goals: string[];
  constraints: string[];
  technicalRequirements: string[];
  deliverables: string[];
  milestones: Milestone[];
  totalEstimatedHours: number;
}

export interface ChatMessage {
  id: string;
  role: 'student' | 'mentor';
  content: string;
  timestamp: string;
  type?: 'text' | 'reminder' | 'feedback' | 'reflection';
}

// ─── Course Program (the catalog from which users pick) ──────────────

export interface CourseProgram {
  id: string;
  code: string;
  title: string;
  description: string;
  color: string;           // tailwind color token e.g. 'indigo'
  icon: string;            // lucide icon name
  semester: string;
  totalWeeks: number;
  weekModules: WeekModule[];
  skills: SkillArea[];
}

// ─── Student Project (one per generation, owns its own mentor) ───────

export interface StudentProject {
  id: string;
  createdAt: string;
  selectedCourseIds: string[];   // which courses from the catalog were combined
  brief: ProjectBrief;
  chatHistory: ChatMessage[];    // per-project mentor conversation
}

// ─── Student Profile (no longer has a single project/chatHistory) ────

export interface StudentProfile {
  name: string;
  studentId: string;
  semester: string;
  currentWeek: number;
  overallProgress: number;
  gpa: number;
  enrolledCourseIds: string[];   // which courses the student is taking
  projects: StudentProject[];    // multiple projects
}
