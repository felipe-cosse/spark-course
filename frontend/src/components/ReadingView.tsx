import { ArrowLeft, ArrowRight, BookOpen, Braces, ListChecks } from "lucide-react";
import { codeExamples, extractSection, lessonExplanation } from "../lib/markdown";
import type { CourseItem, LearningStep, LessonProgress } from "../types";
import { LearningSteps } from "./LearningSteps";
import { MarkdownContent } from "./MarkdownContent";

interface ReadingViewProps {
  item: CourseItem;
  step: Exclude<LearningStep, "exercise">;
  progress: LessonProgress;
  canGoBack: boolean;
  onBack: () => void;
  onStep: (step: LearningStep) => void;
  onUnlockExercise: () => void;
}

const stepMeta = {
  explanation: {
    label: "Explanation",
    icon: BookOpen,
    description: "Build the mental model first. Read actively and pause at each prediction prompt.",
  },
  example: {
    label: "Example",
    icon: Braces,
    description: "Trace the lesson code from input grain to output grain before running it.",
  },
  terms: {
    label: "Key terms",
    icon: ListChecks,
    description: "Use these definitions to explain the work precisely in reviews and incidents.",
  },
};

export function ReadingView({
  item,
  step,
  progress,
  canGoBack,
  onBack,
  onStep,
  onUnlockExercise,
}: ReadingViewProps) {
  const meta = stepMeta[step];
  const Icon = meta.icon;
  const examples = codeExamples(item.lessonMarkdown);
  const terms = extractSection(item.lessonMarkdown, "Key terms on this page");
  const markdown = step === "explanation" ? lessonExplanation(item.lessonMarkdown) : terms;

  const continueForward = () => {
    if (step === "explanation") onStep("example");
    else if (step === "example") onStep("terms");
    else onUnlockExercise();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="lesson-shell">
      <main className="reading-main">
        <div className="lesson-progress-label">
          Lesson {item.index + 1} <span>/</span> {item.phase.label}
        </div>
        <h1>{item.title}</h1>
        <div className="reading-state-heading">
          <Icon size={19} />
          <div>
            <h2>{meta.label}</h2>
            <p>{meta.description}</p>
          </div>
        </div>

        {step === "example" ? (
          <section className="example-sequence">
            <div className="instruction-callout">
              <strong>How to study this example</strong>
              <p>For each block, identify the input, the lazy transformation, the action, and the expected output grain. Then compare your prediction with the explanation in the lesson.</p>
            </div>
            {examples.length ? (
              examples.map((example, index) => (
                <div className="example-item" key={`${item.id}-example-${index}`}>
                  <div className="example-number">Example {index + 1} of {examples.length}</div>
                  <MarkdownContent markdown={example} />
                  <div className="trace-prompt">
                    <strong>Trace it:</strong> What work remains lazy, what triggers execution, and what could fail when the data grows?
                  </div>
                </div>
              ))
            ) : (
              <p>This lesson is conceptual. Use the workplace task in the explanation as the worked example.</p>
            )}
          </section>
        ) : markdown ? (
          <MarkdownContent markdown={markdown} />
        ) : (
          <div className="instruction-callout">
            <strong>No separate glossary section</strong>
            <p>Review the definitions embedded in the lesson and explain them in your own words before continuing.</p>
          </div>
        )}

        <footer className="lesson-footer">
          <button className="secondary-button" onClick={onBack} disabled={!canGoBack}>
            <ArrowLeft size={16} /> Previous lesson
          </button>
          <button className="primary-button" onClick={continueForward}>
            {step === "explanation" ? "Continue to example" : step === "example" ? "Review key terms" : "Continue to exercises"}
            <ArrowRight size={16} />
          </button>
        </footer>
      </main>
      <aside className="lesson-side">
        <LearningSteps
          active={step}
          exerciseUnlocked={progress.exerciseUnlocked}
          visited={progress.visitedSteps}
          onSelect={onStep}
        />
        <div className="source-note">
          <span className="eyebrow">Source file</span>
          <code>{item.sourcePath.replace("/docs/", "")}</code>
        </div>
      </aside>
    </div>
  );
}
