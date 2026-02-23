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
  status: 'completed' | 'in-progress' | 'todo';
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

// ─── Student Profile ────────────────────────────────────────────────

export interface StudentProfile {
  name: string;
  studentId: string;
  semester: string;
  currentWeek: number;
  overallProgress: number;
  gpa: number;
  // Per-student skill/module tracking (used by Dashboard, ProjectHub, CourseProgress)
  skills: SkillArea[];
  weekModules: WeekModule[];
  // Multi-course enrollment + project list (teammate branch)
  enrolledCourseIds: string[];   // which courses the student is taking
  projects: StudentProject[];    // all generated projects (multi-project support)
  // Legacy single-project fields kept for database migration compatibility
  project?: ProjectBrief | null;
  projectUnlocked?: boolean;
  chatHistory?: ChatMessage[];   // top-level chat; per-project chat lives in StudentProject
  notes?: string[];              // personal notes
}
