"use client";

// アプリ全体のキャラクター（2026-11-27、全体ロボ化の叩き台）。
// 場面サムネ・ストーリーで主人公を務めるロボット（コンピュータ）を、アプリの話者に統一する。
// 形はサムネの TroubledRobot と同じ「顔（頭）だけ」。体を描き足すと別キャラになって
// 怖さが出るため、頭＋アンテナの構成をそのまま使う（2026-11-27 Kanato 判断）。
// 絵の語彙もサムネと同じ：頭 #2563eb／顔パネル #dbeafe／目 #1e3a8a。
// MascotFigure と同じ props を受ける差し替え用コンポーネント（mascotId は受け取るが使わない）。

import { Box, keyframes, type SxProps, type Theme } from "@mui/material";
import type { MascotState } from "./mascot";

export type RobotFigureSize = "S" | "M" | "L" | "XL";

const sizeSx: Record<RobotFigureSize, SxProps<Theme>> = {
  S: { width: { xs: 38, md: 48 }, height: { xs: 38, md: 48 } },
  M: { width: { xs: 72, sm: 80 }, height: { xs: 72, sm: 80 } },
  L: { width: { xs: 150, md: 160 }, height: { xs: 150, md: 160 } },
  XL: { width: { xs: 220, md: 240 }, height: { xs: 220, md: 240 } },
};

const robotBounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;
const robotFloat = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.03); }
`;

type RobotExpression = "normal" | "smile" | "celebrate" | "thinking" | "surprise" | "troubled";

const expressionFor = (state: MascotState): RobotExpression => {
  switch (state) {
    case "happy":
    case "cheer":
    case "point":
      return "smile";
    case "celebrate":
      return "celebrate";
    case "thinking":
      return "thinking";
    case "surprise":
      return "surprise";
    default:
      return "normal";
  }
};

function RobotHead({ expression }: { expression: RobotExpression }) {
  const happyEyes = expression === "smile" || expression === "celebrate";
  return (
    <g>
      {/* アンテナ */}
      <line x1="60" y1="16" x2="60" y2="7" stroke="#1e40af" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="5" r="4.5" fill="#2563eb" />
      {/* 耳（サイドポッド） */}
      <rect x="17" y="32" width="9" height="22" rx="4.5" fill="#1e40af" />
      <rect x="94" y="32" width="9" height="22" rx="4.5" fill="#1e40af" />
      {/* 頭 */}
      <rect x="26" y="16" width="68" height="52" rx="14" fill="#2563eb" />
      <rect x="35" y="25" width="50" height="34" rx="9" fill="#dbeafe" />
      {/* 目 */}
      {happyEyes ? (
        <g stroke="#1e3a8a" strokeWidth="2.6" fill="none" strokeLinecap="round">
          <path d="M47 40 Q52 34 57 40" />
          <path d="M63 40 Q68 34 73 40" />
        </g>
      ) : expression === "surprise" ? (
        <g fill="#1e3a8a">
          <circle cx="52" cy="38" r="4.6" />
          <circle cx="68" cy="38" r="4.6" />
        </g>
      ) : expression === "thinking" ? (
        <g fill="#1e3a8a">
          <circle cx="50" cy="37" r="3.6" />
          <circle cx="66" cy="37" r="3.6" />
        </g>
      ) : (
        <g fill="#1e3a8a">
          <circle cx="52" cy="39" r="3.6" />
          <circle cx="68" cy="39" r="3.6" />
        </g>
      )}
      {/* 口 */}
      {expression === "celebrate" ? (
        <path d="M53 47 A7 7 0 0 0 67 47 Z" fill="#1e3a8a" />
      ) : expression === "smile" ? (
        <path d="M53 48 Q60 56 67 48" stroke="#1e3a8a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      ) : expression === "thinking" ? (
        <line x1="56" y1="51" x2="64" y2="51" stroke="#1e3a8a" strokeWidth="2.4" strokeLinecap="round" />
      ) : expression === "surprise" ? (
        <circle cx="60" cy="51" r="2.8" fill="#1e3a8a" />
      ) : expression === "troubled" ? (
        <path d="M55 53 Q60 48 65 53" stroke="#1e3a8a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M55 49 Q60 53 65 49" stroke="#1e3a8a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
      {/* 困り顔の汗（場面サムネの TroubledRobot と同じ） */}
      {expression === "troubled" && (
        <path d="M102 26 C102 26 96 36 96 40.5 A6 6 0 0 0 108 40.5 C108 36 102 26 102 26 Z" fill="#7dd3fc" />
      )}
      {/* 喜びのきらめき */}
      {expression === "celebrate" && (
        <g fill="#f59e0b">
          <path d="M12 22 L13.8 27.2 L19 29 L13.8 30.8 L12 36 L10.2 30.8 L5 29 L10.2 27.2 Z" />
          <path d="M108 12 L109.5 16.5 L114 18 L109.5 19.5 L108 24 L106.5 19.5 L102 18 L106.5 16.5 Z" />
        </g>
      )}
    </g>
  );
}

function RobotSvg({ expression, grounding }: { expression: RobotExpression; grounding: "disc" | "shadow" | "frame" }) {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="100%" role="img" aria-hidden style={{ display: "block" }}>
      {grounding === "disc" && <circle cx="60" cy="40" r="39" fill="#eaf2ff" />}
      {grounding === "shadow" && <ellipse cx="60" cy="74" rx="30" ry="5" fill="#0f172a" opacity="0.14" />}
      <RobotHead expression={expression} />
    </svg>
  );
}

type RobotFigureProps = {
  /** 互換用（マスコット廃止に伴い未使用）。 */
  mascotId?: string | null;
  alt: string;
  state?: MascotState;
  size?: RobotFigureSize;
  grounding?: "disc" | "shadow" | "frame";
  presentation?: "full" | "circle";
  motion?: "none" | "bounce" | "float";
  sx?: SxProps<Theme>;
};

export const RobotFigure = ({ alt, state = "normal", size = "M", grounding = "disc", presentation = "full", motion = "none", sx }: RobotFigureProps) => {
  const expression = expressionFor(state);
  const animation = motion === "bounce" ? `${robotBounce} 1200ms ease-in-out infinite` : motion === "float" ? `${robotFloat} 1300ms ease-in-out infinite` : undefined;
  // sx の width/height（数値）はサイズプリセットのレスポンシブ値を丸ごと置き換える。
  // sx 配列で後付けすると、プリセット側のメディアクエリ規則が勝ってしまうため、
  // 単一オブジェクトの sx はベースにマージして上書きする。
  const flatSx = sx && !Array.isArray(sx) && typeof sx !== "function" ? (sx as Record<string, unknown>) : null;
  const extraSx = Array.isArray(sx) ? sx : [];

  if (presentation === "circle") {
    return (
      <Box
        role="img"
        aria-label={alt}
        data-robot-figure="true"
        sx={[
          {
            ...sizeSx[size],
            flexShrink: 0,
            borderRadius: "50%",
            bgcolor: "#eaf2ff",
            border: "1px solid #bfdbfe",
            overflow: "hidden",
            display: "grid",
            placeItems: "center",
            ...flatSx,
          },
          ...extraSx,
        ]}
      >
        <Box sx={{ width: "92%", height: "92%", animation }}>
          <svg viewBox="10 0 100 72" width="100%" height="100%" aria-hidden style={{ display: "block" }}>
            <RobotHead expression={expression} />
          </svg>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      role="img"
      aria-label={alt}
      data-robot-figure="true"
      sx={[{ ...sizeSx[size], flexShrink: 0, animation, ...flatSx }, ...extraSx]}
    >
      <RobotSvg expression={expression} grounding={grounding} />
    </Box>
  );
};
