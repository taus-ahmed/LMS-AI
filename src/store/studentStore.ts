import { create } from 'zustand';
import type { StudentProfile, StudentProject, ChatMessage, ProjectBrief } from '../types/student';
import {
  initializeDatabase,
  saveStudentProfile,
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getActiveProjectId,
  setActiveProjectId,
  type ProjectRecord,
  type ProjectStatus,
} from '../services/database';

// ---------------------------------------------------------------------------
// Simulated / seed student (exported – imported by database.ts for first-run)
// Contains fields from both branches to satisfy the merged StudentProfile.
// ---------------------------------------------------------------------------

export const SIMULATED_STUDENT: StudentProfile = {
  name: 'Alex Morgan',
  studentId: 'ENG-2026-0482',
  semester: 'Spring 2026',
  currentWeek: 6,
  overallProgress: 42,
  gpa: 3.4,
  // ── Per-student skill / module tracking (HEAD) ──
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
  notes: [],
  // ── Multi-course enrollment + in-memory project list (teammate branch) ──
  enrolledCourseIds: ['mech301', 'ece420', 'cse460', 'me544'],
  projects: [],
};

// ---------------------------------------------------------------------------
// Exported effective-status helper
// ---------------------------------------------------------------------------
export function getEffectiveStatus(project: ProjectRecord): ProjectStatus {
  if (project.status === 'Archived') return 'Archived';
  if (project.status === 'Dropped') return 'Dropped';

  const milestones = project.brief?.milestones ?? [];
  const total = milestones.length;
  const completed = milestones.filter((m) => m.status === 'completed').length;

  if (total > 0 && completed === total) return 'Finished';
  if (completed > 0) return 'InProgress';
  return 'NotStarted';
}

// ---------------------------------------------------------------------------
// Small local helper (mirrors the one in database.ts)
// ---------------------------------------------------------------------------
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return (
    Math.random().toString(36).slice(2, 10) +
    '-' +
    Date.now().toString(36)
  );
}

// ---------------------------------------------------------------------------
// Store interface – merged from both branches
// ---------------------------------------------------------------------------

interface StudentStore {
  // ── Core student state ──
  student: StudentProfile | null;
  isLoading: boolean;
  error: string | null;

  // ── Dexie-backed project inventory (ProjectLibrary / DeliverableCalendar) ──
  projects: ProjectRecord[];
  activeProjectId: string | null;
  activeProject: ProjectRecord | null;

  // ── UI / loading flags ──
  sidebarOpen: boolean;
  isGeneratingProject: boolean;
  /** Global mentor page typing indicator (Mentor.tsx) */
  isMentorTyping: boolean;
  /** Per-project mentor typing indicator (ProjectMentor.tsx) */
  mentorTypingProjectId: string | null;

  // ── UI actions ──
  toggleSidebar: () => void;
  setIsGeneratingProject: (val: boolean) => void;
  setIsMentorTyping: (val: boolean) => void;
  setMentorTypingProjectId: (id: string | null) => void;

  // ── Initialization ──
  initialize: () => Promise<void>;

  // ── Global mentor chat (Mentor.tsx – writes to student.chatHistory) ──
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;

  // ── Legacy single-project helpers ──
  setProject: (project: ProjectBrief) => Promise<void>;

  // ── Student profile notes ──
  addNote: (note: string) => Promise<void>;
  removeNote: (index: number) => Promise<void>;

  // ── Dexie project inventory actions (ProjectLibrary / Calendar) ──
  loadProjects: () => Promise<void>;
  loadActiveProject: () => Promise<void>;
  setActiveProject: (id: string | null) => Promise<void>;
  createProjectFromGenerated: (generated: ProjectBrief) => Promise<string>;
  updateProjectStatus: (id: string, status: ProjectStatus) => Promise<void>;
  resetProjectProgress: (id: string) => Promise<void>;
  deleteProjectById: (id: string) => Promise<void>;
  archiveActiveIfUnused: () => Promise<void>;
  addProjectNote: (projectId: string, text: string) => Promise<void>;
  deleteProjectNote: (projectId: string, noteId: string) => Promise<void>;

