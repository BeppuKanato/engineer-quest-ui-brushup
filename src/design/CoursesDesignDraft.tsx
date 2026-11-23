"use client";

// コース一覧（/courses）のデザイン下書き v3（2026-11-22）。
// この画面の目的は「次に学ぶものを選ぶ画面」。v3 の転換点はサムネイル主役：
// - カードは図を全面に大きく置き、テキストは単元名とミッションの題だけに絞る
// - 進捗バー・知識カード数・説明文はカードから落とす（管理情報はホームと単元画面の仕事）
// - 状態は、ボタンの色分けではなく「印と進捗の形」で表す（一般的な学習アプリの慣例、
//   2026-11-23 Kanato と確認）：未着手＝印なし、学習中＝青い塗りのバッジ＋枠＋
//   サムネ下端の進捗バー（「段階 n/7」のラベル付き）、完了＝印なし（緑の復習ボタンが
//   担う。メダルバッジは、完了が学習中より目立つ逆転とボタンとの二重表現のため外した）。
//   ボタンは主色にそろえ、
//   文言だけが変わる（始める／続きから／復習する）。ただし完了の復習ボタンだけは
//   バッジと同じ緑にする（色は意味で統一）。グレーは操作できない状態だけに使う。
//   ボタンはカード全体リンクの中の見た目上のボタン（遷移はカード全体が担う）。
// - カード全体が単元画面へのリンク
// 並び（2026-11-23 Kanato の案を採用）：グループごとに行を変えるのはやめ、全単元を
// 3列で流す。行分けだと単元数によって空きマスだらけになり、増えた時にも直らないため。
// 課題軸の区別は、カードに付けた「アイコン＋グループ名」のチップで付ける。
// チップは形も色も全軸共通（軸ごとの色分けは、種類が増えた時に枯渇・衝突する
// ためしない）。同じ軸は、同じアイコンと名前、隣り合う並び順で表す。
// BFS と DFS のサムネは、目標ミッションの場面を描いた試作（MissionThumbnail）。

import { useState } from "react";

