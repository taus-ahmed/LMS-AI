import Dexie, { type Table } from 'dexie';
import type { StudentProfile, ProjectBrief } from '../types/student';
import type { CourseModule, Project } from '../types/legacyStudent';

// ---------------------------------------------------------------------------
// Project inventory types (from Branch B)
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
// Database class (merged: Branch A v3 tables + Branch B project inventory)
// ---------------------------------------------------------------------------

export class LMSAIDatabase extends Dexie {
  students!: Table<StudentProfile>;
  courses!: Table<CourseModule>;         // Branch A split-store
  projects!: Table<ProjectRecord, string>; // Branch B Dexie inventory
  legacyProjects!: Table<Project>;       // Branch A legacy projects
  settings!: Table<{ key: string; value: string }, string>; // Branch B settings

  constructor() {
    super('LMSAI_DB');

    this.version(1).stores({
      students: '++id, studentId, name',
    });

    // Version 2: Add notes field
    this.version(2).stores({
      students: '++id, studentId, name',
    });

    // Version 3: Branch A split tables + Branch B project inventory
    this.version(3).stores({
      students: '++id, studentId, name',
      courses: '++id, studentId',
      legacyProjects: '++id, studentId',
      projects: 'id, studentId, status, createdAt, updatedAt',
      settings: 'key',
    });

    // Version 4: Migrate any existing legacy project data to project inventory
    this.version(4)
      .stores({
        students: '++id, studentId, name',
        courses: '++id, studentId',
        legacyProjects: '++id, studentId',
        projects: 'id, studentId, status, createdAt, updatedAt',
        settings: 'key',
      })
      .upgrade(async (tx) => {
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
// Initialize with default data if no data exists
// ---------------------------------------------------------------------------

export async function initializeDatabase(): Promise<StudentProfile> {
  const existingStudents = await db.students.toArray();

  if (existingStudents.length === 0) {
    const { SIMULATED_STUDENT } = await import('../store/legacySimulatedStudent');
    // Convert to new-style profile with required fields
    const seedProfile: StudentProfile = {
      name: SIMULATED_STUDENT.name,
      studentId: SIMULATED_STUDENT.studentId,
      semester: 'Current Semester',
      currentWeek: 1,
      overallProgress: 0,
      gpa: 3.4,
      enrolledCourseIds: [],
      projects: [],
      notes: SIMULATED_STUDENT.notes || [],
    };
    await db.students.add(seedProfile);
    return seedProfile;
  }

  return existingStudents[0];
}

export async function saveStudentProfile(profile: StudentProfile): Promise<void> {
  const toSave = { ...profile } as any;
  if (!('id' in toSave) || !toSave.id) toSave.id = 1;
  await db.students.put(toSave);
}

export async function getStudentProfile(): Promise<StudentProfile | undefined> {
  return await db.students.toCollection().first();
}

// ---------------------------------------------------------------------------
// Split-store helpers used by studentCore, courseStore, projectStore (Branch A)
// ---------------------------------------------------------------------------

// PROFILE (studentCore store)
export async function saveProfile(
  profile: Omit<StudentProfile, 'courses' | 'projects'> & { canvasApiKey?: string },
): Promise<void> {
  const existing = await db.students.toCollection().first();
  if (existing) {
    await db.students.update(existing.id!, {
      name: profile.name,
      studentId: profile.studentId,
      notes: profile.notes,
      canvasApiKey: profile.canvasApiKey,
    });
  } else {
    await db.students.add({ ...profile, id: 1 } as any);
  }
}

export async function getProfile(): Promise<
  Omit<StudentProfile, 'courses' | 'projects'> & { canvasApiKey?: string } | undefined
> {
  const profile = await db.students.toCollection().first();
  if (!profile) return undefined;
  return {
    name: profile.name,
    studentId: profile.studentId,
    notes: profile.notes,
    canvasApiKey: profile.canvasApiKey,
  };
}

// COURSES (courseStore)
export async function saveCourses(courses: CourseModule[]): Promise<void> {
  const existing = await db.students.toCollection().first();
  if (existing?.studentId) {
    await db.courses.where('studentId').equals(existing.studentId).delete();
    if (courses.length > 0) {
      await db.courses.bulkAdd(
        courses.map((course) => ({
          ...course,
          studentId: existing.studentId,
        })),
      );
    }
  }
}

export async function loadCourses(): Promise<CourseModule[]> {
  const profile = await db.students.toCollection().first();
  if (!profile?.studentId) return [];
  return await db.courses.where('studentId').equals(profile.studentId).toArray();
}

// LEGACY PROJECTS (projectStore – Branch A's index-based model)
export async function saveProjects(projects: Project[]): Promise<void> {
  const existing = await db.students.toCollection().first();
  if (existing?.studentId) {
    await db.legacyProjects.where('studentId').equals(existing.studentId).delete();
    if (projects.length > 0) {
      await db.legacyProjects.bulkAdd(
        projects.map((project) => ({
          ...project,
          studentId: existing.studentId,
        })),
      );
    }
  }
}

export async function loadProjects(): Promise<Project[]> {
  const profile = await db.students.toCollection().first();
  if (!profile?.studentId) return [];
  return await db.legacyProjects.where('studentId').equals(profile.studentId).toArray();
}

// ---------------------------------------------------------------------------
// Dexie project inventory helpers (Branch B – ProjectLibrary / Calendar)
// ---------------------------------------------------------------------------

export async function listProjectRecords(studentId: string): Promise<ProjectRecord[]> {
  return db.projects.where('studentId').equals(studentId).toArray();
}

// Alias used by Branch B's studentStore
export { listProjectRecords as listProjects };

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

export async function deleteProjectRecord(id: string): Promise<void> {
  await db.projects.delete(id);
}

// Alias used by Branch B's studentStore
export { deleteProjectRecord as deleteProject };

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
