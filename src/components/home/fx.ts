/**
 * Landing page motion system, ported from the design bundle's home-fx.js:
 * Lenis smooth scroll, GSAP ScrollTrigger scenes (pinned multi-agent canvas,
 * memory strata), HyperText scramble reveals, SplitText line reveals,
 * image parallax, and the nav dark/light theme swap.
 *
 * Everything is created inside a gsap.context so `destroy()` reverts the DOM
 * cleanly (needed for React strict-mode double mounting).
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function frac(x: number) {
  return x - Math.floor(x);
}
function rnd(i: number, salt: number) {
  return frac(Math.sin(i * 127.1 + salt * 311.7) * 43758.5453);
}

/* ---------------- HyperText scramble ---------------- */
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SCRAMBLE_ANIM_ATTR = "data-scramble-anim";
const SCRAMBLE_ORIGINAL_ATTR = "data-scramble-original";

/**
 * Split a heading in two before any animation is allowed to touch it:
 *
 *   <h2><span class="sr-only">Real text</span><span aria-hidden>Real text</span></h2>
 *
 * `scrambleEl` then only ever writes into the `aria-hidden` span, so the
 * heading's accessible name is computed from the `sr-only` copy and stays
 * correct before, during, and after the 900–1100 ms animation. Screen readers
 * and heading navigation never see the random characters. `sr-only` is
 * out-of-flow (absolute, clipped to 1×1), so the visible text is unchanged and
 * nothing is duplicated on screen.
 *
 * This runs from `initHomeFx`, i.e. from a `useEffect` after hydration — the
 * server-rendered HTML still ships the plain heading text (correct with no JS)
 * and React never diffs against the restructured DOM. Idempotent, and undone by
 * `restoreScrambleTarget` on teardown so React strict-mode double mounts do not
 * nest spans.
 */
function prepareScrambleTarget(el: HTMLElement): HTMLElement | null {
  const existing = el.querySelector<HTMLElement>(`[${SCRAMBLE_ANIM_ATTR}]`);
  if (existing) return existing;

  const original = el.textContent ?? "";
  if (!original) return null;
  el.setAttribute(SCRAMBLE_ORIGINAL_ATTR, original);

  const label = document.createElement("span");
  label.className = "sr-only";
  label.textContent = original;

  const anim = document.createElement("span");
  anim.setAttribute(SCRAMBLE_ANIM_ATTR, "");
  anim.setAttribute("aria-hidden", "true");
  anim.textContent = original;

  el.replaceChildren(label, anim);
  return anim;
}

/** Undo `prepareScrambleTarget`: back to a single plain text node. */
function restoreScrambleTarget(el: HTMLElement) {
  const original = el.getAttribute(SCRAMBLE_ORIGINAL_ATTR);
  if (original === null) return;
  el.removeAttribute(SCRAMBLE_ORIGINAL_ATTR);
  el.replaceChildren(document.createTextNode(original));
}

