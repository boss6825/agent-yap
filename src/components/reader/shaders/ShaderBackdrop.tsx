"use client";

import {
  Component,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { GrainGradient, LiquidMetal } from "@paper-design/shaders-react";
import {
  GRAIN_SHARED,
  shaderForChapterIndex,
  shaderLayerKey,
  type MetalVariant,
  type ShaderDefinition,
  type ShaderPolarity,
  type ShaderVariant,
} from "@/components/reader/shaders/registry";
import {
  useDocumentVisible,
  useShaderMotion,
} from "@/components/reader/shaders/motion-pref";

const FILL_STYLE: CSSProperties = { width: "100%", height: "100%" };
const CROSSFADE_MS = 480;

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

function CssFallback({
  polarity,
  canvasBackground,
}: {
  polarity: ShaderPolarity;
  canvasBackground?: string;
}) {
  const background =
    canvasBackground ??
    (polarity === "dark"
      ? "radial-gradient(120% 90% at 80% 0%, #2a00ff 0%, #06060e 55%, #000000 100%)"
      : "radial-gradient(110% 100% at 80% 0%, #eba8ff 0%, #f5f0ff 40%, #ffffff 100%)");
  return <div aria-hidden className="reader-shader__fallback" style={{ background }} />;
}

function GrainCanvas({ playing }: { playing: boolean }) {
  return (
    <GrainGradient
      colors={GRAIN_SHARED.colors}
      colorBack={GRAIN_SHARED.colorBack}
      scale={GRAIN_SHARED.scale}
      rotation={GRAIN_SHARED.rotation}
      offsetX={GRAIN_SHARED.offsetX}
      offsetY={GRAIN_SHARED.offsetY}
      softness={GRAIN_SHARED.softness}
      intensity={GRAIN_SHARED.intensity}
      noise={GRAIN_SHARED.noise}
      shape={GRAIN_SHARED.shape}
      speed={playing ? 1 : 0}
      style={FILL_STYLE}
    />
  );
}

function MetalCanvas({
  variant,
  playing,
}: {
  variant: MetalVariant;
  playing: boolean;
}) {
  return (
    <LiquidMetal
      softness={variant.softness}
      repetition={variant.repetition}
      shiftRed={variant.shiftRed}
      shiftBlue={variant.shiftBlue}
      distortion={variant.distortion}
      contour={variant.contour}
      fit="contain"
      scale={variant.scale}
      rotation={variant.rotation}
      shape={variant.shape}
      angle={variant.angle}
      colorBack={variant.colorBack}
      colorTint={variant.colorTint}
      speed={playing ? 1 : 0}
      style={FILL_STYLE}
    />
  );
}

function ShaderPicture({
  variant,
  polarity,
  playing,
}: {
  variant: ShaderVariant;
  polarity: ShaderPolarity;
  playing: boolean;
}) {
  if (variant.kind === "liquid-metal") {
    return (
      <div className="reader-shader__accent">
        <ShaderBoundary fallback={null}>
          <MetalCanvas variant={variant} playing={playing} />
        </ShaderBoundary>
      </div>
    );
  }

  return (
    <div
      className="reader-shader__full"
      style={{
        opacity: variant.opacity,
        backgroundColor: variant.canvasBackground,
      }}
    >
      <ShaderBoundary
        fallback={
          <CssFallback
            polarity={polarity}
            canvasBackground={variant.canvasBackground}
          />
        }
      >
        <GrainCanvas playing={playing} />
      </ShaderBoundary>
      {variant.scrim ? (
        <div
          className="reader-shader__scrim"
          style={{ backgroundImage: variant.scrim }}
        />
      ) : null}
    </div>
  );
}

function ShaderLayer({
  def,
  polarity,
  playing,
  leaving,
}: {
  def: ShaderDefinition;
  polarity: ShaderPolarity;
  playing: boolean;
  leaving?: boolean;
}) {
  const variant = def.variants[polarity];
  return (
    <div
      className={
        leaving
          ? "reader-shader__layer reader-shader__layer--leave"
          : "reader-shader__layer"
      }
      data-shader={def.id}
      data-polarity={polarity}
    >
      <ShaderPicture variant={variant} polarity={polarity} playing={playing} />
    </div>
  );
}

export function ShaderBackdrop({
  chapterIndex,
  polarity,
}: {
  chapterIndex: number;
  polarity: ShaderPolarity;
}) {
  const { animationsOn, hydrated } = useShaderMotion();
  const visible = useDocumentVisible();
  const def = shaderForChapterIndex(chapterIndex);
  const key = shaderLayerKey(def.id, polarity);
  const [layers, setLayers] = useState(() => [{ key, def, polarity }]);
  const lastKeyRef = useRef(key);

  useEffect(() => {
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    setLayers((prev) => {
      const last = prev[prev.length - 1];
      return last ? [last, { key, def, polarity }] : [{ key, def, polarity }];
    });
    const id = window.setTimeout(() => {
      setLayers([{ key, def, polarity }]);
    }, CROSSFADE_MS);
    return () => window.clearTimeout(id);
  }, [key, def, polarity]);

  if (!hydrated || !animationsOn) return null;

  const playing = visible;

  return (
    <div aria-hidden className="reader-shader">
      {layers.map((layer, i) => (
        <ShaderLayer
          key={layer.key}
          def={layer.def}
          polarity={layer.polarity}
          playing={playing && i === layers.length - 1}
          leaving={i < layers.length - 1}
        />
      ))}
    </div>
  );
}
