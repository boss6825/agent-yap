# 06 — Visual identity: fixing "the photos are boring now"

Research + design only. No repo file was modified to produce this.

---

## 0. Ground truth — what the site actually does with imagery today

Measured, not assumed.

| Asset | Size | Where used | How |
|---|---|---|---|
| `public/assets/snow-mountain.jpg` | **6.82 MB** | `src/components/Home.tsx:138` (hero, `#hero-media`, `priority`, `animate-kenburns`) **and** `src/components/Home.tsx:370` (section 7, CTA divider, `data-parallax`) | full-bleed `object-cover`, dark linear-gradient scrim over it |
| `public/assets/cloud-sea.jpg` | **7.88 MB** | `src/components/Home.tsx:243` (section 4, interstitial) | full-bleed `object-cover`, `bg-black/[0.28]` scrim |
| `public/art/*.jpg` (18 files) | **2.6 MB total**, ~148 KB each | `src/components/reader/Rail.tsx:95–107` | `fill` / `object-cover` behind the whole 300px rail, flattened by a `bg-canvas/70` scrim |

Supporting facts:

- **15 MB of source photography for three appearances.** `next.config.ts` has no `images` block, so the default loader is in play; the source bytes still live in the repo and still get read by the optimizer. The hero is almost certainly the LCP element.
- **The same file appears twice on one page**, bookending the scroll (section 1 and section 7). The two `alt` strings even describe it differently — "Dark snowy mountain range seen from above" (`Home.tsx:139`) vs "…with cloud pouring over a ridge" (`Home.tsx:371`). Two descriptions of one file is the tell that the duplication was never a decision.
- **The art pipeline covers one book of eight.** `scripts/fetch-art.mjs:19` hardcodes `BOOK_DIR = content/architecture-and-system-design`. Current chapter counts: architecture 18 (+index), coding-agents/explained 17 (+index), agentic memory 6, multi-agent 6, context engineering 5, rag 5, glossary 1, research papers 1. **~59 chapters, 18 with art.**
- `scripts/fetch-art.mjs:34–55` already contains a **20-entry** `searchTerms` array indexed `(chapterNumber - 1) % searchTerms.length` (line 225). A deterministic 20-slot rotation already exists in this codebase.
- **The dark reader's ambient layer is orange.** `AmbientBackdrop.tsx:17` — `ORBIT_COLORS = ["#ffc96b", "#ff6200", "#ff2f00", "#421100", "#1a0000"]` — sits behind a `#2997ff` accent. Nothing derives from `--color-blue`. This is an existing identity fracture, not a new problem, but it blocks any "one accent hue" system until fixed.
- `src/components/home/fx.ts:27–31` already ships a seeded hash: `frac(x) = x - floor(x)` and `rnd(i, salt) = frac(sin(i*127.1 + salt*311.7) * 43758.5453)`. Any procedural system should reuse it rather than import a PRNG.
- Motion vocabulary in `fx.ts`: `power3.out` (used 4×), durations 0.9 / 1.0 / 1.1 / 1.3s, `scrub: 0.4`, `stagger: 0.08–0.12`. Reduced motion is gated once at `fx.ts:84–86` and again in `globals.css:150`.

---

## 1. Diagnosis: why repetition kills a hero image

### 1a. The mechanism

A photograph carries a fixed quantity of information. The first view spends a real saccade budget on it — you scan the ridge line, the light, the depth. By the fifth view the eye has fully encoded it and allocates zero exploration; the image stops being an image and becomes a **background colour with texture**. Nothing has changed on screen. What changed is the viewer's internal model.

This produces a specific, predictable failure: **the person who commissioned the image is always the first to find it dead.** The founder loads this site tens of times a day. Their staleness signal runs roughly 50× ahead of the median visitor's. A first-time visitor in August 2026 will still find the hero striking.

So the naive read — "the photos are boring, replace them" — optimises for an audience of one and throws away an asset (personal, high-quality, unlicensed-risk-free photography) that most competitors would pay for.

### 1b. But there is a real, structural defect underneath the perceptual one

Three of them:

1. **Literal duplication.** `snow-mountain.jpg` renders at `Home.tsx:138` and again at `Home.tsx:370`. Same file, same crop, same full-bleed treatment, same dark scrim, same centred white display type over it. The second instance carries **zero new information**. On a page whose whole argument is "we go deeper than everyone else," a repeated background reads as a lazy CMS. This is the part that actually feels cheap, and it is not a perception problem — it is a bug.

