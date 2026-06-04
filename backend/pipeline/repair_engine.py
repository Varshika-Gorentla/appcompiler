import json
import os
import requests
from dotenv import load_dotenv

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

def repair_config(broken_config: dict, errors: list) -> dict:
    system_prompt = load_prompt('repair_prompt.txt')
    user_message = f"""
Broken JSON:
{json.dumps(broken_config, indent=2)}

Validation errors to fix:
{chr(10).join(f'- {e}' for e in errors)}
"""
    raw = call_llm(system_prompt, user_message)

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

    return json.loads(raw.strip())