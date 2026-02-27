import { create } from 'zustand';
import type { StudentProfile, StudentProject, ChatMessage, ProjectBrief } from '../types/student';
import type { Project as LegacyProject, Milestone } from '../types/legacyStudent';
import { useStudentCore } from './studentCore';
import { useCourseStore } from './courseStore';
import { useProjectStore } from './projectStore';
import { COURSE_PROGRAMS } from '../data/coursePrograms';
import {
  saveStudentProfile,
  listProjects,
  getProject,
  createProject as createProjectRecord,
  updateProject as updateProjectRecord,
  deleteProject as deleteProjectRecord,
  getActiveProjectId,
  setActiveProjectId,
  type ProjectRecord,
  type ProjectStatus,
} from '../services/database';

// ---------------------------------------------------------------------------
// Exported effective-status helper (used by ProjectLibrary, Calendar, adapter)
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
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
}

const EMPTY_STUDENT: StudentProfile = {
  name: 'Student',
  studentId: '',
  semester: 'Current Semester',
  currentWeek: 1,
  overallProgress: 0,
  gpa: 3.4,
  enrolledCourseIds: [],
  projects: [],
};

function mapLegacyProject(project: LegacyProject, index: number, enrolledCourseIds: string[]): StudentProject {
  const id = project.id ?? `proj-${index + 1}`;
  const selectedCourseIds =
    project.selectedCourseIds && project.selectedCourseIds.length > 0
      ? project.selectedCourseIds
      : enrolledCourseIds.slice(0, 1);

  const milestones: Milestone[] = (project.milestones || []).map((m) => ({
    ...m,
    difficulty: m.difficulty ?? 3,
  }));

  return {
    id,
    createdAt: project.createdAt ?? '1970-01-01T00:00:00.000Z',
    selectedCourseIds,
    brief: {
      title: project.title,
      context: project.context,
      problemStatement: project.problemStatement,
      totalEstimatedHours: project.totalEstimatedHours,
      goals: project.goals || [],
      constraints: project.constraints || [],
      technicalRequirements: project.technicalRequirements || [],
      deliverables: project.deliverables || [],
      milestones,
    },
    chatHistory: project.chatHistory || [],
  };
}

function deriveStudent(): StudentProfile {
  const core = useStudentCore.getState().student;
  if (!core) return EMPTY_STUDENT;

  const courses = useCourseStore.getState().courses;
  const projects = useProjectStore.getState().projects;

  const activeCourse = courses.find((c) => c.isActive) ?? courses[0];
  const semester = activeCourse?.semester ?? 'Current Semester';
  const currentWeek = activeCourse?.currentWeek ?? 1;
  const overallProgress =
    courses.length > 0
      ? Math.round(courses.reduce((sum, c) => sum + (c.overallProgress || 0), 0) / courses.length)
      : 0;

  const enrolledCourseIds = courses
    .map((c) => {
      const match = COURSE_PROGRAMS.find(
        (p) =>
          p.code.toLowerCase() === (c.courseCode || '').toLowerCase() ||
          p.title.toLowerCase() === (c.course || '').toLowerCase(),
      );
      return match?.id;
    })
    .filter((id): id is string => Boolean(id));

  const mappedProjects = projects.map((p, index) => mapLegacyProject(p, index, enrolledCourseIds));

  return {
    name: core.name,
    studentId: core.studentId,
    semester,
    currentWeek,
    overallProgress,
    gpa: 3.4,
    enrolledCourseIds,
    projects: mappedProjects,
    notes: core.notes,
    canvasApiKey: core.canvasApiKey,
  };
}

const getLegacyProjectId = (project: LegacyProject, index: number) => project.id ?? `proj-${index + 1}`;

// ---------------------------------------------------------------------------
// Store interface – merged from both branches
// ---------------------------------------------------------------------------

interface StudentStore {
  student: StudentProfile;
  isGeneratingProject: boolean;
  mentorTypingProjectId: string | null;
  isLoading: boolean;

