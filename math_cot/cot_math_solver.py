"""
CoT Math Solver
A small script that calls the OpenAI ChatCompletion API to request structured Chain-of-Thought (CoT)
math solutions, parses JSON output, verifies numeric steps locally, and prints the reasoning plus a
clearly-separated final answer.

Usage:
  - set environment variable OPENAI_API_KEY
  - run: python cot_math_solver.py

This file is intentionally conservative about evaluating expressions: it uses a safe AST-based
arithmetic evaluator that allows numeric ops and a small set of math functions.
"""

import os
import json
import re
import ast
import math
from typing import Any, Dict, List, Tuple

import openai

# Model configuration
MODEL_NAME = os.getenv("COT_MODEL", "gpt-4")
SYSTEM_PROMPT = (
    "You are an assistant specialized in step-by-step mathematical reasoning for educational use. "
    "For every math problem, produce explicit intermediate steps and perform numeric calculations. "
    "Output must be valid JSON only (no extra commentary outside JSON). The JSON must follow this schema:\n"
    "{\n  \"steps\": [\n    {\"step\": 1, \"description\": \"<concise description>\", "
    "\"expression\": \"<math expression optional>\", \"value\": <numeric optional>, \"note\": \"<opt>\"}\n  ],\n"
    "  \"final_answer\": {\"value\": <numeric or string>, \"units\": \"<optional>\"},\n"
    "  \"verification\": {\"checks\": [{\"step\": <int>, \"ok\": <true|false>, \"model_value\": <num|null>, \"local_value\": <num|null>, \"tolerance\": <float>}], \"summary\": \"<short>\"}\n}"
    "\nInstructions:\n- Each step should be a single logical transformation or numeric calculation.\n"
    "- When computing a numeric quantity, include an \"expression\" string and the computed numeric \"value\".\n"
    "- Use clear arithmetic expressions with parentheses and standard operators.\n"
    "- After steps, include a verification block repeating critical arithmetic checks.\n"
    "- Final answer must be in final_answer.value.\n"
    "- Produce JSON only. No extra prose."
)

# Allowed math functions for safe evaluation
SAFE_MATH_FUNCS = {
    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "log": math.log,
    "log10": math.log10,
    "exp": math.exp,
    "pi": math.pi,
    "e": math.e,
    "factorial": math.factorial,
}

# Safe evaluator using ast
def safe_eval(expr: str) -> float:
    expr = expr.strip()
    expr = expr.replace("^", "**")
    try:
        node = ast.parse(expr, mode="eval")
    except Exception as e:
        raise ValueError(f"Expression parse error: {e}; expr={expr}")

    def _eval(node):
        if isinstance(node, ast.Expression):
            return _eval(node.body)
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return node.value
            raise ValueError("Unsupported constant type")
        if isinstance(node, ast.Num):  # type: ignore
            return node.n  # type: ignore
        if isinstance(node, ast.BinOp):
            left = _eval(node.left)
            right = _eval(node.right)
            if isinstance(node.op, ast.Add):
                return left + right
            if isinstance(node.op, ast.Sub):
                return left - right
            if isinstance(node.op, ast.Mult):
                return left * right
            if isinstance(node.op, ast.Div):
                return left / right
            if isinstance(node.op, ast.FloorDiv):
                return left // right
            if isinstance(node.op, ast.Mod):
                return left % right
            if isinstance(node.op, ast.Pow):
                return left ** right
            raise ValueError("Unsupported binary operator")
        if isinstance(node, ast.UnaryOp):
            operand = _eval(node.operand)
            if isinstance(node.op, ast.UAdd):
                return +operand
            if isinstance(node.op, ast.USub):
                return -operand
            raise ValueError("Unsupported unary operator")
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                fname = node.func.id
                if fname not in SAFE_MATH_FUNCS:
                    raise ValueError(f"Function {fname} not allowed")
                args = [_eval(a) for a in node.args]
                return SAFE_MATH_FUNCS[fname](*args)
            raise ValueError("Only simple math function calls are allowed")
        if isinstance(node, ast.Name):
            if node.id in SAFE_MATH_FUNCS:
                return SAFE_MATH_FUNCS[node.id]
            raise ValueError(f"Name {node.id} is not allowed")
        raise ValueError(f"Unsupported AST node {type(node)}")

    return float(_eval(node))

# JSON extraction and parsing utilities
def extract_json_from_text(text: str) -> str:
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object start found")
    stack = []
    for i in range(start, len(text)):
        c = text[i]
        if c == "{":
            stack.append(i)
        elif c == "}":
            stack.pop()
            if not stack:
                candidate = text[start:i+1]
                return candidate
    m = re.search(r"\{.*\}", text, flags=re.S)
    if m:
        return m.group(0)
    raise ValueError("Could not extract JSON object")

def parse_model_json(text: str) -> Dict[str, Any]:
    raw = extract_json_from_text(text)
    fixed = raw.replace("'", '"')
    fixed = re.sub(r",\s*([}\]])", r"\1", fixed)
    return json.loads(fixed)