import { Box, Button, ButtonBase, Chip, Paper, Stack, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import Link from "next/link";

import { CourseThumbnail } from "@/app/courses/component/courseThumbnail";
import type { HomeUnit } from "@/api/home.api";
import coursesData from "@/design/data/courses.json";
import { homeFixture } from "@/design/fixtures";
import { findUnitMission } from "@/features/learning/app/missionRegistry";
import { missionThumbnailFor } from "@/design/MissionThumbnail";

const TEXT = "#111827";
const PRIMARY = "#2563eb";
const BORDER = "#dbe3ef";
// 完了・復習の意味の色。ボタンとバッジで同じ緑を使う（色は意味で統一する）。
const GREEN = "#16a34a";

type CourseInfo = { id: string; title: string; description: string };
const courseById = new Map((coursesData as CourseInfo[]).map((c) => [c.id, c]));

// 課題軸のグループ（2026-11-21 決定）。カードのラベルに使う。
// 貪欲法は手法軸で単独＝単元名自体がグループ名になるため、ラベルは付けない。
const GROUP_LABEL: Record<string, string> = {
  "course-algorithm-breadth-first-search-v1": "グラフ探索",
  "course-algorithm-depth-first-search-v1": "グラフ探索",
  "course-algorithm-maze-digging-v1": "迷路生成",
  "course-algorithm-wall-extension-v1": "迷路生成",
  "course-algorithm-bubble-sort-v2": "並び替え",
  "course-algorithm-binary-search-v1": "配列の検索",
};

/** 軸のアイコン（24×24、線と点の最小限の絵）。色は使わず、形で軸を区別する。 */
const GroupGlyph: React.FC<{ label: string }> = ({ label }) => {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  switch (label) {
    case "グラフ探索":
      return (
        <svg {...common}>
          <path d="M7 17 L12 6 M12 6 L18 14 M7 17 L18 14" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="7" cy="17" r="2.6" fill="currentColor" />
          <circle cx="12" cy="6" r="2.6" fill="currentColor" />
          <circle cx="18" cy="14" r="2.6" fill="currentColor" />
        </svg>
      );
    case "迷路生成":
      return (
        <svg {...common}>
          <path
            d="M4 20 V4 H20 V20 H10 V11 H16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "並び替え":
      return (
        <svg {...common}>
          <rect x="5.2" y="13" width="3.6" height="7" fill="currentColor" />
          <rect x="10.6" y="9" width="3.6" height="11" fill="currentColor" />
          <rect x="16" y="5" width="3.6" height="15" fill="currentColor" />
        </svg>
      );
    case "配列の検索":
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M14.8 14.8 L20 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case "貪欲法":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
};

/**
 * グループチップ：形も色も全軸共通（本文色の太枠）。軸ごとの色分けはしない
 * ——軸が何種類になるか分からず、色が枯渇・衝突するため（2026-11-23 Kanato）。
 * 「同じ軸」は、同じアイコンの形と名前、それと隣り合う並び順で表す。
 */
const GroupChip: React.FC<{ label: string }> = ({ label }) => (
  <Box
    component="span"
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.75,
      alignSelf: "flex-start",
      px: 1.5,
      py: 0.75,
      mb: 1,
      border: `2px solid ${TEXT}`,
      borderRadius: 999,
      bgcolor: "#fff",
      color: TEXT,
      fontSize: 18,
      fontWeight: 700,
      lineHeight: 1,
    }}
  >
    <GroupGlyph label={label} />
    {label}
  </Box>
);

/** 絞り込み用の軸（貪欲法も1つの軸として含む）。 */
const FILTER_GROUP: Record<string, string> = {
  ...GROUP_LABEL,
  "course-algorithm-greedy-coins-v1": "貪欲法",
};
const AXES = ["すべて", "グラフ探索", "迷路生成", "並び替え", "配列の検索", "貪欲法"];

/** 軸の検索欄：軸のチップを選んで単元を絞り込む。選択中だけ主色で塗る。 */
const AxisFilter: React.FC<{ value: string; onChange: (axis: string) => void }> = ({ value, onChange }) => (
  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap aria-label="軸で絞り込む">
    {AXES.map((axis) => {
      const selected = axis === value;
      return (
        <ButtonBase
          key={axis}
          onClick={() => onChange(axis)}
          aria-pressed={selected}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.75,
            py: 1,
            borderRadius: 999,
            border: `1px solid ${selected ? PRIMARY : BORDER}`,
            bgcolor: selected ? PRIMARY : "#fff",
            color: selected ? "#fff" : TEXT,
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {axis !== "すべて" && <GroupGlyph label={axis} />}
          {axis}
        </ButtonBase>
      );
    })}
  </Stack>
);

/** 状態の検索欄：学習状態で絞り込む。件数つき。軸の検索欄とは分ける（GPT指摘）。 */
const STATE_OPTIONS: { key: string; label: string }[] = [
  { key: "ALL", label: "すべて" },
  { key: "IN_PROGRESS", label: "学習中" },
  { key: "NOT_STARTED", label: "未着手" },
  { key: "COMPLETED", label: "完了" },
];

const StateFilter: React.FC<{
  value: string;
  onChange: (key: string) => void;
  counts: Record<string, number>;
}> = ({ value, onChange, counts }) => (
  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap aria-label="学習状態で絞り込む">
    {STATE_OPTIONS.map((opt) => {
      const selected = opt.key === value;
      const count = opt.key === "ALL" ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[opt.key] ?? 0);
      return (
        <ButtonBase
          key={opt.key}
          onClick={() => onChange(opt.key)}
          aria-pressed={selected}
          sx={{
            px: 1.75,
            py: 1,
            borderRadius: 999,
            border: `1px solid ${selected ? PRIMARY : BORDER}`,
            bgcolor: selected ? PRIMARY : "#fff",
            color: selected ? "#fff" : TEXT,
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {opt.label}（{count}）
        </ButtonBase>
      );
    })}
  </Stack>
);

// 流す順序：同じ軸の単元を隣り合わせ、組が行の途中で割れないようにする。
const FLOW_ORDER = [
  "course-algorithm-breadth-first-search-v1",
  "course-algorithm-depth-first-search-v1",
  "course-algorithm-bubble-sort-v2",
  "course-algorithm-maze-digging-v1",
  "course-algorithm-wall-extension-v1",
  "course-algorithm-binary-search-v1",
  "course-algorithm-greedy-coins-v1",
];

const OTHER_IDS = [
  "course-algorithm-kmp-v1",
  "course-algorithm-selection-sort-v1",
  "course-algorithm-merge-sort-v1",
];

/**
 * 状態の印：バッジは学習中だけに付ける（2026-11-23、GPT指摘を受けた Kanato の判断）。
 * 完了のメダルバッジは外した。完了が学習中より目立ってしまう逆転が起きるのと、
 * 完了は緑の復習ボタンがすでに担っていて二重表現になるため。完了＝印なし。
 */
const StateMark: React.FC<{ unit: HomeUnit }> = ({ unit }) => {
  if (unit.status === "IN_PROGRESS") {
    return (
      <Box
        component="span"
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 1,
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.25,
          py: 0.75,
          borderRadius: 999,
          bgcolor: PRIMARY,
          color: "#fff",
          fontWeight: 800,
          fontSize: 14,
          lineHeight: 1,
          boxShadow: "0 2px 6px rgba(15, 40, 90, 0.35)",
        }}
      >
        <PlayArrowIcon sx={{ fontSize: 15 }} />
        学習中
      </Box>
    );
  }
  return null;
};