function scrambleEl(el: HTMLElement, duration = 900) {
  const original = el.getAttribute("data-scramble-text") ?? el.textContent ?? "";
  el.setAttribute("data-scramble-text", original);
  let start: number | null = null;
  function frame(now: number) {
    if (start === null) start = now;
    const p = clamp01((now - start) / duration);
    const reveal = p * original.length;
    let out = "";
    for (let i = 0; i < original.length; i++) {
      const c = original.charAt(i);
      if (i <= reveal || !/[A-Za-z0-9]/.test(c)) out += c;
      else out += SCRAMBLE_CHARS.charAt((Math.random() * SCRAMBLE_CHARS.length) | 0);
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(frame);
    else el.textContent = original;
  }
  requestAnimationFrame(frame);
}

/* ---------------- Multi-agent orchestration scene ---------------- */
interface AgentNode {
  label: string;
  x: number;
  y: number;
  r: number;
  kind: "hub" | "agent" | "tool";
  parent?: number;
  sx?: number;
  sy?: number;
}

const NODES: AgentNode[] = [
  { label: "Orchestrator", x: 0.5, y: 0.46, r: 24, kind: "hub" },
  { label: "Planner", x: 0.28, y: 0.26, r: 14, kind: "agent" },
  { label: "Researcher", x: 0.72, y: 0.26, r: 14, kind: "agent" },
  { label: "Coder", x: 0.28, y: 0.68, r: 14, kind: "agent" },
  { label: "Critic", x: 0.72, y: 0.68, r: 14, kind: "agent" },
  { label: "docs", x: 0.13, y: 0.14, r: 6, kind: "tool", parent: 1 },
  { label: "search", x: 0.88, y: 0.12, r: 6, kind: "tool", parent: 2 },
  { label: "browser", x: 0.91, y: 0.34, r: 6, kind: "tool", parent: 2 },
  { label: "git", x: 0.1, y: 0.6, r: 6, kind: "tool", parent: 3 },
  { label: "tests", x: 0.15, y: 0.86, r: 6, kind: "tool", parent: 3 },
  { label: "eval", x: 0.87, y: 0.86, r: 6, kind: "tool", parent: 4 },
];

export function initHomeFx(root: HTMLElement): () => void {
  const reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let lenis: Lenis | null = null;
  const observers: IntersectionObserver[] = [];
  const rafTicker: ((time: number) => void)[] = [];
  const windowListeners: Array<[string, EventListener]> = [];
  const scrambleTargets: HTMLElement[] = [];
  const timers: ReturnType<typeof setTimeout>[] = [];

  const ctx = gsap.context(() => {
    /* ------- Lenis smooth scroll ------- */
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.09 });
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(raf);
      rafTicker.push(raf);
      gsap.ticker.lagSmoothing(0);
    }

    /* ------- Hero ------- */
    const head = root.querySelector<HTMLElement>("#hero-head");
    if (head && !reduced) {
      // Restructure immediately, not at animation start: the h1 is
      // a11y-correct for the whole 350 ms lead-in as well as the scramble.
      const anim = prepareScrambleTarget(head);
      if (anim) {
        scrambleTargets.push(head);
        timers.push(setTimeout(() => scrambleEl(anim, 1100), 350));
      }
    }
    if (!reduced) {
      gsap.from("#hero-sub, #hero-cta", {
        opacity: 0,
        y: 18,
        duration: 1.1,
        delay: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      });
      gsap.to("#hero-media", {
        yPercent: 16,
        scale: 1.06,
        ease: "none",
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to("#hero-copy", {
        opacity: 0,
        y: -40,
        ease: "none",
        scrollTrigger: {
          trigger: "#hero",
          start: "30% top",
          end: "75% top",
          scrub: true,
        },
      });
    }

    /* ------- Scramble reveals on scroll ------- */
    if (!reduced) {
      const els = root.querySelectorAll<HTMLElement>("[data-scramble]");
      if (els.length) {
        const io = new IntersectionObserver(
          (entries) => {
            for (const en of entries) {
              if (en.isIntersecting) {
                io.unobserve(en.target);
                const el = en.target as HTMLElement;
                const d = parseInt(el.getAttribute("data-scramble") || "900", 10);
                // Only the aria-hidden span is ever mutated; the sr-only
                // sibling keeps the heading's accessible name intact.
                const anim = el.querySelector<HTMLElement>(`[${SCRAMBLE_ANIM_ATTR}]`);
                if (anim) scrambleEl(anim, d);
              }
            }
          },
          { threshold: 0.4 },
        );
        els.forEach((el) => {
          if (prepareScrambleTarget(el)) scrambleTargets.push(el);
          io.observe(el);
        });
        observers.push(io);
      }
    }

    /* ------- SplitText line reveals ------- */
    if (!reduced) {
      root.querySelectorAll<HTMLElement>("[data-lines]").forEach((el) => {
        const split = new SplitText(el, { type: "lines", mask: "lines" });
        gsap.from(split.lines, {
          yPercent: 110,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 80%", once: true },
        });
      });
    }

    /* ------- Simple rise-in ------- */
    if (!reduced) {
      root.querySelectorAll<HTMLElement>("[data-rise]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 26,
          duration: 1,
          ease: "power3.out",
          delay: parseFloat(el.getAttribute("data-rise") || "0"),
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });
    }

    /* ------- Image parallax ------- */
    if (!reduced) {
      root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((wrap) => {
        const img = wrap.querySelector("img");
        if (!img) return;
        gsap.fromTo(
          img,
          { yPercent: -10 },
          {
            yPercent: 10,
            ease: "none",
            scrollTrigger: {
              trigger: wrap,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
    }

    /* ------- Multi-agent canvas scene ------- */
    (() => {
      const canvas = root.querySelector<HTMLCanvasElement>("#agent-canvas");
      const pin = root.querySelector<HTMLElement>("#agent-pin");
      if (!canvas || !pin) return;
      const c = canvas.getContext("2d");
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let W = 0;
      let H = 0;
      let progress = reduced ? 1 : 0;
      let active = false;
      let time = 0;

      const nodes = NODES.map((n, i) => ({
        ...n,
        sx: 0.08 + rnd(i, 1) * 0.84,
        sy: 0.1 + rnd(i, 2) * 0.8,
      }));

      function nodePos(n: (typeof nodes)[number], move: number, t: number, idx: number) {
        let fx = lerp(n.sx, n.x, move) * W;
        let fy = lerp(n.sy, n.y, move) * H;
        fx += Math.sin(t * 0.5 + idx * 2.1) * 5;
        fy += Math.cos(t * 0.4 + idx * 1.7) * 5;
        return { x: fx, y: fy };
      }

      function drawEdge(
        a: { x: number; y: number },
        b: { x: number; y: number },
        grow: number,
        alpha: number,
      ) {
        if (grow <= 0 || !c) return;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(lerp(a.x, b.x, grow), lerp(a.y, b.y, grow));
        c.strokeStyle = "rgba(255,255,255," + 0.22 * alpha + ")";
        c.lineWidth = 1;
        c.stroke();
      }

      function draw() {
        if (!c) return;
        const p = progress;
        const t = time;
        c.clearRect(0, 0, W, H);

        const move = easeInOut(clamp01(p / 0.5));
        const eHub = clamp01((p - 0.42) / 0.22);
        const eTool = clamp01((p - 0.62) / 0.22);
        const labelA = clamp01((p - 0.55) / 0.18);
        const pulseA = clamp01((p - 0.78) / 0.15);

        const pos = nodes.map((n, i) => nodePos(n, move, t, i));
        const hub = pos[0];

        for (let i = 1; i <= 4; i++) drawEdge(hub, pos[i], easeInOut(eHub), 1);
        for (let j = 5; j < nodes.length; j++)
          drawEdge(pos[nodes[j].parent!], pos[j], easeInOut(eTool), 0.8);

        if (pulseA > 0) {
          for (let k = 1; k <= 4; k++) {
            const tt = frac(t * 0.35 + k * 0.25);
            const px = lerp(hub.x, pos[k].x, tt);
            const py = lerp(hub.y, pos[k].y, tt);
            c.beginPath();
            c.arc(px, py, 2.5, 0, Math.PI * 2);
            c.fillStyle = "rgba(41,151,255," + 0.9 * pulseA + ")";
            c.fill();
          }
        }

        for (let m = 0; m < nodes.length; m++) {
          const n = nodes[m];
          const q = pos[m];
          c.beginPath();
          c.arc(q.x, q.y, n.r, 0, Math.PI * 2);
          if (n.kind === "hub") {
            const glow = 0.25 + 0.5 * eHub;
            const g = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, n.r * 3);
            g.addColorStop(0, "rgba(41,151,255," + 0.35 * glow + ")");
            g.addColorStop(1, "rgba(41,151,255,0)");
            c.save();
            c.fillStyle = g;
            c.fillRect(q.x - n.r * 3, q.y - n.r * 3, n.r * 6, n.r * 6);
            c.restore();
            c.beginPath();
            c.arc(q.x, q.y, n.r, 0, Math.PI * 2);
            c.fillStyle = "#2997FF";
          } else if (n.kind === "agent") {
            c.fillStyle = "rgba(255,255,255,0.92)";
          } else {
            c.fillStyle = "rgba(255,255,255," + (0.3 + 0.35 * eTool) + ")";
          }
          c.fill();

          const la = n.kind === "tool" ? labelA * eTool : labelA;
          if (la > 0.01) {
            c.font =
              (n.kind === "tool" ? "400 12px" : "600 14px") +
              ' -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
            c.textAlign = "center";
            c.fillStyle =
              "rgba(255,255,255," + (n.kind === "tool" ? 0.45 * la : 0.75 * la) + ")";
            c.fillText(n.label, q.x, q.y + n.r + 20);
          }
        }
      }

      function resize() {
        W = pin!.clientWidth;
        H = pin!.clientHeight;
        canvas!.width = W * dpr;
        canvas!.height = H * dpr;
        canvas!.style.width = W + "px";
        canvas!.style.height = H + "px";
        c!.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
      }

      resize();
      if (reduced) return;

      const onResize = () => resize();
      window.addEventListener("resize", onResize);
      windowListeners.push(["resize", onResize]);

      const tick = (t: number) => {
        time = t;
        if (active) draw();
      };
      gsap.ticker.add(tick);
      rafTicker.push(tick);

      const caps = [0, 1, 2].map((i) =>
        root.querySelector<HTMLElement>('[data-agent-caption="' + i + '"]'),
      );
      function updateCaps(p: number) {
        const phase = p < 0.36 ? 0 : p < 0.68 ? 1 : 2;
        caps.forEach((cap, i) => {
          if (cap) cap.style.opacity = i === phase ? "1" : "0";
        });
      }

      ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: "+=2200",
        pin: true,
        scrub: 0.4,
        onUpdate: (self) => {
          progress = self.progress;
          updateCaps(self.progress);
        },
        onToggle: (self) => {
          active = self.isActive;
        },
      });
      updateCaps(0);
    })();

    /* ------- Memory strata scene ------- */
    (() => {
      const pin = root.querySelector<HTMLElement>("#strata-pin");
      if (!pin || reduced) return;
      const layers = pin.querySelectorAll<HTMLElement>("[data-stratum]");
      const query = root.querySelector<HTMLElement>("#strata-query");
      const queryLabel = root.querySelector<HTMLElement>("#strata-query-label");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: "+=1900",
          pin: true,
          scrub: 0.4,
        },
      });
      for (let i = layers.length - 1; i >= 0; i--) {
        tl.fromTo(
          layers[i],
          { y: 60, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1, ease: "power2.out" },
          (layers.length - 1 - i) * 0.85,
        );
      }
      if (query) {
        tl.fromTo(
          query,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 1.3,
            ease: "power2.inOut",
            transformOrigin: "top center",
          },
          "+=0.3",
        );
      }
      if (queryLabel) {
        tl.fromTo(queryLabel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, "<+=0.4");
      }
    })();

    /* ------- Cloud text rise / exit ------- */
    (() => {
      const el = root.querySelector<HTMLElement>("[data-cloud-text]");
      if (!el || reduced) return;
      gsap.fromTo(
        el,
        { y: 56, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        },
      );
      gsap.to(el, {
        y: -70,
        opacity: 0,
        ease: "power3.in",
        scrollTrigger: {
          trigger: el.closest("section") ?? el.parentElement,
          start: "bottom 72%",
          end: "bottom top",
          scrub: 0.15,
        },
      });
    })();

    /* ------- Nav theme swap ------- */
    (() => {
      const nav = root.querySelector<HTMLElement>("#yap-nav");
      if (!nav) return;
      const links = nav.querySelectorAll<HTMLElement>("[data-nav-text]");
      function apply(theme: string | null) {
        const dark = theme === "dark";
        nav!.classList.toggle("glass-dark", dark);
        nav!.classList.toggle("glass-light", !dark);
        links.forEach((l) => {
          l.style.color = dark ? "#F5F5F7" : "#1D1D1F";
        });
      }
      apply("dark");
      if (reduced) return;
      root.querySelectorAll<HTMLElement>("[data-navtheme]").forEach((sec) => {
        ScrollTrigger.create({
          trigger: sec,
          start: "top 52px",
          end: "bottom 52px",
          onToggle: (self) => {
            if (self.isActive) apply(sec.getAttribute("data-navtheme"));
          },
        });
      });
    })();

    ScrollTrigger.refresh();
  }, root);

  return () => {
    timers.forEach((t) => clearTimeout(t));
    observers.forEach((io) => io.disconnect());
    scrambleTargets.forEach(restoreScrambleTarget);
    windowListeners.forEach(([ev, fn]) => window.removeEventListener(ev, fn));
    rafTicker.forEach((fn) => gsap.ticker.remove(fn));
    lenis?.destroy();
    ctx.revert();
  };
}
