"use client";

// ホームの設計叩き台 v2（デザイン用）。方針5章「統一感の前提」の適用：
// - 面は3階層：S1＝全領域共通の基底（白・影なし・角丸と余白は統一）、S2＝強調は今日の狙いだけ
// - 領域ごとに「形のアンカー」：現在地＝道＋カード21枚の格子、狙い＝単元の図、
//   続き＝タイムライン＋引用（話者はマスコット）、復習＝問題の形、ストリーク＝曜日ドット＋炎、
//   掲示板＝マスコット＋タグ＋返信数のスレッド行
// - レイアウト：現在地は全幅、主ゾーン（狙い→続き→復習）＋副ゾーン（ストリーク→掲示板）
// - 単元の識別は色ではなく図で結ぶ。色は形と組でだけ使う

import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CheckIcon from "@mui/icons-material/Check";
import FlagIcon from "@mui/icons-material/Flag";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import type { HomeResponse, HomeUnit } from "@/api/home.api";
import { isMascotId } from "@/app/component/mascot";
import { MascotFigure } from "@/app/component/mascotFigure";
import { resolveReviewMaterial, reviewUnitName } from "@/features/learning/daily-review/reviewMaterials";
import { BinarySearchExecutionCanvas } from "@/features/learning/binary-search/execution/BinarySearchExecutionCanvas";
import type { BinarySearchExecutionCanvasState } from "@/features/learning/binary-search/execution/execution.types";

const PRIMARY = "#2563eb";
const STREAK_ORANGE = "#ea580c";
const LINE_DONE = "#2563eb";
const LINE_TODO = "#d7dee9";

const S1 = { bgcolor: "#fff", borderRadius: 3, p: { xs: 2.5, md: 3 }, boxShadow: "none" } as const;
const S2 = { bgcolor: "#e8effe", borderRadius: 3, p: { xs: 2.5, md: 3 }, boxShadow: "none" } as const;

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

function RegionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography component="h2" fontSize={14} fontWeight={900} color="text.secondary" sx={{ mb: 2 }}>
      {children}
    </Typography>
  );
}

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
            {index > 0 && <Box sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: prevDone || done ? LINE_DONE : LINE_TODO, mt: "34px", minWidth: 12 }} />}
            <Box component={Link} href={unit.href} sx={{ textDecoration: "none", color: "inherit", textAlign: "center", width: 92, flexShrink: 0 }}>
              <Typography variant="caption" fontWeight={800} color={showGroup ? "text.secondary" : "transparent"} sx={{ display: "block", height: 16 }}>
                {unit.group}
              </Typography>
              <Box sx={{ height: 18, display: "flex", justifyContent: "center" }}>{current && <FlagIcon sx={{ fontSize: 17, color: PRIMARY }} />}</Box>
              <Box
                sx={{
                  width: current ? 44 : 36,
                  height: current ? 44 : 36,
                  mx: "auto",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: done ? PRIMARY : "#fff",
                  border: `3px solid ${done || current ? PRIMARY : "#cbd5e1"}`,
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

// 知識カード21枚のミニ格子。行＝単元、列＝手に入る順（フェーズ2→5→7）。
// 所持はフェーズの完了から決まる（2以上で1枚目、5以上で2枚目、7で3枚目）。
// 所持セルの色は統一する（レアリティの色分けはコレクション画面の仕事）。
const OWNED_TONE = { bgcolor: "#dbeafe", border: "#93c5fd" };
function CardGrid({ units }: { units: HomeUnit[] }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.75 }} role="img" aria-label="知識カードの集まり具合">
      {units.map((unit) => {
        const owned = [unit.completedPhases >= 2, unit.completedPhases >= 5, unit.completedPhases >= 7];
        return (
          <Stack key={unit.id} spacing={0.75} alignItems="center">
            {owned.map((has, slot) => (
              <Box
                key={slot}
                sx={{
                  width: 22,
                  height: 30,
                  borderRadius: 0.75,
                  bgcolor: has ? OWNED_TONE.bgcolor : "#eef1f5",
                  border: has ? `2px solid ${OWNED_TONE.border}` : "2px solid #dde3ea",
                  display: "grid",
                  placeItems: "center",
                  color: "#64748b",
                }}
              >
                {has ? <CheckIcon sx={{ fontSize: 13 }} /> : null}
              </Box>
            ))}
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, lineHeight: 1.2, textAlign: "center" }}>
              {unit.title.replace(/（.*）/, "")}
            </Typography>
          </Stack>
        );
      })}
    </Box>
  );
}