/**
 * 状態ボタン：カード下部に置く見た目上のボタン（遷移はカード全体のリンクが担う）。
 * 色は主色にそろえ、文言だけが変わる。状態の違いは印と進捗の形が担う。
 * 例外は完了だけ：復習ボタンは完了の緑にする（色は意味で統一）。
 */
const StateButton: React.FC<{ unit: HomeUnit }> = ({ unit }) => {
  const base = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    height: 42,
    borderRadius: 2,
    fontSize: 15,
    fontWeight: 700,
  } as const;
  if (unit.status === "COMPLETED") {
    return (
      <Box component="span" sx={{ ...base, bgcolor: GREEN, color: "#fff" }}>
        <ReplayIcon sx={{ fontSize: 19 }} />
        復習する
      </Box>
    );
  }
  if (unit.status === "IN_PROGRESS") {
    return (
      <Box component="span" sx={{ ...base, bgcolor: PRIMARY, color: "#fff" }}>
        <PlayArrowIcon sx={{ fontSize: 19 }} />
        続きから学ぶ
      </Box>
    );
  }
  return (
    <Box component="span" sx={{ ...base, bgcolor: PRIMARY, color: "#fff" }}>
      <PlayArrowIcon sx={{ fontSize: 19 }} />
      学習を始める
    </Box>
  );
};

