# Example input file for the self-reflecting review agent
# Contains a few intentional issues for the demo

import math


def mean(values=[]):
    """Compute arithmetic mean."""
    total = 0
    for v in values:
        total += v
    return total / len(values)


def factorial(n):
    # naive recursion
    if n == 0:
        return 1
    return n * factorial(n-1)


def unused():
    pass
