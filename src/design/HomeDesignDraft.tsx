"use client";

// ホームの設計叩き台 v5（デザイン用）。
// 目的（2026-11-20 確認）：開いてすぐに学習を再開できる画面。
// - 最上段は「今日の狙い」（再開の領域）。目標は狙いの上位目的として中に入れる
// - 狙いの図は「次の段階の教材の形」（二分探索なら図とコードの対応）で予告する
// - 現在地は単元の道だけにし、知識カードの格子は副ゾーンの独立した領域に分ける
//   （格子の列＝カードが手に入る段階、行＝単元。意味が読める形にする）
// - 復習は設問とボタンだけの compact な領域にする
// - 面は S1 共通基底、強調（S2）は狙いだけ。文字は役割の5種、見出しは本文色

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
import { BinarySearchCodeMappingCanvas } from "@/features/learning/binary-search/code-mapping/BinarySearchCodeMappingCanvas";
import { binarySearchCodeMappingContent } from "@/features/learning/binary-search/code-mapping/codeMapping.content";

const PRIMARY = "#2563eb";
const STREAK_ORANGE = "#ea580c";
const LINE_DONE = "#2563eb";
const LINE_TODO = "#d7dee9";

const S1 = { bgcolor: "#fff", borderRadius: 3, p: { xs: 2.5, md: 3 }, boxShadow: "none" } as const;
const S2 = { bgcolor: "#e8effe", borderRadius: 3, p: { xs: 2.5, md: 3 }, boxShadow: "none" } as const;

const achievementTitle = (title: string) => title.replace(/Lv\.(\d+)/g, "第$1段階");

function RegionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography component="h2" fontSize={16} fontWeight={900} sx={{ mb: 2 }}>
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
              <Typography fontSize={14} fontWeight={current ? 900 : 700} sx={{ mt: 0.75, lineHeight: 1.35 }}>
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

// 知識カードの集まり具合。行＝単元、列＝手に入る段階（動きの説明／コードの確認問題／自分で実装）。
// 所持はフェーズの完了から決まる（2以上で1枚目、5以上で2枚目、7で3枚目）。色は統一。
const OWNED_TONE = { bgcolor: "#dbeafe", border: "#93c5fd" };
const SLOT_LABELS = ["説明", "確認", "実装"];
function CardCollection({ units, collected, total }: { units: HomeUnit[]; collected: number; total: number }) {
  return (
    <Paper component="section" aria-label="知識カード" elevation={0} sx={S1}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
        <Typography component="h2" fontSize={16} fontWeight={900}>
          知識カード
        </Typography>
        <Typography fontSize={14} fontWeight={800}>
          {collected}/{total}
        </Typography>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: "64px repeat(3, 1fr)", rowGap: 1, alignItems: "center" }}>
        <Box />
        {SLOT_LABELS.map((label) => (
          <Typography key={label} variant="caption" color="text.secondary" fontWeight={800} sx={{ textAlign: "center" }}>
            {label}
          </Typography>
        ))}
        {units.map((unit) => {
          const owned = [unit.completedPhases >= 2, unit.completedPhases >= 5, unit.completedPhases >= 7];
          return [
            <Typography key={`${unit.id}-name`} fontSize={12} fontWeight={700} sx={{ pr: 1, lineHeight: 1.3 }}>
              {unit.title.replace(/（.*）/, "")}
            </Typography>,
            ...owned.map((has, slot) => (
              <Box key={`${unit.id}-${slot}`} sx={{ display: "flex", justifyContent: "center" }}>
                <Box
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
              </Box>
            )),
          ];
        })}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
        カードは各段階を終えると手に入ります
      </Typography>
      <Button component={Link} href="/collection" sx={{ color: PRIMARY, fontWeight: 800, mt: 1, px: 0.5 }}>
        コレクションへ
      </Button>
    </Paper>
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

