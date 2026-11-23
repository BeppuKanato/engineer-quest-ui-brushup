"use client";
/**
 * 単元ミッションのストーリー（2026-11-23 決定）。
 * 学習教材と同じ再生形式（大きな図＋1ステップ1文のキャプション）で見せる。
 * ビートは「場面 → 困りごと → 解決の方向 → 人間ならどうするか → コンピュータとの差
 * → 学ぶ＋最後に挑戦」。数は固定しない（ビートが単位ごとに増減する）。
 * 論理の注意（2026-11-23、Kanato の指摘）：困りごとと解法の対象を一致させること
 * （例：探す手間が困りごとで、並べ替えが解法なら、「並べば探すのが速くなる」を
 * 挟まないと並べ替える理由が成立しない）。コンピュータとの差は「できない」ではなく
 * 「曖昧な判断ができない・正確な手順が要る」で立てること。学習進捗には含めない。
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

/** ステップ2の図：頼まれるたびに端から探す（困りごとの反復）。 */
function SearchFigure() {
  const values = [7, 3, 9, 1, 8, 2, 5, 4, 6];
  return (
    <svg viewBox="0 0 460 210" width="100%" height="100%" role="img" aria-label="端から1冊ずつ本を探す図" style={{ display: "block" }}>
      <rect width="460" height="210" fill="#eef3f9" />
      <rect x="40" y="150" width="380" height="10" rx="3" fill="#8a6a52" />
      <rect x="56" y="160" width="10" height="34" fill="#8a6a52" />
      <rect x="394" y="160" width="10" height="34" fill="#8a6a52" />
      {values.map((value, index) => (
        <g key={value} opacity={index < 6 ? 0.45 : 1}>
          <rect x={58 + index * 39} y={150 - BOOK_HEIGHTS[index]} width="32" height={BOOK_HEIGHTS[index]} rx="4" fill={BOOK_COLORS[index]} />
          <text x={74 + index * 39} y={150 - BOOK_HEIGHTS[index] / 2 + 6} textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">{value}</text>
        </g>
      ))}
      {/* 端から端までの走査の矢印 */}
      <path d="M 66 34 L 402 34" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
      <path d="M 402 34 l -14 -6 M 402 34 l -14 6" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* 依頼の吹き出し */}
      <g>
        <rect x="150" y="8" width="150" height="34" rx="17" fill="#fff" stroke="#111827" strokeWidth="2" />
        <text x="225" y="31" textAnchor="middle" fontSize="16" fontWeight="800" fill="#111827">「6番の本を貸して」</text>
      </g>
    </svg>
  );
}

/** ステップ3の図：並んでいれば一瞬で見つかる（解決の方向）。 */
function InsightFigure() {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <svg viewBox="0 0 460 210" width="100%" height="100%" role="img" aria-label="並んだ棚では目当ての本がすぐ見つかる図" style={{ display: "block" }}>
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
      {/* 6番を囲む（すぐ見つかる） */}
      <rect x={58 + 5 * 39 - 5} y={150 - (44 + 5 * 7) - 5} width="42" height={44 + 5 * 7 + 5} rx="7" fill="none" stroke="#16a34a" strokeWidth="4" />
      <path d="M 330 30 l 4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 Z" fill="#f59e0b" />
    </svg>
  );
}

/** ステップ5の図：コンピュータは曖昧な判断ができない（本当の差）。 */
function GapFigure() {
  return (
    <svg viewBox="0 0 460 210" width="100%" height="100%" role="img" aria-label="判断の決め方が分からず困るコンピュータの図" style={{ display: "block" }}>
      <rect width="460" height="210" fill="#eef3f9" />
      <rect x="120" y="150" width="300" height="10" rx="3" fill="#8a6a52" />
      <rect x="136" y="160" width="10" height="34" fill="#8a6a52" />
      <rect x="394" y="160" width="10" height="34" fill="#8a6a52" />
      <rect x="196" y="62" width="52" height="88" rx="5" fill="#7d8ca3" />
      <text x="222" y="118" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff">7</text>
      <rect x="304" y="88" width="52" height="62" rx="5" fill="#a98a6d" />
      <text x="330" y="130" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff">3</text>
      {/* コンピュータ（ロボット） */}
      <g>
        <rect x="36" y="86" width="62" height="54" rx="12" fill="#64748b" />
        <circle cx="56" cy="108" r="6" fill="#fff" />
        <circle cx="78" cy="108" r="6" fill="#fff" />
        <path d="M 54 128 Q 67 120 80 128" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <line x1="67" y1="86" x2="67" y2="68" stroke="#64748b" strokeWidth="4" />
        <circle cx="67" cy="64" r="5" fill="#64748b" />
      </g>
      {/* 決められていない判断の「？」 */}
      {[{ x: 222, y: 34 }, { x: 330, y: 60 }, { x: 140, y: 44 }].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="17" fill="#fff" stroke="#2563eb" strokeWidth="2.5" />
          <text x={p.x} y={p.y + 7} textAnchor="middle" fontSize="19" fontWeight="800" fill="#2563eb">?</text>
        </g>
      ))}
    </svg>
  );
}

const bubbleSortStory: MissionStory = {
  steps: [
    {
      caption: "図書室の本棚は、本が番号のバラバラな順番で並んでいます。",
      figure: null, // 場面の絵（サムネと同じ場面）を下で差し込む
    },
    {
      caption: "「6番の本を貸して」と頼まれるたびに、端から1冊ずつ探さなければいけません。しかも、頼みは毎日やってきます。",
      figure: <SearchFigure />,
    },
    {
      caption: "そもそも、本が番号順に並んでいれば、探すのは一瞬で済むはずです。",
      figure: <InsightFigure />,
    },
    {
      caption: "人間の司書なら、隣同士の番号を見比べて、順番が逆なら入れ替えながら、棚を並べ替えることができます。",
      figure: <SwapFigure />,
    },
    {
      caption: "でもコンピュータは、「だいたいこの順」という曖昧な判断ができません。比べる順番も、入れ替える条件も、終わりの決め方も、全部を正確に決めた手順が要ります。",
      figure: <GapFigure />,
    },
    {
      caption: "その手順がバブルソートです。この単元で手順を学び、最後は自分のコードで本棚を並べ替えましょう。",
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
