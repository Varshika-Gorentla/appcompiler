import json
import os
import requests
from dotenv import load_dotenv
from schemas.models import AppConfig

load_dotenv()
API_KEY = os.getenv("OPENROUTER_API_KEY")

def load_prompt(filename):
    path = os.path.join(os.path.dirname(__file__), '..', 'prompts', filename)
    with open(path, 'r') as f:
        return f.read()

def call_llm(system_prompt, user_message):
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "openai/gpt-oss-120b:free",
            "temperature": 0,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
        },
        timeout=60
    )
    return response.json()["choices"][0]["message"]["content"].strip()

def design_system(intent: dict) -> dict:
    system_prompt = load_prompt('design_prompt.txt')
    raw = call_llm(system_prompt, json.dumps(intent))

    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:]
            part = part.strip()
            if part.startswith("{"):
                raw = part
                break

    data = json.loads(raw.strip())
    
    # Don't crash on validation — just return what we got
    try:
        validated = AppConfig(**data)
        return validated.model_dump()
    except Exception:
        return data