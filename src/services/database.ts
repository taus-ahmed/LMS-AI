import Dexie, { type Table } from 'dexie';
import type { StudentProfile, ProjectBrief } from '../types/student';

// ---------------------------------------------------------------------------
// Project types
// ---------------------------------------------------------------------------

export type ProjectStatus =
  | 'NotStarted'
  | 'Started'
  | 'InProgress'
  | 'Finished'
  | 'Dropped'
  | 'Archived';

export type MilestoneStatus = 'todo' | 'in-progress' | 'completed';

export interface ProjectRecord {
  id: string;
  studentId: string;
  title: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  brief: ProjectBrief;
  notes?: { id: string; text: string; createdAt: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments that don't support crypto.randomUUID
  return (
    Math.random().toString(36).slice(2, 10) +
    '-' +
    Date.now().toString(36)
  );
}

function deriveProjectStatus(brief: ProjectBrief): ProjectStatus {
  const milestones = brief.milestones ?? [];
  if (milestones.length === 0) return 'NotStarted';

  const allCompleted = milestones.every((m) => m.status === 'completed');
  if (allCompleted) return 'Finished';

  const anyActive = milestones.some(
    (m) => m.status === 'in-progress' || m.status === 'completed'
  );
  if (anyActive) return 'InProgress';

  return 'NotStarted';
}

// ---------------------------------------------------------------------------
// Database class
// ---------------------------------------------------------------------------

export class LMSAIDatabase extends Dexie {
  students!: Table<StudentProfile>;
  projects!: Table<ProjectRecord, string>;
  settings!: Table<{ key: string; value: string }, string>;

  constructor() {
    super('LMSAI_DB');

    this.version(1).stores({
      students: '++id, studentId, name',
    });

    // Version 2: Add notes field
    this.version(2).stores({
      students: '++id, studentId, name',
    });

    // Version 3: Add projects and settings tables; migrate existing project data
    this.version(3)
      .stores({
        students: '++id, studentId, name',
        projects: 'id, studentId, status, createdAt, updatedAt',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        // Read first student using the raw transaction table
        const student = await (tx as any).students.toCollection().first();

        if (!student) return;

        // Check whether there is an existing project to migrate
        const existingBrief: ProjectBrief | null = student.project ?? null;
        if (!existingBrief) return;

        // Only migrate when the projects table is still empty
        const projectCount = await (tx as any).projects.count();
        if (projectCount > 0) return;

        const now = new Date().toISOString();
        const projectId = generateId();

        const record: ProjectRecord = {
          id: projectId,
          studentId: student.studentId,
          title: existingBrief.title?.trim() || 'Industry Project',
          status: deriveProjectStatus(existingBrief),
          createdAt: now,
          updatedAt: now,
          brief: existingBrief,
        };

        await (tx as any).projects.add(record);
        await (tx as any).settings.put({ key: 'activeProjectId', value: projectId });
      });
  }
}

const db = new LMSAIDatabase();

// ---------------------------------------------------------------------------
// Existing exports (unchanged behaviour)
// ---------------------------------------------------------------------------

export async function initializeDatabase(): Promise<StudentProfile> {
  const existingStudents = await db.students.toArray();

  if (existingStudents.length === 0) {
    const { SIMULATED_STUDENT } = await import('../store/studentStore');
    await db.students.add(SIMULATED_STUDENT);
    return SIMULATED_STUDENT;
  }

  return existingStudents[0];
}

export async function saveStudentProfile(profile: StudentProfile): Promise<void> {
  await db.students.put(profile);
}

export async function getStudentProfile(): Promise<StudentProfile | undefined> {
  return await db.students.toCollection().first();
}

// ---------------------------------------------------------------------------
// New project helper functions
// ---------------------------------------------------------------------------

export async function listProjects(studentId: string): Promise<ProjectRecord[]> {
  return db.projects.where('studentId').equals(studentId).toArray();
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
  return db.projects.get(id);
}

export async function createProject(project: ProjectRecord): Promise<void> {
  await db.projects.put(project);
}

export async function updateProject(
  id: string,
  patch: Partial<ProjectRecord>
): Promise<void> {
  await db.projects.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id);
}

export async function getActiveProjectId(): Promise<string | null> {
  const row = await db.settings.get('activeProjectId');
  return row?.value ?? null;
}

export async function setActiveProjectId(id: string | null): Promise<void> {
  if (id === null) {
    await db.settings.delete('activeProjectId');
  } else {
    await db.settings.put({ key: 'activeProjectId', value: id });
  }
}

export { db };