"use client";

// マスコットの SVG 試作（デザイン確認用。本体の部品ではない）。
// 方針（2026-11-20 決定）：マスコットは1体（レッサーパンダ）にし、パーツ分けした SVG で描く。
// 表情はパーツの組み合わせのプリセットとして、今の7種の名前を引き継ぐ。
// 色と特徴は現在の PNG（ゴーグル・青いマフラー・白い服・縞のしっぽ）から取り、画風は平たく作り直す。

import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

export type MascotExpression =
  | "normal"
  | "happy"
  | "cheer"
  | "thinking"
  | "surprise"
  | "celebrate"
  | "face";

export const mascotExpressionLabels: Record<MascotExpression, string> = {
  normal: "通常",
  happy: "嬉しい",
  cheer: "応援",
  thinking: "考え中",
  surprise: "驚き",
  celebrate: "お祝い",
  face: "顔だけ",
};

const palette = {
  fur: "#E8701F",
  furDark: "#C85A14",
  patch: "#8A4A21",
  cream: "#FFF4E6",
  muzzle: "#FFFDF7",
  nose: "#2A2320",
  eye: "#3D2413",
  mouth: "#5A3A22",
  mouthIn: "#7C3327",
  tongue: "#F08A7A",
  rim: "#C7CDD4",
  rimDark: "#8E959E",
  strap: "#2E2E34",
  lens: "#2EA9F2",
  lensDeep: "#1778CE",
  scarf: "#2456D6",
  scarfDark: "#1B41A8",
  hoodie: "#FFFFFF",
  hoodieShade: "#E9ECF2",
  gear: "#7A5230",
  buckle: "#9AA1AB",
  body: "#6E4525",
  bodyDark: "#5D3A20",
};

type EyeKind = "open" | "happy" | "surprise";
type MouthKind = "smile" | "open" | "o" | "flat";
type ArmPose = "down" | "up" | "think";

const presets: Record<
  MascotExpression,
  { eyes: EyeKind; mouth: MouthKind; arms: ArmPose; gaze: number; tilt: number }
> = {
  normal: { eyes: "open", mouth: "smile", arms: "down", gaze: 0, tilt: 0 },
  happy: { eyes: "happy", mouth: "open", arms: "down", gaze: 0, tilt: 0 },
  cheer: { eyes: "open", mouth: "open", arms: "up", gaze: 0, tilt: 0 },
  thinking: { eyes: "open", mouth: "flat", arms: "think", gaze: 3, tilt: -4 },
  surprise: { eyes: "surprise", mouth: "o", arms: "down", gaze: 0, tilt: 0 },
  celebrate: { eyes: "happy", mouth: "open", arms: "up", gaze: 0, tilt: 0 },
  face: { eyes: "open", mouth: "open", arms: "down", gaze: 0, tilt: 0 },
};

function Eye({ cx, kind, gaze, blink }: { cx: number; kind: EyeKind; gaze: number; blink: boolean }) {
  if (kind === "happy") {
    return (
      <path
        d={`M ${cx - 9} 80 Q ${cx} 69 ${cx + 9} 80`}
        fill="none"
        stroke={palette.eye}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
    );
  }
  const r = kind === "surprise" ? 10.5 : 8.5;
  return (
    <motion.g
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
      animate={blink ? { scaleY: [1, 1, 0.08, 1, 1] } : { scaleY: 1 }}
      transition={
        blink
          ? { duration: 3.8, times: [0, 0.9, 0.94, 0.98, 1], repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.1 }
      }
    >
      <g transform={`translate(${gaze} 0)`}>
        <circle cx={cx} cy={78} r={r} fill={palette.eye} />
        <circle cx={cx - 2.5} cy={74.5} r={3} fill="#FFFFFF" />
        <circle cx={cx + 2.8} cy={81} r={1.4} fill="#FFFFFF" opacity={0.9} />
      </g>
    </motion.g>
  );
}

function Mouth({ kind }: { kind: MouthKind }) {
  if (kind === "open") {
    return (
      <g>
        <ellipse cx={120} cy={110} rx={8.5} ry={6.5} fill={palette.mouthIn} />
        <ellipse cx={120} cy={113.5} rx={5} ry={3} fill={palette.tongue} />
      </g>
    );
  }
  if (kind === "o") return <circle cx={120} cy={110} r={3.6} fill={palette.mouth} />;
  if (kind === "flat")
    return (
      <line x1={114} y1={110} x2={127} y2={110} stroke={palette.mouth} strokeWidth={2.5} strokeLinecap="round" />
    );
  return (
    <path
      d="M 110 106 Q 120 114 130 106"
      fill="none"
      stroke={palette.mouth}
      strokeWidth={2.5}
      strokeLinecap="round"
    />
  );
}

