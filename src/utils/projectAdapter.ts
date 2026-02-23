/**
 * projectAdapter.ts
 *
 * Thin adapter layer that bridges the two project models that coexist in the
 * app after the branch merge:
 *
 *   ProjectRecord  (Dexie / store.projects)
 *     – source of truth for project COUNT, STATUS, TIMESTAMPS, NOTES
 *     – hydrated from IndexedDB by store.initialize()
 *
 *   StudentProject (student.projects inside StudentProfile)
 *     – source of truth for PER-PROJECT CHAT HISTORY and SELECTED COURSE IDs
 *     – persisted as part of the student JSON blob via saveStudentProfile()
 *
 * After fixing ProjectHub.handleGenerate to call createProjectFromGenerated
 * first and pass its Dexie id to addProject, both models share the same id.
 * This adapter merges them by id so every page works from a single type.
 */

import { useStudentStore } from '../store/studentStore';
import type { ProjectRecord } from '../services/database';
import type { ChatMessage } from '../types/student';

export { getEffectiveStatus } from '../store/studentStore';
export type { ProjectRecord, ProjectStatus } from '../services/database';

// ---------------------------------------------------------------------------
// UnifiedProject type
// ---------------------------------------------------------------------------

/**
 * A ProjectRecord enriched with the two fields that only live on
 * StudentProject: selectedCourseIds and chatHistory.
 *
 * It is a structural super-type of StudentProject, so it can be passed
 * directly to getMentorResponse() and any other function expecting
 * StudentProject without a cast.
 */
export type UnifiedProject = ProjectRecord & {
  selectedCourseIds: string[];
  chatHistory: ChatMessage[];
};

// ---------------------------------------------------------------------------
// Internal merge helper (pure, no hooks)
// ---------------------------------------------------------------------------

function mergeOne(
  rec: ProjectRecord,
  inMemory: { id: string; selectedCourseIds: string[]; chatHistory: ChatMessage[] }[],
): UnifiedProject {
  const sp = inMemory.find((p) => p.id === rec.id);
  return {
    ...rec,
    selectedCourseIds: sp?.selectedCourseIds ?? [],
    chatHistory: sp?.chatHistory ?? [],
  };
}

// ---------------------------------------------------------------------------
// React hooks (read from Zustand – never query Dexie directly)
// ---------------------------------------------------------------------------

/**
 * Returns all projects for the current student, merged from Dexie inventory
 * (status / timestamps) and in-memory model (chatHistory / courseIds).
 * Dexie is the authoritative source for ordering and count.
 */
export function useUnifiedProjects(): UnifiedProject[] {
  const dexieProjects = useStudentStore((s) => s.projects);
  const inMemory = useStudentStore((s) => s.student?.projects ?? []);
  return dexieProjects.map((rec) => mergeOne(rec, inMemory));
}

/**
 * Looks up a single project by id, merged from both models.
 * Returns undefined while loading or if the project does not exist.
 */
export function useUnifiedProject(id: string | undefined): UnifiedProject | undefined {
  const dexieProjects = useStudentStore((s) => s.projects);
  const inMemory = useStudentStore((s) => s.student?.projects ?? []);
  if (!id) return undefined;
  const rec = dexieProjects.find((p) => p.id === id);
  if (!rec) return undefined;
  return mergeOne(rec, inMemory);
}

// ---------------------------------------------------------------------------
// Non-hook helper for use inside async callbacks
// (reads directly from Zustand getState() — safe outside render)
// ---------------------------------------------------------------------------

/**
 * Synchronous lookup using the current store snapshot.
 * Use this inside useCallback / async event handlers where calling a hook
 * would violate the Rules of Hooks.
 */
export function getUnifiedProjectById(id: string): UnifiedProject | undefined {
  const s = useStudentStore.getState();
  const rec = s.projects.find((p) => p.id === id);
  if (!rec) return undefined;
  return mergeOne(rec, s.student?.projects ?? []);
}
