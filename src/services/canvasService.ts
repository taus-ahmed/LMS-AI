// Canvas API utilities using Personal Access Token

export interface CanvasUser {
  id: number;
  name: string;
  email: string;
  login: string;
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  start_at: string;
  end_at: string;
  status: 'active' | 'completed';
}

export interface CanvasModule {
  id: number;
  name: string;
  items_count: number;
  items_url: string;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  due_at?: string | null;
  points_possible?: number | null;
  rubric?: Array<{ id?: string; description?: string; long_description?: string; points?: number }>;
}

export interface CanvasSubmission {
  assignment_id: number;
  score?: number | null;
  submitted_at?: string | null;
  workflow_state?: string;
  attempt?: number | null;
  body?: string | null;
  submission_comments?: Array<{
    id?: number;
    comment?: string;
    created_at?: string;
    author_name?: string;
  }>;
}

export interface CanvasAssignmentSignal {
  assignmentId: number;
  name: string;
  dueAt: string | null;
  pointsPossible: number | null;
  rubricCriteriaCount: number;
  score: number | null;
  submittedAt: string | null;
  workflowState: string;
  feedbackSnippets: string[];
  submissionTextSnippet: string | null;
}

export interface CanvasCourseContext {
  courseId: number;
  assignmentSignals: CanvasAssignmentSignal[];
  gradedCount: number;
  averageScore: number | null;
}

export interface CanvasGenerationContext {
  fetchedAt: string;
  courses: CanvasCourseContext[];
}

const CANVAS_API_URL = import.meta.env.VITE_CANVAS_API_URL || 'https://canvas.instructure.com';
const CORS_PROXY = 'https://cors-proxy.jediweirdo.workers.dev/?';

const createAuthHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
});

// Fetch assignment details (description, rubric, submission comments)
export async function getCanvasAssignmentDetails(
  accessToken: string,
  courseId: number,
  assignmentId: number,
) {
  const assignmentUrl =
    CORS_PROXY + `${CANVAS_API_URL}/api/v1/courses/${courseId}/assignments/${assignmentId}`;
  const submissionUrl =
    CORS_PROXY +
    `${CANVAS_API_URL}/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/self`;

  const assignmentRes = await fetch(assignmentUrl, {
    headers: createAuthHeaders(accessToken),
  });
  if (!assignmentRes.ok) throw new Error('Failed to fetch assignment details');
  const assignment = await assignmentRes.json();

  const submissionRes = await fetch(submissionUrl, {
    headers: createAuthHeaders(accessToken),
  });
  let submissionComments: Array<{ comment?: string; author_name?: string }> = [];
  let submission: CanvasSubmission | null = null;
  if (submissionRes.ok) {
    submission = await submissionRes.json();
    submissionComments = submission?.submission_comments || [];
  }

  return {
    description: assignment.description,
    rubric: assignment.rubric || [],
    submissionComments,
    assignment,
    submission,
  };
}

// Fetch user data from Canvas
export async function getCanvasUser(accessToken: string): Promise<CanvasUser> {
  const url = CORS_PROXY + `${CANVAS_API_URL}/api/v1/users/self`;
  const response = await fetch(url, {
    headers: createAuthHeaders(accessToken),
  });
  if (!response.ok) throw new Error('Failed to fetch Canvas user');
  return response.json();
}

// Fetch user's courses
export async function getCanvasCourses(accessToken: string): Promise<CanvasCourse[]> {
  const urlActive = CORS_PROXY + `${CANVAS_API_URL}/api/v1/courses?enrollment_state=active`;
  const urlCompleted = CORS_PROXY + `${CANVAS_API_URL}/api/v1/courses?enrollment_state=completed`;

  const [activeRes, completedRes] = await Promise.all([
    fetch(urlActive, { headers: createAuthHeaders(accessToken) }),
    fetch(urlCompleted, { headers: createAuthHeaders(accessToken) }),
  ]);
  if (!activeRes.ok && !completedRes.ok) throw new Error('Failed to fetch Canvas courses');

  const activeCourses = activeRes.ok ? await activeRes.json() : [];
  const completedCourses = completedRes.ok ? await completedRes.json() : [];

  const activeWithStatus = (activeCourses || []).map((c: CanvasCourse) => ({
    ...c,
    status: 'active' as const,
  }));
  const completedWithStatus = (completedCourses || []).map((c: CanvasCourse) => ({
    ...c,
    status: 'completed' as const,
  }));

  return [...activeWithStatus, ...completedWithStatus];
}

