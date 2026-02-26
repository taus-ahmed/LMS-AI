import { create } from 'zustand';
import type { StudentProfile, StudentProject, ChatMessage, ProjectBrief } from '../types/student';
import type { Project as LegacyProject, Milestone } from '../types/legacyStudent';
import { useStudentCore } from './studentCore';
import { useCourseStore } from './courseStore';
import { useProjectStore } from './projectStore';
import { COURSE_PROGRAMS } from '../data/coursePrograms';

interface StudentStore {
  student: StudentProfile;
  isGeneratingProject: boolean;
  mentorTypingProjectId: string | null;

  addProject: (courseIds: string[], brief: ProjectBrief) => string;
  deleteProject: (projectId: string) => void;
  addProjectMessage: (projectId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  setIsGeneratingProject: (val: boolean) => void;
  setMentorTypingProjectId: (id: string | null) => void;
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
  };
}

const getLegacyProjectId = (project: LegacyProject, index: number) => project.id ?? `proj-${index + 1}`;

export const useStudentStore = create<StudentStore>((set) => ({
  student: deriveStudent(),
  isGeneratingProject: false,
  mentorTypingProjectId: null,

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
    set({ student: deriveStudent() });
    return id;
  },

  deleteProject: (projectId) => {
    const projects = useProjectStore.getState().projects;
    const index = projects.findIndex((p, i) => getLegacyProjectId(p, i) === projectId);
    if (index < 0) return;
    void useProjectStore.getState().deleteProject(index);
    set({ student: deriveStudent() });
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
}));

const syncStudent = () => {
  useStudentStore.setState({ student: deriveStudent() });
};

useStudentCore.subscribe(syncStudent);
useCourseStore.subscribe(syncStudent);
useProjectStore.subscribe(syncStudent);
