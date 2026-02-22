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

export interface StudentProfile {
  name: string;
  studentId: string;
  course: string;
  courseCode: string;
  semester: string;
  currentWeek: number;
  totalWeeks: number;
  overallProgress: number;
  gpa: number;
  skills: SkillArea[];
  weekModules: WeekModule[];
  project: ProjectBrief | null;
  projectUnlocked: boolean;
  chatHistory: ChatMessage[];
}
