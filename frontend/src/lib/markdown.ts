import type { ExerciseSection } from "../types";

function sectionBounds(markdown: string, heading: string): [number, number] | null {
  const pattern = new RegExp(`^## ${heading}\\s*$`, "m");
  const match = pattern.exec(markdown);
  if (!match) return null;
  const start = match.index;
  const following = markdown.slice(start + match[0].length);
  const next = /^##\s+/m.exec(following);
  return [start, next ? start + match[0].length + next.index : markdown.length];
}

export function extractSection(markdown: string, heading: string): string {
  const bounds = sectionBounds(markdown, heading);
  return bounds ? markdown.slice(bounds[0], bounds[1]).trim() : "";
}

export function lessonExplanation(markdown: string): string {
  let result = markdown.replace(/^#\s+.+$/m, "").trim();
  for (const heading of ["Key terms on this page", "Exercises"]) {
    const bounds = sectionBounds(result, heading);
    if (bounds) result = `${result.slice(0, bounds[0])}${result.slice(bounds[1])}`.trim();
  }
  return result;
}

export function codeExamples(markdown: string): string[] {
  return [...markdown.matchAll(/```(?:python|bash|sql|text)?\n([\s\S]*?)```/g)].map(
    (match) => match[0],
  );
}

export function parseExercises(markdown: string): ExerciseSection[] {
  const matches = [...markdown.matchAll(/^## Exercise (\d+)\s*(?::|—)\s*(.+)$/gm)];
  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.search(/^## Self-check/m);
    return {
      number: Number(match[1]),
      title: match[2].trim(),
      body: markdown.slice(start, end > start ? end : markdown.length).trim(),
    };
  });
}

export function extractBullets(markdown: string, heading: string): string[] {
  const section = extractSection(markdown, heading);
  return [...section.matchAll(/^-\s+(.+)$/gm)].map((match) => match[1].trim());
}

export function extractSubsection(markdown: string, heading: string): string {
  const pattern = new RegExp(`^### ${heading}\\s*$`, "m");
  const match = pattern.exec(markdown);
  if (!match) return "";
  const start = match.index + match[0].length;
  const following = markdown.slice(start);
  const next = /^(?:###|##)\s+/m.exec(following);
  return following.slice(0, next?.index ?? following.length).trim();
}

function compactCriterion(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function listItems(value: string): string[] {
  return [...value.matchAll(/^(?:[-*]|\d+\.)\s+(.+)$/gm)]
    .map((match) => compactCriterion(match[1]))
    .filter(Boolean);
}

function uniqueCriteria(values: string[]): string[] {
  return [...new Set(values.map(compactCriterion).filter((value) => value.length >= 8))].slice(0, 8);
}

export function exerciseCriteria(body: string, title: string): string[] {
  const mainTask = body.split(/^###\s+/m)[0].trim();
  const taskItems = listItems(mainTask);
  const prose = compactCriterion(mainTask);
  const sentences = prose
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12);
  const listStart = /^(?:[-*]|\d+\.)\s+/m.exec(mainTask)?.index;
  const lead = listStart === undefined ? "" : compactCriterion(mainTask.slice(0, listStart));
  const taskCriteria = taskItems.length ? [...(lead ? [lead] : []), ...taskItems] : sentences;

  const requirements = extractSubsection(body, "Requirements");
  const acceptance = extractSubsection(body, "Acceptance criteria");
  const explicitItems = [...listItems(requirements), ...listItems(acceptance)];
  if (explicitItems.length) return uniqueCriteria([...taskCriteria, ...explicitItems]);

  const deliverable = compactCriterion(extractSubsection(body, "Deliverable"));
  if (deliverable || taskCriteria.length) {
    return uniqueCriteria([
      ...(deliverable ? [`Produce the requested deliverable: ${deliverable}`] : []),
      ...taskCriteria,
    ]);
  }

  return [`Complete “${title}” and include evidence that can be reviewed.`];
}

export function parseReferenceSolutions(markdown: string): Map<string, string> {
  const matches = [...markdown.matchAll(/^## (\/docs\/.+\.md)#(\d+)\s*$/gm)];
  return new Map(
    matches.map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = matches[index + 1]?.index ?? markdown.length;
      return [`${match[1]}#${match[2]}`, markdown.slice(start, end).trim()];
    }),
  );
}
