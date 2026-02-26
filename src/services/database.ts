import Dexie, { type Table } from 'dexie';
import type { StudentProfile, CourseModule, Project } from '../types/legacyStudent';
import { SIMULATED_STUDENT } from '../store/legacySimulatedStudent';

/**
 * Dexie-backed storage for profile, courses, and projects
 * (ported from Old backend, using legacy data shapes).
 */

export class LMSAIDatabase extends Dexie {
  students!: Table<StudentProfile>;
  courses!: Table<CourseModule>;
  projects!: Table<Project>;

  constructor() {
    super('LMSAI_DB');
    this.version(1).stores({
      students: '++id, studentId, name',
    });

    // Version 2: Add notes field
    this.version(2).stores({
      students: '++id, studentId, name',
    });

    // Version 3: Add separate tables for courses and projects
    this.version(3).stores({
      students: '++id, studentId, name',
      courses: '++id, studentId', // Index by studentId to support multi-student eventually
      projects: '++id, studentId', // Index by studentId to support multi-student eventually
    });
  }
}

const db = new LMSAIDatabase();

// Initialize with default data if no data exists
export async function initializeDatabase(): Promise<StudentProfile> {
  const existingStudents = await db.students.toArray();

  if (existingStudents.length === 0) {
    await db.students.add(SIMULATED_STUDENT);
    return SIMULATED_STUDENT;
  }

  // Return the first (and likely only) student
  return existingStudents[0];
}

export async function saveStudentProfile(profile: StudentProfile): Promise<void> {
  // Add a fake id if missing for compatibility
  const toSave = { ...profile } as any;
  if (!('id' in toSave)) toSave.id = 1;
  await db.students.put(toSave);
}

export async function getStudentProfile(): Promise<StudentProfile | undefined> {
  return await db.students.toCollection().first();
}

/**
 * Split-store helpers used by studentCore, courseStore, and projectStore
 */

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

// PROJECTS (projectStore)
export async function saveProjects(projects: Project[]): Promise<void> {
  const existing = await db.students.toCollection().first();
  if (existing?.studentId) {
    await db.projects.where('studentId').equals(existing.studentId).delete();
    if (projects.length > 0) {
      await db.projects.bulkAdd(
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
  return await db.projects.where('studentId').equals(profile.studentId).toArray();
}

export { db };

