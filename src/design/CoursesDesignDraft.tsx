"use client";

// コース一覧（/courses）のデザイン下書き v3（2026-11-22）。
// この画面の目的は「次に学ぶものを選ぶ画面」。v3 の転換点はサムネイル主役：
// - カードは図を全面に大きく置き、テキストは単元名とミッションの題だけに絞る
// - 進捗バー・知識カード数・説明文はカードから落とす（管理情報はホームと単元画面の仕事）
// - 状態は2か所で表す：サムネの上の印（学習中チップ／完了＝メダルのバッジ）と、
//   カード下部の状態ボタン。ボタンは文字を読まなくても色と形で状態が分かること
//   （2026-11-23 Kanato）：未着手＝青＋▶、学習中＝青＋段階の目盛り、完了＝緑＋円の矢印。
//   グレーは操作できない状態だけに使う（完了に淡色を使うと「押せない」と読まれる）。
//   ボタンはカード全体リンクの中の見た目上のボタン（遷移はカード全体が担う）。
// - カード全体が単元画面へのリンク
// グループ分けは課題軸のまま（グループ自体が「同じ課題への別解法」という内容を持つため）。
// BFS のサムネだけ、目標ミッションの場面を描いた試作（MissionThumbnail）に差し替えてある。

import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
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

type CourseInfo = { id: string; title: string; description: string };
const courseById = new Map((coursesData as CourseInfo[]).map((c) => [c.id, c]));

// 課題軸のグループ（2026-11-21 決定）。貪欲法は手法軸のため単独で置く。
const GROUPS: { label: string; ids: string[] }[] = [
  { label: "グラフ探索", ids: ["course-algorithm-breadth-first-search-v1", "course-algorithm-depth-first-search-v1"] },
  { label: "迷路生成", ids: ["course-algorithm-maze-digging-v1", "course-algorithm-wall-extension-v1"] },
  { label: "並び替え", ids: ["course-algorithm-bubble-sort-v2"] },
  { label: "配列の検索", ids: ["course-algorithm-binary-search-v1"] },
  { label: "貪欲法", ids: ["course-algorithm-greedy-coins-v1"] },
];

const OTHER_IDS = [
  "course-algorithm-kmp-v1",
  "course-algorithm-selection-sort-v1",
  "course-algorithm-merge-sort-v1",
];

/** 完了バッジ：メダル（円＋リボン＋✓）。達成したことを称える印。文字に頼らない。 */
const CompletionBadge: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 52 60"
    aria-label="ミッション達成"
    sx={{
      position: "absolute",
      top: 8,
      right: 10,
      zIndex: 1,
      width: 50,
      height: 58,
      transform: "rotate(-8deg)",
      filter: "drop-shadow(0 2px 4px rgba(15, 40, 90, 0.35))",
    }}
  >
    <polygon points="15,32 9,56 21,49 25,38" fill="#1e40af" />
    <polygon points="37,32 43,56 31,49 27,38" fill="#1e40af" />
    <circle cx="26" cy="24" r="19" fill="#2563eb" stroke="#ffffff" strokeWidth="3" />
    <path d="M17 24 l6.5 6.5 L35 18" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
  </Box>
);

const StateMark: React.FC<{ unit: HomeUnit }> = ({ unit }) => {
  if (unit.status === "COMPLETED") {
    return <CompletionBadge />;
  }
  if (unit.status === "IN_PROGRESS") {
    return (
      <Chip
        label="学習中"
        size="small"
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 1,
          bgcolor: "#fff",
          color: PRIMARY,
          border: `1.5px solid ${PRIMARY}`,
          fontWeight: 800,
          fontSize: 14,
          height: 28,
          boxShadow: "0 1px 4px rgba(15, 40, 90, 0.25)",
        }}
      />
    );
  }
  return null;
};

/**
 * 状態ボタン：カード下部に置く見た目上のボタン（遷移はカード全体のリンクが担う）。
 * 文字を読まなくても状態が分かるように、一般的なマークと色の役割で分ける：
 * 未着手＝青＋▶／学習中＝青＋段階の目盛り（白）／完了＝緑＋円の矢印。
 * グレーは操作できない状態だけに使うので、完了には使わない。
 */
const REVIEW_GREEN = "#16a34a";

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
      <Box component="span" sx={{ ...base, bgcolor: REVIEW_GREEN, color: "#fff" }}>
        <ReplayIcon sx={{ fontSize: 19 }} />
        復習する
      </Box>
    );
  }
  if (unit.status === "IN_PROGRESS") {
    return (
      <Box component="span" sx={{ ...base, bgcolor: PRIMARY, color: "#fff" }}>
        <Stack direction="row" spacing={0.5} aria-label={`段階 ${unit.completedPhases}/${unit.totalPhases} まで完了`}>
          {Array.from({ length: unit.totalPhases }, (_, i) => (
            <Box
              key={i}
              sx={{
                width: 18,
                height: 8,
                borderRadius: 999,
                bgcolor: i < unit.completedPhases ? "#fff" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </Stack>
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
      </Box>
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1 }}>
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
              <Box sx={{ width: `${ratio}%`, height: "100%", bgcolor: PRIMARY, borderRadius: 999 }} />
            </Box>
            <Typography fontSize={16} fontWeight={700} color={TEXT} sx={{ whiteSpace: "nowrap" }}>
              知識カード {overview.collectedCards}/{overview.totalCards} 枚
            </Typography>
          </Stack>
        </Paper>
      </Box>

      {GROUPS.map((group) => {
        const groupUnits = group.ids
          .map((id) => unitById.get(id))
          .filter((u): u is HomeUnit => !!u);
        if (groupUnits.length === 0) return null;
        return (
          <Box key={group.label} component="section" aria-label={group.label}>
            <Typography component="h2" fontSize={18} fontWeight={900} color={TEXT} sx={{ mb: 2 }}>
              {group.label}
            </Typography>
            <CardGrid>
              {groupUnits.map((unit) => (
                <UnitCard key={unit.id} unit={unit} />
              ))}
            </CardGrid>
          </Box>
        );
      })}

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
