# ReAct Agent (Python)

This small package implements a production-minded ReAct (Reasoning + Acting) agent using the OpenAI Chat API and a simple web_search tool.

Structure
- `react_agent/` - package modules
  - `agent.py` - controller implementing the ReAct loop
  - `tools.py` - tool adapters (web_search)
  - `openai_client.py` - minimal OpenAI client wrapper
  - `prompts.py` - system prompt and parsing helpers
  - `cli.py` - small CLI runner

Quick start
1. Install dependency:

```powershell
pip install -r requirements.txt
```

2. Set your OpenAI key in PowerShell:

```powershell
$env:OPENAI_API_KEY = "sk-..."
```

3. Run an example:

```powershell
python -m react_agent.cli "Who won the 2023 Nobel Prize in Physics?"
```

Notes
- The included `web_search` uses DuckDuckGo HTML parsing and is brittle; replace with a paid search API for production.
- The system prompt enforces a strict ReAct format: `Thought:`, `Action: web_search["<query>"]`, `Observation:`, `Final Answer:`.
- Keep `OPENAI_MODEL` and `OPENAI_API_KEY` as environment variables for configuration.

License: MIT (example)
