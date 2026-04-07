"""Self-reflecting code review agent (CLI entry).

This module wires the utils, loads the system prompt, performs two iterations
(initial review + self-critique), validates results, and prints a final
verified JSON review.

Usage:
    $env:OPENAI_API_KEY = 'sk-...'
    python self_reflecting_review_agent.py

"""
import json
import os
from typing import Any, Dict, Optional

from pathlib import Path

from utils import summarize_ast, build_payload, call_llm, validate_review, code_parses, pretty_json

ROOT = Path(__file__).resolve().parent
PROMPT_PATH = ROOT / "prompt.txt"

DEFAULT_MODEL = os.environ.get("SRR_MODEL", "gpt-4o-mini")


def load_prompt() -> str:
    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read()


def review_loop(source: str, max_iterations: int = 2, model: str = DEFAULT_MODEL) -> Dict[str, Any]:
    system_prompt = load_prompt()
    ast_summary = summarize_ast(source)
    if ast_summary.get("parse_error"):
        return {"error": "parse_error", "details": ast_summary["parse_error"]}

    previous: Optional[Dict[str, Any]] = None
    final_review: Optional[Dict[str, Any]] = None

    for iteration in range(1, max_iterations + 1):
        payload = build_payload(source, ast_summary, iteration, previous_review=previous)
        llm_out = call_llm(payload, system_prompt=system_prompt, model=model, temperature=0.0)

        if isinstance(llm_out, dict) and llm_out.get("error") == "invalid_json":
            return {"error": "llm_invalid_json", "raw": llm_out}
        if isinstance(llm_out, dict) and llm_out.get("error") == "openai_not_installed":
            return llm_out

        # validation against AST
        validation = validate_review(llm_out, ast_summary)
        llm_out.setdefault("metadata", {})
        llm_out["metadata"].update({"validation": validation, "iteration": iteration})

        # Check improved code parses if provided
        improved = llm_out.get("improved_code")
        if improved:
            llm_out["metadata"]["improved_code_parses"] = code_parses(improved)
            if not llm_out["metadata"]["improved_code_parses"]:
                llm_out["metadata"]["improved_code_parse_error"] = "improved_code failed to parse"

        previous = llm_out
        final_review = llm_out

    return {"final_review": final_review, "ast_summary": ast_summary}


# ---------------- Demo / CLI ----------------
if __name__ == "__main__":
    # Example sample (small) — replace or load from file for real runs
    sample_code = '''
import math

def mean(values=[]):
    # compute mean
    total = 0
    for v in values:
        total += v
    return total / len(values)

def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n-1)

def unused():
    pass
'''

    print("Running self-reflecting review loop (2 iterations) — model:", DEFAULT_MODEL)
    result = review_loop(sample_code, max_iterations=2, model=DEFAULT_MODEL)
    print(pretty_json(result))
