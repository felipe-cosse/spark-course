import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Eye,
  EyeOff,
  FlaskConical,
  Lightbulb,
  ListChecks,
  LoaderCircle,
  Play,
  RotateCcw,
  SkipForward,
  Terminal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { labFor } from "../data/labs";
import { solutionFor } from "../data/solutions";
import { executeSpark } from "../lib/api";
import { extractBullets, extractSubsection, parseExercises } from "../lib/markdown";
import type { CourseItem, LessonProgress, RunResult } from "../types";
import { LearningSteps } from "./LearningSteps";
import { MarkdownContent } from "./MarkdownContent";

type FeedbackTab = "output" | "tests" | "plan";
type WorkspaceMode = "code" | "notes";

interface ExerciseWorkspaceProps {
  item: CourseItem;
  progress: LessonProgress;
  codeDrafts: Record<string, string>;
  noteDrafts: Record<string, string>;
  runnerOnline: boolean | null;
  onStep: (step: "explanation" | "example" | "terms" | "exercise") => void;
  onDraft: (kind: "codeDrafts" | "noteDrafts", key: string, value: string) => void;
  onExerciseDone: (exerciseId: string, done: boolean) => void;
  onExerciseSkipped: (exerciseId: string, skipped: boolean) => void;
  onLabPassed: (labId: string) => void;
  onCompleteLesson: () => void;
  onNextLesson: () => void;
  hasNextLesson: boolean;
}

const genericStarter = `# The active SparkSession is named spark.
# Import helpers with F, T, and Window; they are already available.

# Build a small fixture that represents the edge cases in the task.
data = [("example", 1)]
df = spark.createDataFrame(data, "name string, value long")

# Replace this preview with your solution.
result = df
result.show()`;

function criteriaFor(body: string, fallback: string, selfCheck: string[]): string[] {
  const requirementSection = extractSubsection(body, "Requirements");
  const acceptanceSection = extractSubsection(body, "Acceptance criteria");
  const deliverable = extractSubsection(body, "Deliverable");
  const bullets = [requirementSection, acceptanceSection]
    .flatMap((section) => [...section.matchAll(/^[-*]\s+(.+)$/gm)].map((match) => match[1].trim()));
  if (bullets.length) return bullets;
  if (deliverable) return [deliverable.replace(/\s+/g, " ").trim(), ...selfCheck.slice(0, 2)];
  if (selfCheck.length) return selfCheck;
  return [`The answer fully addresses “${fallback}” and includes verifiable evidence.`];
}

