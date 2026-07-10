#!/usr/bin/env python3
"""
Download the three benchmark papers into this folder (04-Benchmarks).
Run from anywhere:  python download_benchmarks.py
Requires:           pip install requests

Note: these PDFs could not be fetched automatically because the assistant's
sandbox has no network access to arxiv. Running this on your own machine,
which does have internet, will populate the folder.
"""

import os
import time
import requests

SAVE_DIR = os.path.dirname(os.path.abspath(__file__))

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# (filename, url, note)
PAPERS = [
    (
        "BIG-Bench Beyond the Imitation Game.pdf",
        "https://arxiv.org/pdf/2206.04615",
        "BIG-Bench: Beyond the Imitation Game (2022)"
    ),
    (
        "SWE-bench Can Language Models Resolve Real-World GitHub Issues.pdf",
        "https://arxiv.org/pdf/2310.06770",
        "SWE-bench (2023)"
    ),
    (
        "Chatbot Arena An Open Platform for Evaluating LLMs by Human Preference.pdf",
        "https://arxiv.org/pdf/2403.04132",
        "Chatbot Arena (2024)"
    ),
]


def main():
    for filename, url, note in PAPERS:
        dest = os.path.join(SAVE_DIR, filename)
        if os.path.exists(dest):
            print(f"SKIP (exists): {filename}")
            continue
        print(f"Downloading: {note}")
        try:
            resp = requests.get(url, headers=HEADERS, timeout=60)
            resp.raise_for_status()
            with open(dest, "wb") as f:
                f.write(resp.content)
            print(f"  saved -> {filename} ({len(resp.content):,} bytes)")
        except Exception as exc:
            print(f"  FAILED: {exc}")
        time.sleep(1)


if __name__ == "__main__":
    main()
