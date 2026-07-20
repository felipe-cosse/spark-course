import referenceSolutionsMarkdown from "../../../docs/solutions/reference-solutions.md?raw";
import { parseReferenceSolutions } from "../lib/markdown";

const solutions = parseReferenceSolutions(referenceSolutionsMarkdown);

export function solutionFor(sourcePath: string, exerciseNumber: number): string {
  return solutions.get(`${sourcePath}#${exerciseNumber}`) ?? "A reference solution has not been published for this exercise yet.";
}

export function hasSolution(sourcePath: string, exerciseNumber: number): boolean {
  return solutions.has(`${sourcePath}#${exerciseNumber}`);
}