2. **Photo-as-metaphor ages fastest.** The mountain is doing rhetorical work: `Home.tsx:384` reads *"The climb is the curriculum."* A visual metaphor is a claim, and a claim is spent the moment it lands. Texture is not a claim, which is why texture doesn't stale the same way. The mountain-as-argument was always going to have a short half-life; the mountain-as-material doesn't.

3. **No variance budget for what's coming.** Two photographs cannot carry identity for 59 chapters today, 20 recombinant modules tomorrow, and an assessment surface after that. Whatever ships must scale without a human sourcing an image.

### 1c. The three standard fixes, and which applies

| Fix | What it means | Cost | Verdict here |
|---|---|---|---|
| **A. Rotation / variety** | More images; pick one per unit | Sourcing, curation, bytes, brand dilution. 20 unrelated photographs = stock-photo energy, the exact opposite of the target vibe | **Narrow yes.** Only where the source is already curated and already paid for: the Met CC0 rail. Never for the hero. |
| **B. Transformation** | One image, different treatment per placement — crop, colour, scale, *role* | Near zero bytes, near zero code. Risk: treatments degrade into decoration | **Primary fix.** Preserves the founder's attachment (it is still *their* photo) while destroying the repetition signal. |
| **C. Replacement** | Remove the photograph; carry the moment with type, space, or procedural form | Requires the typography to actually be good enough to hold a full-bleed section alone | **Yes, for exactly one placement:** the second `snow-mountain` at `Home.tsx:363–393` should not be a photograph. |

**Prescription: B for the hero, C for the duplicate, narrow-A for the rail, and a fourth thing — generated marks — for the 20 modules.**

The founder's photos are not the problem. Using two of them for everything is.

---

## 2. An imagery system that scales to 20 modules

### 2a. The counts

| Surface | Count | Source | Bytes |
|---|---|---|---|
| Landing hero | **1** photograph, one appearance | `snow-mountain.jpg`, re-exported | ~380 KB AVIF |
| Landing close | **1** photograph, one appearance | `cloud-sea.jpg`, re-exported, cropped to a band | ~240 KB AVIF |
| Module identity | **20** | **Generated, seeded by module id** | **0 bytes** |
| Chapter rail | **~59** | Met CC0, existing pipeline extended | ~148 KB each, already amortised |
| Reading slide | **0** | — | 0 |
| Assessment | **0** | — | 0 |

Total photographic appearances site-wide: **two**. Scarcity is what makes a hero photograph feel like a hero photograph.

### 2b. Why the 20 modules get generated marks, not photographs

Three candidate sources were considered:

**(i) Extend the Met CC0 pipeline to modules.** Tempting — it exists, it's deterministic, it's CC0, `fetch-art.mjs` already has a 20-slot term rotation. Rejected as the *module* system because **"zero manual work" is false**. The script takes the first portrait JPEG ≥10 KB out of a 40-candidate window from a Met keyword search (`fetch-art.mjs:26, 214`). Nobody has judged whether the returned tapestry fragment reads well at 320×200 with white type on it. Today that's tolerable at 18% opacity behind a nav tree. As a *module cover*, seen every session, it is not. Also: 59 chapters × 148 KB ≈ 8.7 MB of committed binaries and a network dependency in the content pipeline.

> Keep the Met pipeline. Just fix its scope (all eight books) and its treatment (§3, R5). Do not promote it to module identity.

**(ii) Duotone/gradient-mapped variants of the founder's photos, one colourway per module.** Real appeal: 20 identities from 2 files, and the founder's photography becomes the substrate of the whole product. Rejected at 20. Past roughly six variants the viewer stops seeing twenty places and starts seeing *one photo with a filter wheel* — which is a worse kind of repetition than the original, because now the repetition is the mechanism itself. **Use it for the 4–5 onboarding flow templates instead** (§3, R2): five is under the threshold where the trick becomes visible, and the flow template is exactly the place where you want the user to feel "this variant of the site is mine."