export function MascotSvg({
  expression,
  reaction,
  size = 220,
}: {
  expression: MascotExpression;
  /** 反応の強さ。nonce が変わるたびに再生する。1=頷く、2=小さく跳ねる、3=大きく跳ねる */
  reaction?: { level: 1 | 2 | 3; nonce: number } | null;
  size?: number;
}) {
  const preset = presets[expression];
  const faceOnly = expression === "face";
  const controls = useAnimationControls();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!reaction || reduced) return;
    if (reaction.level === 1) {
      void controls.start({ y: [0, 3, 0], rotate: [0, 1.5, 0], transition: { duration: 0.45, ease: "easeInOut" } });
    } else if (reaction.level === 2) {
      void controls.start({ y: [0, -13, 0], transition: { duration: 0.5, ease: "easeOut" } });
    } else {
      void controls.start({
        y: [0, 2, -27, 0],
        scaleY: [1, 0.93, 1.05, 1],
        transition: { duration: 0.7, times: [0, 0.2, 0.55, 1], ease: "easeOut" },
      });
    }
  }, [reaction, controls, reduced]);

  const armRotate = (side: "left" | "right"): number => {
    // SVG の回転は時計回りが正。左腕を外側に上げるには正、右腕は負。
    if (preset.arms === "up") return side === "left" ? 138 : -138;
    if (preset.arms === "think" && side === "right") return 125;
    return side === "left" ? -6 : 6;
  };

  return (
    <motion.svg
      viewBox={faceOnly ? "46 -6 148 140" : "0 0 240 240"}
      width={size}
      height={size}
      role="img"
      aria-label={`マスコット（${mascotExpressionLabels[expression]}）`}
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="mascot-lens" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0%" stopColor="#7ED0FF" />
          <stop offset="55%" stopColor={palette.lens} />
          <stop offset="100%" stopColor={palette.lensDeep} />
        </radialGradient>
        <clipPath id="mascot-tail-clip">
          <ellipse cx={42} cy={160} rx={19} ry={35} transform="rotate(22 42 160)" />
        </clipPath>
      </defs>

      <motion.g
        animate={controls}
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
      >
        <motion.g
          animate={reduced ? undefined : { y: [0, -2.5, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* しっぽ */}
          <motion.g
            style={{ transformBox: "fill-box", transformOrigin: "85% 30%" }}
            animate={reduced ? undefined : { rotate: [0, 4, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ellipse cx={42} cy={160} rx={19} ry={35} transform="rotate(22 42 160)" fill={palette.fur} />
            <g clipPath="url(#mascot-tail-clip)">
              <rect x={8} y={140} width={70} height={11} fill={palette.furDark} transform="rotate(22 42 160)" />
              <rect x={8} y={166} width={70} height={11} fill={palette.furDark} transform="rotate(22 42 160)" />
            </g>
          </motion.g>

          {/* 脚と足 */}
          <rect x={97} y={190} width={17} height={28} rx={7} fill={palette.body} />
          <rect x={126} y={190} width={17} height={28} rx={7} fill={palette.body} />
          <ellipse cx={103} cy={221} rx={15} ry={7} fill={palette.bodyDark} />
          <ellipse cx={137} cy={221} rx={15} ry={7} fill={palette.bodyDark} />

          {/* 体（白い服と道具のベルト） */}
          <rect x={80} y={122} width={80} height={76} rx={20} fill={palette.hoodie} />
          <rect x={94} y={124} width={10} height={56} fill={palette.gear} />
          <rect x={136} y={124} width={10} height={56} fill={palette.gear} />
          <rect x={92.5} y={144} width={13} height={11} rx={2} fill="none" stroke={palette.buckle} strokeWidth={2.5} />
          <rect x={134.5} y={144} width={13} height={11} rx={2} fill="none" stroke={palette.buckle} strokeWidth={2.5} />
          <rect x={101} y={168} width={38} height={19} rx={5} fill={palette.hoodieShade} />

          {/* マフラー */}
          <path d="M 64 116 Q 120 138 176 116 L 180 132 Q 120 156 60 132 Z" fill={palette.scarf} />
          <path d="M 172 118 Q 202 124 198 152 Q 186 140 168 138 Z" fill={palette.scarf} />
          <path d="M 68 118 Q 46 128 50 148 Q 60 138 72 134 Z" fill={palette.scarfDark} />

          {/* 頭 */}
          <motion.g
            style={{ transformBox: "fill-box", transformOrigin: "50% 92%" }}
            animate={{ rotate: preset.tilt }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
          >
            {/* 耳 */}
            <g>
              <path d="M 61 63 C 53 37 55 9 67 0 C 80 -5 95 15 94 42 C 84 31 72 39 61 63 Z" fill={palette.cream} />
              <path d="M 68 53 C 63 34 65 16 73 11 C 83 7 90 22 88 37 C 81 30 74 38 68 53 Z" fill="#B96A35" />
            </g>
            <g transform="translate(240 0) scale(-1 1)">
              <path d="M 61 63 C 53 37 55 9 67 0 C 80 -5 95 15 94 42 C 84 31 72 39 61 63 Z" fill={palette.cream} />
              <path d="M 68 53 C 63 34 65 16 73 11 C 83 7 90 22 88 37 C 81 30 74 38 68 53 Z" fill="#B96A35" />
            </g>

            {/* 顔の土台 */}
            <ellipse cx={120} cy={78} rx={64} ry={56} fill={palette.fur} />
            {/* 頬の白と、目の下の濃い模様 */}
            <ellipse cx={73} cy={94} rx={13.5} ry={10.5} transform="rotate(-18 73 94)" fill={palette.cream} />
            <ellipse cx={167} cy={94} rx={13.5} ry={10.5} transform="rotate(18 167 94)" fill={palette.cream} />
            <ellipse cx={92} cy={98} rx={5.5} ry={10} transform="rotate(18 92 98)" fill={palette.patch} opacity={0.85} />
            <ellipse cx={148} cy={98} rx={5.5} ry={10} transform="rotate(-18 148 98)" fill={palette.patch} opacity={0.85} />
            {/* 眉の白い模様 */}
            <ellipse cx={97} cy={52} rx={9.5} ry={5} transform="rotate(-12 97 52)" fill={palette.cream} />
            <ellipse cx={143} cy={52} rx={9.5} ry={5} transform="rotate(12 143 52)" fill={palette.cream} />
            {/* 口元 */}
            <ellipse cx={120} cy={103} rx={30} ry={20} fill={palette.muzzle} />

            <Eye cx={97} kind={preset.eyes} gaze={preset.gaze} blink={!reduced && preset.eyes === "open"} />
            <Eye cx={143} kind={preset.eyes} gaze={preset.gaze} blink={!reduced && preset.eyes === "open"} />

            {/* 鼻と口 */}
            <ellipse cx={120} cy={93} rx={7} ry={5.5} fill={palette.nose} />
            <ellipse cx={117.5} cy={91} rx={2.2} ry={1.4} fill="#FFFFFF" opacity={0.55} />
            <Mouth kind={preset.mouth} />

            {/* ゴーグル */}
            <path d="M 50 42 Q 120 12 190 42 L 190 53 Q 120 23 50 53 Z" fill={palette.strap} />
            <g>
              <circle cx={93} cy={30} r={17.5} fill={palette.rim} />
              <circle cx={93} cy={30} r={17.5} fill="none" stroke={palette.rimDark} strokeWidth={1.6} />
              <circle cx={93} cy={30} r={13} fill="url(#mascot-lens)" />
              <ellipse cx={88} cy={24} rx={5.5} ry={3.6} transform="rotate(-24 88 24)" fill="#FFFFFF" opacity={0.85} />
            </g>
            <g>
              <circle cx={147} cy={30} r={17.5} fill={palette.rim} />
              <circle cx={147} cy={30} r={17.5} fill="none" stroke={palette.rimDark} strokeWidth={1.6} />
              <circle cx={147} cy={30} r={13} fill="url(#mascot-lens)" />
              <ellipse cx={142} cy={24} rx={5.5} ry={3.6} transform="rotate(-24 142 24)" fill="#FFFFFF" opacity={0.85} />
            </g>
          </motion.g>

          {/* 腕（肩を軸にポーズが変わる。頭より上に描く：考え中の「あごに手」が頭に隠れないように） */}
          <motion.g
            style={{ transformBox: "fill-box", transformOrigin: "50% 8%" }}
            animate={{ rotate: armRotate("left") }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <rect x={63} y={130} width={15} height={42} rx={7.5} fill={palette.body} />
            <circle cx={70.5} cy={174} r={8.5} fill={palette.bodyDark} />
          </motion.g>
          <motion.g
            style={{ transformBox: "fill-box", transformOrigin: "50% 8%" }}
            animate={{ rotate: armRotate("right") }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <rect x={162} y={130} width={15} height={42} rx={7.5} fill={palette.body} />
            <circle cx={169.5} cy={174} r={8.5} fill={palette.bodyDark} />
          </motion.g>
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}
