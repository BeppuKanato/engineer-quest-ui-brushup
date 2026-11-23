"use client";
/**
 * 単元ミッションのストーリー（2026-11-23 決定）。
 * 学習教材と同じ再生形式（大きな図＋1ステップ1文のキャプション）で、
 * 「場面 → 困りごと → 人間ならどうするか → 手順が要るので学ぶ（最後に挑戦）」を
 * 4ステップ程度で見せる。学習進捗には含めない。
 * 文案は下書き。ここではバブルソートだけ全ステップを用意し、他単元は
 * 1フレーム（場面＋ミッション文）で代替する。
 */
import type { ReactNode } from "react";
import { findUnitMission } from "@/features/learning/app/missionRegistry";
import { missionThumbnailFor } from "./MissionThumbnail";

export type MissionStoryStep = { caption: string; figure: ReactNode };
export type MissionStory = { steps: readonly MissionStoryStep[] };

const BOOK_COLORS = ["#7d8ca3", "#a98a6d", "#82a37d", "#9382a3", "#a37d7d", "#7d8ca3", "#a98a6d", "#82a37d", "#9382a3"];
const BOOK_HEIGHTS = [64, 92, 52, 80, 60, 96, 68, 88, 56];

/** ステップ3の図：隣同士を見比べて入れ替える（人間のやり方）。 */
function SwapFigure() {
  return (
    <svg viewBox="0 0 460 210" width="100%" height="100%" role="img" aria-label="隣同士の本を見比べて入れ替える図" style={{ display: "block" }}>
      <rect width="460" height="210" fill="#eef3f9" />
      {/* 棚 */}
      <rect x="60" y="150" width="340" height="10" rx="3" fill="#8a6a52" />
      <rect x="76" y="160" width="10" height="34" fill="#8a6a52" />
      <rect x="374" y="160" width="10" height="34" fill="#8a6a52" />
      {/* 対象の2冊（大きく） */}
      <g>
        <rect x="150" y="62" width="52" height="88" rx="5" fill="#7d8ca3" />
        <text x="176" y="118" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff">7</text>
        <rect x="258" y="88" width="52" height="62" rx="5" fill="#a98a6d" />
        <text x="284" y="130" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff">3</text>
        <rect x="144" y="56" width="64" height="100" rx="8" fill="none" stroke="#2563eb" strokeWidth="3" />
        <rect x="252" y="82" width="64" height="74" rx="8" fill="none" stroke="#2563eb" strokeWidth="3" />
      </g>
      {/* 入れ替えの矢印 */}
      <path d="M 196 44 Q 230 22 264 44" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
      <path d="M 264 44 l -12 -2 M 264 44 l -3 12" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 264 168 Q 230 188 196 168" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
      <path d="M 196 168 l 12 2 M 196 168 l 3 -12" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** ステップ4の図：並べ替えた後の棚（達成のイメージ）。方法ではなくゴールの絵。 */
function SortedFigure() {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <svg viewBox="0 0 460 210" width="100%" height="100%" role="img" aria-label="番号順に並んだ本棚の図" style={{ display: "block" }}>
      <rect width="460" height="210" fill="#eef3f9" />
      <rect x="40" y="150" width="380" height="10" rx="3" fill="#8a6a52" />
      <rect x="56" y="160" width="10" height="34" fill="#8a6a52" />
      <rect x="394" y="160" width="10" height="34" fill="#8a6a52" />
      {values.map((value, index) => {
        const height = 44 + index * 7;
        return (
          <g key={value}>
            <rect x={58 + index * 39} y={150 - height} width="32" height={height} rx="4" fill={BOOK_COLORS[index]} />
            <text x={74 + index * 39} y={150 - height / 2 + 7} textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff">{value}</text>
          </g>
        );
      })}
      {/* ゴールの旗 */}
      <line x1="424" y1="150" x2="424" y2="86" stroke="#111827" strokeWidth="3" />
      <path d="M 424 86 L 448 94 L 424 102 Z" fill="#dc2626" />
    </svg>
  );
}

const bubbleSortStory: MissionStory = {
  steps: [
    {
      caption: "本棚の本が、番号のバラバラな順番で並んでいます。",
      figure: null, // 場面の絵（サムネと同じ場面）を下で差し込む
    },
    {
      caption: "このままでは、目当ての本がどこにあるか分からず、端から1冊ずつ探すしかありません。",
      figure: null,
    },
    {
      caption: "人間なら、隣同士の番号を見比べて、順番が逆なら入れ替えながら並べ替えることができます。",
      figure: <SwapFigure />,
    },
    {
      caption: "でも、コンピュータにやらせるには、その手順を正確に決める必要があります。この単元で手順を学び、最後は自分のコードで並べ替えに挑戦します。",
      figure: <SortedFigure />,
    },
  ],
};

export function missionStoryFor(courseId: string): MissionStory | null {
  const scene = missionThumbnailFor(courseId);
  if (courseId === "course-algorithm-bubble-sort-v2") {
    return {
      steps: bubbleSortStory.steps.map(step => step.figure ? step : { ...step, figure: scene }),
    };
  }
  // 他単元は当面1フレーム（場面＋ミッション文）で代替する。
  const mission = findUnitMission(courseId);
  if (!mission || !scene) return null;
  return { steps: [{ caption: mission.description, figure: scene }] };
}
