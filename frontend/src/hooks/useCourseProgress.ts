import { useCallback, useEffect, useState } from "react";
import type { LearningStep, LessonProgress, ProgressState } from "../types";

const STORAGE_KEY = "spark-path-progress-v1";

const emptyState: ProgressState = {
  lessons: {},
  codeDrafts: {},
  noteDrafts: {},
};

const emptyLesson = (): LessonProgress => ({
  visitedSteps: [],
  exerciseUnlocked: false,
  completedExerciseIds: [],
  skippedExerciseIds: [],
  passedLabIds: [],
  completed: false,
});

function normalizeLesson(lesson?: Partial<LessonProgress>): LessonProgress {
  return { ...emptyLesson(), ...lesson };
}

function loadState(): ProgressState {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return emptyState;
    const stored = JSON.parse(value) as Partial<ProgressState>;
    return {
      ...emptyState,
      ...stored,
      lessons: Object.fromEntries(
        Object.entries(stored.lessons ?? {}).map(([id, lesson]) => [id, normalizeLesson(lesson)]),
      ),
    };
  } catch {
    return emptyState;
  }
}

export function useCourseProgress() {
  const [state, setState] = useState<ProgressState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateLesson = useCallback(
    (lessonId: string, update: (lesson: LessonProgress) => LessonProgress) => {
      setState((current) => ({
        ...current,
        lessons: {
          ...current.lessons,
          [lessonId]: update(normalizeLesson(current.lessons[lessonId])),
        },
      }));
    },
    [],
  );

  const visitStep = useCallback(
    (lessonId: string, step: LearningStep) =>
      updateLesson(lessonId, (lesson) => ({
        ...lesson,
        visitedSteps: lesson.visitedSteps.includes(step)
          ? lesson.visitedSteps
          : [...lesson.visitedSteps, step],
      })),
    [updateLesson],
  );

  const unlockExercise = useCallback(
    (lessonId: string) =>
      updateLesson(lessonId, (lesson) => ({
        ...lesson,
        exerciseUnlocked: true,
        visitedSteps: lesson.visitedSteps.includes("exercise")
          ? lesson.visitedSteps
          : [...lesson.visitedSteps, "exercise"],
      })),
    [updateLesson],
  );

  const setExerciseDone = useCallback(
    (lessonId: string, exerciseId: string, done: boolean) =>
      updateLesson(lessonId, (lesson) => ({
        ...lesson,
        completedExerciseIds: done
          ? [...new Set([...lesson.completedExerciseIds, exerciseId])]
          : lesson.completedExerciseIds.filter((id) => id !== exerciseId),
        skippedExerciseIds: done
          ? lesson.skippedExerciseIds.filter((id) => id !== exerciseId)
          : lesson.skippedExerciseIds,
      })),
    [updateLesson],
  );

  const setExerciseSkipped = useCallback(
    (lessonId: string, exerciseId: string, skipped: boolean) =>
      updateLesson(lessonId, (lesson) => ({
        ...lesson,
        skippedExerciseIds: skipped
          ? [...new Set([...lesson.skippedExerciseIds, exerciseId])]
          : lesson.skippedExerciseIds.filter((id) => id !== exerciseId),
        completedExerciseIds: skipped
          ? lesson.completedExerciseIds.filter((id) => id !== exerciseId)
          : lesson.completedExerciseIds,
      })),
    [updateLesson],
  );

  const passLab = useCallback(
    (lessonId: string, labId: string) =>
      updateLesson(lessonId, (lesson) => ({
        ...lesson,
        passedLabIds: [...new Set([...lesson.passedLabIds, labId])],
      })),
    [updateLesson],
  );

  const completeLesson = useCallback(
    (lessonId: string) =>
      updateLesson(lessonId, (lesson) => ({ ...lesson, completed: true })),
    [updateLesson],
  );

  const setDraft = useCallback((kind: "codeDrafts" | "noteDrafts", key: string, value: string) => {
    setState((current) => ({ ...current, [kind]: { ...current[kind], [key]: value } }));
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(emptyState);
  }, []);

  return {
    state,
    progressFor: (lessonId: string) => normalizeLesson(state.lessons[lessonId]),
    visitStep,
    unlockExercise,
    setExerciseDone,
    setExerciseSkipped,
    passLab,
    completeLesson,
    setDraft,
    reset,
  };
}
