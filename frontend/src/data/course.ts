import type { CourseItem, CoursePhase } from "../types";

const rawMarkdownModules = import.meta.glob("../../../docs/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const markdownModules = Object.fromEntries(
  Object.entries(rawMarkdownModules).map(([path, markdown]) => [
    `/docs/${path.split("/docs/")[1]}`,
    markdown,
  ]),
) as Record<string, string>;

export const phases: CoursePhase[] = [
  { code: "—", label: "Course overview", directory: "" },
  { code: "00", label: "Start", directory: "00-getting-started" },
  { code: "01", label: "Foundations", directory: "01-foundations" },
  { code: "02", label: "DataFrames & SQL", directory: "02-dataframes-sql" },
  { code: "03", label: "Production Engineering", directory: "03-production-engineering" },
  { code: "04", label: "Structured Streaming", directory: "04-structured-streaming" },
  { code: "05", label: "Advanced APIs", directory: "05-advanced-apis" },
  { code: "06", label: "Workplace Cases", directory: "06-real-world-cases" },
  { code: "07", label: "Capstones", directory: "07-capstones" },
  { code: "R", label: "Reference", directory: "reference" },
];

const sourcePaths = [
  "/docs/README.md",
  "/docs/00-getting-started/01-course-plan.md",
  "/docs/00-getting-started/02-setup.md",
  "/docs/01-foundations/01-distributed-execution.md",
  "/docs/01-foundations/02-sessions-and-first-dataframe.md",
  "/docs/01-foundations/03-schemas-and-types.md",
  "/docs/01-foundations/04-rdds-and-shared-variables.md",
  "/docs/02-dataframes-sql/01-transformations.md",
  "/docs/02-dataframes-sql/02-aggregations-and-windows.md",
  "/docs/02-dataframes-sql/03-joins.md",
  "/docs/02-dataframes-sql/04-storage-and-semi-structured-data.md",
  "/docs/02-dataframes-sql/05-sql-and-catalogs.md",
  "/docs/03-production-engineering/01-design-and-testing.md",
  "/docs/03-production-engineering/02-data-quality-and-idempotency.md",
  "/docs/03-production-engineering/03-performance-tuning.md",
  "/docs/03-production-engineering/04-debugging-and-observability.md",
  "/docs/03-production-engineering/05-deployment-security-and-cost.md",
  "/docs/04-structured-streaming/01-streaming-model.md",
  "/docs/04-structured-streaming/02-state-watermarks-and-joins.md",
  "/docs/04-structured-streaming/03-production-streaming.md",
  "/docs/05-advanced-apis/01-arrow-udfs-and-pandas.md",
  "/docs/05-advanced-apis/02-connect-data-sources-and-pipelines.md",
  "/docs/05-advanced-apis/03-mllib-pipelines.md",
  "/docs/06-real-world-cases/01-orders-batch-etl.md",
  "/docs/06-real-world-cases/02-incremental-and-cdc.md",
  "/docs/06-real-world-cases/03-streaming-fraud-design.md",
  "/docs/06-real-world-cases/04-performance-incident.md",
  "/docs/07-capstones/01-batch-capstone.md",
  "/docs/07-capstones/02-streaming-capstone.md",
  "/docs/07-capstones/03-rubric-and-review.md",
  "/docs/reference/cheat-sheet.md",
  "/docs/reference/glossary.md",
  "/docs/reference/references.md",
  "/docs/reference/troubleshooting.md",
];

function heading(markdown: string): string {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "Untitled lesson";
}

function exercisePath(sourcePath: string): string {
  if (sourcePath === "/docs/README.md") {
    return "/docs/exercises/course-home-exercises.md";
  }
  const relative = sourcePath.replace("/docs/", "");
  const lastSlash = relative.lastIndexOf("/");
  const directory = relative.slice(0, lastSlash);
  const file = relative.slice(lastSlash + 1).replace(/\.md$/, "-exercises.md");
  return `/docs/exercises/${directory}/${file}`;
}

function phaseFor(sourcePath: string): CoursePhase {
  if (sourcePath === "/docs/README.md") return phases[0];
  return (
    phases.find((phase) => phase.directory && sourcePath.includes(`/${phase.directory}/`)) ??
    phases[0]
  );
}

function idFor(sourcePath: string): string {
  return sourcePath
    .replace("/docs/", "")
    .replace(/\.md$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const courseItems: CourseItem[] = sourcePaths.map((sourcePath, index) => {
  const lessonMarkdown = markdownModules[sourcePath];
  const companion = exercisePath(sourcePath);
  const exerciseMarkdown = markdownModules[companion];
  if (!lessonMarkdown || !exerciseMarkdown) {
    throw new Error(`Missing Markdown content for ${sourcePath} or ${companion}`);
  }
  return {
    id: idFor(sourcePath),
    index,
    phase: phaseFor(sourcePath),
    title: heading(lessonMarkdown),
    sourcePath,
    exercisePath: companion,
    lessonMarkdown,
    exerciseMarkdown,
  };
});

export const courseById = new Map(courseItems.map((item) => [item.id, item]));
