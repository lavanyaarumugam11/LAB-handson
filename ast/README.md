# Self-Reflecting Python Code Review Agent (ast/)

This folder contains a compact self-reflecting code review agent built around Python's
`ast` module and the OpenAI Chat API. It performs two iterations: an initial structured
review and a self-critique/refinement pass.

Files created:
- `utils.py` — AST summarization, payload builder, OpenAI wrapper, validators.
- `prompt.txt` — strict system prompt that enforces JSON-only structured reviews and grounding.
- `self_reflecting_review_agent.py` — CLI entry that runs 2 iterations and prints the final JSON review.
- `requirements.txt` — dependencies (`openai` and optional `pytest`).
- `example_code.py` — example input code used in the demo.
- `README.md` — this file.

Quickstart (PowerShell):

```powershell
# set your key
$env:OPENAI_API_KEY = 'sk-...'

# create a venv (optional)
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# run the agent (from this folder)
python self_reflecting_review_agent.py
```

Notes / next steps:
- The agent expects the LLM to return strict JSON following the schema in `prompt.txt`.
- If the model returns non-JSON or the OpenAI package isn't available, the script will return
  an error wrapper with the raw content.
- For production use, add robust retries, rate-limit handling, and expand validators.

If you'd like, I can:
- Add unit tests that assert the validator flags fabricated locations.
- Create a CLI flag to run on arbitrary files and output a unified diff.
- Add an automated local-mode fallback that simulates an LLM response for offline testing.
