import json
import requests
import time
import os

API = "https://appcompiler-production.up.railway.app"

def run_eval():
    results = []
    
    with open("prompts_normal.json") as f:
        normal = json.load(f)
    with open("prompts_edge.json") as f:
        edge = json.load(f)
    
    all_prompts = [("normal", p) for p in normal] + [("edge", p) for p in edge]
    
    print(f"Running eval on {len(all_prompts)} prompts...\n")
    
    for i, (ptype, prompt) in enumerate(all_prompts):
        print(f"[{i+1}/{len(all_prompts)}] {ptype.upper()}: {prompt[:60]}...")
        
        try:
            start = time.time()
            res = requests.post(f"{API}/compile", json={"prompt": prompt}, timeout=120)
            latency = int((time.time() - start) * 1000)
            
            if res.status_code == 200:
                data = res.json()
                results.append({
                    "type": ptype,
                    "prompt": prompt,
                    "success": True,
                    "latency_ms": data["meta"]["latency_ms"],
                    "retries": data["meta"]["retries"],
                    "repair_count": data["meta"]["repair_count"],
                    "runtime_pass": data["runtime"]["overall_pass"]
                })
                print(f"  ✓ Success | {data['meta']['latency_ms']}ms | repairs: {data['meta']['repair_count']}")
            else:
                results.append({
                    "type": ptype, "prompt": prompt,
                    "success": False, "latency_ms": latency,
                    "retries": 0, "repair_count": 0, "runtime_pass": False
                })
                print(f"  ✗ Failed with status {res.status_code}")
        
        except Exception as e:
            results.append({
                "type": ptype, "prompt": prompt,
                "success": False, "latency_ms": 0,
                "retries": 0, "repair_count": 0, "runtime_pass": False,
                "error": str(e)
            })
            print(f"  ✗ Exception: {e}")
        
        time.sleep(2)  # avoid rate limits
    
    # Summary
    normal_results = [r for r in results if r["type"] == "normal"]
    edge_results = [r for r in results if r["type"] == "edge"]
    
    normal_success = sum(1 for r in normal_results if r["success"])
    edge_success = sum(1 for r in edge_results if r["success"])
    
    print("\n" + "="*50)
    print("EVAL RESULTS")
    print("="*50)
    print(f"Normal prompts: {normal_success}/{len(normal_results)} success ({round(normal_success/len(normal_results)*100)}%)")
    print(f"Edge cases:     {edge_success}/{len(edge_results)} success ({round(edge_success/len(edge_results)*100)}%)")
    print(f"Overall:        {normal_success+edge_success}/{len(results)} ({round((normal_success+edge_success)/len(results)*100)}%)")
    avg_latency = sum(r["latency_ms"] for r in results if r["success"]) / max(1, sum(1 for r in results if r["success"]))
    print(f"Avg latency:    {round(avg_latency)}ms")
    
    with open("eval_results.json", "w") as f:
        json.dump({"summary": {
            "total": len(results),
            "normal_success_rate": round(normal_success/len(normal_results)*100, 1),
            "edge_success_rate": round(edge_success/len(edge_results)*100, 1),
            "avg_latency_ms": round(avg_latency)
        }, "runs": results}, f, indent=2)
    
    print("\nSaved to eval_results.json")

if __name__ == "__main__":
    run_eval()