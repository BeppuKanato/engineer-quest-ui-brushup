"use client";

// ミッション場面サムネイルの試作（2026-11-22）。
// 目的：サムネを見ただけで「このアルゴリズムがどんな課題に挑むのか」が直感的に分かること。
// 描くのは「何かをしたくて困っている状態（AS-IS）」であって、解法は描かない。
// 解法（最短経路など）を描くと答えになってしまい、「自分が解く課題」として伝わらない。
// 従来の CourseThumbnail はアルゴリズムの仕組みの図（ノード図など）で、課題の場面は描いていない。
// まずは BFS の1単元だけ試作し、全単元へ広げるかは Kanato の判断を待つ。
// 枠の形はカードのサムネ領域（約 2.2 : 1）に合わせてある。

import { Box } from "@mui/material";

/** BFS：荷物を届けたいのに、棚に阻まれて進めず困っている配送ロボット。 */
export const BfsMissionThumbnail: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 460 210"
    preserveAspectRatio="xMidYMid slice"
    sx={{ width: "100%", height: "100%", display: "block" }}
    role="img"
    aria-label="荷物を届けたいのに棚に阻まれて困っている配送ロボット"
  >
    <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
    {/* 床のグリッド */}
    {Array.from({ length: 17 }, (_, i) => (
      <line key={`v${i}`} x1={(i + 1) * 26} y1="0" x2={(i + 1) * 26} y2="210" stroke="#2563eb" strokeOpacity="0.06" />
    ))}
    {Array.from({ length: 7 }, (_, i) => (
      <line key={`h${i}`} x1="0" y1={(i + 1) * 26} x2="460" y2={(i + 1) * 26} stroke="#2563eb" strokeOpacity="0.06" />
    ))}
    {/* 棚（障害物） */}
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
    {/* 届け先：家と旗（行きたいのに、棚の向こうで遠い） */}
    <g>
      <path d="M376 44 L404 24 L432 44 Z" fill="#1e40af" />
      <rect x="382" y="44" width="44" height="34" rx="3" fill="#ffffff" stroke="#1e40af" strokeWidth="3" />
      <rect x="396" y="58" width="14" height="20" rx="2" fill="#2563eb" />
      <line x1="404" y1="6" x2="404" y2="24" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M404 6 L426 12 L404 19 Z" fill="#2563eb" />
    </g>
    {/* さまよった足あと（試したけど届いていない） */}
    <g fill="#94a3b8">
      <circle cx="60" cy="196" r="3" />
      <circle cx="82" cy="200" r="3" />
      <circle cx="104" cy="202" r="3" />
      <circle cx="126" cy="200" r="3" />
      <circle cx="148" cy="194" r="3" />
    </g>
    {/* ロボット：荷物を抱えて、汗と「？」。棚と棚の間の通路にいる */}
    <g>
      <line x1="205" y1="132" x2="205" y2="118" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="205" cy="114" r="5" fill="#2563eb" />
      <rect x="183" y="148" width="44" height="42" rx="10" fill="#2563eb" />
      <rect x="190" y="156" width="30" height="19" rx="5" fill="#dbeafe" />
      <circle cx="200" cy="164" r="3" fill="#1e3a8a" />
      <circle cx="210" cy="164" r="3" fill="#1e3a8a" />
      <path d="M200 172 Q205 169 210 172" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
      {/* 汗 */}
      <path d="M235 154 C235 154 229 164 229 168.5 A6 6 0 0 0 241 168.5 C241 164 235 154 235 154 Z" fill="#7dd3fc" />
      {/* 抱えた荷物 */}
      <rect x="189" y="182" width="34" height="26" rx="3" fill="#b45309" />
      <line x1="189" y1="195" x2="223" y2="195" stroke="#92400e" strokeWidth="2.5" />
      <line x1="206" y1="182" x2="206" y2="208" stroke="#92400e" strokeWidth="2.5" />
    </g>
    {/* 「どうやって届けるの？」の吹き出し */}
    <g>
      <circle cx="272" cy="118" r="17" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
      <path d="M260 130 L248 146 L268 136 Z" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="272" y="126" textAnchor="middle" fontSize="21" fontWeight="900" fill="#2563eb">
        ？
      </text>
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
