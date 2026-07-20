import { Cloud, Menu, RotateCcw } from "lucide-react";

interface AppHeaderProps {
  runnerOnline: boolean | null;
  onMenu: () => void;
  onReset: () => void;
}

function BrandMark() {
  return (
    <svg aria-hidden="true" className="brand-mark" viewBox="0 0 28 28">
      <path d="M14 2.5 16.9 11 25.5 14l-8.6 3L14 25.5 11.1 17 2.5 14l8.6-3L14 2.5Z" />
      <circle cx="14" cy="14" r="2.2" />
    </svg>
  );
}

export function AppHeader({ runnerOnline, onMenu, onReset }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="icon-button menu-button" onClick={onMenu} aria-label="Open curriculum">
          <Menu size={20} />
        </button>
        <a className="brand" href="#/" aria-label="Spark Path course home">
          <BrandMark />
          <span>Spark Path</span>
        </a>
        <span className="header-course">PySpark 4.2 Course</span>
      </div>
      <div className="header-actions">
        <span
          className={`runner-state ${runnerOnline === true ? "online" : runnerOnline === false ? "offline" : ""}`}
          title={runnerOnline ? "The local PySpark runner is ready" : "Start the backend to run Spark code"}
        >
          <Cloud size={16} />
          {runnerOnline === null ? "Checking runner" : runnerOnline ? "Runner ready" : "Reader only"}
        </span>
        <button className="text-button" onClick={onReset}>
          <RotateCcw size={15} /> Reset progress
        </button>
      </div>
    </header>
  );
}
