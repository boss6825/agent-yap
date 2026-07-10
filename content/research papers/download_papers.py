#!/usr/bin/env python3
"""
Download research papers for the multi-agent/memory survey.
Run: python download_papers.py
Requires: pip install requests
"""

import os
import time
import requests

SAVE_DIR = os.path.dirname(os.path.abspath(__file__))

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# Papers: (filename, url, note)
PAPERS = [
    # ── Multi-Agent Foundational Frameworks ──────────────────────────────────
    (
        "CAMEL_Li_NeurIPS2023.pdf",
        "https://arxiv.org/pdf/2303.17760",
        "CAMEL: Communicative Agents for Mind Exploration (Li et al., NeurIPS 2023)"
    ),
    (
        "MetaGPT_Hong_ICLR2024.pdf",
        "https://arxiv.org/pdf/2308.00352",
        "MetaGPT: Meta Programming for Multi-Agent Collaboration (Hong et al., ICLR 2024)"
    ),
    (
        "GPTSwarm_Zhuge_ICML2024.pdf",
        "https://arxiv.org/pdf/2402.16823",
        "GPTSwarm: Language Agents as Optimizable Graphs (Zhuge et al., ICML 2024)"
    ),

    # ── Stigmergy / PSO / Swarm Intelligence × LLMs ─────────────────────────
    (
        "HeterogeneousSwarms_Feng_Google2025.pdf",
        "https://arxiv.org/pdf/2502.04510",
        "Heterogeneous Swarms (Feng et al., Google Research 2025)"
    ),
    (
        "MultiAgentLLM_SwarmIntelligence_Jimenez2025.pdf",
        "https://arxiv.org/pdf/2503.03800",
        "Multi-agent systems powered by LLMs: applications in swarm intelligence (Jimenez-Romero et al. 2025)"
    ),
    (
        "LLM_Swarms_CriticalEval_2025.pdf",
        "https://arxiv.org/pdf/2506.14496",
        "LLM-Powered Swarms: A New Frontier or a Conceptual Stretch? (2025)"
    ),

    # ── Bridging Brain ↔ AI Memory ───────────────────────────────────────────
    (
        "HopfieldNetworks_Ramsauer_ICLR2021.pdf",
        "https://arxiv.org/pdf/2008.02217",
        "Hopfield Networks is All You Need (Ramsauer et al., ICLR 2021)"
    ),
    (
        "HippoRAG_Gutierrez_NeurIPS2024.pdf",
        "https://arxiv.org/pdf/2405.14831",
        "HippoRAG: Neurobiologically Inspired Long-Term Memory for LLMs (NeurIPS 2024)"
    ),

    # ── Recent Memory-Architecture Research (2025) ────────────────────────────
    (
        "MemoryAugmentedTransformers_Survey_2025.pdf",
        "https://arxiv.org/pdf/2508.10824",
        "Memory-Augmented Transformers survey (2025)"
    ),
    (
        "EngramEncoding_Neurocomputational_2025.pdf",
        "https://arxiv.org/pdf/2506.01659",
        "Engram encoding: A neurocomputational perspective (2025)"
    ),

    # ── Stigmergy papers (2026-scheme IDs — may or may not exist) ────────────
    # These are flagged as potentially unverified; script will skip silently if 404
    (
        "PressureFields_2601.08129.pdf",
        "https://arxiv.org/pdf/2601.08129",
        "Pressure Fields (arXiv:2601.08129) — verify exists"
    ),
    (
        "DiversityScaling_2602.03794.pdf",
        "https://arxiv.org/pdf/2602.03794",
        "Diversity Scaling (arXiv:2602.03794) — verify exists"
    ),
    (
        "MemorySurvey_2603.07670.pdf",
        "https://arxiv.org/pdf/2603.07670",
        "Memory Survey (arXiv:2603.07670) — verify exists"
    ),
    (
        "AMROS_2603.12933.pdf",
        "https://arxiv.org/pdf/2603.12933",
        "AMRO-S (arXiv:2603.12933) — verify exists"
    ),
    (
        "PolySwarm_2604.03888.pdf",
        "https://arxiv.org/pdf/2604.03888",
        "PolySwarm (arXiv:2604.03888) — verify exists"
    ),
    (
        "LedgerStateStigmergy_2604.03997.pdf",
        "https://arxiv.org/pdf/2604.03997",
        "Ledger-State Stigmergy (arXiv:2604.03997) — verify exists"
    ),
    (
        "KhushiyantEmergentMemory_2512.10166.pdf",
        "https://arxiv.org/pdf/2512.10166",
        "Khushiyant emergent-memory (arXiv:2512.10166)"
    ),
    (
        "ScalingLaws_Kim_2512.08296.pdf",
        "https://arxiv.org/pdf/2512.08296",
        "Scaling laws (Kim et al., arXiv:2512.08296)"
    ),
    (
        "CraniMem_2603.15642.pdf",
        "https://arxiv.org/pdf/2603.15642",
        "CraniMem (arXiv:2603.15642) — verify exists"
    ),

    # ── Open-access neuroscience ──────────────────────────────────────────────
    (
        "McClelland_CLS_Theory_1995.pdf",
        "https://www.cnbc.cmu.edu/~plaut/papers/pdf/McClellandMcNaughtonOReilly95PsychRev.complementary.pdf",
        "McClelland, McNaughton & O'Reilly (1995) — CLS Theory"
    ),
    (
        "Josselyn_Tonegawa_MemoryEngrams_Science2020.pdf",
        "https://www.science.org/doi/pdf/10.1126/science.aaw4325",
        "Josselyn & Tonegawa (2020) — Memory engrams (Science)"
    ),
    (
        "DNC_Graves_Nature2016.pdf",
        "https://www.nature.com/articles/nature20101.pdf",
        "Graves et al. (2016) — DNC (Nature)"
    ),
]

