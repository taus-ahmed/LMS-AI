/**
 * projectAdapter.ts
 *
 * Bridges the two project models in the merged codebase:
 *   ProjectRecord  (Dexie / store.dexieProjects)
 *   StudentProject (student.projects inside StudentProfile)
 */

import { useStudentStore } from '../store/studentStore';
import type { ProjectRecord } from '../services/database';
import type { ChatMessage } from '../types/student';

export { getEffectiveStatus } from '../store/studentStore';
export type { ProjectRecord, ProjectStatus } from '../services/database';

// ---------------------------------------------------------------------------
// UnifiedProject type
// ---------------------------------------------------------------------------

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
// React hooks
// ---------------------------------------------------------------------------

export function useUnifiedProjects(): UnifiedProject[] {
  const dexieProjects = useStudentStore((s) => s.dexieProjects);
  const inMemory = useStudentStore((s) => s.student?.projects ?? []);
  return dexieProjects.map((rec) => mergeOne(rec, inMemory));
}

export function useUnifiedProject(id: string | undefined): UnifiedProject | undefined {
  const dexieProjects = useStudentStore((s) => s.dexieProjects);
  const inMemory = useStudentStore((s) => s.student?.projects ?? []);
  if (!id) return undefined;
  const rec = dexieProjects.find((p) => p.id === id);
  if (!rec) return undefined;
  return mergeOne(rec, inMemory);
}

// ---------------------------------------------------------------------------
// Non-hook helper for async callbacks
// ---------------------------------------------------------------------------

export function getUnifiedProjectById(id: string): UnifiedProject | undefined {
  const s = useStudentStore.getState();
  const rec = s.dexieProjects.find((p) => p.id === id);
  if (!rec) return undefined;
  return mergeOne(rec, s.student?.projects ?? []);
}
