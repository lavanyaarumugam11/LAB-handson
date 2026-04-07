"""react_agent.tools

Small set of tool adapters used by the ReAct agent. Current implementation:
- web_search: lightweight DuckDuckGo HTML search (no API key). Intended for
  development and demo purposes only. Replace with a proper search API for
  production use (Bing/SerpAPI/etc.).

The function returns a list of dicts: {"title": str, "snippet": str, "url": str}.
Raises ToolError on network or parsing problems.
"""

from typing import List, Dict
import re
import html
import requests

TIMEOUT = 15


class ToolError(Exception):
    """Generic tool error."""


def web_search(query: str, max_results: int = 5) -> List[Dict[str, str]]:
    """Perform a lightweight web search using DuckDuckGo's HTML endpoint.

    Args:
        query: search query string
        max_results: maximum number of results to return

    Returns:
        List of result dicts with keys: title, snippet, url

    Note: this parser is intentionally simple and brittle. For production,
    use a proper search API and a JSON response.
    """
    url = "https://html.duckduckgo.com/html"
    headers = {"User-Agent": "ReAct-Agent/1.0 (+https://example.org)"}
    try:
        resp = requests.post(url, data={"q": query}, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        html_text = resp.text
    except Exception as e:
        raise ToolError(f"web_search network error: {e}")

    results: List[Dict[str, str]] = []

    # Patterns tuned for DuckDuckGo HTML layout. Keep simple to avoid heavy deps.
    link_pattern = re.compile(r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>', re.IGNORECASE | re.DOTALL)
    snippet_pattern = re.compile(r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>', re.IGNORECASE | re.DOTALL)

    anchors = link_pattern.findall(html_text)
    snippets = snippet_pattern.findall(html_text)

    def decode_link(href: str) -> str:
        # DuckDuckGo sometimes wraps urls with /l/?kh=-1&uddg=<encoded-url>
        m = re.search(r'uddg=([^&]+)', href)
        if m:
            return requests.utils.unquote(m.group(1))
        if href.startswith("http"):
            return href
        return href

    for i, (href, raw_title) in enumerate(anchors[:max_results]):
        try:
            title = html.unescape(re.sub(r'<.*?>', '', raw_title)).strip()
            url_link = decode_link(href)
            snippet = html.unescape(re.sub(r'<.*?>', '', snippets[i]).strip()) if i < len(snippets) else ""
            results.append({"title": title, "snippet": snippet, "url": url_link})
        except Exception:
            # Skip malformed entries rather than failing the whole tool
            continue

    return results
