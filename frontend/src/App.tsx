import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { CurriculumRail } from "./components/CurriculumRail";
import { ExerciseWorkspace } from "./components/ExerciseWorkspace";
import { ReadingView } from "./components/ReadingView";
import { courseById, courseItems } from "./data/course";
import { useCourseProgress } from "./hooks/useCourseProgress";
import { runnerAvailable } from "./lib/api";
import type { LearningStep } from "./types";

function itemFromHash() {
  const id = window.location.hash.replace(/^#\/?/, "").split("/")[0];
  return courseById.get(id) ?? courseItems[0];
}

export default function App() {
  const progress = useCourseProgress();
  const initial = useMemo(itemFromHash, []);
  const [currentIndex, setCurrentIndex] = useState(initial.index);
  const [step, setStep] = useState<LearningStep>("explanation");
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [runnerOnline, setRunnerOnline] = useState<boolean | null>(null);
  const item = courseItems[currentIndex];
  const lessonProgress = progress.progressFor(item.id);

  useEffect(() => {
    runnerAvailable().then(setRunnerOnline);
    const timer = window.setInterval(() => runnerAvailable().then(setRunnerOnline), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    progress.visitStep(item.id, "explanation");
    document.title = `${item.title} · Spark Path`;
    if (window.location.hash !== `#/${item.id}`) window.history.replaceState(null, "", `#/${item.id}`);
  }, [item.id]);

  const selectLesson = (index: number) => {
    setCurrentIndex(index);
    setStep("explanation");
    window.history.pushState(null, "", `#/${courseItems[index].id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectStep = (next: LearningStep) => {
    if (next === "exercise" && !lessonProgress.exerciseUnlocked) return;
    setStep(next);
    progress.visitStep(item.id, next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const unlockExercise = () => {
    progress.unlockExercise(item.id);
    setStep("exercise");
  };

  const completeLesson = () => {
    progress.completeLesson(item.id);
  };

  const resetProgress = () => {
    if (!window.confirm("Reset all lesson progress, code drafts, and notebook notes?")) return;
    progress.reset();
    selectLesson(0);
  };

  return (
    <div className="app-frame">
      <AppHeader runnerOnline={runnerOnline} onMenu={() => setMobileRailOpen(true)} onReset={resetProgress} />
      <CurriculumRail
        currentIndex={currentIndex}
        progress={progress.state}
        mobileOpen={mobileRailOpen}
        onClose={() => setMobileRailOpen(false)}
        onSelect={selectLesson}
      />
      <div className="app-content">
        {step === "exercise" ? (
          <ExerciseWorkspace
            item={item}
            progress={lessonProgress}
            codeDrafts={progress.state.codeDrafts}
            noteDrafts={progress.state.noteDrafts}
            runnerOnline={runnerOnline}
            onStep={selectStep}
            onDraft={progress.setDraft}
            onExerciseDone={(id, done) => progress.setExerciseDone(item.id, id, done)}
            onLabPassed={(labId) => progress.passLab(item.id, labId)}
            onCompleteLesson={completeLesson}
            onNextLesson={() => selectLesson(Math.min(currentIndex + 1, courseItems.length - 1))}
            hasNextLesson={currentIndex < courseItems.length - 1}
          />
        ) : (
          <ReadingView
            item={item}
            step={step}
            progress={lessonProgress}
            canGoBack={currentIndex > 0}
            onBack={() => selectLesson(currentIndex - 1)}
            onStep={selectStep}
            onUnlockExercise={unlockExercise}
          />
        )}
      </div>
    </div>
  );
}