const UnitCard: React.FC<{ unit: HomeUnit }> = ({ unit }) => {
  const mission = findUnitMission(unit.id);
  const scene = missionThumbnailFor(unit.id);
  const inProgress = unit.status === "IN_PROGRESS";
  return (
    <Paper
      component={Link}
      href={unit.href}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: inProgress ? `2px solid ${PRIMARY}` : `1px solid ${BORDER}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        textDecoration: "none",
        transition: "box-shadow 0.18s ease, transform 0.18s ease",
        "&:hover": { boxShadow: "0 8px 24px rgba(30, 64, 175, 0.18)", transform: "translateY(-2px)" },
      }}
    >
      <Box sx={{ position: "relative", height: 196, bgcolor: "#f6f9ff", flexShrink: 0 }}>
        <StateMark unit={unit} />
        {scene ?? (
          <Box sx={{ position: "absolute", inset: 0, p: 1.5 }}>
            <CourseThumbnail courseId={unit.id} />
          </Box>
        )}
        {inProgress && (
          <>
            {/* 進捗バーのラベル：何の進捗か（段階のどこまでか）を数字で添える */}
            <Box
              component="span"
              sx={{
                position: "absolute",
                right: 8,
                bottom: 12,
                zIndex: 1,
                px: 1,
                py: 0.375,
                borderRadius: 999,
                bgcolor: "rgba(255, 255, 255, 0.94)",
                border: `1px solid ${BORDER}`,
                color: TEXT,
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              段階 {unit.completedPhases}/{unit.totalPhases}
            </Box>
            <Box
              aria-label={`段階 ${unit.completedPhases}/${unit.totalPhases} まで完了`}
              sx={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, bgcolor: "#dbe3ef", zIndex: 1 }}
            >
              <Box sx={{ width: `${(unit.completedPhases / unit.totalPhases) * 100}%`, height: "100%", bgcolor: GREEN }} />
            </Box>
          </>
        )}
      </Box>
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1 }}>
        {GROUP_LABEL[unit.id] && <GroupChip label={GROUP_LABEL[unit.id]} />}
        <Typography fontSize={18} fontWeight={900} color={TEXT}>
          {unit.title}
        </Typography>
        {mission && (
          <Typography fontSize={16} fontWeight={700} color={TEXT} sx={{ mt: 0.5, lineHeight: 1.6 }}>
            {mission.title}
          </Typography>
        )}
        <Box sx={{ mt: "auto", pt: 2 }}>
          <StateButton unit={unit} />
        </Box>
      </Box>
    </Paper>
  );
};

const OtherCard: React.FC<{ course: CourseInfo }> = ({ course }) => (
  <Paper
    component={Link}
    href={`/courses/roadmap/${course.id}`}
    elevation={0}
    sx={{
      borderRadius: 3,
      border: `1px solid ${BORDER}`,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      textDecoration: "none",
      transition: "box-shadow 0.18s ease, transform 0.18s ease",
      "&:hover": { boxShadow: "0 8px 24px rgba(30, 64, 175, 0.18)", transform: "translateY(-2px)" },
    }}
  >
    <Box sx={{ position: "relative", height: 196, bgcolor: "#f6f9ff", flexShrink: 0 }}>
      <Box sx={{ position: "absolute", inset: 0, p: 1.5 }}>
        <CourseThumbnail courseId={course.id} />
      </Box>
    </Box>
    <Box sx={{ p: 2.5 }}>
      <Typography fontSize={18} fontWeight={900} color={TEXT}>
        {course.title}
      </Typography>
      <Typography
        fontSize={14}
        color={TEXT}
        sx={{
          mt: 0.5,
          lineHeight: 1.7,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {course.description}
      </Typography>
    </Box>
  </Paper>
);

const CardGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
      gap: 3,
      alignItems: "stretch",
    }}
  >
    {children}
  </Box>
);

export const CoursesDesignDraft: React.FC = () => {
  const { overview } = homeFixture;
  const unitById = new Map(overview.units.map((u) => [u.id, u]));
  const ratio = overview.totalUnits > 0 ? (overview.completedUnits / overview.totalUnits) * 100 : 0;
  const [axis, setAxis] = useState("すべて");
  const [stateFilter, setStateFilter] = useState("ALL");
  const stateCounts: Record<string, number> = {};
  for (const u of overview.units) {
    stateCounts[u.status] = (stateCounts[u.status] ?? 0) + 1;
  }
  const visibleUnits = FLOW_ORDER.map((id) => unitById.get(id)).filter(
    (u): u is HomeUnit =>
      !!u &&
      (axis === "すべて" || FILTER_GROUP[u.id] === axis) &&
      (stateFilter === "ALL" || u.status === stateFilter),
  );
  return (
    <Stack spacing={4}>
      <Box>
        <Typography component="h1" fontSize={24} fontWeight={900} color={TEXT}>
          コース一覧
        </Typography>
        <Paper elevation={0} sx={{ mt: 2, px: 3, py: 2, borderRadius: 3, border: `1px solid ${BORDER}` }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <Typography fontSize={16} fontWeight={700} color={TEXT} sx={{ whiteSpace: "nowrap" }}>
              全{overview.totalUnits}単元中 {overview.completedUnits}単元完了
            </Typography>
            <Box sx={{ flex: 1, width: "100%", height: 10, borderRadius: 999, bgcolor: "#e8eef7", overflow: "hidden" }}>
              <Box sx={{ width: `${ratio}%`, height: "100%", bgcolor: GREEN, borderRadius: 999 }} />
            </Box>
            <Typography fontSize={16} fontWeight={700} color={TEXT} sx={{ whiteSpace: "nowrap" }}>
              知識カード {overview.collectedCards}/{overview.totalCards} 枚
            </Typography>
          </Stack>
        </Paper>
      </Box>

      <Stack spacing={1.25}>
        <StateFilter value={stateFilter} onChange={setStateFilter} counts={stateCounts} />
        <AxisFilter value={axis} onChange={setAxis} />
      </Stack>

      <Box component="section" aria-label="単元">
        <CardGrid>
          {visibleUnits.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </CardGrid>
      </Box>

      <Box component="section" aria-label="その他のコース">
        <Typography component="h2" fontSize={18} fontWeight={900} color={TEXT} sx={{ mb: 2 }}>
          その他のコース
        </Typography>
        <CardGrid>
          {OTHER_IDS.map((id) => {
            const course = courseById.get(id);
            return course ? <OtherCard key={id} course={course} /> : null;
          })}
        </CardGrid>
      </Box>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${BORDER}` }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={18} fontWeight={900} color={TEXT}>
              発展ミッション
            </Typography>
            <Typography fontSize={14} color={TEXT} sx={{ mt: 0.75, lineHeight: 1.7 }}>
              単元で学んだアルゴリズムを、新しい課題で選んで使う挑戦です。目指すスコアを自分で決めて挑戦できます。
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/missions"
            variant="contained"
            disableElevation
            sx={{ alignSelf: { xs: "flex-start", md: "center" }, fontSize: 16, fontWeight: 700, px: 3.5, py: 1.25, borderRadius: 2, bgcolor: PRIMARY }}
          >
            発展ミッションを見る
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
};
