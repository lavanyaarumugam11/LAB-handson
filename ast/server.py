# server.py — simple Flask wrapper for the review agent
from flask import Flask, request, jsonify
import os
from pathlib import Path

# Ensure ast module path is discoverable if running from ast/ folder
import sys
sys.path.append(str(Path(__file__).resolve().parent))

from self_reflecting_review_agent import review_loop

app = Flask(__name__)

@app.route("/review", methods=["POST"])
def review_endpoint():
    body = request.get_json(force=True)
    source = body.get("source")
    if not source:
        return jsonify({"error": "missing 'source' in JSON body"}), 400

    # Optional: allow overriding iterations and model
    iterations = int(body.get("iterations", 2))
    model = body.get("model", os.environ.get("SRR_MODEL"))

    result = review_loop(source, max_iterations=iterations, model=model)
    return jsonify(result)

if __name__ == "__main__":
    # For local dev only. Use a real WSGI server for production.
    app.run(host="127.0.0.1", port=5002, debug=True)