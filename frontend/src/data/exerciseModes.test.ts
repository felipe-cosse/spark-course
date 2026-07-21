import { describe, expect, it } from "vitest";
import { courseItems } from "./course";
import { codeExerciseKeys, exerciseModeFor } from "./exerciseModes";
import { labs } from "./labs";
import { parseExercises } from "../lib/markdown";

describe("exercise workspace modes", () => {
  const exerciseKeys = new Set(
    courseItems.flatMap((item) => (
      parseExercises(item.exerciseMarkdown).map((exercise) => `${item.sourcePath}#${exercise.number}`)
    )),
  );

  it("classifies all reviewed code keys as real exercises", () => {
    expect(exerciseKeys.size).toBe(124);
    expect(codeExerciseKeys.size).toBe(56);
    for (const key of codeExerciseKeys) expect(exerciseKeys.has(key), key).toBe(true);
  });

  it("keeps every automatically graded lab in code mode", () => {
    for (const lab of labs) {
      expect(exerciseModeFor(lab.sourcePath, lab.exerciseNumber), lab.id).toBe("code");
    }
  });

  it("uses written mode for analysis and documentation tasks", () => {
    expect(exerciseModeFor("/docs/README.md", 1)).toBe("written");
    expect(exerciseModeFor("/docs/reference/glossary.md", 2)).toBe("written");
    expect(exerciseModeFor("/docs/03-production-engineering/04-debugging-and-observability.md", 4)).toBe("written");
  });
});
