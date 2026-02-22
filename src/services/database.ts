import Dexie, { type Table } from 'dexie';
import type { StudentProfile, ChatMessage, ProjectBrief } from '../types/student';

export class LMSAIDatabase extends Dexie {
  students!: Table<StudentProfile>;

  constructor() {
    super('LMSAI_DB');
    this.version(1).stores({
      students: '++id, studentId, name'
    });

    // Version 2: Add notes field
    this.version(2).stores({
      students: '++id, studentId, name'
    });
  }
}

const db = new LMSAIDatabase();

// Initialize with default data if no data exists
export async function initializeDatabase(): Promise<StudentProfile> {
  const existingStudents = await db.students.toArray();

  if (existingStudents.length === 0) {
    // Import the simulated student data
    const { SIMULATED_STUDENT } = await import('../store/studentStore');
    await db.students.add(SIMULATED_STUDENT);
    return SIMULATED_STUDENT;
  }

  // Return the first (and likely only) student
  return existingStudents[0];
}

export async function saveStudentProfile(profile: StudentProfile): Promise<void> {
  await db.students.put(profile);
}

export async function getStudentProfile(): Promise<StudentProfile | undefined> {
  return await db.students.toCollection().first();
}

export { db };