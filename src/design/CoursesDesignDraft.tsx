"use client";

// コース一覧（/courses）のデザイン下書き v2（2026-11-22、再設計への追随）。
// v1 からの変更は「見た目の強化」ではなく前提の更新：
// - グループ分けを課題軸に（グラフ探索／迷路生成／並び替え／配列の検索／貪欲法）
// - カードの顔を目標ミッションに（単元名は補助、ミッション文が主）
// - 進捗の分母を段階6に（段階7はミッション挑戦へ分離したため）
// - 「おすすめ」枠は置かない（単元は自由に選ぶ前提）
// - 最下段に発展ミッションへの入口を置く
// データは実カタログ（courses.json）とホームと同じ仮の利用者状態（homeFixture）、
// ミッション文は missionRegistry の下書きを使う。

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FlagIcon from "@mui/icons-material/Flag";
import Link from "next/link";

import { CourseThumbnail } from "@/app/courses/component/courseThumbnail";
import type { HomeUnit } from "@/api/home.api";
import coursesData from "@/design/data/courses.json";
import { homeFixture } from "@/design/fixtures";
import { findUnitMission } from "@/features/learning/app/missionRegistry";

const TEXT = "#111827";
const PRIMARY = "#2563eb";
const BORDER = "#dbe3ef";
const SEG_ON = "#2563eb";
const SEG_OFF = "#c3cede";

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

// 再設計後の進捗（段階は1〜6、ミッションは状態で持つ）。仮の利用者状態を
// homeFixture の status から写したもの。実データの形が決まれば差し替える。
type UnitProgress = { phasesDone: number; missionDone: boolean };
const progressOf = (unit: HomeUnit): UnitProgress => {
  if (unit.status === "COMPLETED") return { phasesDone: 6, missionDone: true };
  if (unit.status === "IN_PROGRESS") return { phasesDone: 3, missionDone: false };
  return { phasesDone: 0, missionDone: false };
};

const Segments: React.FC<{ done: number; total: number }> = ({ done, total }) => (
  <Stack direction="row" spacing={0.5} aria-hidden="true">
    {Array.from({ length: total }, (_, i) => (
      <Box
        key={i}
        sx={{
          flex: 1,
          height: 10,
          borderRadius: 999,
          bgcolor: i < done ? SEG_ON : "#fff",
          border: `1.5px solid ${i < done ? SEG_ON : SEG_OFF}`,
        }}
      />
    ))}
  </Stack>
);

const CardSlots: React.FC<{ owned: number; total: number }> = ({ owned, total }) => (
  <Stack direction="row" spacing={0.5} alignItems="center" aria-hidden="true">
    {Array.from({ length: total }, (_, i) => (
      <Box
        key={i}
        sx={{
          width: 15,
          height: 20,
          borderRadius: 0.75,
          bgcolor: i < owned ? "#dbeafe" : "#fff",
          border: `1.5px solid ${i < owned ? "#93c5fd" : "#c3cede"}`,
        }}
      />
    ))}
  </Stack>
);

const UnitCard: React.FC<{ unit: HomeUnit }> = ({ unit }) => {
  const mission = findUnitMission(unit.id);
  const progress = progressOf(unit);
  const inProgress = unit.status === "IN_PROGRESS";
  const completed = unit.status === "COMPLETED";
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: inProgress ? `2px solid ${PRIMARY}` : `1px solid ${BORDER}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ borderRadius: 2, bgcolor: "#f6f9ff", px: 2, py: 1.5, height: 132 }}>
        <CourseThumbnail courseId={unit.id} />
      </Box>
      <Typography fontSize={14} fontWeight={700} color={TEXT} sx={{ mt: 2 }}>
        {unit.title}
      </Typography>
      {mission && (
        <>
          <Typography fontSize={18} fontWeight={900} color={TEXT} sx={{ mt: 0.5, lineHeight: 1.5 }}>
            {mission.title}
          </Typography>
          <Typography
            fontSize={14}
            color={TEXT}
            sx={{
              mt: 0.75,
              lineHeight: 1.7,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {mission.description}
          </Typography>
        </>
      )}
      <Box sx={{ mt: 2 }}>
        <Segments done={progress.phasesDone} total={6} />
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.25 }}>
          <Typography fontSize={14} fontWeight={700} color={TEXT}>
            {completed
              ? "段階 6 / 6 完了"
              : inProgress
                ? `段階 ${progress.phasesDone} / 6 完了`
                : "まだ始めていません"}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <CardSlots owned={unit.collectedCards} total={unit.totalCards} />
            <Typography fontSize={14} color={TEXT}>
              {unit.collectedCards}/{unit.totalCards}
            </Typography>
          </Stack>
        </Stack>
        {completed && (
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
            <FlagIcon sx={{ fontSize: 18, color: PRIMARY }} />
            <Typography fontSize={14} fontWeight={700} color={TEXT}>
              ミッション達成済み
            </Typography>
          </Stack>
        )}
      </Box>
      <Box sx={{ flex: 1 }} />
      {inProgress ? (
        <Stack spacing={1} sx={{ mt: 2.5 }}>
          <Typography fontSize={14} fontWeight={700} color={TEXT}>
            次は『{unit.nextPhase}』
          </Typography>
          <Button
            component={Link}
            href={unit.resumeHref}
            variant="contained"
            disableElevation
            sx={{ alignSelf: "flex-start", fontSize: 16, fontWeight: 700, px: 3.5, py: 1.25, borderRadius: 2, bgcolor: PRIMARY }}
          >
            学習を再開する
          </Button>
        </Stack>
      ) : completed ? (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 2.5 }}>
          <CheckCircleIcon sx={{ fontSize: 20, color: PRIMARY }} />
          <Typography fontSize={14} fontWeight={700} color={TEXT}>
            完了しています
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button component={Link} href={unit.href} variant="text" sx={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>
            単元を見る
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2.5 }}>
          <Button component={Link} href={unit.href} variant="text" sx={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>
            単元を見る
          </Button>
        </Stack>
      )}
    </Paper>
  );
};

const OtherCard: React.FC<{ course: CourseInfo }> = ({ course }) => (
  <Paper
    elevation={0}
    sx={{ p: 3, borderRadius: 3, border: `1px solid ${BORDER}`, height: "100%", display: "flex", flexDirection: "column" }}
  >
    <Box sx={{ borderRadius: 2, bgcolor: "#f6f9ff", px: 2, py: 1.5, height: 132 }}>
      <CourseThumbnail courseId={course.id} />
    </Box>
    <Typography fontSize={18} fontWeight={900} color={TEXT} sx={{ mt: 2 }}>
      {course.title}
    </Typography>
    <Typography
      fontSize={14}
      color={TEXT}
      sx={{
        mt: 0.75,
        lineHeight: 1.7,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {course.description}
    </Typography>
    <Box sx={{ flex: 1 }} />
    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2.5 }}>
      <Button
        component={Link}
        href={`/courses/roadmap/${course.id}`}
        variant="text"
        sx={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}
      >
        コースを見る
      </Button>
    </Stack>
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
        <Paper elevation={0} sx={{ mt: 2, p: 3, borderRadius: 3, border: `1px solid ${BORDER}` }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} alignItems={{ md: "center" }}>
            <Typography fontSize={16} fontWeight={700} color={TEXT} sx={{ whiteSpace: "nowrap" }}>
              全{overview.totalUnits}単元中 {overview.completedUnits}単元完了
            </Typography>
            <Box sx={{ flex: 1, width: "100%", height: 12, borderRadius: 999, bgcolor: "#e8eef7", overflow: "hidden" }}>
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