**(iii) Seeded procedural marks.** Chosen. Zero bytes, zero network, zero curation, deterministic, cannot return an ugly or licensing-risky result, and — critically — it can be a **pure function of the module id**, so adding module 21 requires touching no manifest, no script, and no `public/` directory.

### 2c. Deterministic assignment

One new file, `src/lib/identity.ts`, pure, no dependencies, safe in RSC:

```ts
/** FNV-1a 32-bit. Stable across runtimes; same id => same seed forever. */
export function moduleSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Hue for module index i, on a golden-ratio additive recurrence folded into a
 * 140-degree cool arc (184 teal -> 324 violet). Consecutive modules land far
 * apart; the full set fills the band evenly; the k-th module is always the
 * same hue.
 */
export function moduleHue(i: number): number {
  const frac = (x: number) => x - Math.floor(x);
  return 184 + 140 * frac(i * 0.6180339887);
}
```

First eight values: **184.0, 270.5, 217.0, 303.6, 250.1, 196.6, 283.1, 229.6**. Consecutive modules are 40–90° apart — unambiguous local contrast — while every value stays cool, so twenty modules still read as one product.

**Honest limitation, stated up front:** twenty points in a 140° band means a minimum adjacent gap of roughly **4°**, which is below the just-noticeable difference for large flat fills. **Hue alone cannot carry twenty identities.** It doesn't need to. You never see twenty modules side by side choosing on colour. You see (a) a module grid, where position and title do the identifying and colour only needs to be non-repeating *locally*, and (b) the module you are inside, where colour needs to be stable and different from the last room you were in. Recognition is carried by the mark's **geometry**; hue carries **family and adjacency**.

### 2d. What "a new module gets art with zero manual work" concretely means

```tsx
// src/app/modules/[slug]/page.tsx  (illustrative)
const i = moduleIndex(slug);                       // from the module registry
<main style={{ "--module-h": moduleHue(i) } as CSSProperties}>
  <ContourMark id={slug} />
  …
</main>
```

Adding module 21: append it to the registry. No image fetched, no file committed, no designer, no build step. The mark and the colour already exist as functions of the id.

---

## 3. Treatment recipes

### Recipes that survive the minimalism bar

**R1 — Extreme crop + role change (the fix for the duplicate photo).**
Zero new bytes. The hero keeps the full frame and the existing ken-burns (`globals.css:126–136`, 26s, scale 1 → 1.09). The closing section stops being a second full-bleed hero and becomes a **22vh horizontal band of ridge line only**, no text over it, no parallax, no zoom:

```css
.ridge-band {
  height: 22vh; min-height: 160px;
  overflow: hidden;
}
.ridge-band img {
  object-fit: cover;
  object-position: 50% 12%;   /* ridge + sky, no foreground */
  transform: none;            /* explicitly not ken-burns */
}
```

The eye reads texture, not "the mountain again." The CTA type moves onto flat `bg-night` above it, where it will read better than it currently does over a `rgba(0,0,0,0.72)` scrim (`Home.tsx:378`).

**R2 — Duotone via `feColorMatrix` + `feComponentTransfer` (flow templates only).**
Exact, implementable markup — desaturate first, then two-point map each channel:

```html
<svg width="0" height="0" aria-hidden style="position:absolute">
  <filter id="duo-flow">
    <feColorMatrix type="matrix" result="gray"
      values="1 0 0 0 0
              1 0 0 0 0
              1 0 0 0 0
              0 0 0 1 0"/>
    <feComponentTransfer color-interpolation-filters="sRGB">
      <feFuncR type="table" tableValues="0.04 0.83"/>  <!-- shadow R, highlight R -->
      <feFuncG type="table" tableValues="0.06 0.88"/>
      <feFuncB type="table" tableValues="0.18 0.97"/>
      <feFuncA type="table" tableValues="0 1"/>
    </feComponentTransfer>
  </filter>
</svg>
```

Applied with `filter: url(#duo-flow)` on the `next/image`. Two non-obvious gotchas:

- `color-interpolation-filters="sRGB"` is **mandatory**. Without it Chrome performs the transfer in linearRGB and the result comes back washed and milky.
- Do **not** add `will-change: filter`. It promotes the element to a raster layer at full composited size; on a 116vh hero (`Home.tsx:136`) that is a large, pointless texture upload every frame of the ken-burns.

