"use client";

// ミッション場面サムネイルの試作（2026-11-22）。
// 目的：サムネを見ただけで「このアルゴリズムがどんな課題に挑むのか」が直感的に分かること。
// 従来の CourseThumbnail はアルゴリズムの仕組みの図（ノード図など）で、課題の場面は描いていない。
// ここでは目標ミッションの場面そのものを描く。まずは BFS の1単元だけ試作し、
// 全単元へ広げるかは Kanato の判断を待つ。
// 枠の形はカードのサムネ領域（約 2.2 : 1）に合わせてある。

import { Box } from "@mui/material";

/** BFS：倉庫で配送ロボットが最短経路（通る道の本数が最小）で荷物を届ける場面。 */
export const BfsMissionThumbnail: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 460 210"
    preserveAspectRatio="xMidYMid slice"
    sx={{ width: "100%", height: "100%", display: "block" }}
    role="img"
    aria-label="倉庫の中を配送ロボットが最短経路で進む場面"
  >
    <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
    {/* 床のグリッド */}
    {Array.from({ length: 17 }, (_, i) => (
      <line key={`v${i}`} x1={(i + 1) * 26} y1="0" x2={(i + 1) * 26} y2="210" stroke="#2563eb" strokeOpacity="0.06" />
    ))}
    {Array.from({ length: 7 }, (_, i) => (
      <line key={`h${i}`} x1="0" y1={(i + 1) * 26} x2="460" y2={(i + 1) * 26} stroke="#2563eb" strokeOpacity="0.06" />
    ))}
    {/* 棚（障害物）。配置上、右端の通路を通る L 字が最短路になる */}
    <g fill="#5b7186">
      <rect x="34" y="26" width="104" height="38" rx="6" />
      <rect x="176" y="26" width="104" height="38" rx="6" />
      <rect x="34" y="108" width="128" height="38" rx="6" />
      <rect x="238" y="108" width="104" height="38" rx="6" />
    </g>
    <g stroke="#ffffff" strokeOpacity="0.28" strokeWidth="2">
      <line x1="86" y1="26" x2="86" y2="64" />
      <line x1="228" y1="26" x2="228" y2="64" />
      <line x1="98" y1="108" x2="98" y2="146" />
      <line x1="290" y1="108" x2="290" y2="146" />
      <line x1="34" y1="45" x2="138" y2="45" />
      <line x1="176" y1="45" x2="280" y2="45" />
      <line x1="34" y1="127" x2="162" y2="127" />
      <line x1="238" y1="127" x2="342" y2="127" />
    </g>
    {/* 最短経路 */}
    <path
      d="M70 168 L392 168 Q404 168 404 156 L404 62"
      fill="none"
      stroke="#2563eb"
      strokeWidth="7"
      strokeLinecap="round"
    />
    {/* ゴール：旗と荷物 */}
    <line x1="404" y1="18" x2="404" y2="62" stroke="#1e40af" strokeWidth="4" strokeLinecap="round" />
    <path d="M404 18 L430 27 L404 37 Z" fill="#2563eb" />
    <g>
      <rect x="372" y="40" width="24" height="20" rx="3" fill="#b45309" />
      <line x1="372" y1="50" x2="396" y2="50" stroke="#92400e" strokeWidth="2.5" />
      <line x1="384" y1="40" x2="384" y2="60" stroke="#92400e" strokeWidth="2.5" />
    </g>
    {/* ロボット（スタート） */}
    <g>
      <line x1="52" y1="140" x2="52" y2="128" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
      <circle cx="52" cy="124" r="4.5" fill="#2563eb" />
      <rect x="34" y="144" width="36" height="34" rx="9" fill="#2563eb" />
      <rect x="40" y="151" width="24" height="15" rx="4" fill="#dbeafe" />
      <circle cx="48" cy="158.5" r="2.6" fill="#1e3a8a" />
      <circle cx="56" cy="158.5" r="2.6" fill="#1e3a8a" />
      <rect x="38" y="178" width="9" height="6" rx="2" fill="#1e40af" />
      <rect x="57" y="178" width="9" height="6" rx="2" fill="#1e40af" />
    </g>
  </Box>
);

/** ミッション場面サムネがある単元はそれを、無い単元は null を返す。 */
export const missionThumbnailFor = (courseId: string): React.ReactNode => {
  switch (courseId) {
    case "course-algorithm-breadth-first-search-v1":
      return <BfsMissionThumbnail />;
    default:
      return null;
  }
};