function SegmentDots({ progress, goal }: { progress: number; goal: number }) {
  return (
    <Box sx={{ display: "flex", gap: 0.75 }} aria-label={`${progress} / ${goal}`}>
      {Array.from({ length: goal }, (_, i) => (
        <Box key={i} sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: i < progress ? PRIMARY : "transparent", border: `2px solid ${i < progress ? PRIMARY : "#b6c2d2"}` }} />
      ))}
    </Box>
  );
}

// 掲示板の行に要るタグと返信数は、ホームのAPIにまだ無いので叩き台では仮置きする。
const POST_META: Record<string, { tag: string; replies: number }> = {
  "design-post-1": { tag: "幅優先探索", replies: 3 },
  "design-post-2": { tag: "二分探索", replies: 1 },
};

// 復習の問題は実在の教材から引く（フィクスチャと同じキー）。
const reviewMaterial = resolveReviewMaterial({
  courseId: "course-algorithm-binary-search-v1",
  phaseKey: "binary-search-check",
  assessmentId: "binary-search-check",
  questionId: "first-center",
});

// 復習の設問が指す場面（範囲を出す前、25 を探し始める盤面）。回答用の盤面部品は
// ホームの小さい枠に合わないため、同じ盤面を説明用の図で見せる。
const reviewScene: BinarySearchExecutionCanvasState = {
  data: { kind: "binary-search-execution" },
  state: {
    values: [3, 7, 12, 19, 25, 31, 42],
    target: 25,
    lo: null,
    hi: null,
    mid: null,
    cells: ["in-range", "in-range", "in-range", "in-range", "in-range", "in-range", "in-range"],
  },
  highlights: [],
};

// フィードバックの「次の一歩」の引用。話者はマスコット。
function FeedbackQuote({ mascotId, nextStep }: { mascotId: string; nextStep: string }) {
  const id = isMascotId(mascotId) ? mascotId : "red-panda";
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <MascotFigure mascotId={id} state="face" alt="相棒" size="S" grounding="frame" />
      <Box sx={{ bgcolor: "#f1f5fb", borderLeft: `4px solid ${PRIMARY}`, borderRadius: 2, px: 2, py: 1.5, flex: 1 }}>
        <Typography variant="caption" fontWeight={800} color="text.secondary">
          前回のフィードバックの次の一歩
        </Typography>
        <Typography sx={{ mt: 0.25 }}>{nextStep}</Typography>
      </Box>
    </Box>
  );
}

