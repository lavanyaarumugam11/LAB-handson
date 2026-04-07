"""
Minimal OpenAI Chat Completion client using requests.
Uses OPENAI_API_KEY from env.
"""
import os
import requests

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4")

class OpenAIError(Exception):
    pass


def chat_completion(messages, model=None, temperature=0.0, max_tokens=800, api_key: str = None):
    """Call OpenAI Chat Completions.

    If api_key is provided it will be used for this call; otherwise the
    OPENAI_API_KEY environment variable is read at call time.
    """
    if model is None:
        model = OPENAI_MODEL
    effective_key = api_key or os.getenv("OPENAI_API_KEY")
    if not effective_key:
        raise OpenAIError("OPENAI_API_KEY not set in environment and no api_key provided")
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {effective_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": 1.0,
        "n": 1,
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    try:
        resp.raise_for_status()
    except Exception as e:
        raise OpenAIError(f"OpenAI API error: {e} - {resp.text}")
    data = resp.json()
    return data["choices"][0]["message"]["content"]
