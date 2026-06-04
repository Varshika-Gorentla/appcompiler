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

def extract_intent(user_prompt: str) -> dict:
    system_prompt = load_prompt('intent_prompt.txt')
    raw = call_llm(system_prompt, user_prompt)

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

    return {
        "app_name": data.get("app_name", user_prompt[:50]),
        "features": data.get("features", ["core functionality"]),
        "roles": data.get("roles", ["user"]) or ["user"],
        "entities": data.get("entities", []),
        "has_payments": data.get("has_payments", False),
        "has_auth": data.get("has_auth", True)
    }