# Papers that require institutional access — provide links only
PAYWALLED = [
    ("Teyler & DiScenna (1986)", "https://scholar.google.com/scholar?q=Teyler+DiScenna+1986+hippocampal+memory+indexing+theory"),
    ("Wimber et al. (2015)", "https://scholar.google.com/scholar?q=Wimber+2015+Retrieval+induces+adaptive+forgetting+Nature+Neuroscience"),
    ("Klinzing, Diekelmann & Born (2019)", "https://scholar.google.com/scholar?q=Klinzing+Diekelmann+Born+2019+systems+memory+consolidation+sleep+Nature+Neuroscience"),
    ("Kumaran, Hassabis & McClelland (2016)", "https://scholar.google.com/scholar?q=Kumaran+Hassabis+McClelland+2016+CLS+Theory+updated+Trends+Cognitive+Sciences"),
    ("Kanerva (1988) — Sparse Distributed Memory", "https://mitpress.mit.edu/9780262110341/sparse-distributed-memory/"),
]


def download(filename, url, title):
    path = os.path.join(SAVE_DIR, filename)
    if os.path.exists(path) and os.path.getsize(path) > 10_000:
        print(f"  [SKIP] Already exists: {filename}")
        return True

    try:
        resp = requests.get(url, headers=HEADERS, timeout=60, stream=True)
        if resp.status_code == 200 and len(resp.content) > 10_000:
            with open(path, "wb") as f:
                f.write(resp.content)
            size_kb = os.path.getsize(path) // 1024
            print(f"  [OK]   {filename}  ({size_kb} KB)")
            return True
        else:
            print(f"  [FAIL] {filename}  — HTTP {resp.status_code} / size {len(resp.content)} bytes")
            return False
    except Exception as e:
        print(f"  [ERR]  {filename}  — {e}")
        return False


def main():
    print(f"\nSaving to: {SAVE_DIR}\n")
    succeeded, failed = [], []

    for filename, url, title in PAPERS:
        print(f"\n→ {title}")
        ok = download(filename, url, title)
        (succeeded if ok else failed).append((filename, url, title))
        time.sleep(1.5)  # be polite to servers

    print("\n" + "═" * 60)
    print(f"✓ Downloaded: {len(succeeded)}")
    print(f"✗ Failed:     {len(failed)}")

    if failed:
        print("\n── Failed downloads (try manually) ──")
        for fn, url, title in failed:
            print(f"  {title}\n    URL: {url}\n")

    print("\n── Paywalled (access via library/Google Scholar) ──")
    for title, url in PAYWALLED:
        print(f"  {title}\n    {url}\n")


if __name__ == "__main__":
    main()
