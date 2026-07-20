from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.runner import run_submission


class RunRequest(BaseModel):
    code: str = Field(min_length=1, max_length=50_000)
    mode: str = Field(pattern="^(run|check)$")
    lab_id: str | None = Field(default=None, max_length=100)


app = FastAPI(title="Spark Path Runner", version="1.0.0")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ready", "spark": "4.2.0"}


@app.post("/api/run")
def run(request: RunRequest) -> dict:
    if request.mode == "check" and not request.lab_id:
        raise HTTPException(status_code=400, detail="A lab_id is required when checking an answer.")
    result, status = run_submission(request.model_dump())
    if status != 200:
        return JSONResponse(status_code=status, content=result)
    return result


DIST = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if (DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")


@app.get("/{path:path}", include_in_schema=False)
def frontend(path: str):
    candidate = (DIST / path).resolve()
    if DIST.exists() and candidate.is_relative_to(DIST.resolve()) and candidate.is_file():
        return FileResponse(candidate)
    index = DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    raise HTTPException(status_code=404, detail="Build the frontend with make build.")