export function HomeDesignDraft({ data, currentGoal, goalText }: { data: HomeResponse; review?: ReactNode; currentGoal?: ReactNode; goalText?: string }) {
  const { overview, today, resume, week, questions } = data;
  const mascotId = isMascotId(data.user.selectedMascotId) ? data.user.selectedMascotId : "red-panda";
  const current = today.recommended;
  // 再開先と推奨先が同じ単元なら、前回の続きは独立させず狙いの中の引用に畳む。
  const sameUnit = Boolean(resume && current && resume.id === current.id);

  return (
    <Stack spacing={3}>
      {/* (1) 現在地：全幅の帯。道＋カード格子 */}
      <Paper component="section" aria-label="現在地" elevation={0} sx={S1}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
          <Box sx={{ flex: "1 1 62%", minWidth: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
              <RegionTitle>現在地</RegionTitle>
              <Typography fontSize={14} fontWeight={800}>
                単元 {overview.completedUnits}/{overview.totalUnits} ・ カード {overview.collectedCards}/{overview.totalCards}
              </Typography>
            </Stack>
            <UnitPath units={overview.units} />
          </Box>
          <Box sx={{ flex: "1 1 38%", minWidth: 0 }}>
            <Typography fontSize={14} fontWeight={900} color="text.secondary" sx={{ mb: 2 }}>
              知識カード
            </Typography>
            <CardGrid units={overview.units} />
          </Box>
        </Stack>
      </Paper>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, alignItems: "flex-start" }}>
        {/* 主ゾーン */}
        <Stack spacing={3} sx={{ flex: "2 1 0", minWidth: 0, width: "100%" }}>
          {/* (2) 今日の狙い：S2 の強調。単元の図＋主ボタン1つ */}
          {current && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              aria-label="今日の狙い"
              style={{ background: S2.bgcolor, borderRadius: 12, padding: 24 }}
            >
              <RegionTitle>今日の狙い</RegionTitle>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                <Box sx={{ flex: "1 1 52%", minWidth: 0 }}>
                  <Box sx={{ bgcolor: "#f4f8ff", borderRadius: 3, px: 2, py: 1, height: 218 }}>
                    <BinarySearchExecutionCanvas canvas={binarySearchNow} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    25 を探し中。真ん中の 31 より小さいので、探す範囲は左側に絞られました
                  </Typography>
                </Box>
                <Box sx={{ flex: "1 1 48%", minWidth: 0 }}>
                  <Typography component="h3" fontSize={22} fontWeight={900}>
                    {current.title}
                  </Typography>
                  {current.nextPhase && (
                    <Typography sx={{ mt: 0.75 }}>次は『{current.nextPhase}』。中央の要素と探す値を比べる動きを、コードに写していきます。</Typography>
                  )}
                  <Button
                    component={Link}
                    href={current.status === "IN_PROGRESS" ? current.resumeHref : current.href}
                    variant="contained"
                    sx={{ mt: 2, bgcolor: PRIMARY, fontWeight: 900, px: 3, py: 1.25, borderRadius: 2.5 }}
                  >
                    {current.nextPhase ? `${current.nextPhase}へ` : "単元を見る"}
                  </Button>
                  <Stack spacing={1.5} sx={{ mt: 3 }}>
                    {today.nearAchievements.map((achievement) => (
                      <Stack key={achievement.id} direction="row" alignItems="center" spacing={1.5}>
                        <SegmentDots progress={achievement.progress} goal={achievement.goal} />
                        <Typography fontSize={14}>あと少しで『{achievementTitle(achievement.title)}』</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Stack>
              {sameUnit && resume?.nextStep && (
                <Box sx={{ mt: 3 }}>
                  <FeedbackQuote mascotId={mascotId} nextStep={resume.nextStep} />
                </Box>
              )}
            </motion.section>
          )}
          {/* 大目標は「目標の文」だけの細い帯にする。進み具合は現在地の道が担う */}
          {data.hasInProgressUnit &&
            (goalText ? (
              <Paper component="section" aria-label="いまの目標" elevation={0} sx={{ ...S1, py: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <FlagIcon sx={{ color: PRIMARY, fontSize: 22 }} />
                  <Typography fontWeight={800} color="text.secondary">
                    いまの目標
                  </Typography>
                  <Typography fontWeight={900} fontSize={16}>
                    {goalText}
                  </Typography>
                </Stack>
              </Paper>
            ) : (
              currentGoal
            ))}

          {/* (3) 前回の続き：再開先が推奨先と違う単元の時だけ独立させる */}
          {resume && !sameUnit && (
            <Paper component="section" aria-label="前回の続き" elevation={0} sx={S1}>
              <RegionTitle>前回の続き</RegionTitle>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: PRIMARY, flexShrink: 0 }} />
                  <Box sx={{ width: 3, flex: 1, bgcolor: LINE_TODO, borderRadius: 2, mt: 0.5 }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", border: `3px solid ${PRIMARY}`, bgcolor: "#fff", flexShrink: 0 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={900}>
                    {resume.title}（{resume.nextPhase ?? "単元の最終結果"}から）
                  </Typography>
                  {resume.nextStep && (
                    <Box sx={{ mt: 1.75 }}>
                      <FeedbackQuote mascotId={mascotId} nextStep={resume.nextStep} />
                    </Box>
                  )}
                  <Button component={Link} href={resume.resumeHref} variant="outlined" sx={{ mt: 2, borderColor: PRIMARY, color: PRIMARY, fontWeight: 900 }}>
                    前回の続きに戻る
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}

          {/* (4) 今日の復習：問題の形（設問と図）。答えるのは専用画面 */}
          {reviewMaterial && (
            <Paper component="section" aria-label="今日の復習" elevation={0} sx={S1}>
              <RegionTitle>今日の復習</RegionTitle>
              <Typography fontWeight={900} fontSize={17}>
                {reviewMaterial.question.prompt}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {reviewUnitName(reviewMaterial.courseId)} ・ 動きの確認問題から
              </Typography>
              <Box sx={{ height: 190, mt: 1.5, borderRadius: 3, bgcolor: "#fbfcfe", px: 2, py: 1 }}>
                <BinarySearchExecutionCanvas canvas={reviewScene} />
              </Box>
              <Button component={Link} href="/daily-review" variant="contained" sx={{ mt: 2, bgcolor: PRIMARY, fontWeight: 900 }}>
                復習する
              </Button>
            </Paper>
          )}
        </Stack>

        {/* 副ゾーン */}
        <Stack spacing={3} sx={{ flex: "1 1 0", minWidth: 0, width: "100%" }}>
          {/* (5) ストリーク：曜日ドット＋炎。橙は専用 */}
          <Paper component="section" aria-label="学習ストリーク" elevation={0} sx={S1}>
            <RegionTitle>学習ストリーク</RegionTitle>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocalFireDepartmentIcon sx={{ color: STREAK_ORANGE, fontSize: 30 }} />
              <Typography fontSize={24} fontWeight={900}>
                {week.streakDays}日連続
              </Typography>
            </Stack>
            <Stack direction="row" gap={1} sx={{ mt: 2 }}>
              {week.days.map((day) => (
                <Stack key={day.date} alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                  <Box
                    aria-label={`${day.date} ${day.learned ? "学習済み" : "学習記録なし"}${day.isToday ? " 今日" : ""}`}
                    sx={{
                      width: 32,
                      height: 32,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "50%",
                      bgcolor: day.learned ? "#ffedd5" : "#eef1f5",
                      color: day.learned ? STREAK_ORANGE : "#94a3b8",
                      border: day.isToday ? `2px solid ${STREAK_ORANGE}` : "2px solid transparent",
                      fontSize: 12.5,
                      fontWeight: 800,
                    }}
                  >
                    {day.learned ? <LocalFireDepartmentIcon sx={{ fontSize: 17 }} /> : Number(day.date.slice(8))}
                  </Box>
                  <Typography variant="caption" fontWeight={day.isToday ? 900 : 600} color={day.isToday ? "text.primary" : "text.secondary"}>
                    {day.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          {/* (6) 掲示板：スレッドの行 */}
          {questions.length > 0 && (
            <Paper component="section" aria-label="掲示板の新着質問" elevation={0} sx={S1}>
              <RegionTitle>掲示板の新着質問</RegionTitle>
              <Stack divider={<Divider flexItem />}>
                {questions.map((question) => {
                  const meta = POST_META[question.id];
                  return (
                    <Box key={question.id} component={Link} href={question.href} sx={{ display: "flex", gap: 1.5, py: 1.75, textDecoration: "none", color: "inherit", alignItems: "flex-start" }}>
                      <Box component="img" src="/images/mascots/red-panda/face.png" alt="" sx={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", bgcolor: "#eef1f5", flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={800} sx={{ lineHeight: 1.45 }}>
                          {question.title}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                          {meta && <Chip label={meta.tag} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />}
                          <Typography variant="caption" color="text.secondary">
                            {new Date(question.createdAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                          </Typography>
                        </Stack>
                      </Box>
                      {meta && (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary", flexShrink: 0 }}>
                          <ChatBubbleOutlineIcon sx={{ fontSize: 17 }} />
                          <Typography fontSize={13.5} fontWeight={800}>
                            {meta.replies}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  );
                })}
              </Stack>
              <Button component={Link} href="/quest-board" sx={{ color: PRIMARY, fontWeight: 800, mt: 1, px: 0.5 }}>
                掲示板へ
              </Button>
            </Paper>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