export function organizeCanvasCourses(courses: CanvasCourse[]): {
  active: CanvasCourse[];
  completed: CanvasCourse[];
} {
  const sortByStartThenName = (a: CanvasCourse, b: CanvasCourse) => {
    const aDate = a.start_at ? Date.parse(a.start_at) : 0;
    const bDate = b.start_at ? Date.parse(b.start_at) : 0;
    if (aDate !== bDate) return bDate - aDate;
    return a.name.localeCompare(b.name);
  };

  return {
    active: courses.filter((c) => c.status === 'active').sort(sortByStartThenName),
    completed: courses.filter((c) => c.status === 'completed').sort(sortByStartThenName),
  };
}

// Fetch modules for a course
export async function getCanvasModules(accessToken: string, courseId: number): Promise<CanvasModule[]> {
  const url = CORS_PROXY + `${CANVAS_API_URL}/api/v1/courses/${courseId}/modules`;
  const response = await fetch(url, {
    headers: createAuthHeaders(accessToken),
  });
  if (!response.ok) throw new Error('Failed to fetch Canvas modules');
  return response.json();
}

// Fetch assignments for a course
export async function getCanvasAssignments(
  accessToken: string,
  courseId: number,
): Promise<CanvasAssignment[]> {
  const url =
    CORS_PROXY +
    `${CANVAS_API_URL}/api/v1/courses/${courseId}/assignments?per_page=50&order_by=due_at`;
  const response = await fetch(url, {
    headers: createAuthHeaders(accessToken),
  });
  if (!response.ok) throw new Error(`Failed to fetch Canvas assignments for course ${courseId}`);
  const assignments = (await response.json()) as CanvasAssignment[];
  return assignments || [];
}

function toSignal(
  assignment: CanvasAssignment,
  submission: CanvasSubmission | null,
  feedbackComments: Array<{ comment?: string }>,
): CanvasAssignmentSignal {
  const feedbackSnippets = feedbackComments
    .map((c) => (c.comment || '').trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((c) => c.slice(0, 180));

  return {
    assignmentId: assignment.id,
    name: assignment.name,
    dueAt: assignment.due_at ?? null,
    pointsPossible: assignment.points_possible ?? null,
    rubricCriteriaCount: assignment.rubric?.length || 0,
    score: submission?.score ?? null,
    submittedAt: submission?.submitted_at ?? null,
    workflowState: submission?.workflow_state || 'unknown',
    feedbackSnippets,
    submissionTextSnippet: submission?.body?.trim()?.slice(0, 300) || null,
  };
}

// Build student-centric Canvas context for project generation.
// Intentionally excludes assignment instructions and teacher-provided resource content.
export async function buildCanvasGenerationContext(
  accessToken: string,
  canvasCourseIds: number[],
  maxAssignmentsPerCourse = 8,
): Promise<CanvasGenerationContext> {
  const courseContexts = await Promise.all(
    canvasCourseIds.map(async (courseId) => {
      const assignments = await getCanvasAssignments(accessToken, courseId);

      const sorted = [...assignments].sort((a, b) => {
        const aTime = a.due_at ? Date.parse(a.due_at) : 0;
        const bTime = b.due_at ? Date.parse(b.due_at) : 0;
        return bTime - aTime;
      });
      const limited = sorted.slice(0, maxAssignmentsPerCourse);

      const details = await Promise.all(
        limited.map(async (assignment) => {
          try {
            return await getCanvasAssignmentDetails(accessToken, courseId, assignment.id);
          } catch {
            return {
              assignment,
              rubric: assignment.rubric || [],
              submissionComments: [],
              submission: null,
              description: '',
            };
          }
        }),
      );

      const assignmentSignals = details.map((detail) =>
        toSignal(detail.assignment as CanvasAssignment, detail.submission, detail.submissionComments || []),
      );
      const graded = assignmentSignals.filter((a) => typeof a.score === 'number') as Array<
        CanvasAssignmentSignal & { score: number }
      >;
      const averageScore =
        graded.length > 0
          ? Math.round(graded.reduce((sum, item) => sum + item.score, 0) / graded.length)
          : null;

      return {
        courseId,
        assignmentSignals,
        gradedCount: graded.length,
        averageScore,
      };
    }),
  );

  return {
    fetchedAt: new Date().toISOString(),
    courses: courseContexts,
  };
}
