"""
Small CLI to run the react agent package.
"""
import argparse
import json
from .agent import run_react_agent


def main():
    parser = argparse.ArgumentParser(description="Run the ReAct agent CLI")
    parser.add_argument("question", nargs="?", help="Question to ask the agent")
    parser.add_argument("--demo", action="store_true", help="Show simulated demo")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    if args.demo:
        print("=== Simulated ReAct run ===")
        print("User: Who won the 2023 Fields Medal?")
        print("Thought: I should verify the winners with a reliable source.")
        print("Action: web_search[\"2023 Fields Medal winners\"]")
        print("Observation: - Name A (https://example.org) ...")
        print("Thought: The winners were X, Y, Z. I'll answer and cite.")
        print("Final Answer: The 2023 Fields Medal winners were ... (cite: https://example.org)")
        return

    if not args.question:
        parser.print_help()
        return

    res = run_react_agent(args.question, verbose=args.verbose)
    print("Answer:\n", res["answer"])
    print("\nTrace:")
    for step in res["trace"]:
        print(json.dumps(step, indent=2))

if __name__ == '__main__':
    main()
