"use client";

// ミッション場面サムネイルの試作（2026-11-22）。
// 目的：サムネを見ただけで「このアルゴリズムがどんな課題に挑むのか」が直感的に分かり、
// 見た人が「自分ならどうする？」と考え始めること。興味はこの「どうすれば」が引く。
// 条件は3つ：①課題が一目で分かる、②答え（解法）は描かない、③通路が一目では読めず、
// 目が自然に経路を探す。解法を描くと答えになってしまい、「自分が解く課題」として伝わらない。
// 従来の CourseThumbnail はアルゴリズムの仕組みの図（ノード図など）で、課題の場面は描いていない。
// 2026-11-23：同じ課題の組（BFS/DFS）で場面が似すぎて見分けがつかない問題への対応。
// 「同じ課題だから仕方ない」ではサムネの識別の仕事が成り立たないため、場面の形に
// 手法の性格を埋め込んで描き分ける：BFS＝幅（横に広い空間、たくさんの分かれ道、
// 近くを少しずつ試した足あと）、DFS＝深さ（暗い塊に一本だけ刻まれた深い通路、
// 奥の行き止まりまで入った足あと）。課題は描き、経路（答え）は描かない点は同じ。
// 枠の形はカードのサムネ領域（約 2.2 : 1）に合わせてある。

import { Box } from "@mui/material";

/** BFS：広い倉庫で、たくさんの通路の前に困っている配送ロボット（幅の場面）。 */
export const BfsMissionThumbnail: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 460 210"
    preserveAspectRatio="xMidYMid slice"
    sx={{ width: "100%", height: "100%", display: "block" }}
    role="img"
    aria-label="広い倉庫で、たくさんの通路の前に困っている配送ロボット"
  >
    <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
    {/* 床のグリッド */}
    {Array.from({ length: 17 }, (_, i) => (
      <line key={`v${i}`} x1={(i + 1) * 26} y1="0" x2={(i + 1) * 26} y2="210" stroke="#2563eb" strokeOpacity="0.06" />
    ))}
    {Array.from({ length: 7 }, (_, i) => (
      <line key={`h${i}`} x1="0" y1={(i + 1) * 26} x2="460" y2={(i + 1) * 26} stroke="#2563eb" strokeOpacity="0.06" />
    ))}
    {/* 棚：横に広く、浅く並べる。通路が何本もある「幅」の空間にする */}
    <g fill="#5b7186">
      <rect x="16" y="48" width="84" height="30" rx="6" />
      <rect x="132" y="48" width="84" height="30" rx="6" />
      <rect x="248" y="48" width="84" height="30" rx="6" />
      <rect x="364" y="48" width="84" height="30" rx="6" />
      <rect x="64" y="98" width="84" height="30" rx="6" />
      <rect x="180" y="98" width="84" height="30" rx="6" />
      <rect x="296" y="98" width="84" height="30" rx="6" />
    </g>
    <g stroke="#ffffff" strokeOpacity="0.28" strokeWidth="2">
      <line x1="58" y1="48" x2="58" y2="78" />
      <line x1="174" y1="48" x2="174" y2="78" />
      <line x1="290" y1="48" x2="290" y2="78" />
      <line x1="406" y1="48" x2="406" y2="78" />
      <line x1="106" y1="98" x2="106" y2="128" />
      <line x1="222" y1="98" x2="222" y2="128" />
      <line x1="338" y1="98" x2="338" y2="128" />
    </g>
    {/* 届け先：家（広い空間の向こう側に小さく見える） */}
    <g>
      <path d="M394 26 L421 8 L448 26 Z" fill="#1e40af" />
      <rect x="398" y="26" width="46" height="24" rx="3" fill="#ffffff" stroke="#1e40af" strokeWidth="3" />
      <rect x="413" y="36" width="13" height="14" rx="2" fill="#2563eb" />
    </g>
    {/* 足あと：ロボットの周りで、近くの通路を少しずつ試して止まっている（幅の試行） */}
    <g fill="#94a3b8">
      <circle cx="192" cy="146" r="3" />
      <circle cx="174" cy="136" r="3" />
      <circle cx="160" cy="124" r="3" />
      <circle cx="206" cy="134" r="3" />
      <circle cx="188" cy="120" r="3" />
      <circle cx="176" cy="106" r="3" />
      <circle cx="244" cy="142" r="3" />
      <circle cx="264" cy="134" r="3" />
      <circle cx="284" cy="126" r="3" />
    </g>
    {/* ロボット：中央に立ち、荷物を抱えて、汗と「？」 */}
    <g>
      <line x1="221" y1="136" x2="221" y2="122" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="221" cy="118" r="5" fill="#2563eb" />
      <rect x="199" y="150" width="44" height="42" rx="10" fill="#2563eb" />
      <rect x="206" y="158" width="30" height="19" rx="5" fill="#dbeafe" />
      <circle cx="216" cy="166" r="3" fill="#1e3a8a" />
      <circle cx="226" cy="166" r="3" fill="#1e3a8a" />
      <path d="M216 174 Q221 171 226 174" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
      {/* 汗 */}
      <path d="M251 156 C251 156 245 166 245 170.5 A6 6 0 0 0 257 170.5 C257 166 251 156 251 156 Z" fill="#7dd3fc" />
      {/* 抱えた荷物 */}
      <rect x="207" y="178" width="34" height="24" rx="3" fill="#b45309" />
      <line x1="207" y1="190" x2="241" y2="190" stroke="#92400e" strokeWidth="2.5" />
      <line x1="224" y1="178" x2="224" y2="202" stroke="#92400e" strokeWidth="2.5" />
    </g>
    {/* 「どうやって届けるの？」の吹き出し */}
    <g>
      <circle cx="276" cy="140" r="16" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
      <path d="M264 150 L250 160 L266 158 Z" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="276" y="148" textAnchor="middle" fontSize="20" fontWeight="900" fill="#2563eb">
        ？
      </text>
    </g>
  </Box>
);

