"use client";

// ミッション場面サムネイルの試作（2026-11-22）。
// 目的：サムネを見ただけで「このアルゴリズムがどんな課題に挑むのか」が直感的に分かり、
// 見た人が「自分ならどうする？」と考え始めること。興味はこの「どうすれば」が引く。
// 条件は3つ：①課題が一目で分かる、②答え（解法）は描かない、③通路が一目では読めず、
// 目が自然に経路を探す。解法を描くと答えになってしまい、「自分が解く課題」として伝わらない。
// 従来の CourseThumbnail はアルゴリズムの仕組みの図（ノード図など）で、課題の場面は描いていない。
// まずは BFS の1単元だけ試作し、全単元へ広げるかは Kanato の判断を待つ。
// 2026-11-22 夜：BFS に続けて DFS も試作した。Kanato の懸念「場面サムネにすると
// BFS と DFS の違いが出なくなるか」への検証用で、同じロボット・同じ3条件で、
// 世界だけを変えた（BFS＝倉庫・最短経路、DFS＝迷路・行き止まりだらけ）。
// 枠の形はカードのサムネ領域（約 2.2 : 1）に合わせてある。

import { Box } from "@mui/material";

/** BFS：荷物を届けたいのに、棚の通路で行き詰まって困っている配送ロボット。 */
export const BfsMissionThumbnail: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 460 210"
    preserveAspectRatio="xMidYMid slice"
    sx={{ width: "100%", height: "100%", display: "block" }}
    role="img"
    aria-label="荷物を届けようとして、棚の通路で行き詰まっている配送ロボット"
  >
    <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
    {/* 床のグリッド */}
    {Array.from({ length: 17 }, (_, i) => (
      <line key={`v${i}`} x1={(i + 1) * 26} y1="0" x2={(i + 1) * 26} y2="210" stroke="#2563eb" strokeOpacity="0.06" />
    ))}
    {Array.from({ length: 7 }, (_, i) => (
      <line key={`h${i}`} x1="0" y1={(i + 1) * 26} x2="460" y2={(i + 1) * 26} stroke="#2563eb" strokeOpacity="0.06" />
    ))}
    {/* 棚：ずらして配置し、通路が一目では読めないようにする */}
    <g fill="#5b7186">
      <rect x="28" y="22" width="116" height="36" rx="6" />
      <rect x="196" y="22" width="116" height="36" rx="6" />
      <rect x="28" y="100" width="84" height="36" rx="6" />
      <rect x="164" y="100" width="116" height="36" rx="6" />
      <rect x="348" y="40" width="36" height="96" rx="6" />
      <rect x="300" y="150" width="132" height="36" rx="6" />
    </g>
    <g stroke="#ffffff" strokeOpacity="0.28" strokeWidth="2">
      <line x1="86" y1="22" x2="86" y2="58" />
      <line x1="254" y1="22" x2="254" y2="58" />
      <line x1="70" y1="100" x2="70" y2="136" />
      <line x1="222" y1="100" x2="222" y2="136" />
      <line x1="348" y1="88" x2="384" y2="88" />
      <line x1="366" y1="150" x2="366" y2="186" />
      <line x1="28" y1="40" x2="144" y2="40" />
      <line x1="196" y1="40" x2="312" y2="40" />
      <line x1="164" y1="118" x2="280" y2="118" />
      <line x1="300" y1="168" x2="432" y2="168" />
    </g>
    {/* 届け先：家と旗（棚の向こうに見えるのに、どう行けばいいか分からない） */}
    <g>
      <path d="M386 46 L419 24 L452 46 Z" fill="#1e40af" />
      <rect x="392" y="46" width="52" height="36" rx="3" fill="#ffffff" stroke="#1e40af" strokeWidth="3" />
      <rect x="411" y="62" width="15" height="20" rx="2" fill="#2563eb" />
      <line x1="419" y1="8" x2="419" y2="24" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M419 8 L441 14 L419 21 Z" fill="#2563eb" />
    </g>
    {/* 足あと：左下から来て、右の通路に入ってみたが途中で止まっている（失敗した試行） */}
    <g fill="#94a3b8">
      <circle cx="44" cy="196" r="3" />
      <circle cx="70" cy="202" r="3" />
      <circle cx="96" cy="204" r="3" />
      <circle cx="120" cy="200" r="3" />
      <circle cx="196" cy="190" r="3" />
      <circle cx="228" cy="186" r="3" />
      <circle cx="258" cy="172" r="3" />
      <circle cx="282" cy="152" r="3" />
      <circle cx="300" cy="126" r="3" />
      <circle cx="310" cy="100" r="3" />
      <circle cx="314" cy="78" r="3" />
    </g>
    {/* ロボット：荷物を抱えて、汗と「？」 */}
    <g>
      <line x1="160" y1="142" x2="160" y2="128" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="160" cy="124" r="5" fill="#2563eb" />
      <rect x="138" y="156" width="44" height="42" rx="10" fill="#2563eb" />
      <rect x="145" y="164" width="30" height="19" rx="5" fill="#dbeafe" />
      <circle cx="155" cy="172" r="3" fill="#1e3a8a" />
      <circle cx="165" cy="172" r="3" fill="#1e3a8a" />
      <path d="M155 180 Q160 177 165 180" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
      {/* 汗 */}
      <path d="M190 162 C190 162 184 172 184 176.5 A6 6 0 0 0 196 176.5 C196 172 190 162 190 162 Z" fill="#7dd3fc" />
      {/* 抱えた荷物 */}
      <rect x="146" y="184" width="34" height="24" rx="3" fill="#b45309" />
      <line x1="146" y1="196" x2="180" y2="196" stroke="#92400e" strokeWidth="2.5" />
      <line x1="163" y1="184" x2="163" y2="208" stroke="#92400e" strokeWidth="2.5" />
    </g>
    {/* 「どうやって届けるの？」の吹き出し */}
    <g>
      <circle cx="208" cy="154" r="16" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
      <path d="M197 165 L186 152 L192 168 Z" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="208" y="162" textAnchor="middle" fontSize="20" fontWeight="900" fill="#2563eb">
        ？
      </text>
    </g>
  </Box>
);

