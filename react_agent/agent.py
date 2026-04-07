"""
Agent controller implementing the ReAct loop.
"""
from typing import List, Dict, Any, Optional
import logging

from .prompts import SYSTEM_PROMPT, parse_action, parse_thoughts, parse_final_answer
from .openai_client import chat_completion, OpenAIError
from .tools import web_search, ToolError

logger = logging.getLogger("react_agent.agent")
logging.basicConfig(level=logging.INFO)

MAX_ITERATIONS = 5


def run_react_agent(question: str, max_iters: int = MAX_ITERATIONS, verbose: bool = False, api_key: str = None) -> Dict[str, Any]:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Question: {question}"}
    ]
    trace = []

    for it in range(max_iters):
        if verbose:
            logger.info("Iteration %d: calling OpenAI", it+1)
        try:
            # pass api_key through to OpenAI client (allows per-request keys)
            resp_text = chat_completion(messages, api_key=api_key)
        except OpenAIError as e:
            return {"answer": f"OpenAI error: {e}", "trace": trace}

        if verbose:
            logger.info("LLM response:\n%s", resp_text)

        thought_lines = parse_thoughts(resp_text)
        thought = thought_lines[-1].strip() if thought_lines else ""
        action = parse_action(resp_text)
        final = parse_final_answer(resp_text)

        record = {"thought": thought}
        if final:
            record["final_answer"] = final
            trace.append(record)
            return {"answer": final, "trace": trace}

        if action:
            tool_name = action["tool"]
            arg = action["arg"]
            record["action"] = {"tool": tool_name, "arg": arg}
            trace.append(record)
            if tool_name.lower() in ("web_search", "websearch"):
                try:
                    results = web_search(arg, max_results=5)
                except ToolError as te:
                    observation = f"ToolError: {str(te)}"
                except Exception as e:
                    observation = f"ToolError: {repr(e)}"
                else:
                    if not results:
                        observation = "Observation: no results found."
                    else:
                        lines = []
                        for r in results[:3]:
                            lines.append(f"- {r['title']} ({r['url']})\n  {r['snippet']}")
                        observation = "Observation:\n" + "\n".join(lines)
                messages.append({"role": "assistant", "content": resp_text})
                messages.append({"role": "system", "content": observation})
                continue
            else:
                observation = f"Observation: Unsupported tool '{tool_name}'."
                messages.append({"role": "assistant", "content": resp_text})
                messages.append({"role": "system", "content": observation})
                continue
        else:
            short_answer = resp_text.strip()
            if len(short_answer.splitlines()) <= 4 and len(short_answer) < 800:
                record["final_answer"] = short_answer
                trace.append(record)
                return {"answer": short_answer, "trace": trace}
            messages.append({"role": "assistant", "content": resp_text})
            messages.append({"role": "system", "content": "Please respond using the ReAct format with 'Thought:' then either an Action or 'Final Answer:'."})
            trace.append(record)
            continue

    return {"answer": "Max iterations reached; insufficient evidence.", "trace": trace}
