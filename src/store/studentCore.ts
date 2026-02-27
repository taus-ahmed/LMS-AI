import { create } from 'zustand';
import { initializeDatabase, saveProfile } from '../services/database';

/**
 * Core Student Store - Only stores personal profile (name, ID, notes)
 * Separated from courses and projects for future multi-course/project support
 */
interface CoreStudent {
  name: string;
  studentId: string;
  notes?: string[];
  canvasApiKey?: string;
}

interface StudentCoreStore {
  student: CoreStudent | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  updateStudent: (updates: Partial<CoreStudent>) => Promise<void>;
  addNote: (note: string) => Promise<void>;
  removeNote: (index: number) => Promise<void>;
}

export const useStudentCore = create<StudentCoreStore>((set, get) => ({
  student: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    let timeout: any;
    try {
      timeout = setTimeout(() => {
        set({ isLoading: false, error: 'Timeout loading student core' });
        console.error('StudentCoreStore: Initialization timed out');
      }, 5000);
      console.log('StudentCoreStore: Initializing...');
      const studentData = await initializeDatabase();
      clearTimeout(timeout);
      set({
        student: {
          name: studentData.name,
          studentId: studentData.studentId,
          notes: studentData.notes,
          canvasApiKey: studentData.canvasApiKey,
        },
        isLoading: false,
      });
      console.log('StudentCoreStore: Initialized');
    } catch (error) {
      clearTimeout(timeout);
      console.error('Failed to initialize student core:', error);
      set({
        error: 'Failed to load student data',
        isLoading: false,
        student: null,
      });
    }
  },

  updateStudent: async (updates) => {
    const state = get();
    if (!state.student) return;

    const updated = { ...state.student, ...updates };
    set({ student: updated });

    // Persist to database
    await saveProfile({
      name: updated.name,
      studentId: updated.studentId,
      notes: updated.notes,
      canvasApiKey: updated.canvasApiKey,
    });
  },

  addNote: async (note) => {
    const state = get();
    if (!state.student) return;

    const updated = {
      ...state.student,
      notes: [...(state.student.notes || []), note],
    };

    set({ student: updated });

    await saveProfile({
      name: updated.name,
      studentId: updated.studentId,
      notes: updated.notes,
    });
  },

  removeNote: async (index) => {
    const state = get();
    if (!state.student) return;

    const notes = state.student.notes || [];
    const updated = {
      ...state.student,
      notes: notes.filter((_, i) => i !== index),
    };

    set({ student: updated });

    await saveProfile({
      name: updated.name,
      studentId: updated.studentId,
      notes: updated.notes,
    });
  },
}));
