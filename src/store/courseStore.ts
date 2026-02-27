import { create } from 'zustand';
import type { CourseModule } from '../types/legacyStudent';
import { saveCourses, loadCourses } from '../services/database';

/**
 * Courses Store - Manages course data
 * Supports multiple courses (selected by index)
 */
interface CourseStore {
  courses: CourseModule[];
  currentCourseIndex: number;
  isLoading: boolean;
  error: string | null;
  
  // Initialization & loading
  initialize: () => Promise<void>;
  
  // Course selection
  setCurrentCourse: (index: number) => void;
  getCurrentCourse: () => CourseModule | null;
  
  // Course operations
  addCourse: (course: CourseModule) => Promise<void>;
  updateCourse: (index: number, updates: Partial<CourseModule>) => Promise<void>;
  deleteCourse: (index: number) => Promise<void>;
  clearAllCourses: () => Promise<void>;
}

export const useCourseStore = create<CourseStore>((set, get) => ({
  courses: [],
  currentCourseIndex: 0,
  isLoading: true,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    let timeout: any;
    try {
      timeout = setTimeout(() => {
        set({ isLoading: false, error: 'Timeout loading courses' });
        console.error('CourseStore: Initialization timed out');
      }, 5000);
      console.log('CourseStore: Initializing...');
      const courses = await loadCourses();
      clearTimeout(timeout);
      set({
        courses: courses && courses.length > 0 ? courses : [],
        currentCourseIndex: 0,
        isLoading: false,
      });
      console.log('CourseStore: Initialized');
    } catch (error) {
      clearTimeout(timeout);
      console.error('Failed to initialize courses:', error);
      set({
        error: 'Failed to load courses',
        isLoading: false,
        courses: [],
      });
    }
  },

  setCurrentCourse: (index) => {
    const state = get();
    if (index >= 0 && index < state.courses.length) {
      set({ currentCourseIndex: index });
    }
  },

  getCurrentCourse: () => {
    const state = get();
    return state.courses[state.currentCourseIndex] || null;
  },

  addCourse: async (course) => {
    const state = get();
    const updated = [...state.courses, course];
    set({ courses: updated });
    await saveCourses(updated);
  },

  updateCourse: async (index, updates) => {
    const state = get();
    if (index < 0 || index >= state.courses.length) return;

    const updated = [...state.courses];
    updated[index] = { ...updated[index], ...updates };
    set({ courses: updated });
    await saveCourses(updated);
  },

  deleteCourse: async (index) => {
    const state = get();
    const updated = state.courses.filter((_, i) => i !== index);
    
    // Reset current index if needed
    let newIndex = state.currentCourseIndex;
    if (newIndex >= updated.length) {
      newIndex = Math.max(0, updated.length - 1);
    }

    set({ courses: updated, currentCourseIndex: newIndex });
    await saveCourses(updated);
  },
  clearAllCourses: async () => {
    set({ courses: [], currentCourseIndex: 0 });
    await saveCourses([]);
  }
}));
