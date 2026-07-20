export type LearningStep = "explanation" | "example" | "terms" | "exercise";

export interface CoursePhase {
  code: string;
  label: string;
  directory: string;
}

export interface CourseItem {
  id: string;
  index: number;
  phase: CoursePhase;
  title: string;
  sourcePath: string;
  exercisePath: string;
  lessonMarkdown: string;
  exerciseMarkdown: string;
}

export interface ExerciseSection {
  number: number;
  title: string;
  body: string;
}

export interface LessonProgress {
  visitedSteps: LearningStep[];
  exerciseUnlocked: boolean;
  completedExerciseIds: string[];
  skippedExerciseIds: string[];
  passedLabIds: string[];
  completed: boolean;
}

export interface ProgressState {
  lessons: Record<string, LessonProgress>;
  codeDrafts: Record<string, string>;
  noteDrafts: Record<string, string>;
}

export interface LabDefinition {
  id: string;
  sourcePath: string;
  exerciseNumber: number;
  functionName: string;
  starter: string;
  criteria: string[];
}

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  plan: string;
  tests: TestResult[];
  duration_ms: number;
  error?: string;
}
