import { create } from 'zustand';
import type { Project, ChatMessage } from '../types/legacyStudent';
import { saveProjects, loadProjects } from '../services/database';

/**
 * Projects Store - Manages project data and chat
 * Supports multiple projects (selected by index)
 */
interface ProjectStore {
  projects: Project[];
  currentProjectIndex: number | null;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isGeneratingProject: boolean;
  isMentorTyping: boolean;

  // Initialization & loading
  initialize: () => Promise<void>;

  // Project selection
  setCurrentProject: (index: number | null) => void;
  getCurrentProject: () => Project | null;

  // Project operations
  createProject: (project: Project) => Promise<void>;
  updateProject: (index: number, updates: Partial<Project>) => Promise<void>;
  deleteProject: (index: number) => Promise<void>;

  // Chat operations (associated with current project)
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
  setChatHistory: (messages: ChatMessage[]) => Promise<void>;

  // UI state
  setIsGeneratingProject: (val: boolean) => void;
  setIsMentorTyping: (val: boolean) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProjectIndex: null,
  chatHistory: [],
  isLoading: true,
  error: null,
  isGeneratingProject: false,
  isMentorTyping: false,

  initialize: async () => {
    set({ isLoading: true, error: null });
    let timeout: any;
    try {
      timeout = setTimeout(() => {
        set({ isLoading: false, error: 'Timeout loading projects' });
        console.error('ProjectStore: Initialization timed out');
      }, 5000);
      console.log('ProjectStore: Initializing...');
      const projects = await loadProjects();
      clearTimeout(timeout);
      set({
        projects: projects || [],
        currentProjectIndex: projects && projects.length > 0 ? 0 : null,
        isLoading: false,
      });
      console.log('ProjectStore: Initialized');
    } catch (error) {
      clearTimeout(timeout);
      console.error('Failed to initialize projects:', error);
      set({
        error: 'Failed to load projects',
        isLoading: false,
        projects: [],
        currentProjectIndex: null,
      });
    }
  },

  setCurrentProject: (index) => {
    const state = get();
    if (index === null) {
      set({ currentProjectIndex: null, chatHistory: [] });
    } else if (index >= 0 && index < state.projects.length) {
      set({
        currentProjectIndex: index,
        chatHistory: state.projects[index].chatHistory || [],
      });
    }
  },

  getCurrentProject: () => {
    const state = get();
    if (state.currentProjectIndex === null) return null;
    return state.projects[state.currentProjectIndex] || null;
  },

  createProject: async (project) => {
    const state = get();
    const updated = [...state.projects, project];
    set({
      projects: updated,
      currentProjectIndex: updated.length - 1,
      chatHistory: project.chatHistory || [],
    });
    await saveProjects(updated);
  },

  updateProject: async (index, updates) => {
    const state = get();
    if (index < 0 || index >= state.projects.length) return;

    const updated = [...state.projects];
    updated[index] = { ...updated[index], ...updates };

    // If updating current project, update chat history too
    if (index === state.currentProjectIndex) {
      set({
        projects: updated,
        chatHistory: updated[index].chatHistory || [],
      });
    } else {
      set({ projects: updated });
    }

    await saveProjects(updated);
  },

  deleteProject: async (index) => {
    const state = get();
    const updated = state.projects.filter((_, i) => i !== index);

    let newIndex = state.currentProjectIndex;
    if (newIndex === index) {
      newIndex = updated.length > 0 ? 0 : null;
    } else if (newIndex !== null && newIndex > index) {
      newIndex -= 1;
    }

    set({
      projects: updated,
      currentProjectIndex: newIndex,
      chatHistory: newIndex !== null ? updated[newIndex]?.chatHistory || [] : [],
    });

    await saveProjects(updated);
  },

  addMessage: async (message) => {
    const state = get();
    if (state.currentProjectIndex === null) return;

    const newMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    const updated = [...state.chatHistory, newMessage];
    set({ chatHistory: updated });

    // Update project with new chat history
    const projects = [...state.projects];
    projects[state.currentProjectIndex].chatHistory = updated;
    await saveProjects(projects);
  },

  setChatHistory: async (messages) => {
    const state = get();
    if (state.currentProjectIndex === null) return;

    set({ chatHistory: messages });

    const projects = [...state.projects];
    projects[state.currentProjectIndex].chatHistory = messages;
    await saveProjects(projects);
  },

  setIsGeneratingProject: (val) => set({ isGeneratingProject: val }),
  setIsMentorTyping: (val) => set({ isMentorTyping: val }),
}));
