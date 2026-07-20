# Spark Path interactive PySpark course

Spark Path turns the Markdown course in `docs/` into a numbered, progress-aware learning application. Each lesson follows the same instructional sequence:

1. Read the explanation and build the mental model.
2. Trace the worked examples.
3. Review the page-specific definitions.
4. Complete the numbered exercises.
5. Run PySpark code, inspect output and the physical plan, and use automatic tests where a grader is available.

Progress, code drafts, and notebook notes are stored in the browser. The Markdown files remain the source of truth, so course content can still be reviewed and edited without the application.

## Run the complete course

Docker is the recommended path because it supplies the exact Python, Java, and PySpark 4.2.0 runtime:

```bash
make up
```

Open [http://localhost:8000](http://localhost:8000). The first code execution may take several seconds while a local Spark session starts. Stop the course with `Ctrl+C`.

The container is read-only except for a temporary execution directory. Submitted code runs in a short-lived process with import restrictions and a 35-second timeout. This is appropriate for a local, single-user course; it is not a security boundary for running untrusted code from other people.

## How exercise checking works

Every exercise has two workspaces:

- **Spark code** is a notebook-like editor connected to the PySpark runner. `Run code` returns printed output, a small DataFrame preview, and the formatted physical plan when the variable `result` is a DataFrame.
- **Notebook notes** stores grain, assumptions, expected results, evidence, trade-offs, or a written design for exercises that are not primarily coding tasks.

Representative exercises include deterministic fixture-based graders and a **Check answer** action. Graded labs cover local setup, daily aggregations, type validation, RDD aggregation, transformation cleanup, windows, reconciliation joins, JSON parsing, and data-quality metrics. Other workplace and capstone tasks are completed against the acceptance criteria and self-check questions in their companion exercise page.

## Frontend development

```bash
make install
make dev
```

Vite serves the frontend at [http://localhost:5173](http://localhost:5173). To execute Spark code during frontend development, run the backend separately in a Python 3.11 environment:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --port 8000
```

The Vite development server proxies `/api` requests to port 8000.

## Project structure

```text
spark-course/
├── frontend/     React, Vite, course UI, and browser tests
├── backend/      FastAPI API, isolated PySpark worker, and graders
├── docs/         Markdown lessons and companion exercises
├── design/       Design specification, concepts, and screenshots
├── compose.yaml  Local course runtime
├── Dockerfile    Production frontend and PySpark image
└── Makefile      Common development, test, and runtime commands
```

Run `make help` to see the available commands. The root remains the working directory for Docker and backend commands; frontend-specific npm commands run inside `frontend/`.

## Verification

```bash
make check
make docker-build
make health
```

The tests cover Markdown parsing, the explanation-to-exercise gate, and browser persistence. The Docker build verifies that the frontend and PySpark 4.2.0 runtime can be assembled together.