# Call model
def call_model(problem_text: str, model: str = MODEL_NAME, temperature: float = 0.0, max_tokens: int = 1200) -> str:
    openai.api_key = os.getenv("OPENAI_API_KEY")
    if not openai.api_key:
        raise EnvironmentError("OPENAI_API_KEY not set in environment")
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": problem_text}
    ]
    resp = openai.ChatCompletion.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens
    )
    return resp["choices"][0]["message"]["content"]

# Verification
def verify_and_evaluate(model_json: Dict[str, Any], tolerance: float = 1e-6) -> Tuple[Dict[str, Any], bool]:
    steps = model_json.get("steps", [])
    checks = []
    overall_ok = True
    for st in steps:
        step_idx = st.get("step")
        expr = st.get("expression")
        model_value = st.get("value")
        local_value = None
        ok = None
        if expr is not None:
            try:
                local_value = safe_eval(str(expr))
                if model_value is not None:
                    try:
                        model_val_num = float(model_value)
                    except Exception:
                        model_val_num = None
                    if model_val_num is not None:
                        diff = abs(local_value - model_val_num)
                        ok = diff <= tolerance or (abs(local_value) > 0 and diff / max(abs(local_value), 1e-12) <= tolerance)
                        if not ok:
                            overall_ok = False
                    else:
                        ok = False
                        overall_ok = False
                else:
                    ok = False
                    overall_ok = False
            except Exception:
                ok = False
                overall_ok = False
        else:
            ok = None

        checks.append({
            "step": step_idx,
            "ok": ok,
            "model_value": model_value,
            "local_value": local_value,
            "tolerance": tolerance
        })
    verification = {"checks": checks, "summary": "All numeric steps matched locally" if overall_ok else "Discrepancies found"}
    return verification, overall_ok

# High-level pipeline
def solve_math_problem(problem_text: str, model: str = MODEL_NAME, recheck_on_mismatch: bool = True) -> Dict[str, Any]:
    raw = call_model(problem_text, model=model)
    try:
        model_json = parse_model_json(raw)
    except Exception as e:
        return {"model_raw": raw, "error": f"Failed to parse model output: {e}"}

    verification, ok = verify_and_evaluate(model_json)
    model_json["verification"] = verification

    if not ok and recheck_on_mismatch:
        mismatch_info = {"problem": problem_text, "model_steps": model_json.get("steps", []), "verification": verification}
        recon_prompt = (
            "The client performed local checks on your JSON output and found discrepancies. Please produce a corrected JSON only (no prose), following the same schema as before. "
            "Here are the mismatches found:\n\n" + json.dumps(mismatch_info, indent=2) + "\n\nReturn corrected steps and final_answer. If model values were correct and my local checks are mistaken, include a note and justify numerically."
        )
        recon_raw = openai.ChatCompletion.create(
            model=model,
            messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": recon_prompt}],
            temperature=0.0,
            max_tokens=800
        )
        recon_text = recon_raw["choices"][0]["message"]["content"]
        recon_json = parse_model_json(recon_text)
        verification2, ok2 = verify_and_evaluate(recon_json)
        recon_json["verification"] = verification2
        return {"model_raw": raw, "model_json": recon_json, "verification": verification2, "final_answer": recon_json.get("final_answer"), "ok": ok2}

    return {"model_raw": raw, "model_json": model_json, "verification": verification, "final_answer": model_json.get("final_answer"), "ok": ok}

# Pretty printer
def pretty_print_result(result: Dict[str, Any]):
    if "error" in result:
        print("Error:", result["error"])
        print("Raw model output:")
        print(result.get("model_raw", ""))
        return

    model_json = result.get("model_json", {})
    steps = model_json.get("steps", [])
    print("\nREASONING (Chain-of-Thought steps):\n")
    for st in steps:
        s = st.get("step")
        desc = st.get("description")
        expr = st.get("expression")
        val = st.get("value")
        note = st.get("note", "")
        print(f"Step {s}: {desc}")
        if expr is not None:
            print(f"  expression: {expr}")
        if val is not None:
            print(f"  model_value: {val}")
        if note:
            print(f"  note: {note}")
        print()

    print("VERIFICATION SUMMARY:")
    ver = model_json.get("verification", {})
    for check in ver.get("checks", []):
        print(f" Step {check['step']}: ok={check['ok']}, model_value={check['model_value']}, local_value={check['local_value']}, tol={check['tolerance']}")
    print("Summary:", ver.get("summary"))

    final = model_json.get("final_answer")
    print("\nFINAL ANSWER (separated):")
    print(json.dumps(final, indent=2))

if __name__ == "__main__":
    sample = "Find the area of a triangle with side lengths 13, 14, and 15."
    print("Problem:\n", sample)
    try:
        res = solve_math_problem(sample)
        pretty_print_result(res)
    except Exception as e:
        print("Runtime error:", e)
