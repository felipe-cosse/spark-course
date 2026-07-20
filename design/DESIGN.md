# Spark Path Design Specification

Concept sources:

- `design/concepts/course-reader.png` — explanation state and navigation.
- `design/concepts/exercise-workspace.png` — editor, tests, and criteria state.

## Product structure

- Quiet top header: Spark Path wordmark, course name, save/reset utility.
- Persistent left curriculum rail: numbered phases, current phase expanded, completed/current/locked lesson states.
- Primary reading state: progress, large lesson title, content, code, key terms, previous/continue controls.
- Exercise state: step rail, task instructions, code or written workspace, run/check actions, output/tests, acceptance criteria, hint, reset, lesson navigation.
- Mobile: header plus curriculum drawer; one content column ordered as instructions, workspace, feedback, criteria, navigation.

## Visible-copy lock

Allowed first-viewport product strings come from course Markdown plus: `Spark Path`, `PySpark 4.2 Course`, `Reset progress`, `Previous lesson`, `Continue to exercises`, `Explanation`, `Example`, `Key terms`, `Exercise`, `Run code`, `Check answer`, `Output`, `Tests`, `Plan`, `Hint`, `Reset exercise`, `Back to explanation`, `Next exercise`, and saved/runner state text needed by the workflow.

No marketing hero, kicker, badges, fake metrics, or unrelated dashboard copy.

## Tokens

- Background: true white `#ffffff`.
- Primary ink: `#111827`; secondary ink: `#4b5563`; muted ink: `#7b8494`.
- Cobalt: `#0759d9`; hover `#0648b2`; soft selection `#eef5ff`.
- Border: `#d7dce4`; light rule: `#e8ebf0`; subtle surface: `#f7f9fc`.
- Success: `#168a43`; success surface: `#eefaf2`.
- Failure: `#c92a2a`; failure surface: `#fff2f1`.
- Warning/running: `#a86300`; warning surface: `#fff7e8`.
- Radii: 6px controls, 8px editor/panels, no giant outer wrapper.
- Shadow: none by default; `0 8px 24px rgb(17 24 39 / 8%)` only for mobile drawer/popover.
- Spacing: 4, 8, 12, 16, 24, 32, 48, 64.

## Typography

- UI/content: `Inter`, `Arial`, sans-serif fallback; no dependence on external font loading.
- Code: `SFMono-Regular`, `Cascadia Code`, `Liberation Mono`, monospace.
- Lesson title: 44–52px desktop, 34px tablet, 28px mobile; 700/1.05.
- Section title: 24–30px; 700/1.2.
- Body: 17–18px; 400/1.65; reading measure 74ch.
- UI controls: 14px; 600/1.2. Rail labels: 14–15px.
- Code: 14px; 1.6.

## Components

- `AppHeader`: wordmark, course name, saved/runner state, reset.
- `CurriculumRail`: `PhaseGroup`, `LessonRow`, progress rule, responsive drawer.
- `LearningSteps`: four steps with completed/current/locked states.
- `MarkdownLesson`: prose, tables, code blocks, links.
- `CodeBlock`: line-number gutter and copy action.
- `ExerciseWorkspace`: `ExercisePicker`, `CodeEditor` or `WrittenNotebook`, actions.
- `FeedbackPanel`: Output/Tests/Plan tabs and pass/fail rows.
- `CriteriaRail`: criteria checkboxes, hint disclosure, reset.
- `LessonFooter`: previous/continue/complete/next controls.

## Interaction and motion

- 120–180ms color/border transitions; no decorative motion.
- Focus rings use 2px cobalt plus 2px white offset.
- Reduced-motion preference removes transitions and smooth scrolling.
- Drafts, visited steps, selected exercise, responses, and completion persist locally.
- Explanation precedes exercise. The exercise step unlocks after the learner explicitly continues from the reading flow.

## Icons

Use one consistent 1.75px outline family for menu, chevron, check, lock, reset, play, flask/tests, terminal/output, list/plan, cloud/save, and copy. Icons remain 16–20px and use text color; selected/semantic states use cobalt/success/failure.
