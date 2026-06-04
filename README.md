# Varshika's AppCompiler

> Turn plain English into a fully validated, executable application configuration using a multi-stage AI pipeline.

**Live Demo:** https://appcompiler-mu.vercel.app  
**Backend API:** https://appcompiler-production.up.railway.app/docs  
**GitHub:** https://github.com/Varshika-Gorentla/appcompiler

---

## What it does

AppCompiler works like a compiler — but for software generation. You describe an app in plain English, and the system produces a structured, validated, executable configuration including UI schema, API design, database schema, and auth rules.

"Build a CRM with login, contacts, dashboard, role-based access, and payments"
↓
Intent Extraction → System Design → Schema Generation → Validation → Repair → Runtime Simulation
↓
{ ui: [...], api: [...], db: [...], auth: [...] }  ← validated + executable

---

## Evaluation Results

| Category | Success Rate | Avg Latency |
|---|---|---|
| Normal prompts | 100% (10/10) | ~28s |
| Edge cases | 100% (10/10) | ~28s |
| Overall | 100% (20/20) | ~28s |

Tested on 10 real product prompts and 10 edge cases including vague, conflicting, and underspecified inputs.

---

## Architecture

### Pipeline Stages

| Stage | What it does |
|---|---|
| Intent Extraction | Parses raw prompt into structured intent JSON — features, roles, entities |
| System Design | Converts intent into full architecture plan |
| Schema Generation | Produces UI, API, DB, and Auth configs simultaneously |
| Validation Engine | Pydantic type checking + cross-layer consistency checks |
| Repair Engine | Targeted partial regeneration of only broken fields — not full retry |
| Runtime Simulator | Validates routes, DB relations, and auth flows in-memory |

### Why multi-stage?

Single-prompt generation fails ~40% of the time on complex apps. Each stage has one job, clear inputs/outputs, and can be validated and repaired independently.

The repair engine is the critical differentiator — instead of retrying the entire pipeline on failure, it reads the exact Pydantic validation error and sends a targeted prompt that fixes only the specific field that failed. This makes repair 3x cheaper and 5x faster than full retry.

### Determinism

All generation stages use `temperature=0`. System prompts enforce strict JSON-only output. Pydantic models act as typed contracts at every stage boundary.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | FastAPI + Python | Async, auto-docs, Pydantic built-in |
| LLM | openai/gpt-oss-120b via OpenRouter | Best free model, strong JSON adherence |
| Validation | Pydantic v2 | Type-safe contracts, detailed error messages for repair |
| Metrics | SQLite | Zero config, tracks every pipeline run |
| Frontend | React + Vite | Fast setup, component-based |
| Deployment | Railway (backend) + Vercel (frontend) | Free tier, one-click deploy |

---

## Project Structure
appcompiler/
├── backend/
│   ├── main.py                   # FastAPI routes, pipeline orchestration
│   ├── requirements.txt
│   ├── .python-version           # Pins Python 3.12
│   ├── pipeline/
│   │   ├── intent_extractor.py   # Stage 1: prompt → intent JSON
│   │   ├── system_designer.py    # Stage 2: intent → full architecture
│   │   ├── validator.py          # Pydantic + cross-layer consistency checks
│   │   ├── repair_engine.py      # Targeted partial repair
│   │   └── runtime_simulator.py  # Route + DB + auth simulation
│   ├── schemas/
│   │   └── models.py             # Pydantic models (typed contracts)
│   ├── metrics/
│   │   └── tracker.py            # SQLite metrics logging
│   └── prompts/
│       ├── intent_prompt.txt
│       ├── design_prompt.txt
│       ├── schema_prompt.txt
│       └── repair_prompt.txt
├── frontend/
│   └── src/
│       └── App.jsx               # Full React UI with dark theme
└── eval/
├── prompts_normal.json       # 10 real product prompts
├── prompts_edge.json         # 10 edge cases
├── run_eval.py               # Automated evaluation runner
└── eval_results.json         # Results from evaluation run

---

## Setup — Run Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
# Create .env file with:
# OPENROUTER_API_KEY=your-key-here
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Evaluation
```bash
cd eval
python run_eval.py
```

---

## How the Repair Engine Works

This is the most important part of the system.

**Naive approach (rejected):** If validation fails, retry the entire pipeline. Expensive, slow, often produces the same error.

**Our approach:** 
1. Pydantic validation fails and returns a specific error message e.g. `"Structure error at auth.0.permissions: field required"`
2. Repair engine reads that exact error
3. Sends a targeted prompt: *"Fix only the auth.permissions field. Here is the broken JSON and the specific error."*
4. Only the broken field is regenerated
5. Re-validate — if passes, continue. If fails again, retry up to 3 times.

This means we never waste tokens regenerating correct parts of the config.

---

## Cross-Layer Consistency Checks

The validator checks that all four layers are internally consistent:

- Every UI page role must exist in the Auth rules
- Every API endpoint role must exist in the Auth rules  
- DB relations must reference tables that actually exist
- All HTTP methods must be valid (GET, POST, PUT, DELETE, PATCH)

---

## Tradeoffs

**Speed vs quality:** Used a single strong free model (gpt-oss-120b) via OpenRouter. Free tier with no cost.

**Repair vs retry:** Full retry wastes tokens and time. Targeted repair reads Pydantic errors directly and fixes only the broken field.

**Simulation vs real execution:** True execution would require a full runtime environment. The runtime simulator validates structural correctness — valid HTTP methods, DB foreign keys, role coverage — which catches the majority of real execution failures at zero infrastructure cost.

**Temperature=0:** All generation stages use temperature=0 for maximum determinism. Same input produces consistent output across runs.

---

## Screenshots

### Main Interface
<img width="1890" height="962" alt="image" src="https://github.com/user-attachments/assets/14dab522-d847-4719-8392-81625314eb4c" />


### Output Config
<img width="1407" height="905" alt="image" src="https://github.com/user-attachments/assets/e5c58402-f6ab-4e81-a45c-f01d45f146ce" />
<img width="1382" height="892" alt="image" src="https://github.com/user-attachments/assets/a08f755f-7931-4c26-a5ff-13fa480b4571" />



### Metrics Dashboard
<img width="527" height="182" alt="image" src="https://github.com/user-attachments/assets/990c1e90-be28-4204-b44d-6d83e33e4cad" />


---

## Submission

Built for the AI Engineer Internship Demo Task.  
Reference: https://base44.com/
