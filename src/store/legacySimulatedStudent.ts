import type { StudentProfile } from '../types/legacyStudent';

// Minimal simulated profile used only to bootstrap the Dexie database
// Actual rich template data is provided via the "Copy Template Test Data" actions.
export const SIMULATED_STUDENT: StudentProfile = {
  name: 'Alex Morgan',
  studentId: 'ENG-2026-0482',
  courses: [],
  projects: [],
  notes: [],
};

