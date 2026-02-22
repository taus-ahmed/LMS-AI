import { create } from 'zustand';
import type { StudentProfile, ChatMessage, ProjectBrief } from '../types/student';
import { initializeDatabase, saveStudentProfile } from '../services/database';

export const SIMULATED_STUDENT: StudentProfile = {
  name: 'Alex Morgan',
  studentId: 'ENG-2026-0482',
  course: 'Introduction to Mechatronics Engineering',
  courseCode: 'MECH 301',
  semester: 'Spring 2026',
  currentWeek: 6,
  totalWeeks: 14,
  overallProgress: 42,
  gpa: 3.4,
  skills: [
    { name: 'Circuit Design', score: 78, trend: 'up' },
    { name: 'Programming (C/C++)', score: 85, trend: 'up' },
    { name: 'Sensor Integration', score: 62, trend: 'stable' },
    { name: 'Control Systems', score: 70, trend: 'up' },
    { name: 'Mechanical Design', score: 55, trend: 'down' },
    { name: 'Signal Processing', score: 68, trend: 'stable' },
    { name: 'Documentation', score: 72, trend: 'up' },
    { name: 'Problem Solving', score: 80, trend: 'up' },
  ],
  weekModules: [
    {
      week: 1,
      title: 'Foundations of Mechatronics',
      topics: ['System thinking', 'Interdisciplinary integration', 'Mechatronic system architecture'],
      status: 'completed',
      score: 88,
      completedAt: '2026-01-16',
    },
    {
      week: 2,
      title: 'Sensors & Transducers',
      topics: ['Sensor types', 'Signal conditioning', 'Calibration techniques'],
      status: 'completed',
      score: 75,
      completedAt: '2026-01-23',
    },
    {
      week: 3,
      title: 'Actuators & Drive Systems',
      topics: ['DC motors', 'Stepper motors', 'Servo mechanisms', 'Pneumatic systems'],
      status: 'completed',
      score: 82,
      completedAt: '2026-01-30',
    },
    {
      week: 4,
      title: 'Microcontroller Programming',
      topics: ['Arduino platform', 'Digital I/O', 'Analog reads', 'PWM control'],
      status: 'completed',
      score: 91,
      completedAt: '2026-02-06',
    },
    {
      week: 5,
      title: 'Control Systems Fundamentals',
      topics: ['Open-loop vs closed-loop', 'PID controllers', 'System modeling'],
      status: 'completed',
      score: 73,
      completedAt: '2026-02-13',
    },
    {
      week: 6,
      title: 'Signal Processing & Data Acquisition',
      topics: ['ADC/DAC', 'Filtering techniques', 'Sampling theory', 'Real-time data'],
      status: 'current',
    },
    {
      week: 7,
      title: 'Communication Protocols',
      topics: ['I2C', 'SPI', 'UART', 'Wireless protocols'],
      status: 'locked',
    },
    {
      week: 8,
      title: 'System Integration',
      topics: ['Hardware-software interface', 'Debugging strategies', 'Testing methodology'],
      status: 'locked',
    },
    {
      week: 9,
      title: 'Embedded Systems Design',
      topics: ['RTOS concepts', 'Memory management', 'Power optimization'],
      status: 'locked',
    },
    {
      week: 10,
      title: 'Human-Machine Interfaces',
      topics: ['Display systems', 'Input devices', 'Ergonomic design', 'UX for embedded'],
      status: 'locked',
    },
    {
      week: 11,
      title: 'Industrial Applications',
      topics: ['Robotics', 'Automation', 'Quality control systems'],
      status: 'locked',
    },
    {
      week: 12,
      title: 'Advanced Topics',
      topics: ['Machine learning on edge', 'IoT integration', 'Cloud connectivity'],
      status: 'locked',
    },
    {
      week: 13,
      title: 'Project Presentations',
      topics: ['Technical presentation', 'Demo day', 'Peer review'],
      status: 'locked',
    },
    {
      week: 14,
      title: 'Final Submission & Reflection',
      topics: ['Portfolio compilation', 'Self-assessment', 'Course reflection'],
      status: 'locked',
    },
  ],
  projectUnlocked: true,
  project: null,
  chatHistory: [
    {
      id: 'msg-1',
      role: 'mentor',
      content:
        "Welcome, Alex! 🎓 I'm your AI Project Mentor powered by advanced reasoning. I have full context on your course syllabus, skill profile, and semester progress. I'm here to guide your thinking — not give you answers.\n\nYou can ask me about course concepts, your project, engineering decisions, or anything related to your learning journey. What's on your mind?",
      timestamp: '2026-02-20T09:00:00',
      type: 'text',
    },
  ],
  // New field with default value
  notes: [],
};

interface StudentStore {
  student: StudentProfile | null;
  isLoading: boolean;
  error: string | null;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
  setProject: (project: ProjectBrief) => Promise<void>;
  isGeneratingProject: boolean;
  setIsGeneratingProject: (val: boolean) => void;
  isMentorTyping: boolean;
  setIsMentorTyping: (val: boolean) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  initialize: () => Promise<void>;
  // New actions for notes
  addNote: (note: string) => Promise<void>;
  removeNote: (index: number) => Promise<void>;
}

export const useStudentStore = create<StudentStore>((set, get) => ({
  student: null,
  isLoading: true,
  error: null,
  sidebarOpen: false,
  isGeneratingProject: false,
  isMentorTyping: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setIsGeneratingProject: (val) => set({ isGeneratingProject: val }),
  setIsMentorTyping: (val) => set({ isMentorTyping: val }),

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const studentData = await initializeDatabase();
      set({ student: studentData, isLoading: false });
    } catch (error) {
      console.error('Failed to initialize database:', error);
      set({
        error: 'Failed to load student data',
        isLoading: false,
        student: SIMULATED_STUDENT // Fallback to hard-coded data
      });
    }
  },

  addMessage: async (message) => {
    const state = get();
    if (!state.student) return;

    const newMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    const updatedStudent = {
      ...state.student,
      chatHistory: [...state.student.chatHistory, newMessage],
    };

    set({ student: updatedStudent });
    await saveStudentProfile(updatedStudent);
  },

  setProject: async (project) => {
    const state = get();
    if (!state.student) return;

    const updatedStudent = {
      ...state.student,
      project,
      projectUnlocked: true,
    };

    set({ student: updatedStudent });
    await saveStudentProfile(updatedStudent);
  },

  addNote: async (note) => {
    const state = get();
    if (!state.student) return;

    const updatedStudent = {
      ...state.student,
      notes: [...(state.student.notes || []), note],
    };

    set({ student: updatedStudent });
    await saveStudentProfile(updatedStudent);
  },

  removeNote: async (index) => {
    const state = get();
    if (!state.student || !state.student.notes) return;

    const updatedNotes = state.student.notes.filter((_, i) => i !== index);
    const updatedStudent = {
      ...state.student,
      notes: updatedNotes,
    };

    set({ student: updatedStudent });
    await saveStudentProfile(updatedStudent);
  },
}));
