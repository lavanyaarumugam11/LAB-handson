"""
Simple Flask server to expose the CoT math solver as a local HTTP service.

Endpoints:
- POST /solve  -> JSON body {"problem": "<math problem text>"}
  returns JSON with keys: model_raw, model_json, verification, final_answer, ok

Security notes: Keep this server local (it binds to 127.0.0.1 by default). Do NOT expose OPENAI_API_KEY or this service to the public network.
"""
from flask import Flask, request, jsonify
import os
from cot_math_solver import solve_math_problem

app = Flask(__name__)

@app.route("/", methods=["GET"])
def index():
    return (
        "CoT Math Solver Service. POST JSON {\"problem\": \"<text>\"} to /solve\n",
        200,
        {"Content-Type": "text/plain"}
    )

@app.route("/solve", methods=["POST"])
def solve():
    payload = request.get_json(force=True, silent=True)
    if not payload or "problem" not in payload:
        return jsonify({"error": "Request JSON must include the 'problem' field."}), 400
    problem = payload["problem"]

    try:
        result = solve_math_problem(problem)
        # Return JSON as-is. result contains model_json and verification.
        return jsonify(result)
    except Exception as e:
        # Log full traceback to console for local debugging and include it in the response.
        import traceback
        tb = traceback.format_exc()
        print(tb)
        return jsonify({"error": str(e), "traceback": tb}), 500

if __name__ == "__main__":
    # Bind to localhost only by default. Use a different host/port if you know what you're doing.
    host = os.getenv("COT_HOST", "127.0.0.1")
    port = int(os.getenv("COT_PORT", "5000"))
    debug = os.getenv("COT_DEBUG", "0") == "1"
    app.run(host=host, port=port, debug=debug)
