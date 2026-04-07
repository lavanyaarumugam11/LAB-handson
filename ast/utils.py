"""
Utility functions for the self-reflecting code review agent.
Provides AST summarization, payload construction, validators and an OpenAI wrapper.
"""
import ast
import json
import os
from typing import Any, Dict, List, Optional

try:
    import openai
except Exception:
    openai = None  # OpenAI may be installed in runtime environment

# ---------- AST summarization ----------

def summarize_ast(source: str) -> Dict[str, Any]:
    """Parse source into AST summary and compute simple metrics.

    Returns a dict with either 'parse_error' or keys: 'ast_nodes' and 'metrics'.
    """
    try:
        tree = ast.parse(source)
    except SyntaxError as e:
        return {"parse_error": {"msg": str(e), "lineno": getattr(e, "lineno", None)}}

    nodes: List[Dict[str, Any]] = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            nodes.append({
                "type": "FunctionDef",
                "name": node.name,
                "lineno": node.lineno,
                "end_lineno": getattr(node, "end_lineno", None),
                "args": [a.arg for a in node.args.args],
                "has_docstring": bool(ast.get_docstring(node)),
                "decorators": [ast.unparse(d) if hasattr(ast, "unparse") else None for d in node.decorator_list],
            })
        elif isinstance(node, ast.AsyncFunctionDef):
            nodes.append({
                "type": "AsyncFunctionDef",
                "name": node.name,
                "lineno": node.lineno,
                "end_lineno": getattr(node, "end_lineno", None),
                "args": [a.arg for a in node.args.args],
                "has_docstring": bool(ast.get_docstring(node)),
                "decorators": [ast.unparse(d) if hasattr(ast, "unparse") else None for d in node.decorator_list],
            })
        elif isinstance(node, ast.ClassDef):
            nodes.append({
                "type": "ClassDef",
                "name": node.name,
                "lineno": node.lineno,
                "end_lineno": getattr(node, "end_lineno", None),
                "bases": [ast.unparse(b) if hasattr(ast, "unparse") else None for b in node.bases],
                "has_docstring": bool(ast.get_docstring(node)),
            })
        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            nodes.append({
                "type": "Import" if isinstance(node, ast.Import) else "ImportFrom",
                "lineno": node.lineno,
                "raw": ast.unparse(node) if hasattr(ast, "unparse") else None,
            })

    metrics = {
        "lines": len(source.splitlines()),
        "num_functions": sum(1 for n in nodes if n["type"] in ("FunctionDef", "AsyncFunctionDef")),
        "num_classes": sum(1 for n in nodes if n["type"] == "ClassDef"),
    }

    return {"ast_nodes": nodes, "metrics": metrics}


# ---------- Payload builder ----------

def build_payload(source: str, ast_summary: Dict[str, Any], iteration: int, previous_review: Optional[Dict] = None) -> Dict[str, Any]:
    excerpt = "\n".join(source.splitlines()[:400])  # limited excerpt size
    payload = {
        "source": source,
        "excerpt": excerpt,
        "ast_summary": ast_summary,
        "metrics": ast_summary.get("metrics"),
        "iteration": iteration,
        "previous_review": previous_review,
    }
    return payload


# ---------- LLM call wrapper ----------

def call_llm(payload: Dict[str, Any], system_prompt: str, model: str = "gpt-4o-mini", temperature: float = 0.0) -> Dict[str, Any]:
    """Call the OpenAI ChatCompletion API with the provided system prompt and payload.

    Returns parsed JSON response or wrapper describing the raw response if JSON parsing fails.
    Requires `openai` package and environment variable OPENAI_API_KEY.
    """
    if openai is None:
        return {"error": "openai_not_installed", "message": "openai package not available"}

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "REVIEW_PAYLOAD:\n" + json.dumps(payload, indent=2)}
    ]

    resp = openai.ChatCompletion.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=1600
    )

    text = resp.choices[0].message["content"]
    # Attempt to parse JSON from response
    try:
        return json.loads(text)
    except Exception as e:
        return {"error": "invalid_json", "raw": text, "exc": str(e)}


# ---------- Validators / Safeguards ----------

def validate_review(review: Dict[str, Any], ast_summary: Dict[str, Any]) -> Dict[str, Any]:
    """Basic validator: ensure issue locations map to AST nodes or line numbers present in the ast_summary.

    Returns a dict with 'hallucinated_items' list and 'hallucination_checks' status.
    """
    nodes = ast_summary.get("ast_nodes", [])
    node_names = {(n.get("type"), n.get("name")) for n in nodes if n.get("name")}
    lines = set()

    for n in nodes:
        if n.get("lineno"):
            lines.add(n["lineno"])
        if n.get("end_lineno"):
            lines.update(range(n["lineno"], n["end_lineno"] + 1))

    issues = review.get("issues", []) or []
    hallucinated = []
    for it in issues:
        loc = it.get("location", {})
        lineno = loc.get("lineno")
        name = loc.get("name")
        supported = True
        if lineno is not None and lineno not in lines:
            supported = False
        if name is not None and ("FunctionDef", name) not in node_names and ("ClassDef", name) not in node_names:
            supported = False
        if not supported:
            hallucinated.append({"issue": it, "reason": "location not found in AST summary"})

    return {"hallucinated_items": hallucinated, "hallucination_checks": "failed" if hallucinated else "passed"}


# ---------- Convenience: safe parse check ----------

def code_parses(source: str) -> bool:
    try:
        ast.parse(source)
        return True
    except Exception:
        return False


# ---------- Small helper: pretty JSON dump for printing ----------

def pretty_json(obj: Any) -> str:
    return json.dumps(obj, indent=2, ensure_ascii=False)
