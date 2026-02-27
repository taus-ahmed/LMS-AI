import { useStudentCore } from './studentCore';
import { useCourseStore } from './courseStore';
import { useProjectStore } from './projectStore';

// Profile
export const useProfile = () => useStudentCore((s) => s.student);

// Courses
export const useCourses = () => useCourseStore((s) => s.courses);
export const useCurrentCourse = () => useCourseStore((s) => s.getCurrentCourse());

// Projects
export const useProjects = () => useProjectStore((s) => s.projects);
export const useCurrentProject = () => useProjectStore((s) => s.getCurrentProject());

export const useIsAppLoading = () => {
  // Subscribe to all three stores in a single render
  const [coreLoading, coursesLoading, projectsLoading] = [
    useStudentCore((s) => s.isLoading),
    useCourseStore((s) => s.isLoading),
    useProjectStore((s) => s.isLoading),
  ];
  return coreLoading || coursesLoading || projectsLoading;
};

// Initialize all stores (call from App on mount)
export async function initializeAllStores(): Promise<void> {
  await Promise.all([
    useStudentCore.getState().initialize(),
    useCourseStore.getState().initialize(),
    useProjectStore.getState().initialize(),
  ]);
  // After split stores are ready, load Dexie project inventory
  const { useStudentStore } = await import('./studentStore');
  await useStudentStore.getState().loadDexieProjects();
  await useStudentStore.getState().loadActiveProject();
}

// Convenience delegations
export const useAddNote = () => useStudentCore((s) => s.addNote);
export const useAddMessage = () => useProjectStore((s) => s.addMessage);
export const useSetIsMentorTyping = () => useProjectStore((s) => s.setIsMentorTyping);
export const useIsMentorTyping = () => useProjectStore((s) => s.isMentorTyping);
export const useIsGeneratingProject = () => useProjectStore((s) => s.isGeneratingProject);
export const useUpdateStudent = () => useStudentCore((s) => s.updateStudent);
