import time
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pipeline.intent_extractor import extract_intent
from pipeline.system_designer import design_system
from pipeline.validator import validate_config
from pipeline.repair_engine import repair_config
from pipeline.runtime_simulator import simulate_runtime
from metrics.tracker import log_run, get_metrics

app = FastAPI(title="AppCompiler API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/compile")
async def compile_app(req: PromptRequest):
    start_time = time.time()
    retries = 0
    repair_count = 0
    all_errors = []
    pipeline_stages = []

    try:
        # Stage 1: Intent Extraction
        pipeline_stages.append({"stage": "intent_extraction", "status": "running"})
        intent = extract_intent(req.prompt)
        pipeline_stages[-1]["status"] = "done"
        pipeline_stages[-1]["output"] = intent

        # Stage 2: System Design
        pipeline_stages.append({"stage": "system_design", "status": "running"})
        config = design_system(intent)
        pipeline_stages[-1]["status"] = "done"

        # Stage 3: Validation + Repair loop (max 3 attempts)
        pipeline_stages.append({"stage": "validation", "status": "running"})
        is_valid, errors = validate_config(config)

        while not is_valid and retries < 3:
            retries += 1
            repair_count += 1
            all_errors.extend(errors)
            pipeline_stages[-1]["status"] = "repairing"
            pipeline_stages[-1]["errors"] = errors
            config = repair_config(config, errors)
            is_valid, errors = validate_config(config)

        if not is_valid:
            all_errors.extend(errors)
            pipeline_stages[-1]["status"] = "failed"
            latency = int((time.time() - start_time) * 1000)
            log_run(req.prompt, False, retries, repair_count, latency, all_errors)
            raise HTTPException(status_code=422, detail={
                "message": "Could not produce valid config after 3 repair attempts",
                "errors": all_errors,
                "pipeline": pipeline_stages
            })

        pipeline_stages[-1]["status"] = "passed"

        # Stage 4: Runtime Simulation
        pipeline_stages.append({"stage": "runtime_simulation", "status": "running"})
        runtime_results = simulate_runtime(config)
        pipeline_stages[-1]["status"] = "done" if runtime_results["overall_pass"] else "warnings"
        pipeline_stages[-1]["output"] = runtime_results

        latency = int((time.time() - start_time) * 1000)
        log_run(req.prompt, True, retries, repair_count, latency, all_errors)

        return {
            "success": True,
            "intent": intent,
            "config": config,
            "runtime": runtime_results,
            "pipeline": pipeline_stages,
            "meta": {
                "latency_ms": latency,
                "retries": retries,
                "repair_count": repair_count
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        log_run(req.prompt, False, retries, repair_count, latency, [str(e)])
        raise HTTPException(status_code=500, detail={"message": str(e), "pipeline": pipeline_stages})

@app.get("/metrics")
def metrics():
    return get_metrics()