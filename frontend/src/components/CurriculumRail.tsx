import { Check, ChevronDown, ChevronRight, Lock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { courseItems, phases } from "../data/course";
import type { ProgressState } from "../types";

interface CurriculumRailProps {
  currentIndex: number;
  progress: ProgressState;
  mobileOpen: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
}

export function CurriculumRail({
  currentIndex,
  progress,
  mobileOpen,
  onClose,
  onSelect,
}: CurriculumRailProps) {
  const currentPhase = courseItems[currentIndex].phase.code;
  const [expanded, setExpanded] = useState<string[]>([currentPhase]);

  useEffect(() => {
    setExpanded((values) => (values.includes(currentPhase) ? values : [...values, currentPhase]));
  }, [currentPhase]);

  const isUnlocked = (index: number) =>
    index === 0 || Boolean(progress.lessons[courseItems[index - 1].id]?.completed);

  const completedCount = courseItems.filter((item) => progress.lessons[item.id]?.completed).length;

  return (
    <>
      <button
        className={`rail-scrim ${mobileOpen ? "visible" : ""}`}
        aria-label="Close curriculum"
        onClick={onClose}
      />
      <aside className={`curriculum-rail ${mobileOpen ? "open" : ""}`} aria-label="Course curriculum">
        <div className="rail-heading">
          <div>
            <span className="eyebrow">Curriculum</span>
            <strong>{completedCount} of {courseItems.length} lessons</strong>
          </div>
          <button className="icon-button rail-close" onClick={onClose} aria-label="Close curriculum">
            <X size={20} />
          </button>
        </div>
        <div className="rail-progress" aria-hidden="true">
          <span style={{ width: `${(completedCount / courseItems.length) * 100}%` }} />
        </div>

        <nav>
          {phases.map((phase) => {
            const items = courseItems.filter((item) => item.phase.code === phase.code);
            const isExpanded = expanded.includes(phase.code);
            const phaseDone = items.length > 0 && items.every((item) => progress.lessons[item.id]?.completed);
            return (
              <section className="phase-group" key={phase.code}>
                <button
                  className="phase-button"
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpanded((values) =>
                      isExpanded ? values.filter((code) => code !== phase.code) : [...values, phase.code],
                    )
                  }
                >
                  <span className={`phase-code ${phaseDone ? "done" : ""}`}>
                    {phaseDone ? <Check size={13} /> : phase.code}
                  </span>
                  <span>{phase.label}</span>
                  {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
                {isExpanded && (
                  <ol className="lesson-list">
                    {items.map((item) => {
                      const unlocked = isUnlocked(item.index);
                      const done = Boolean(progress.lessons[item.id]?.completed);
                      const active = item.index === currentIndex;
                      return (
                        <li key={item.id}>
                          <button
                            className={`lesson-row ${active ? "active" : ""} ${done ? "done" : ""}`}
                            disabled={!unlocked}
                            onClick={() => {
                              onSelect(item.index);
                              onClose();
                            }}
                            title={unlocked ? item.title : "Complete the previous lesson to unlock"}
                          >
                            <span className="lesson-index">
                              {done ? <Check size={13} /> : unlocked ? String(item.index + 1).padStart(2, "0") : <Lock size={12} />}
                            </span>
                            <span>{item.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
