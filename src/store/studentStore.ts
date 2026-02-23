import { create } from 'zustand';
import type { StudentProfile, StudentProject, ChatMessage, ProjectBrief } from '../types/student';

const INITIAL_STUDENT: StudentProfile = {
  name: 'Alex Morgan',
  studentId: 'ENG-2026-0482',
  semester: 'Spring 2026',
  currentWeek: 6,
  overallProgress: 42,
  gpa: 3.4,
  enrolledCourseIds: ['mech301', 'ece420', 'cse460', 'me544'],
  projects: [],
};

interface StudentStore {
  student: StudentProfile;
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Multi-project management
  addProject: (courseIds: string[], brief: ProjectBrief) => string;  // returns new project id
  deleteProject: (projectId: string) => void;

  // Per-project chat
  addProjectMessage: (projectId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  // Loading states
  isGeneratingProject: boolean;
  setIsGeneratingProject: (val: boolean) => void;
  mentorTypingProjectId: string | null;
  setMentorTypingProjectId: (id: string | null) => void;
}

export const useStudentStore = create<StudentStore>((set) => ({
  student: INITIAL_STUDENT,
  sidebarOpen: false,
  isGeneratingProject: false,
  mentorTypingProjectId: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setIsGeneratingProject: (val) => set({ isGeneratingProject: val }),
  setMentorTypingProjectId: (id) => set({ mentorTypingProjectId: id }),

  addProject: (courseIds, brief) => {
    const id = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newProject: StudentProject = {
      id,
      createdAt: new Date().toISOString(),
      selectedCourseIds: courseIds,
      brief,
      chatHistory: [
        {
          id: `msg-welcome-${id}`,
          role: 'mentor',
          content: `Welcome! 🎓 I'm the dedicated AI Mentor for your project **"${brief.title}"**.\n\nI have full context on the courses this project was generated from, every milestone, and all your skill scores. I can only help with topics relevant to this specific project — that's by design, so my answers stay precise and grounded.\n\nAsk me anything: requirements clarification, concept explanations, milestone guidance, or engineering trade-offs. What would you like to start with?`,
          timestamp: new Date().toISOString(),
          type: 'text',
        },
      ],
    };
    set((s) => ({
      student: { ...s.student, projects: [...s.student.projects, newProject] },
    }));
    return id;
  },

  deleteProject: (projectId) =>
    set((s) => ({
      student: {
        ...s.student,
        projects: s.student.projects.filter((p) => p.id !== projectId),
      },
    })),

  addProjectMessage: (projectId, message) =>
    set((s) => ({
      student: {
        ...s.student,
        projects: s.student.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                chatHistory: [
                  ...p.chatHistory,
                  {
                    ...message,
                    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }
            : p
        ),
      },
    })),
}));
