import { describe, expect, it } from "vitest";
import { codeExamples, extractSection, lessonExplanation, parseExercises } from "./markdown";

const lesson = `# A lesson

## Key terms on this page

| Term | Definition |
|---|---|
| Grain | What one row represents. |

## Objectives

Understand the plan.

\`\`\`python
result = spark.range(3)
\`\`\`

## Exercises

Complete the companion page.
`;

const exercisePage = `# Exercises

## Exercise 1: First task

Do the first thing.

### Requirements

- Keep the grain.

## Exercise 2 — Second task

Do the second thing.

## Self-check

- Did it work?
`;

describe("Markdown course parsing", () => {
  it("separates the term table from the explanation", () => {
    expect(extractSection(lesson, "Key terms on this page")).toContain("Grain");
    expect(lessonExplanation(lesson)).toContain("Understand the plan");
    expect(lessonExplanation(lesson)).not.toContain("What one row represents");
  });

  it("extracts runnable examples", () => {
    expect(codeExamples(lesson)).toEqual(["```python\nresult = spark.range(3)\n```"]);
  });

  it("keeps numbered exercise bodies independent", () => {
    const exercises = parseExercises(exercisePage);
    expect(exercises).toHaveLength(2);
    expect(exercises[0]).toMatchObject({ number: 1, title: "First task" });
    expect(exercises[0].body).toContain("Keep the grain");
    expect(exercises[0].body).not.toContain("Second task");
    expect(exercises[1]).toMatchObject({ number: 2, title: "Second task" });
    expect(exercises[1].body).not.toContain("Self-check");
  });
});