/** DFS：暗い塊に一本だけ刻まれた深い通路。その入口で困っているロボット（深さの場面）。 */
export const DfsMissionThumbnail: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 460 210"
    preserveAspectRatio="xMidYMid slice"
    sx={{ width: "100%", height: "100%", display: "block" }}
    role="img"
    aria-label="一本の深い通路の入口で困っているロボット"
  >
    <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
    {/* 壁の塊：通路以外は全部壁 */}
    <rect x="10" y="6" width="440" height="198" rx="10" fill="#5b7186" />
    {/* 一本の通路：入口から奥へ、折れ曲がりながら深く続く */}
    <path
      d="M74 214 L74 96 L196 96 L196 158 L322 158 L322 58 L404 58"
      fill="none"
      stroke="#eef4fc"
      strokeWidth="36"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    {/* 行き止まりの枝：本道から分かれて、奥で行き止まっている */}
    <path d="M196 158 L196 192" fill="none" stroke="#eef4fc" strokeWidth="30" strokeLinecap="round" />
    {/* 出口：通路のいちばん奥に、小さく光る扉 */}
    <g>
      <line x1="420" y1="24" x2="420" y2="30" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="406" y1="28" x2="410" y2="33" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="434" y1="28" x2="430" y2="33" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <rect x="406" y="34" width="28" height="46" rx="4" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />
      <path d="M412 80 L412 52 A8 8 0 0 1 428 52 L428 80 Z" fill="#f59e0b" />
    </g>
    {/* 足あと：本道を進み、行き止まりの枝の奥まで入って止まっている（深さの試行） */}
    <g fill="#94a3b8">
      <circle cx="106" cy="96" r="3" />
      <circle cx="136" cy="96" r="3" />
      <circle cx="166" cy="96" r="3" />
      <circle cx="196" cy="118" r="3" />
      <circle cx="196" cy="140" r="3" />
      <circle cx="196" cy="168" r="3" />
    </g>
    {/* ロボット：通路の入口に立ち、汗と「？」 */}
    <g>
      <line x1="76" y1="136" x2="76" y2="122" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="76" cy="118" r="5" fill="#2563eb" />
      <rect x="54" y="150" width="44" height="42" rx="10" fill="#2563eb" />
      <rect x="61" y="158" width="30" height="19" rx="5" fill="#dbeafe" />
      <circle cx="71" cy="166" r="3" fill="#1e3a8a" />
      <circle cx="81" cy="166" r="3" fill="#1e3a8a" />
      <path d="M71 174 Q76 171 81 174" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
      {/* 汗 */}
      <path d="M104 156 C104 156 98 166 98 170.5 A6 6 0 0 0 110 170.5 C110 166 104 156 104 156 Z" fill="#7dd3fc" />
    </g>
    {/* 「どうやって抜けるの？」の吹き出し（暗い壁の上で白く浮く） */}
    <g>
      <circle cx="128" cy="142" r="16" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
      <path d="M116 152 L102 162 L120 158 Z" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="128" y="150" textAnchor="middle" fontSize="20" fontWeight="900" fill="#2563eb">
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
