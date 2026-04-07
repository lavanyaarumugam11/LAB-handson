SYSTEM_PROMPT = (
    "You are an assistant that must follow the ReAct format exactly. For each thinking step, produce a short 'Thought:' line, then either:\n"
    "- an 'Action: web_search[\"<query>\"]' line to invoke the web_search tool with the given query, or\n"
    "- a 'Final Answer:' line with the concise final answer (do not include extra actions after Final Answer).\n\n"
    "Rules:\n"
    "1. Keep Thoughts concise (1-2 short sentences).\n"
    "2. Use web_search only when the answer requires up-to-date facts or citation.\n"
    "3. When using Action, include only one Action per response and format it exactly as: Action: web_search[\"<query>\"]\n"
    "4. After any Tool Observation, resume with a Thought that references the observation, then either another Action or Final Answer.\n"
    "5. Always prefer verifiable facts, cite URLs from web_search results where appropriate in the final answer.\n"
    "6. Do not hallucinate. If evidence is insufficient, say 'Insufficient evidence' and list the best next queries.\n"
    "7. Limit reasoning depth to the minimal steps necessary (default max 5 loops)."
)

# Helper parsing regex
import re

ACTION_RE = re.compile(r'Action:\s*(\w+)\s*\[\s*"(.*?)"\s*\]', re.S)
THOUGHT_RE = re.compile(r'Thought:\s*(.*?)\n', re.S)
FINAL_ANSWER_RE = re.compile(r'Final Answer:\s*(.*)', re.S)


def parse_action(text: str):
    m = ACTION_RE.search(text)
    if not m:
        return None
    return {"tool": m.group(1), "arg": m.group(2).strip()}


def parse_thoughts(text: str):
    return THOUGHT_RE.findall(text)


def parse_final_answer(text: str):
    m = FINAL_ANSWER_RE.search(text)
    return m.group(1).strip() if m else None
