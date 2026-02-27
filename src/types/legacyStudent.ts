export interface AssignmentModule {
  id?: number; // Canvas Assignment ID
  title: string;
  topics: string[];
  status: 'completed' | 'ungraded' | 'missing';
  score?: number;
  completedAt?: string;
}

export interface SkillArea {
  name: string;
  score: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  source: AssignmentModule[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  estimatedHours: number;
  deliverables: string[];
  difficulty: number;
}

export interface ProjectBrief {
  title: string;
  context: string;
  problemStatement: string;
  totalEstimatedHours: number;
}

export interface ChatMessage {
  id: string;
  role: 'student' | 'mentor';
  content: string;
  timestamp: string;
  type?: 'text' | 'reminder' | 'feedback' | 'reflection';
}

export interface CourseModule {
  course: string;
  courseCode: string;
  id: number; // Canvas course ID for syncing
  semester: string;
  currentWeek: number;
  totalWeeks: number;
  overallProgress: number;
  skills: SkillArea[];
  assignmentModules: AssignmentModule[];
  isActive: boolean;
}

export interface Project {
  id?: string;
  createdAt?: string;
  selectedCourseIds?: string[];
  title: string;
  context: string;
  problemStatement: string;
  totalEstimatedHours: number;
  chatHistory: ChatMessage[];
  goals: string[];
  constraints: string[];
  technicalRequirements: string[];
  deliverables: string[];
  milestones: Milestone[];
  difficulty: number;
}

export interface StudentProfile {
  name: string;
  studentId: string;
  courses: CourseModule[];
  projects: Project[];
  notes?: string[]; // Array of personal notes
  chatHistory?: ChatMessage[]; // Optional for legacy compatibility
  id?: number; // For Dexie compatibility
  canvasApiKey?: string; // Optional for Canvas integration
}

