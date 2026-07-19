"use client";

import { Component, useSyncExternalStore, type ReactNode } from "react";
import { DotOrbit, MeshGradient } from "@paper-design/shaders-react";
import { useReducedMotion } from "framer-motion";

/**
 * The reader's ambient layer: one WebGL canvas behind the glass surfaces.
 * MeshGradient in light mode, DotOrbit in dark (owner-picked palettes from
 * shaders.paper.design). Decoration only — reduced motion freezes it, and a
 * WebGL failure falls back to CSS gradients (P-READER-003).
 *
 * Prop objects live at module scope so their identity is stable across
 * renders (upstream paper-shaders issue #275 re-uploads uniforms otherwise).
 */
const MESH_COLORS = ["#e0eaff", "#241d9a", "#f75092", "#9f50d3"];
const ORBIT_COLORS = ["#ffc96b", "#ff6200", "#ff2f00", "#421100", "#1a0000"];

type Theme = "light" | "dark";

function subscribeTheme(cb: () => void): () => void {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getThemeSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function getServerTheme(): Theme | null {
  return null;
}

function useTheme(): Theme | null {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerTheme);
}

/** Latches on the first shader error; no remount loops. */
class ShaderBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function CssFallback({ theme }: { theme: Theme }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={
        theme === "dark"
          ? {
              background:
                "radial-gradient(120% 90% at 80% 110%, #421100 0%, #1a0000 45%, #000000 100%)",
            }
          : {
              background:
                "radial-gradient(110% 100% at 15% 0%, #e0eaff 0%, #ece5fa 40%, #fbe9f2 75%, #ffffff 100%)",
            }
      }
    />
  );
}

export function AmbientBackdrop() {
  const theme = useTheme();
  const reduced = useReducedMotion() ?? false;

  // Server HTML and the first client render agree on "nothing"; the canvas
  // appears only after the real theme is known.
  if (!theme) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <ShaderBoundary fallback={<CssFallback theme={theme} />}>
        {theme === "dark" ? (
          <DotOrbit
            colors={ORBIT_COLORS}
            colorBack="#000000"
            stepsPerColor={4}
            size={1}
            sizeRange={0}
            spreading={1}
            scale={1}
            speed={reduced ? 0 : 1}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <MeshGradient
            colors={MESH_COLORS}
            distortion={0.8}
            swirl={0.1}
            grainMixer={0}
            grainOverlay={0}
            scale={1}
            speed={reduced ? 0 : 0.6}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </ShaderBoundary>
    </div>
  );
}