  // ── Dexie-backed project inventory (ProjectLibrary / DeliverableCalendar) ──
  dexieProjects: ProjectRecord[];
  activeProjectId: string | null;
  activeProject: ProjectRecord | null;

  // ── In-memory project actions (Branch A – ProjectHub / ProjectMentor) ──
  addProject: (courseIds: string[], brief: ProjectBrief) => string;
  deleteProject: (projectId: string) => void;
  addProjectMessage: (projectId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  setIsGeneratingProject: (val: boolean) => void;
  setMentorTypingProjectId: (id: string | null) => void;

  // ── Dexie project inventory actions (Branch B) ──
  loadDexieProjects: () => Promise<void>;
  loadActiveProject: () => Promise<void>;
  setActiveProject: (id: string | null) => Promise<void>;
  createProjectFromGenerated: (generated: ProjectBrief) => Promise<string>;
  updateProjectStatus: (id: string, status: ProjectStatus) => Promise<void>;
  resetProjectProgress: (id: string) => Promise<void>;
  deleteProjectById: (id: string) => Promise<void>;
  archiveActiveIfUnused: () => Promise<void>;
  addProjectNote: (projectId: string, text: string) => Promise<void>;
  deleteProjectNote: (projectId: string, noteId: string) => Promise<void>;
}

export const useStudentStore = create<StudentStore>((set, get) => ({
  student: deriveStudent(),
  isGeneratingProject: false,
  mentorTypingProjectId: null,
  isLoading: false,
  dexieProjects: [],
  activeProjectId: null,
  activeProject: null,

  // ── In-memory project actions (Branch A) ──

  addProject: (courseIds, brief) => {
    const id = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();

    const legacyProject: LegacyProject = {
      id,
      createdAt,
      selectedCourseIds: courseIds,
      title: brief.title,
      context: brief.context,
      problemStatement: brief.problemStatement,
      totalEstimatedHours: brief.totalEstimatedHours,
      goals: brief.goals,
      constraints: brief.constraints,
      technicalRequirements: brief.technicalRequirements,
      deliverables: brief.deliverables,
      milestones: brief.milestones.map((m) => ({
        ...m,
        difficulty: m.difficulty ?? 3,
      })),
      chatHistory: [
        {
          id: `msg-welcome-${id}`,
          role: 'mentor',
          content: `Welcome! I'm your AI mentor for "${brief.title}".`,
          timestamp: createdAt,
          type: 'text',
        },
      ],
      difficulty: 3,
    };

    void useProjectStore.getState().createProject(legacyProject);

    // Also create a Dexie ProjectRecord so it appears in ProjectLibrary/Calendar
    const student = get().student;
    const projectRecord: ProjectRecord = {
      id,
      studentId: student.studentId || 'default',
      title: brief.title,
      status: 'NotStarted',
      createdAt,
      updatedAt: createdAt,
      brief,
    };
    createProjectRecord(projectRecord).catch(console.error);

    set({ student: deriveStudent() });

    // Refresh Dexie list
    get().loadDexieProjects().catch(console.error);

    return id;
  },

  deleteProject: (projectId) => {
    const projects = useProjectStore.getState().projects;
    const index = projects.findIndex((p, i) => getLegacyProjectId(p, i) === projectId);
    if (index < 0) return;
    void useProjectStore.getState().deleteProject(index);

    // Also remove from Dexie inventory
    deleteProjectRecord(projectId).catch(console.error);

    set({ student: deriveStudent() });
    get().loadDexieProjects().catch(console.error);
  },

  addProjectMessage: (projectId, message) => {
    const store = useProjectStore.getState();
    const index = store.projects.findIndex((p, i) => getLegacyProjectId(p, i) === projectId);
    if (index < 0) return;

    const project = store.projects[index];
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    void store.updateProject(index, {
      chatHistory: [...(project.chatHistory || []), newMessage],
    });

    set({ student: deriveStudent() });
  },

  setIsGeneratingProject: (val) => {
    useProjectStore.getState().setIsGeneratingProject(val);
    set({ isGeneratingProject: val });
  },

  setMentorTypingProjectId: (id) => {
    useProjectStore.getState().setIsMentorTyping(Boolean(id));
    set({ mentorTypingProjectId: id });
  },

  // ── Dexie project inventory actions (Branch B) ──

  loadDexieProjects: async () => {
    const { student } = get();
    if (!student?.studentId) {
      set({ dexieProjects: [] });
      return;
    }
    const projects = await listProjects(student.studentId);
    set({ dexieProjects: projects });
  },

  loadActiveProject: async () => {
    const id = await getActiveProjectId();
    if (id === null) {
      set({ activeProjectId: null, activeProject: null });
      return;
    }
    const proj = await getProject(id);
    if (!proj) {
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
      studentId: student.studentId || 'default',
      title: generated.title?.trim() || 'Industry Project',
      status: 'NotStarted',
      createdAt: now,
      updatedAt: now,
      brief: generated,
    };

    await createProjectRecord(record);
    await get().setActiveProject(record.id);
    await get().loadDexieProjects();
    return record.id;
  },

  updateProjectStatus: async (id, status) => {
    await updateProjectRecord(id, { status });
    await get().loadDexieProjects();
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

    await updateProjectRecord(id, { brief: newBrief, status: 'NotStarted' });
    await get().loadDexieProjects();
    if (get().activeProjectId === id) {
      const updated = await getProject(id);
      set({ activeProject: updated ?? null });
    }
  },

  deleteProjectById: async (id) => {
    await deleteProjectRecord(id);
    await get().loadDexieProjects();

    // Also remove from legacy store
    const legacyProjects = useProjectStore.getState().projects;
    const idx = legacyProjects.findIndex((p, i) => getLegacyProjectId(p, i) === id);
    if (idx >= 0) {
      void useProjectStore.getState().deleteProject(idx);
    }

    if (get().activeProjectId === id) {
      const remaining = get().dexieProjects;
      const sorted = [...remaining].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      if (sorted.length === 0) {
        await get().setActiveProject(null);
      } else {
        await get().setActiveProject(sorted[0].id);
      }
    }

    set({ student: deriveStudent() });
  },

  archiveActiveIfUnused: async () => {
    const { activeProject } = get();
    if (!activeProject) return;
    if (getEffectiveStatus(activeProject) !== 'NotStarted') return;
    await updateProjectRecord(activeProject.id, { status: 'Archived' });
    await get().loadDexieProjects();
    if (get().activeProjectId === activeProject.id) {
      const updated = await getProject(activeProject.id);
      set({ activeProject: updated ?? null });
    }
  },

  addProjectNote: async (projectId, text) => {
    const proj = await getProject(projectId);
    if (!proj) return;
    const notes = proj.notes ?? [];
    const newNote = { id: generateId(), text, createdAt: new Date().toISOString() };
    await updateProjectRecord(projectId, { notes: [...notes, newNote] });
    await get().loadDexieProjects();
    if (get().activeProjectId === projectId) {
      const updated = await getProject(projectId);
      set({ activeProject: updated ?? null });
    }
  },

  deleteProjectNote: async (projectId, noteId) => {
    const proj = await getProject(projectId);
    if (!proj) return;
    const notes = (proj.notes ?? []).filter((n) => n.id !== noteId);
    await updateProjectRecord(projectId, { notes });
    await get().loadDexieProjects();
    if (get().activeProjectId === projectId) {
      const updated = await getProject(projectId);
      set({ activeProject: updated ?? null });
    }
  },
}));

// Sync student whenever underlying stores change
const syncStudent = () => {
  const newStudent = deriveStudent();
  useStudentStore.setState({ student: newStudent });
  // Also refresh Dexie projects when student changes
  useStudentStore.getState().loadDexieProjects().catch(console.error);
};

useStudentCore.subscribe(syncStudent);
useCourseStore.subscribe(syncStudent);
useProjectStore.subscribe(syncStudent);