  // ── In-memory StudentProject actions (ProjectHub / ProjectMentor) ──
  /** Creates a StudentProject inside student.projects (in-memory + persisted).
   *  Pass `id` to reuse a Dexie ProjectRecord id so both models share the same key. */
  addProject: (courseIds: string[], brief: ProjectBrief, id?: string) => string;
  /** Removes a StudentProject from student.projects by id */
  deleteProject: (projectId: string) => void;
  /** Appends a chat message to a specific StudentProject's chatHistory */
  addProjectMessage: (projectId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useStudentStore = create<StudentStore>((set, get) => ({
  // ── Initial state ──
  student: null,
  isLoading: true,
  error: null,
  sidebarOpen: false,
  isGeneratingProject: false,
  isMentorTyping: false,
  mentorTypingProjectId: null,
  projects: [],
  activeProjectId: null,
  activeProject: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setIsGeneratingProject: (val) => set({ isGeneratingProject: val }),
  setIsMentorTyping: (val) => set({ isMentorTyping: val }),
  setMentorTypingProjectId: (id) => set({ mentorTypingProjectId: id }),

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const studentData = await initializeDatabase();

      // Ensure fields introduced by the teammate branch always exist on the
      // profile even when the record was written by an older DB schema version.
      const hydrated: StudentProfile = {
        ...studentData,
        enrolledCourseIds: studentData.enrolledCourseIds ?? [],
        projects: studentData.projects ?? [],
      };

      set({ student: hydrated, isLoading: false });

      // Hydrate project inventory
      await get().loadProjects();
      await get().loadActiveProject();

      // If there is no active project but there are projects, pick the most
      // recently updated one as the default active project
      const { activeProjectId, projects } = get();
      if (!activeProjectId && projects.length > 0) {
        const sorted = [...projects].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        await get().setActiveProject(sorted[0].id);
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      set({
        error: 'Failed to load student data',
        isLoading: false,
        student: SIMULATED_STUDENT, // Fallback to hard-coded data
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
      chatHistory: [...(state.student.chatHistory ?? []), newMessage],
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

  // -------------------------------------------------------------------------
  // Project inventory actions
  // -------------------------------------------------------------------------

  loadProjects: async () => {
    const { student } = get();
    if (!student) {
      set({ projects: [] });
      return;
    }
    const projects = await listProjects(student.studentId);
    set({ projects });
  },

  loadActiveProject: async () => {
    const id = await getActiveProjectId();
    if (id === null) {
      set({ activeProjectId: null, activeProject: null });
      return;
    }
    const proj = await getProject(id);
    if (!proj) {
      // Stale reference — the project was deleted; clear it from settings too
      await setActiveProjectId(null);
      set({ activeProjectId: null, activeProject: null });
    } else {
      set({ activeProjectId: id, activeProject: proj });
    }
  },

  setActiveProject: async (id) => {
    await setActiveProjectId(id);
    set({ activeProjectId: id });
    if (id === null) {
      set({ activeProject: null });
    } else {
      const proj = await getProject(id);
      set({ activeProject: proj ?? null });
    }
  },

  createProjectFromGenerated: async (generated) => {
    const { student } = get();
    if (!student) throw new Error('No student loaded');

    const now = new Date().toISOString();
    const record: ProjectRecord = {
      id: generateId(),
      studentId: student.studentId,
      title: generated.title?.trim() || 'Industry Project',
      status: 'NotStarted',
      createdAt: now,
      updatedAt: now,
      brief: generated,
    };

    await createProject(record);
    await get().setActiveProject(record.id);
    await get().loadProjects();
    return record.id;
  },

  updateProjectStatus: async (id, status) => {
    await updateProject(id, { status });
    await get().loadProjects();
    if (get().activeProjectId === id) {
      const proj = await getProject(id);
      set({ activeProject: proj ?? null });
    }
  },

  resetProjectProgress: async (id) => {
    const proj = await getProject(id);
    if (!proj) return;

    const newBrief: typeof proj.brief = {
      ...proj.brief,
      milestones: proj.brief.milestones.map((m) => ({ ...m, status: 'todo' as const })),
    };

    await updateProject(id, { brief: newBrief, status: 'NotStarted' });
    await get().loadProjects();
    if (get().activeProjectId === id) {
      const updated = await getProject(id);
      set({ activeProject: updated ?? null });
    }
  },

  deleteProjectById: async (id) => {
    await deleteProject(id);
    await get().loadProjects();

    if (get().activeProjectId === id) {
      const remaining = get().projects; // already refreshed above
      const sorted = [...remaining].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      if (sorted.length === 0) {
        await get().setActiveProject(null);
      } else {
        await get().setActiveProject(sorted[0].id);
      }
    }
  },

  archiveActiveIfUnused: async () => {
    const { activeProject } = get();
    if (!activeProject) return;
    if (getEffectiveStatus(activeProject) !== 'NotStarted') return;
    await updateProject(activeProject.id, { status: 'Archived' });
    await get().loadProjects();
    // Refresh activeProject in store if it's still the active one
    if (get().activeProjectId === activeProject.id) {
      const updated = await getProject(activeProject.id);
      set({ activeProject: updated ?? null });
    }
  },

  addProjectNote: async (projectId, text) => {
    const proj = await getProject(projectId);
    if (!proj) return;
    const notes = proj.notes ?? [];
    const newNote = {
      id: generateId(),
      text,
      createdAt: new Date().toISOString(),
    };
    await updateProject(projectId, { notes: [...notes, newNote] });
    await get().loadProjects();
    if (get().activeProjectId === projectId) {
      const updated = await getProject(projectId);
      set({ activeProject: updated ?? null });
    }
  },

  deleteProjectNote: async (projectId, noteId) => {
    const proj = await getProject(projectId);
    if (!proj) return;
    const notes = (proj.notes ?? []).filter((n) => n.id !== noteId);
    await updateProject(projectId, { notes });
    await get().loadProjects();
    if (get().activeProjectId === projectId) {
      const updated = await getProject(projectId);
      set({ activeProject: updated ?? null });
    }
  },

  // ---------------------------------------------------------------------------
  // In-memory StudentProject actions (ProjectHub / ProjectMentor)
  // These write to student.projects (StudentProject[]) on the profile object.
  // ---------------------------------------------------------------------------

  addProject: (courseIds, brief, precomputedId) => {
    const id = precomputedId ?? `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
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

    set((s) => {
      if (!s.student) return {};
      return {
        student: {
          ...s.student,
          projects: [...s.student.projects, newProject],
        },
      };
    });

    // Persist updated student (fire-and-forget)
    const updated = get().student;
    if (updated) saveStudentProfile(updated).catch(console.error);

    return id;
  },

  deleteProject: (projectId) => {
    set((s) => {
      if (!s.student) return {};
      return {
        student: {
          ...s.student,
          projects: s.student.projects.filter((p) => p.id !== projectId),
        },
      };
    });
    const updated = get().student;
    if (updated) saveStudentProfile(updated).catch(console.error);
  },

  addProjectMessage: (projectId, message) => {
    const newMsg: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    set((s) => {
      if (!s.student) return {};
      return {
        student: {
          ...s.student,
          projects: s.student.projects.map((p) =>
            p.id === projectId
              ? { ...p, chatHistory: [...p.chatHistory, newMsg] }
              : p
          ),
        },
      };
    });

    const updated = get().student;
    if (updated) saveStudentProfile(updated).catch(console.error);
  },
}));
