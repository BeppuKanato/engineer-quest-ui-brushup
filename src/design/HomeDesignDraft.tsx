"use client";

// ホームの設計叩き台（デザイン用）。方針の適用：
// - 単元の図を主役にする（今日の狙いに二分探索の図）
// - 進捗は形で見せる（単元の道、実績の丸、カードの枠）。数字は脇に小さく
// - 枠は「行動できるひとかたまり」だけ（今日の狙い）。他は余白と並びで分ける
// - マスコットは今日の狙いを自分の言葉で渡す（中身は状態から組み立てる）
// - ボタンは行き先を書く。色はプレイヤーの青（#2563eb）に統一する案

import CheckIcon from "@mui/icons-material/Check";
import FlagIcon from "@mui/icons-material/Flag";
import { Box, Button, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import type { HomeResponse, HomeUnit } from "@/api/home.api";
import { isMascotId } from "@/app/component/mascot";
import { MascotFigure } from "@/app/component/mascotFigure";
import { BinarySearchExecutionCanvas } from "@/features/learning/binary-search/execution/BinarySearchExecutionCanvas";
import type { BinarySearchExecutionCanvasState } from "@/features/learning/binary-search/execution/execution.types";

const PRIMARY = "#2563eb";
const LINE_DONE = "#2563eb";
const LINE_TODO = "#d7dee9";

// 二分探索の「いまの盤面」：25 を探して範囲が右半分に絞られ、中央を見ているところ。
// 教材の主データ（values / target）と同じ値を使う。
const binarySearchNow: BinarySearchExecutionCanvasState = {
  data: { kind: "binary-search-execution" },
  state: {
    values: [3, 7, 12, 19, 25, 31, 42],
    target: 25,
    lo: 4,
    hi: 6,
    mid: 5,
    cells: ["discarded", "discarded", "discarded", "discarded", "remaining", "center", "remaining"],
  },
  highlights: [],
};

const achievementTitle = (title: string) => title.replace(/Lv\.(\d+)/g, "第$1段階");

function UnitPath({ units }: { units: HomeUnit[] }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", overflowX: "auto", pb: 0.5, px: 0.5 }}>
      {units.map((unit, index) => {
        const done = unit.status === "COMPLETED";
        const current = unit.status === "IN_PROGRESS";
        const prevDone = index > 0 && units[index - 1].status === "COMPLETED";
        const showGroup = index === 0 || units[index - 1].group !== unit.group;
        return (
          <Box key={unit.id} sx={{ display: "flex", alignItems: "flex-start", flex: index === 0 ? "0 0 auto" : "1 1 0", minWidth: 0 }}>
            {index > 0 && (
              <Box sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: prevDone || done ? LINE_DONE : LINE_TODO, mt: "34px", minWidth: 12 }} />
            )}
            <Box component={Link} href={unit.href} sx={{ textDecoration: "none", color: "inherit", textAlign: "center", width: 92, flexShrink: 0 }}>
              <Typography variant="caption" fontWeight={800} color={showGroup ? "text.secondary" : "transparent"} sx={{ display: "block", height: 16 }}>
                {unit.group}
              </Typography>
              <Box sx={{ height: 18, display: "flex", justifyContent: "center" }}>
                {current && <FlagIcon sx={{ fontSize: 17, color: PRIMARY }} />}
              </Box>
              <Box
                sx={{
                  width: current ? 44 : 36,
                  height: current ? 44 : 36,
                  mx: "auto",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: done ? PRIMARY : "#fff",
                  border: current ? `3px solid ${PRIMARY}` : done ? `3px solid ${PRIMARY}` : "3px solid #cbd5e1",
                  color: done ? "#fff" : PRIMARY,
                  fontWeight: 900,
                  fontSize: current ? 16 : 14,
                }}
              >
                {done ? <CheckIcon sx={{ fontSize: 20 }} /> : current ? `${unit.completedPhases}` : ""}
              </Box>
              <Typography fontSize={12.5} fontWeight={current ? 900 : 700} sx={{ mt: 0.75, lineHeight: 1.35 }}>
                {unit.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {done ? "完了" : current ? `${unit.completedPhases}/${unit.totalPhases} 進んだ` : "まだ"}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function SegmentDots({ progress, goal }: { progress: number; goal: number }) {
  return (
    <Box sx={{ display: "flex", gap: 0.75 }} aria-label={`${progress} / ${goal}`}>
      {Array.from({ length: goal }, (_, i) => (
        <Box key={i} sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: i < progress ? PRIMARY : "transparent", border: `2px solid ${i < progress ? PRIMARY : "#cbd5e1"}` }} />
      ))}
    </Box>
  );
}

function CardSlots({ collected, total }: { collected: number; total: number }) {
  return (
    <Box sx={{ display: "flex", gap: 0.75 }} aria-label={`カード ${collected} / ${total} 枚`}>
      {Array.from({ length: total }, (_, i) => (
        <Box
          key={i}
          sx={{
            width: 20,
            height: 28,
            borderRadius: 0.75,
            bgcolor: i < collected ? "#0f766e" : "transparent",
            border: i < collected ? "2px solid #0f766e" : "2px dashed #94a3b8",
          }}
        />
      ))}
    </Box>
  );
}

export function HomeDesignDraft({ data, review, currentGoal }: { data: HomeResponse; review?: ReactNode; currentGoal?: ReactNode }) {
  const { overview, today, resume, week, questions } = data;
  const mascotId = isMascotId(data.user.selectedMascotId) ? data.user.selectedMascotId : "red-panda";
  const current = today.recommended;
  const nearest = [...today.nearAchievements].sort((a, b) => a.goal - a.progress - (b.goal - b.progress))[0];

  const speechLines: string[] = [];
  if (current?.status === "IN_PROGRESS" && current.nextPhase) {
    speechLines.push(`「${current.title}」の途中だね。次は『${current.nextPhase}』から始めよう。`);
  } else if (current) {
    speechLines.push(`次は「${current.title}」がおすすめだよ。`);
  }
  if (nearest) {
    speechLines.push(`実績『${achievementTitle(nearest.title)}』まで、あと${nearest.goal - nearest.progress}つだよ。`);
  }

  return (
    <Stack spacing={4.5}>
      {/* 現在地：枠なし。マスコットの言葉＋単元の道（形の進捗） */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} aria-label="現在地">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems={{ sm: "center" }}>
          <MascotFigure mascotId={mascotId} state="normal" alt="ユーザーの相棒" size="M" grounding="disc" motion="float" />
          <Box
            sx={{
              position: "relative",
              bgcolor: "#fff",
              borderRadius: 3,
              px: 2.25,
              py: 1.75,
              maxWidth: 560,
              boxShadow: "0 1px 4px rgba(15, 23, 42, 0.08)",
            }}
          >
            {speechLines.map((line) => (
              <Typography key={line} fontSize={15.5} fontWeight={700} sx={{ lineHeight: 1.65 }}>
                {line}
              </Typography>
            ))}
            <Typography variant="caption" color="text.secondary">
              {data.user.displayName?.trim() || "エンジニア"}さんの現在地
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Box sx={{ textAlign: { sm: "right" } }}>
            <Typography fontSize={15} fontWeight={800}>
              単元 {overview.completedUnits}/{overview.totalUnits} ・ カード {overview.collectedCards}/{overview.totalCards}
            </Typography>
            <Button component={Link} href="/courses" sx={{ color: PRIMARY, fontWeight: 800, px: 0.5 }}>
              単元一覧へ
            </Button>
          </Box>
        </Stack>
        <Box sx={{ mt: 2.5 }}>
          <UnitPath units={overview.units} />
        </Box>
      </motion.section>

      {/* 今日の狙い：行動できるひとかたまりなので、ここだけ柔らかい面を持つ */}
      {current && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          aria-label="今日の狙い"
          style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(15, 23, 42, 0.06)" }}
        >
          <Typography component="h2" fontSize={14} fontWeight={900} color="text.secondary" sx={{ mb: 2 }}>
            今日の狙い
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Box sx={{ flex: "1 1 52%", minWidth: 0, bgcolor: "#f4f8ff", borderRadius: 3, px: 2, py: 1, height: 218 }}>
              <BinarySearchExecutionCanvas canvas={binarySearchNow} />
            </Box>
            <Box sx={{ flex: "1 1 48%", minWidth: 0 }}>
              <Typography component="h3" fontSize={22} fontWeight={900}>
                {current.title}
              </Typography>
              {current.nextPhase && (
                <Typography sx={{ mt: 0.75 }}>
                  次は『{current.nextPhase}』。中央の要素と探す値を比べる動きを、コードに写していきます。
                </Typography>
              )}
              <Button
                component={Link}
                href={current.status === "IN_PROGRESS" ? current.resumeHref : current.href}
                variant="contained"
                sx={{ mt: 2, bgcolor: PRIMARY, fontWeight: 900, px: 3, py: 1.25, borderRadius: 2.5 }}
              >
                {current.nextPhase ? `${current.nextPhase}へ` : "単元を見る"}
              </Button>
              <Stack spacing={1.75} sx={{ mt: 3 }}>
                {today.nearAchievements.map((achievement) => (
                  <Stack key={achievement.id} direction="row" alignItems="center" spacing={1.5}>
                    <SegmentDots progress={achievement.progress} goal={achievement.goal} />
                    <Typography fontSize={14}>
                      あと少しで『{achievementTitle(achievement.title)}』
                    </Typography>
                  </Stack>
                ))}
                {today.nearCards.map((unit) => (
                  <Stack key={unit.id} direction="row" alignItems="center" spacing={1.5}>
                    <CardSlots collected={unit.collectedCards} total={unit.totalCards} />
                    <Typography fontSize={14}>「{unit.title}」のカード、あと{unit.totalCards - unit.collectedCards}枚で揃う</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>
          {data.hasInProgressUnit && currentGoal && <Box sx={{ mt: 2.5 }}>{currentGoal}</Box>}
        </motion.section>
      )}

      {/* 前回の続き：枠なしの1行。次の一歩を全文で拾う */}
      {resume && (
        <section aria-label="前回の続き">
          <Typography component="h2" fontSize={14} fontWeight={900} color="text.secondary" sx={{ mb: 1 }}>
            前回の続き
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={900}>{resume.title}（{resume.nextPhase ?? "単元の最終結果"}から）</Typography>
              {resume.nextStep && (
                <Typography sx={{ mt: 0.5, color: "#475569" }}>前回の次の一歩：{resume.nextStep}</Typography>
              )}
            </Box>
            <Button component={Link} href={resume.resumeHref} variant="outlined" sx={{ borderColor: PRIMARY, color: PRIMARY, fontWeight: 900, flexShrink: 0 }}>
              前回の続きに戻る
            </Button>
          </Stack>
        </section>
      )}

      {review}

      {/* 学習ストリーク：枠なし。今週の丸はもともと形の表示 */}
      <section aria-label="学習ストリーク">
        <Stack direction={{ xs: "column", sm: "row" }} gap={2.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
          <Typography fontSize={15}>
            <Box component="span" fontWeight={900} fontSize={20}>{week.streakDays}日連続</Box>
            <Box component="span" color="text.secondary"> で学習中。今週の学習日</Box>
          </Typography>
          <Stack direction="row" gap={{ xs: 1, sm: 1.75 }}>
            {week.days.map((day) => (
              <Stack key={day.date} alignItems="center" spacing={0.5}>
                <Box
                  aria-label={`${day.date} ${day.learned ? "学習済み" : "学習記録なし"}${day.isToday ? " 今日" : ""}`}
                  sx={{
                    width: 34,
                    height: 34,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    bgcolor: day.learned ? PRIMARY : "#e8edf4",
                    color: day.learned ? "#fff" : "#64748b",
                    border: day.isToday ? `2px solid ${PRIMARY}` : "2px solid transparent",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {day.learned ? <CheckIcon sx={{ fontSize: 18 }} /> : Number(day.date.slice(8))}
                </Box>
                <Typography variant="caption" fontWeight={day.isToday ? 900 : 600} color={day.isToday ? "text.primary" : "text.secondary"}>
                  {day.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </section>

      {/* 掲示板：枠なしの並び */}
      {questions.length > 0 && (
        <section aria-label="掲示板の新着質問">
          <Typography component="h2" fontSize={14} fontWeight={900} color="text.secondary" sx={{ mb: 1.5 }}>
            掲示板の新着質問
          </Typography>
          <Stack spacing={1.25}>
            {questions.map((question) => (
              <Box key={question.id} component={Link} href={question.href} sx={{ display: "flex", justifyContent: "space-between", gap: 2, textDecoration: "none", color: "inherit" }}>
                <Typography fontWeight={800}>{question.title}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                  {new Date(question.createdAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                </Typography>
              </Box>
            ))}
          </Stack>
        </section>
      )}
    </Stack>
  );
}