// フィードバックの「次の一歩」の引用。話者はマスコット。
function FeedbackQuote({ mascotId, nextStep }: { mascotId: string; nextStep: string }) {
  const id = isMascotId(mascotId) ? mascotId : "red-panda";
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <MascotFigure mascotId={id} state="face" alt="相棒" size="S" grounding="frame" />
      <Box sx={{ bgcolor: "#f1f5fb", borderLeft: `4px solid ${PRIMARY}`, borderRadius: 2, px: 2, py: 1.5, flex: 1 }}>
        <Typography fontSize={12} fontWeight={800}>
          前回のフィードバックの次の一歩
        </Typography>
        <Typography fontSize={14} sx={{ mt: 0.25 }}>{nextStep}</Typography>
      </Box>
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

// 狙いの予告は「次の段階（動きとコードの対応）」の実在のステップから引く。
const aimStep = binarySearchCodeMappingContent.steps.find((step) => step.id === "if-hit-2");

export function HomeDesignDraft({ data, currentGoal, goalText }: { data: HomeResponse; review?: ReactNode; currentGoal?: ReactNode; goalText?: string }) {
  const { overview, today, resume, week, questions } = data;
  const mascotId = isMascotId(data.user.selectedMascotId) ? data.user.selectedMascotId : "red-panda";
  const current = today.recommended;
  // 再開先と推奨先が同じ単元なら、前回の続きは独立させず狙いの中の引用に畳む。
  const sameUnit = Boolean(resume && current && resume.id === current.id);

  return (
    <Stack spacing={3}>
      {/* (1) 今日の狙い：最上段。S2 の強調。目標は上位目的として中に入れる */}
      {current && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          aria-label="今日の狙い"
          style={{ background: S2.bgcolor, borderRadius: 12, padding: 24 }}
        >
          {goalText && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <FlagIcon sx={{ color: PRIMARY, fontSize: 19 }} />
              <Typography fontSize={14} fontWeight={800}>
                目標
              </Typography>
              <Typography fontSize={14} fontWeight={900}>
                {goalText}
              </Typography>
            </Stack>
          )}
          <RegionTitle>今日の狙い</RegionTitle>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3} justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h3" fontSize={22} fontWeight={900}>
                {current.title}
              </Typography>
              {current.nextPhase && (
                <Typography fontSize={14} sx={{ mt: 0.75 }}>次は『{current.nextPhase}』。中央の要素と探す値を比べる動きを、コードに写していきます。</Typography>
              )}
              <Button
                component={Link}
                href={current.status === "IN_PROGRESS" ? current.resumeHref : current.href}
                variant="contained"
                sx={{ mt: 2, bgcolor: PRIMARY, fontWeight: 900, px: 3, py: 1.25, borderRadius: 2.5 }}
              >
                {current.nextPhase ? `${current.nextPhase}へ` : "単元を見る"}
              </Button>
            </Box>
            <Stack spacing={1.5} sx={{ pt: { sm: 1 } }}>
              {today.nearAchievements.map((achievement) => (
                <Stack key={achievement.id} direction="row" alignItems="center" spacing={1.5}>
                  <SegmentDots progress={achievement.progress} goal={achievement.goal} />
                  <Typography fontSize={14}>あと少しで『{achievementTitle(achievement.title)}』</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
          {/* 予告は次の段階の教材そのもの（図とコードの対応）。幅が要るので領域の全幅で見せる */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ bgcolor: "#f4f8ff", borderRadius: 3, px: 2, py: 1.5, height: { xs: 300, md: 330 } }}>
              {aimStep && <BinarySearchCodeMappingCanvas canvas={aimStep.canvas} />}
            </Box>
            {aimStep && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                次の段階の様子：{aimStep.caption}
              </Typography>
            )}
          </Box>
          {sameUnit && resume?.nextStep && (
            <Box sx={{ mt: 3 }}>
              <FeedbackQuote mascotId={mascotId} nextStep={resume.nextStep} />
            </Box>
          )}
        </motion.section>
      )}
      {!goalText && data.hasInProgressUnit && currentGoal}

      {/* (2) 現在地：単元の道だけ */}
      <Paper component="section" aria-label="現在地" elevation={0} sx={S1}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
          <RegionTitle>現在地</RegionTitle>
          <Typography fontSize={14} fontWeight={800}>
            単元 {overview.completedUnits}/{overview.totalUnits} ・ カード {overview.collectedCards}/{overview.totalCards}
          </Typography>
        </Stack>
        <UnitPath units={overview.units} />
      </Paper>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, alignItems: "flex-start" }}>
        {/* 主ゾーン */}
        <Stack spacing={3} sx={{ flex: "2 1 0", minWidth: 0, width: "100%" }}>
          {/* 前回の続き：再開先が推奨先と違う単元の時だけ独立させる */}
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

          {/* (3) 今日の復習：設問とボタンだけの compact な領域 */}
          {reviewMaterial && (
            <Paper component="section" aria-label="今日の復習" elevation={0} sx={S1}>
              <RegionTitle>今日の復習</RegionTitle>
              <Typography fontWeight={900} fontSize={16}>
                {reviewMaterial.question.prompt}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {reviewUnitName(reviewMaterial.courseId)} ・ 動きの確認問題から
              </Typography>
              <Box>
                <Button component={Link} href="/daily-review" variant="contained" sx={{ mt: 2, bgcolor: PRIMARY, fontWeight: 900 }}>
                  復習する
                </Button>
              </Box>
            </Paper>
          )}
        </Stack>

        {/* 副ゾーン（眺める情報） */}
        <Stack spacing={3} sx={{ flex: "1 1 0", minWidth: 0, width: "100%" }}>
          {/* 学習ストリーク：曜日ドット＋炎。橙は専用 */}
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
                      fontSize: 12,
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

          <CardCollection units={overview.units} collected={overview.collectedCards} total={overview.totalCards} />

          {/* 掲示板：スレッドの行 */}
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
                        <Typography fontWeight={900} fontSize={16} sx={{ lineHeight: 1.45 }}>
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
                          <Typography fontSize={14} fontWeight={800}>
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