The two `tableValues` pairs per channel are the shadow and highlight colours, normalised 0–1 — derive them from `--module-h` at build time so a flow template's duotone matches its accent.

Scope: the 4–5 onboarding flow templates. Not 20 modules (§2b).

**R3 — Photo-as-texture (the highest-value, lowest-risk reuse of the founder's photos).**
The photograph at 4–6% over a flat dark surface. Completely unrecognisable as a mountain; it only removes the deadness of flat `#000`.

```css
.night-textured { position: relative; background: var(--color-night); }
.night-textured::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: url("/assets/snow-mountain.jpg") center/cover;
  opacity: 0.05;
  mix-blend-mode: overlay;
}
```

Because it is unrecognisable, it can appear on *every* dark section without ever reading as repetition. This is how the founder's photography stays present across the whole site while literally appearing twice.

**R4 — Grain.**
A single fixed overlay, `feTurbulence baseFrequency="0.8" numOctaves="4"` rasterised once to a 128×128 tile, or the SVG inline:

```css
.grain::after {
  content: ""; position: fixed; inset: 0; z-index: 9999; pointer-events: none;
  background-image: url("data:image/svg+xml,…feTurbulence…");
  background-size: 128px 128px;
  opacity: 0.035;
  mix-blend-mode: overlay;
}
@media (prefers-reduced-motion: reduce) { /* static anyway — nothing to gate */ }
```

Two payoffs. First, it kills the banding that `linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 45%, …)` at `Home.tsx:146` will show on wide-gamut displays. Second, it is the single cheapest "expensively made" signal available — under 3 KB, one composite layer, no JS.

**R5 — Gradient mask instead of the flat rail scrim.**
`Rail.tsx:105` currently drops `bg-canvas/70` — a flat 70% wash — over a 148 KB artwork. That is the worst of both: full byte cost, muddy result, and the top of the artwork (where the interesting part usually is) fights the book title. Replace the scrim with a mask on the image:

```tsx
<Image … className="object-cover
  [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.25)_45%,transparent_78%)]" />
<div className="absolute inset-0 bg-canvas/35" />
```

Effective opacity lands near 18% at the top and fades to nothing before the scroll region — the art becomes a wayfinding cue ("the room changed") rather than a competing surface.

**R6 — The seeded procedural mark.**
Plain SVG, generated as a string, ~1.2 KB inline. No canvas, no hydration, no `useEffect`, renders in RSC, prints, and needs no reduced-motion gate because it doesn't move. Reuses the `frac`/`rnd` idiom already in `fx.ts:27–31`:

```ts
const frac = (x: number) => x - Math.floor(x);

/** Nine seeded contour lines. Same module id => same topography forever. */
export function contourPaths(id: string, w = 320, h = 200, lines = 9) {
  const s = moduleSeed(id) % 100000;
  const r = (i: number, salt: number) =>
    frac(Math.sin((s + i) * 127.1 + salt * 311.7) * 43758.5453);

  return Array.from({ length: lines }, (_, i) => {
    const y = (h * (i + 0.5)) / lines;
    const amp = 6 + r(i, 1) * 26;
    const ph = r(i, 2) * Math.PI * 2;
    const pts = Array.from({ length: 13 }, (_, k) => {
      const x = (w * k) / 12;
      return `${x.toFixed(1)},${(y + Math.sin(k * 0.62 + ph) * amp).toFixed(1)}`;
    });
    return `M${pts.join(" L")}`;
  });
}
```

Render each path `stroke="currentColor" fill="none" strokeWidth="1"` with `opacity={0.14 + i * 0.055}`, inside a wrapper at `color: oklch(0.62 0.16 var(--module-h))`.

Why contours specifically: they **rhyme with the mountain** without being a mountain. The founder's imagery stays conceptually present in all twenty modules while literally appearing in one. That through-line is what makes twenty generated marks feel authored rather than random.

### Recipes that are decoration — reject

| Rejected | Why |
|---|---|
| **Dither / ordered-Bayer halftone** | Photographs beautifully in a screenshot. Costs a canvas pass or a heavy SVG filter, and it reads as *a style* by the third exposure — it re-creates the exact staleness problem being solved. |
| **Per-module WebGL ambient blur** | `AmbientBackdrop.tsx` already ships `@paper-design/shaders-react` on every reader page. A second shader per module doubles a cost that is already questionable *behind prose*. Cheaper and better: make the existing `MESH_COLORS`/`ORBIT_COLORS` (lines 16–17) functions of `--module-h`. |
| **Ken Burns on more than one image** | Currently on exactly one element (`Home.tsx:143`). A second animated photograph turns the page into a screensaver. |
| **Parallax on module covers** | `data-parallax` (`fx.ts:196–214`, ±10 yPercent) is right for a 92vh interstitial. On a 240px card it produces sub-pixel jitter and a scroll-linked layout read for no perceptual gain. |
| **Per-module bespoke illustration** | This is what Stripe Press does, and it works — because a human designs every cover. That is precisely the budget this team does not have. Bespoke-per-item does not scale to 20 + N. |

---

## 4. When imagery is allowed to appear at all

**The three-photograph rule.**

| Surface | Imagery policy |
|---|---|
| **Marketing (`/`)** | Photographs allowed. **Max two distinct appearances; never the same file twice.** Full-bleed only, always with type over them. *A photograph carrying no text is decoration.* |
| **Onboarding / flow-template result** | Duotone treatment of a founder photo, one colourway per template (4–5 total). This is the one place a "this variant is mine" signal is worth an image. |
| **Module cover / module home** | **Procedural mark only. Never a photograph.** This screen is seen every session; a photograph here recreates the boring-hero problem in miniature within a week. |
| **Chapter rail (`Rail.tsx`)** | Met CC0 artwork, gradient-masked to ≤18% effective opacity, never as a subject. It is a wayfinding cue, not content. |
| **Reading surface (the slide)** | **Zero imagery**, except diagrams that *are* the content. Nothing ambient. Note that `AmbientBackdrop` currently animates a WebGL mesh gradient **behind prose** — that is imagery in the reading surface. Demote it to a static two-stop gradient in the module hue. |
| **Assessment surfaces (the "LeetCode" half)** | **Zero imagery, unconditionally.** A quiz with ambient art is a quiz you don't trust. Nothing on this screen should move while someone is thinking. |

**What replaces imagery in reading surfaces:** surface lift, hairline weight, and type scale — nothing else.

- A four-step surface ladder. The tokens exist: `--color-canvas` / `-2` / `-3` (`globals.css:7–9`, dark at 36–39) is three; add a fourth.
- 1px hairlines at 8–10% alpha — already `--color-hairline` (`globals.css:12, 42`).
- The accent on **≤2% of pixels**: focus rings, the active slide row, the progress ring, the list bullet. Nothing else.
- Generous measure and the existing 17px/1.6 prose scale (`globals.css:161–167`).

If a reading screen looks empty, the fix is spacing and type. Never an image. That is the whole minimalism bar, expressed as a rule someone can enforce in review.

---

## 5. Colour + motion: twenty identities from one variable

### 5a. The problem with today's tokens

`--color-blue: #0071e3` (`globals.css:13`) is consumed raw and literally everywhere: `bg-blue`, `text-blue`, `border-blue`, `bg-blue/10`, and `var(--color-blue)` hardcoded inside `Rail.tsx:284` and `:289`, plus `rgba(0,113,227,0.2)` written out longhand in `::selection` (`globals.css:67`) and `rgba(41,151,255, …)` in the canvas scene (`fx.ts:285, 298–299, 306`). Twenty modules cannot be themed by editing twenty rules; they have to fall out of one variable.

### 5b. The proposal

```css
@theme {
  --module-h: 254;      /* oklch hue of today's #0071e3 -- default = no change */
  --module-c: 0.19;
}

:root {
  --color-accent:       oklch(0.56 var(--module-c) var(--module-h));
  --color-accent-hover: oklch(0.50 var(--module-c) var(--module-h));
  --color-accent-quiet: oklch(0.56 var(--module-c) var(--module-h) / 0.12);
  --color-accent-line:  oklch(0.56 var(--module-c) var(--module-h) / 0.28);
}

[data-theme="dark"] {
  --color-accent:       oklch(0.72 0.16 var(--module-h));
  --color-accent-hover: oklch(0.78 0.16 var(--module-h));
}
```

Set once per module, on the module's root element:

```tsx
<main style={{ "--module-h": moduleHue(i) } as CSSProperties}>
```

Everything downstream moves for free: buttons, the `ReadMark` check (`Rail.tsx:225`), the `ChapterMeter` ring stroke (`Rail.tsx:289`), the prose bullet `::before` (`globals.css:225`), `::selection`, the active-slide row. **Zero per-module CSS.** Migration is a mechanical rename of `blue` → `accent` plus deleting the two longhand rgba literals.

### 5c. Why OKLCH and not HSL

At constant HSL lightness, hue 254 and hue 60 differ by roughly 40% in *perceived* lightness — the identical button passes contrast in blue and fails in yellow. OKLCH holds perceptual L fixed, so one contrast check covers all twenty hues. This is precisely Stripe's published finding: they built a custom Lab-space tool specifically to get "uniform contrast values across all the hues" rather than uniform *numbers*. Tailwind v4 already emits `oklch()`, and `oklch()` accepts a custom property in the hue slot in all current engines.

Practical scale rule, borrowed from the same Stripe post: **five steps apart passes small-text contrast; four steps apart is enough for icons.** That gives a ready-made review heuristic instead of eyeballing.

### 5d. Constrain the arc, or it stops being one product

`moduleHue` (§2c) confines every module to **184°–324°**: teal → indigo → violet. Never warm. That single constraint is what makes twenty colours read as one family rather than a crayon box. `#0071e3` at hue ~254 sits in the middle of the band, so the brand colour is not an exception to the system — it is the centre of it.

**Fix the fracture first:** `AmbientBackdrop.tsx:17`'s dark palette (`#ffc96b`, `#ff6200`, `#ff2f00`) is a warm orange behind a blue accent. Derive both `MESH_COLORS` and `ORBIT_COLORS` from `--module-h` — five stops at fixed L/C, hue offsets `[-18, -6, 0, +9, +20]` — and the ambient layer starts reinforcing module identity instead of contradicting the brand.

### 5e. Motion

One ladder for the whole product. Per-module motion differs **only in seed**, never in style.

| Tier | Duration | Use | Already in the code |
|---|---|---|---|
| State | 180 ms | hover, focus, toggle | `duration-200` (`Rail.tsx:154`) |
| Surface | 500 ms | entrance, expand, ring fill | `duration-500` (`Rail.tsx:291`) |
| Cinematic | 1100 ms | hero reveal, scramble | `1.1` (`fx.ts:112`), `scrambleEl(…, 1100)` |

- One entrance easing: GSAP `power3.out` (used 4× in `fx.ts`) = `cubic-bezier(0.215, 0.61, 0.355, 1)` on the CSS side.
- **The only per-module motion difference:** entrance stagger origin, `delay = (moduleSeed(id) % 5) * 0.04` → 0–160 ms. Individually sub-perceptual; collectively it stops twenty module pages from having an identical rhythm.
- Reduced motion is already gated once at `fx.ts:84–86` and once at `globals.css:150`. The contour mark needs no gate because static SVG doesn't move — which is a further argument for SVG over canvas.

### 5f. Also fix the bytes

Re-export both photographs at 2560px, mozjpeg q76 plus an AVIF sibling. `snow-mountain.jpg` 6.82 MB → **~380 KB AVIF / ~620 KB JPEG**; `cloud-sea.jpg` 7.88 MB → **~420 KB / ~700 KB**. A ~95% cut on the LCP element, and a smaller decode makes the 26s ken-burns visibly smoother on mid-range hardware. This is free and independent of every other recommendation here.

---

## 6. Research — how restrained sites carry per-section identity at scale

**Linear** — the strongest direct precedent, because it proves per-section identity at scale does **not** require per-section imagery. One chromatic accent, lavender `#5e6ad2`, and nothing else; gradients explicitly forbidden; the accent restricted to the brand mark, focus rings, and roughly one CTA per section. Hierarchy is carried instead by a **four-step charcoal surface ladder** — `#0f1011`, `#141516`, `#18191a`, `#191a1b` — plus ultra-thin semi-transparent white borders. The reported failure mode is instructive: copying the hue and applying it at normal SaaS density yields something with Linear's palette and none of its character. **Density of the accent is the design, not the accent.** Directly supports §4's "≤2% of pixels" rule and §5's four-step ladder.
Sources: [Linear design system read as constraints](https://identityforge.io/learn/linear-design-system) · [Design System Analysis: Linear](https://getdesign.md/linear.app/design-md)

**Stripe** — how one system stays coherent across many hues. They work in **CIELAB**, not RGB or HSL, and tune each hue against perceptual contrast rather than numeric value, targeting **4.5:1 for small text and 3.0:1 for large**, with the working rules "at least five levels apart" for small text and "four levels apart" for icons. The explicit goal is uniform contrast across every hue so no single colour dominates. This is the empirical case for §5's OKLCH-with-one-hue-variable — the same idea, in a colour space CSS now speaks natively.
Source: [Designing accessible color systems](https://stripe.com/blog/accessible-color-systems)

**GitHub Identicons** — the canonical proof that a deterministic hash can supply unlimited visual identity at zero marginal cost and zero human curation. A 5×5 grid, horizontally mirrored so the pattern carries only **15 bits**, cells filled by the parity of successive hash nibbles walking outward from the centre column, colour drawn from further hash bytes. Same input, same mark, forever. §2c/§3-R6 is the same architecture with a higher aesthetic ceiling — contour lines instead of blocks, and the hue drawn from a constrained arc rather than raw bytes so it can't leave the brand.
Sources: [Identicons! — The GitHub Blog](https://github.blog/news-insights/company-news/identicons/) · [Reverse-engineering GitHub's avatar generation](https://github.com/kashav/identicon) · [Avatars, identicons, and hash visualization](https://barro.github.io/2018/02/avatars-identicons-and-hash-visualization/)

**Stripe Press — cited as the counter-example.** Per-title bespoke covers, "living cover" pages, custom zine layouts, author-specific imagery, all sitting on a rigidly consistent catalogue chassis (uniform typography, uniform metadata, uniform purchase block). It is beautiful and it is the right answer *when a human designs every item*. That is exactly the budget this team does not have, which is why bespoke-per-module is rejected in §3.
Source: [Stripe Press](https://press.stripe.com/)

**Supporting technique references.**
Duotone: the desaturating `feColorMatrix` (three identical `1 0 0 0 0` rows plus `0 0 0 1 0` for alpha) followed by `feComponentTransfer` with two-entry `tableValues` per channel — and `color-interpolation-filters="sRGB"` is required for correct output. `mix-blend-mode: luminosity` over a gradient is the cheaper approximation; `feColorMatrix` is the accurate one.
Sources: [Using SVG to Create a Duotone Image Effect — CSS-Tricks](https://css-tricks.com/using-svg-to-create-a-duotone-image-effect/) · [Duotone using CSS blend modes — José M. Pérez](https://jmperezperez.com/blog/duotone-using-css-blend-modes/)
OKLCH scale construction: vary L while holding C and H, reduce chroma at both extremes and peak it at the mid step; this removes the hue and lightness drift HSL introduces.
Sources: [OKLCH Color Space guide](https://colorarchive.org/guides/oklch-color-space-guide/) · [Color experiments with OKLCH — Chris Henrick](https://clhenrick.io/blog/color-experiments-with-oklch/)

---

## 7. Implementation order (cheapest decisive win first)

1. **Delete the duplicate.** `Home.tsx:363–393` stops using `snow-mountain.jpg`; becomes flat `bg-night` + R1 ridge band. One file, ~20 lines. Removes the actual defect.
2. **Re-export both photos** (§5f). 15 MB → ~800 KB. No code change.
3. **Grain overlay** (R4) + **photo-as-texture** (R3) on every dark section. ~3 KB, biggest perceived-quality jump per line of CSS.
4. **Rail gradient mask** (R5) — replaces `Rail.tsx:105`.
5. **`src/lib/identity.ts`** — `moduleSeed`, `moduleHue`, `contourPaths`. Pure, testable by inspection, no dependencies.
6. **`--module-h` token migration** — `blue` → `accent`, delete the two longhand rgba literals, re-derive `AmbientBackdrop`'s two palettes.
7. **Extend `fetch-art.mjs`** past the single hardcoded `BOOK_DIR` (line 19); key the manifest `${bookSlug}/${chapterSlug}`.
8. **Duotone flow templates** (R2) — last, because it depends on onboarding shipping first.

Steps 1–4 are a single afternoon and resolve the founder's stated complaint on their own. Steps 5–6 are what makes the next 40 modules free.
