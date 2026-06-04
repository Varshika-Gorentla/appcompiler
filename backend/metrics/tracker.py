import sqlite3
import json
import time
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'metrics.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt TEXT,
            success INTEGER,
            retries INTEGER,
            repair_count INTEGER,
            latency_ms INTEGER,
            validation_errors TEXT,
            timestamp INTEGER
        )
    ''')
    conn.commit()
    conn.close()

def log_run(prompt: str, success: bool, retries: int, 
            repair_count: int, latency_ms: int, validation_errors: list):
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        'INSERT INTO runs VALUES (NULL,?,?,?,?,?,?,?)',
        (prompt, int(success), retries, repair_count, 
         latency_ms, json.dumps(validation_errors), int(time.time()))
    )
    conn.commit()
    conn.close()

def get_metrics():
    init_db()
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute('SELECT * FROM runs ORDER BY timestamp DESC LIMIT 100').fetchall()
    conn.close()
    
    if not rows:
        return {
            "total_runs": 0, "success_rate": 0,
            "avg_latency_ms": 0, "avg_retries": 0,
            "avg_repair_count": 0, "recent_runs": []
        }
    
    total = len(rows)
    successes = sum(1 for r in rows if r[2])
    
    return {
        "total_runs": total,
        "success_rate": round(successes / total * 100, 1),
        "avg_latency_ms": round(sum(r[5] for r in rows) / total),
        "avg_retries": round(sum(r[3] for r in rows) / total, 2),
        "avg_repair_count": round(sum(r[4] for r in rows) / total, 2),
        "recent_runs": [
            {
                "id": r[0], "prompt": r[1][:60] + "..." if len(r[1]) > 60 else r[1],
                "success": bool(r[2]), "retries": r[3],
                "repair_count": r[4], "latency_ms": r[5]
            }
            for r in rows[:10]
        ]
    }