export function ExerciseWorkspace({
  item,
  progress,
  codeDrafts,
  noteDrafts,
  runnerOnline,
  onStep,
  onDraft,
  onExerciseDone,
  onExerciseSkipped,
  onLabPassed,
  onCompleteLesson,
  onNextLesson,
  hasNextLesson,
}: ExerciseWorkspaceProps) {
  const exercises = useMemo(() => parseExercises(item.exerciseMarkdown), [item.exerciseMarkdown]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("code");
  const [feedbackTab, setFeedbackTab] = useState<FeedbackTab>("output");
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [selfReviewOpen, setSelfReviewOpen] = useState(false);
  const [reviewChecks, setReviewChecks] = useState<Record<string, boolean[]>>({});
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    setSelectedIndex(0);
    setResult(null);
    setHintOpen(false);
    setSolutionOpen(false);
    setSelfReviewOpen(false);
  }, [item.id]);

  const selected = exercises[selectedIndex] ?? { number: 1, title: "Practice", body: item.exerciseMarkdown };
  const exerciseId = `${item.id}-exercise-${selected.number}`;
  const lab = labFor(item.sourcePath, selected.number);
  const draftKey = lab?.id ?? exerciseId;
  const code = codeDrafts[draftKey] ?? lab?.starter ?? genericStarter;
  const notes = noteDrafts[exerciseId] ?? "";
  const done = progress.completedExerciseIds.includes(exerciseId);
  const skipped = progress.skippedExerciseIds.includes(exerciseId);
  const labPassed = Boolean(lab && progress.passedLabIds.includes(lab.id));
  const selfCheck = extractBullets(item.exerciseMarkdown, "Self-check");
  const criteria = lab?.criteria ?? criteriaFor(selected.body, selected.title, selfCheck);
  const hint = extractSubsection(selected.body, "Hint") || "Return to the worked example. Start with a three-row fixture that includes one normal row, one boundary case, and one invalid row.";
  const solution = solutionFor(item.sourcePath, selected.number);
  const selectedChecks = reviewChecks[exerciseId] ?? criteria.map(() => false);
  const allReviewChecksPassed = criteria.length > 0 && selectedChecks.every(Boolean);
  const allResolved = exercises.length > 0 && exercises.every((exercise) => {
    const id = `${item.id}-exercise-${exercise.number}`;
    return progress.completedExerciseIds.includes(id) || progress.skippedExerciseIds.includes(id);
  });

  const selectExercise = (index: number) => {
    setSelectedIndex(index);
    setResult(null);
    setHintOpen(false);
    setSolutionOpen(false);
    setSelfReviewOpen(false);
    setRequestError("");
  };

  const advanceToNextUnresolved = () => {
    const orderedIndexes = [
      ...exercises.map((_, index) => index).slice(selectedIndex + 1),
      ...exercises.map((_, index) => index).slice(0, selectedIndex),
    ];
    const nextIndex = orderedIndexes.find((index) => {
      const id = `${item.id}-exercise-${exercises[index].number}`;
      return !progress.completedExerciseIds.includes(id) && !progress.skippedExerciseIds.includes(id);
    });
    if (nextIndex !== undefined) {
      selectExercise(nextIndex);
      return;
    }
    onCompleteLesson();
    if (hasNextLesson) onNextLesson();
  };

  const skipExercise = () => {
    onExerciseSkipped(exerciseId, true);
    advanceToNextUnresolved();
  };

  const checkAnswer = () => {
    if (lab) {
      void runCode("check");
      return;
    }
    setSolutionOpen(true);
    setSelfReviewOpen(true);
    setFeedbackTab("tests");
    setRequestError("");
  };

  const toggleReviewCriterion = (index: number) => {
    setReviewChecks((current) => {
      const checks = [...(current[exerciseId] ?? criteria.map(() => false))];
      checks[index] = !checks[index];
      return { ...current, [exerciseId]: checks };
    });
  };

  const finishSelfReview = () => {
    if (!allReviewChecksPassed) return;
    onExerciseDone(exerciseId, true);
    setSelfReviewOpen(false);
    setFeedbackTab("tests");
  };

  const runCode = async (mode: "run" | "check") => {
    setRunning(true);
    setRequestError("");
    setFeedbackTab(mode === "check" ? "tests" : "output");
    try {
      const response = await executeSpark(code, mode, lab?.id);
      setResult(response);
      if (mode === "check" && lab && response.tests.length > 0 && response.tests.every((test) => test.passed)) {
        onLabPassed(lab.id);
        onExerciseDone(exerciseId, true);
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "The runner could not execute this code.");
    } finally {
      setRunning(false);
    }
  };

  const resetExercise = () => {
    onDraft("codeDrafts", draftKey, lab?.starter ?? genericStarter);
    onDraft("noteDrafts", exerciseId, "");
    onExerciseDone(exerciseId, false);
    onExerciseSkipped(exerciseId, false);
    setReviewChecks((current) => ({ ...current, [exerciseId]: criteria.map(() => false) }));
    setResult(null);
    setSolutionOpen(false);
    setSelfReviewOpen(false);
    setRequestError("");
  };

  return (
    <div className="exercise-shell">
      <main className="exercise-main">
        <div className="exercise-topline">
          <button className="back-link" onClick={() => onStep("terms")}><ArrowLeft size={15} /> Back to key terms</button>
          <span>Lesson {item.index + 1} exercise</span>
        </div>
        <h1>{item.title}</h1>

        <div className="exercise-picker" role="tablist" aria-label="Exercises">
          {exercises.map((exercise, index) => {
            const id = `${item.id}-exercise-${exercise.number}`;
            const complete = progress.completedExerciseIds.includes(id);
            return (
              <button
                role="tab"
                aria-selected={selectedIndex === index}
                className={selectedIndex === index ? "active" : ""}
                key={id}
                onClick={() => selectExercise(index)}
              >
                {complete ? <Check size={14} /> : progress.skippedExerciseIds.includes(id) ? <SkipForward size={14} /> : <span>{exercise.number}</span>}
                Exercise {exercise.number}
              </button>
            );
          })}
        </div>

        <section className="task-instructions">
          <div className="task-number">{selected.number}</div>
          <div>
            <h2>{selected.title}</h2>
            <MarkdownContent markdown={selected.body} />
          </div>
        </section>

        <div className="answer-tools">
          <button
            className="secondary-button"
            aria-expanded={solutionOpen}
            aria-controls="reference-solution"
            onClick={() => setSolutionOpen((open) => !open)}
          >
            {solutionOpen ? <EyeOff size={16} /> : <Eye size={16} />}
            {solutionOpen ? "Hide solution" : "Show solution"}
          </button>
          <span>Try the exercise first, then compare your reasoning and evidence.</span>
        </div>

        {solutionOpen && (
          <section className="solution-panel" id="reference-solution">
            <div className="solution-heading">
              <BookOpenCheck size={19} />
              <div>
                <h2>Reference solution</h2>
                <p>One valid approach—not the only possible answer.</p>
              </div>
            </div>
            <MarkdownContent markdown={solution} />
          </section>
        )}

        <section className="workspace-panel">
          <div className="workspace-toolbar">
            <div className="segmented-control" aria-label="Workspace type">
              <button className={workspaceMode === "code" ? "active" : ""} onClick={() => setWorkspaceMode("code")}>Spark code</button>
              <button className={workspaceMode === "notes" ? "active" : ""} onClick={() => setWorkspaceMode("notes")}>Notebook notes</button>
            </div>
            <span className="autosave-state">Saved in this browser</span>
          </div>

          {workspaceMode === "code" ? (
            <CodeMirror
              aria-label="PySpark exercise editor"
              className="spark-editor"
              value={code}
              height="360px"
              extensions={[python()]}
              onChange={(value) => onDraft("codeDrafts", draftKey, value)}
              basicSetup={{ foldGutter: false, highlightActiveLineGutter: false }}
            />
          ) : (
            <textarea
              className="notes-editor"
              aria-label="Exercise notebook notes"
              value={notes}
              onChange={(event) => onDraft("noteDrafts", exerciseId, event.target.value)}
              placeholder="Write your grain, assumptions, expected result, evidence, and trade-offs here…"
            />
          )}

          <div className="workspace-actions">
            <div>
              <button className="secondary-button" onClick={() => runCode("run")} disabled={running || runnerOnline !== true}>
                {running ? <LoaderCircle className="spin" size={16} /> : <Play size={16} />} Run code
              </button>
              <button className="primary-button" onClick={checkAnswer} disabled={running || Boolean(lab && runnerOnline !== true)}>
                <FlaskConical size={16} /> Check answer
              </button>
            </div>
            <button className="text-button" onClick={resetExercise}><RotateCcw size={15} /> Reset exercise</button>
          </div>
          {runnerOnline === false && (
            <p className="runner-help">Spark execution is offline. Reference solutions and rubric reviews still work; start the complete course with <code>make up</code> to run code and use automatic lab tests.</p>
          )}
        </section>

        <section className="feedback-panel" aria-live="polite">
          <div className="feedback-tabs">
            <button className={feedbackTab === "output" ? "active" : ""} onClick={() => setFeedbackTab("output")}><Terminal size={15} /> Output</button>
            <button className={feedbackTab === "tests" ? "active" : ""} onClick={() => setFeedbackTab("tests")}><FlaskConical size={15} /> {lab ? "Tests" : "Review"}</button>
            <button className={feedbackTab === "plan" ? "active" : ""} onClick={() => setFeedbackTab("plan")}><ListChecks size={15} /> Plan</button>
          </div>
          <div className="feedback-body">
            {requestError ? <div className="error-message">{requestError}</div> : feedbackTab === "tests" ? (
              !lab && done ? (
                <div className="review-passed"><CheckCircle2 size={18} /><div><strong>Self-review complete</strong><span>Your answer meets every stated criterion.</span></div></div>
              ) : !lab && selfReviewOpen ? (
                <div className="self-review">
                  <p>Compare your work with the reference solution, then confirm each criterion with evidence from your answer.</p>
                  <div className="review-checklist">
                    {criteria.map((criterion, index) => (
                      <label key={`${criterion}-${index}`}>
                        <input type="checkbox" checked={Boolean(selectedChecks[index])} onChange={() => toggleReviewCriterion(index)} />
                        <span>{criterion}</span>
                      </label>
                    ))}
                  </div>
                  <button className="primary-button" disabled={!allReviewChecksPassed} onClick={finishSelfReview}>
                    <CheckCircle2 size={16} /> Confirm answer meets criteria
                  </button>
                </div>
              ) : result?.tests.length ? (
                <ul className="test-results">
                  {result.tests.map((test) => (
                    <li className={test.passed ? "passed" : "failed"} key={test.name}>
                      {test.passed ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                      <div><strong>{test.name}</strong><span>{test.message}</span></div>
                    </li>
                  ))}
                </ul>
              ) : <p>{lab ? "Choose Check answer to run the task-specific tests." : "Choose Check answer to compare with the reference solution and complete the review checklist."}</p>
            ) : feedbackTab === "plan" ? (
              <pre>{result?.plan || "Run a DataFrame assigned to result to inspect its formatted physical plan."}</pre>
            ) : (
              <pre>{result ? [result.stdout, result.stderr].filter(Boolean).join("\n") || "Code completed without printed output." : "Run the code to see stdout and a small DataFrame preview."}</pre>
            )}
          </div>
        </section>

        <footer className="lesson-footer exercise-footer">
          <div className={`exercise-result ${done ? "is-complete" : skipped ? "is-skipped" : ""}`}>
            {done ? <CheckCircle2 size={17} /> : skipped ? <SkipForward size={17} /> : <Circle size={17} />}
            {done ? "Exercise completed" : skipped ? "Exercise skipped" : lab ? "Pass the tests or skip" : "Check your answer or skip"}
          </div>
          <div className="exercise-navigation">
            {!done && !skipped && (
              <button className="secondary-button" onClick={skipExercise}>Skip exercise <SkipForward size={16} /></button>
            )}
            {(done || skipped) && !allResolved && (
              <button className="primary-button" onClick={advanceToNextUnresolved}>Next exercise <ArrowRight size={16} /></button>
            )}
            {allResolved && (
              progress.completed ? (
                <button className="primary-button" onClick={onNextLesson} disabled={!hasNextLesson}>Next lesson <ArrowRight size={16} /></button>
              ) : (
                <button className="primary-button" onClick={onCompleteLesson}>Complete lesson <ArrowRight size={16} /></button>
              )
            )}
          </div>
        </footer>
      </main>

      <aside className="exercise-side">
        <LearningSteps active="exercise" exerciseUnlocked visited={progress.visitedSteps} onSelect={onStep} />
        <section className="criteria-panel">
          <span className="eyebrow">Completion criteria</span>
          <ul>
            {criteria.map((criterion, index) => (
              <li key={`${criterion}-${index}`}>
                {done || (labPassed && result?.tests[index]?.passed) ? <CheckCircle2 size={16} /> : skipped ? <SkipForward size={16} /> : <Circle size={16} />}
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="hint-panel">
          <button onClick={() => setHintOpen((open) => !open)} aria-expanded={hintOpen}>
            <span><Lightbulb size={16} /> Hint</span><ChevronDown className={hintOpen ? "open" : ""} size={16} />
          </button>
          {hintOpen && <p>{hint}</p>}
        </section>
      </aside>
    </div>
  );
}
