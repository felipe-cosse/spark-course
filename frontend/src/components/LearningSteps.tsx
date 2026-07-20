import { Check, Lock } from "lucide-react";
import type { LearningStep } from "../types";

const steps: { id: LearningStep; label: string }[] = [
  { id: "explanation", label: "Explanation" },
  { id: "example", label: "Example" },
  { id: "terms", label: "Key terms" },
  { id: "exercise", label: "Exercise" },
];

interface LearningStepsProps {
  active: LearningStep;
  exerciseUnlocked: boolean;
  visited: LearningStep[];
  onSelect: (step: LearningStep) => void;
}

export function LearningSteps({ active, exerciseUnlocked, visited, onSelect }: LearningStepsProps) {
  const activeIndex = steps.findIndex((step) => step.id === active);
  return (
    <nav className="learning-steps" aria-label="Lesson steps">
      <span className="eyebrow">Lesson path</span>
      <ol>
        {steps.map((step, index) => {
          const locked = step.id === "exercise" && !exerciseUnlocked;
          const complete = visited.includes(step.id) && index < activeIndex;
          return (
            <li key={step.id}>
              <button
                aria-label={step.label}
                className={`${active === step.id ? "active" : ""} ${complete ? "complete" : ""}`}
                disabled={locked}
                onClick={() => onSelect(step.id)}
              >
                <span>{complete ? <Check size={13} /> : locked ? <Lock size={12} /> : index + 1}</span>
                {step.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
