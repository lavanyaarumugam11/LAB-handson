"""
Simple HTTP server exposing the ReAct agent on localhost.

Endpoints:
- POST /ask  -> JSON {"question": "...", "api_key": "optional-key", "model": "optional"}

Response:
- 200 JSON {"answer": ..., "trace": [...]}
- 400 / 500 on errors

Run: python -m react_agent.server
"""
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

from .agent import run_react_agent

HOST = "127.0.0.1"
PORT = int(os.getenv("REACT_AGENT_PORT", "8000"))


class SimpleHandler(BaseHTTPRequestHandler):
    def _send_json(self, code: int, obj):
        payload = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/ask":
            self._send_json(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            self._send_json(400, {"error": "empty body"})
            return
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
        except Exception as e:
            self._send_json(400, {"error": "invalid json", "detail": str(e)})
            return
        question = data.get("question")
        api_key = data.get("api_key")
        model = data.get("model")
        if not question:
            self._send_json(400, {"error": "question is required"})
            return
        # Allow temporarily setting model via env for this run
        if model:
            os.environ["OPENAI_MODEL"] = model
        try:
            res = run_react_agent(question, verbose=False, api_key=api_key)
        except Exception as e:
            self._send_json(500, {"error": "internal error", "detail": str(e)})
            return
        self._send_json(200, res)


def run_server(host=HOST, port=PORT):
    server = HTTPServer((host, port), SimpleHandler)
    print(f"ReAct agent server listening at http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Shutting down")
        server.server_close()


if __name__ == "__main__":
    run_server()