/** DFS：迷路を抜けたいのに、行き止まりで困っているロボット。BFS と同じ子・同じ条件で、世界だけ迷路。 */
export const DfsMissionThumbnail: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 460 210"
    preserveAspectRatio="xMidYMid slice"
    sx={{ width: "100%", height: "100%", display: "block" }}
    role="img"
    aria-label="迷路を抜けようとして、行き止まりで困っているロボット"
  >
    <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
    {/* 床のグリッド */}
    {Array.from({ length: 17 }, (_, i) => (
      <line key={`v${i}`} x1={(i + 1) * 26} y1="0" x2={(i + 1) * 26} y2="210" stroke="#2563eb" strokeOpacity="0.06" />
    ))}
    {Array.from({ length: 7 }, (_, i) => (
      <line key={`h${i}`} x1="0" y1={(i + 1) * 26} x2="460" y2={(i + 1) * 26} stroke="#2563eb" strokeOpacity="0.06" />
    ))}
    {/* 迷路の壁：行き止まりの部屋ができる配置 */}
    <g fill="#5b7186">
      <rect x="80" y="28" width="150" height="16" rx="6" />
      <rect x="280" y="28" width="120" height="16" rx="6" />
      <rect x="80" y="88" width="16" height="84" rx="6" />
      <rect x="170" y="88" width="130" height="16" rx="6" />
      <rect x="330" y="88" width="16" height="84" rx="6" />
      <rect x="170" y="148" width="150" height="16" rx="6" />
      <rect x="380" y="60" width="16" height="60" rx="6" />
    </g>
    <g stroke="#ffffff" strokeOpacity="0.28" strokeWidth="2">
      <line x1="155" y1="28" x2="155" y2="44" />
      <line x1="340" y1="28" x2="340" y2="44" />
      <line x1="80" y1="36" x2="230" y2="36" />
      <line x1="280" y1="36" x2="400" y2="36" />
      <line x1="80" y1="130" x2="96" y2="130" />
      <line x1="88" y1="88" x2="88" y2="172" />
      <line x1="235" y1="88" x2="235" y2="104" />
      <line x1="170" y1="96" x2="300" y2="96" />
      <line x1="330" y1="130" x2="346" y2="130" />
      <line x1="338" y1="88" x2="338" y2="172" />
      <line x1="245" y1="148" x2="245" y2="164" />
      <line x1="170" y1="156" x2="320" y2="156" />
      <line x1="380" y1="90" x2="396" y2="90" />
      <line x1="388" y1="60" x2="388" y2="120" />
    </g>
    {/* 出口：光る扉（遠くに見えるのに、どう行けばいいか分からない） */}
    <g>
      <line x1="430" y1="2" x2="430" y2="10" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="414" y1="6" x2="419" y2="12" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="446" y1="6" x2="441" y2="12" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <rect x="412" y="16" width="36" height="46" rx="4" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />
      <path d="M420 62 L420 34 A8 8 0 0 1 436 34 L436 62 Z" fill="#f59e0b" />
    </g>
    {/* 足あと：左の通路から右の部屋へ入ってみたが、行き止まりで止まっている */}
    <g fill="#94a3b8">
      <circle cx="84" cy="196" r="3" />
      <circle cx="108" cy="198" r="3" />
      <circle cx="128" cy="182" r="3" />
      <circle cx="130" cy="160" r="3" />
      <circle cx="132" cy="136" r="3" />
      <circle cx="160" cy="128" r="3" />
      <circle cx="200" cy="128" r="3" />
      <circle cx="240" cy="128" r="3" />
      <circle cx="278" cy="128" r="3" />
    </g>
    {/* ロボット：汗と「？」 */}
    <g>
      <line x1="52" y1="142" x2="52" y2="128" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="52" cy="124" r="5" fill="#2563eb" />
      <rect x="30" y="156" width="44" height="42" rx="10" fill="#2563eb" />
      <rect x="37" y="164" width="30" height="19" rx="5" fill="#dbeafe" />
      <circle cx="47" cy="172" r="3" fill="#1e3a8a" />
      <circle cx="57" cy="172" r="3" fill="#1e3a8a" />
      <path d="M47 180 Q52 177 57 180" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
      {/* 汗 */}
      <path d="M78 160 C78 160 72 170 72 174.5 A6 6 0 0 0 84 174.5 C84 170 78 160 78 160 Z" fill="#7dd3fc" />
    </g>
    {/* 「どうやって抜けるの？」の吹き出し */}
    <g>
      <circle cx="116" cy="132" r="16" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
      <path d="M104 142 L90 154 L110 146 Z" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="116" y="140" textAnchor="middle" fontSize="20" fontWeight="900" fill="#2563eb">
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
    case "course-algorithm-depth-first-search-v1":
      return <DfsMissionThumbnail />;
    default:
      return null;
  }
};
