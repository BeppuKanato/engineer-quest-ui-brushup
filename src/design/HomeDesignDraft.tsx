"use client";

// ホームの設計叩き台 v8（デザイン用）。
// 目的（2026-11-20 確認）：開いてすぐに学習を再開できる画面。
// - 最上段は行動のカード。「今日の狙い」と「今日の復習（1問）」を切り替える。
//   強調は面の色ではなく主色の枠線で示す（色の面積を抑える）
// - 現在地は要約の帯にする（全体の完了・現在の単元・次の一手）。全体図はコース画面の仕事
// - 下部は「アプリの直近の状況」のタイル列：ストリーク／実績／知識カード／掲示板。
//   形は「見出し＋代表の1件＋要約＋行き先リンク」で揃える。小さい画面では縦に積む
// - 文字は役割の5種、見出しは本文色。意味色は予約制（橙＝ストリーク、レアリティ色は実績とカードの中だけ）

import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlagIcon from "@mui/icons-material/Flag";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { HomeResponse } from "@/api/home.api";
import { isMascotId } from "@/app/component/mascot";
import { MascotFigure } from "@/app/component/mascotFigure";
import { knowledgeCardTones } from "@/components/rewards/rarity.tokens";
import achievementsData from "@/design/data/achievements.json";
import knowledgeCardsData from "@/design/data/knowledgeCards.json";
import { resolveReviewMaterial, reviewUnitName } from "@/features/learning/daily-review/reviewMaterials";

const PRIMARY = "#2563eb";
const STREAK_ORANGE = "#ea580c";

const S1 = { bgcolor: "#fff", borderRadius: 3, p: { xs: 2.5, md: 3 }, boxShadow: "none" } as const;

const achievementTitle = (title: string) => title.replace(/Lv\.(\d+)/g, "第$1段階");

function TileTitle({ children }: { children: ReactNode }) {
  return (
    <Typography component="h2" fontSize={16} fontWeight={900} sx={{ mb: 2 }}>
      {children}
    </Typography>
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

// 最近手に入れたカード（叩き台では固定の1枚）。
const latestCard = knowledgeCardsData.find((card) => card.id === "knowledge-card-binary-search-halving-range");

const tabSx = (active: boolean) =>
  ({
    borderRadius: 999,
    px: 2.5,
    py: 1,
    fontWeight: 900,
    bgcolor: active ? PRIMARY : "#ffffff",
    color: active ? "#ffffff" : "#334155",
    border: `2px solid ${active ? PRIMARY : "#c7d3e8"}`,
    "&:hover": { bgcolor: active ? PRIMARY : "#eef2fb" },
  }) as const;

export function HomeDesignDraft({ data, currentGoal, goalText }: { data: HomeResponse; review?: ReactNode; currentGoal?: ReactNode; goalText?: string }) {
  const [tab, setTab] = useState<"aim" | "review">("aim");
  const { overview, today, resume, week, questions } = data;
  const mascotId = isMascotId(data.user.selectedMascotId) ? data.user.selectedMascotId : "red-panda";
  const current = today.recommended;
  // 再開先と推奨先が同じ単元なら、前回の続きは独立させず狙いの中の引用に畳む。
  const sameUnit = Boolean(resume && current && resume.id === current.id);
  const nearAchievement = today.nearAchievements[0];
  const nearAchievementData = nearAchievement ? achievementsData.find((a) => a.id === nearAchievement.id) : undefined;
  const latestTone = latestCard ? knowledgeCardTones[latestCard.rarity as keyof typeof knowledgeCardTones] : undefined;
  const overallRatio = overview.totalUnits > 0 ? overview.completedUnits / overview.totalUnits : 0;

  return (
    <Stack spacing={3}>
      {/* (1) 今日の行動：狙いと復習の切り替え。強調は枠線 */}
      {current && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          aria-label="今日の行動"
          style={{ background: "#ffffff", border: `2px solid ${PRIMARY}`, borderRadius: 12, padding: 24 }}
        >
          <Stack direction="row" spacing={1} sx={{ mb: 3 }} role="tablist" aria-label="今日の行動の切り替え">
            <Button onClick={() => setTab("aim")} sx={tabSx(tab === "aim")} aria-selected={tab === "aim"} role="tab">
              今日の狙い
            </Button>
            <Button onClick={() => setTab("review")} sx={tabSx(tab === "review")} aria-selected={tab === "review"} role="tab">
              今日の復習（1問）
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: tab === "review" ? "#ffffff" : PRIMARY, ml: 1 }} />
            </Button>
          </Stack>
          {tab === "review" && reviewMaterial ? (
            <Box>
              <Typography component="h3" fontSize={22} fontWeight={900}>
                {reviewMaterial.question.prompt}
              </Typography>
              <Typography fontSize={14} sx={{ mt: 1 }}>
                {reviewUnitName(reviewMaterial.courseId)} ・ 動きの確認問題から。前に間違えた問題です
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                今日の分はこの1問だけです
              </Typography>
              <Button component={Link} href="/daily-review" variant="contained" sx={{ mt: 2.5, bgcolor: PRIMARY, fontWeight: 900, px: 3, py: 1.25, borderRadius: 2.5 }}>
                復習する
              </Button>
            </Box>
          ) : (
            <>
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
              <Box sx={{ maxWidth: 640 }}>
                <Typography component="h3" fontSize={22} fontWeight={900}>
                  {current.title}
                </Typography>
                {current.nextPhase && (
                  <Typography fontSize={14} sx={{ mt: 0.75 }}>次は『{current.nextPhase}』。中央の要素と探す値を比べる動きを、コードに写していきます。</Typography>
                )}
                {sameUnit && resume?.nextStep && (
                  <Box sx={{ mt: 2 }}>
                    <FeedbackQuote mascotId={mascotId} nextStep={resume.nextStep} />
                  </Box>
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
            </>
          )}
        </motion.section>
      )}
      {!goalText && data.hasInProgressUnit && currentGoal}

      {/* (2) 現在地：要約の帯。全体図はコース画面が担う */}
      <Paper component="section" aria-label="現在地" elevation={0} sx={S1}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2, md: 4 }} alignItems={{ md: "center" }}>
          <Box sx={{ minWidth: 220, flex: "1 1 0" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography component="h2" fontSize={16} fontWeight={900}>
                現在地
              </Typography>
              <Typography fontSize={14} fontWeight={800}>
                全{overview.totalUnits}単元中 {overview.completedUnits}単元完了
              </Typography>
            </Stack>
            <Box sx={{ height: 8, borderRadius: 4, bgcolor: "#e7edf5", mt: 1.5, overflow: "hidden" }}>
              <Box sx={{ height: "100%", width: `${overallRatio * 100}%`, bgcolor: PRIMARY, borderRadius: 4 }} />
            </Box>
          </Box>
          {current && (
            <Typography fontSize={14}>
              現在の単元：<strong>{current.title}</strong>（ステップ {current.completedPhases}/{current.totalPhases}）
              {current.nextPhase && (
                <>
                  　次：<strong>{current.nextPhase}</strong>
                </>
              )}
            </Typography>
          )}
          <Button component={Link} href="/courses" sx={{ color: PRIMARY, fontWeight: 800, px: 0.5, whiteSpace: "nowrap" }}>
            全体を見る
          </Button>
        </Stack>
      </Paper>

      {/* 前回の続き：再開先が推奨先と違う単元の時だけ独立させる */}
      {resume && !sameUnit && (
        <Paper component="section" aria-label="前回の続き" elevation={0} sx={S1}>
          <TileTitle>前回の続き</TileTitle>
          <Typography fontWeight={900}>
            {resume.title}（{resume.nextPhase ?? "単元の最終結果"}から）
          </Typography>
          {resume.nextStep && (
            <Box sx={{ mt: 1.75, maxWidth: 640 }}>
              <FeedbackQuote mascotId={mascotId} nextStep={resume.nextStep} />
            </Box>
          )}
          <Button component={Link} href={resume.resumeHref} variant="outlined" sx={{ mt: 2, borderColor: PRIMARY, color: PRIMARY, fontWeight: 900 }}>
            前回の続きに戻る
          </Button>
        </Paper>
      )}

      {/* (3) 直近の状況：タイルの列 */}
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          alignItems: "stretch",
        }}
      >
        {/* 学習ストリーク */}
        <Paper component="section" aria-label="学習ストリーク" elevation={0} sx={{ ...S1, display: "flex", flexDirection: "column" }}>
          <TileTitle>学習ストリーク</TileTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocalFireDepartmentIcon sx={{ color: STREAK_ORANGE, fontSize: 30 }} />
            <Typography fontSize={24} fontWeight={900}>
              {week.streakDays}日連続
            </Typography>
          </Stack>
          <Stack direction="row" gap={0.75} sx={{ mt: 2 }}>
            {week.days.map((day) => (
              <Stack key={day.date} alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                <Box
                  aria-label={`${day.date} ${day.learned ? "学習済み" : "学習記録なし"}${day.isToday ? " 今日" : ""}`}
                  sx={{
                    width: 26,
                    height: 26,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    bgcolor: day.learned ? "#ffedd5" : "#eef1f5",
                    color: day.learned ? STREAK_ORANGE : "#94a3b8",
                    border: day.isToday ? `2px solid ${STREAK_ORANGE}` : "2px solid transparent",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {day.learned ? <LocalFireDepartmentIcon sx={{ fontSize: 14 }} /> : Number(day.date.slice(8))}
                </Box>
                <Typography variant="caption" fontWeight={day.isToday ? 900 : 600} color={day.isToday ? "text.primary" : "text.secondary"}>
                  {day.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Button component={Link} href="/history" sx={{ color: PRIMARY, fontWeight: 800, mt: 2, px: 0.5, alignSelf: "flex-start" }}>
            履歴を見る
          </Button>
        </Paper>

        {/* 実績：達成が近いものを1つ、トロフィーの色でレアリティが分かる形で */}
        {nearAchievement && (
          <Paper component="section" aria-label="実績" elevation={0} sx={{ ...S1, display: "flex", flexDirection: "column" }}>
            <TileTitle>実績</TileTitle>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "#dbeafe",
                  color: "#1d4ed8",
                  flexShrink: 0,
                }}
              >
                <EmojiEventsIcon sx={{ fontSize: 30 }} />
              </Box>
              <Box>
                <Typography fontSize={16} fontWeight={900} sx={{ lineHeight: 1.4 }}>
                  {achievementTitle(nearAchievement.title)}
                </Typography>
                <Typography variant="caption" fontWeight={800} sx={{ color: "#1d4ed8" }}>
                  {nearAchievementData ? knowledgeCardTones[nearAchievementData.rarity as keyof typeof knowledgeCardTones]?.label ?? "" : ""}
                </Typography>
              </Box>
            </Stack>
            <Typography fontSize={14} sx={{ mt: 2 }}>
              あと{nearAchievement.goal - nearAchievement.progress}単元で達成（{nearAchievement.progress}/{nearAchievement.goal}単元完了）
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button component={Link} href="/achievements" sx={{ color: PRIMARY, fontWeight: 800, mt: 2, px: 0.5, alignSelf: "flex-start" }}>
              実績一覧へ
            </Button>
          </Paper>
        )}

        {/* 知識カード：最近の1枚と全体の数 */}
        <Paper component="section" aria-label="知識カード" elevation={0} sx={{ ...S1, display: "flex", flexDirection: "column" }}>
          <TileTitle>知識カード</TileTitle>
          {latestCard && latestTone && (
            <Box sx={{ bgcolor: latestTone.bgcolor, border: `2px solid ${latestTone.border}`, borderRadius: 2, px: 2, py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontSize={12} fontWeight={800}>
                  {latestCard.label}
                </Typography>
                <Typography fontSize={12} fontWeight={900} sx={{ color: latestTone.color }}>
                  {latestTone.label}
                </Typography>
              </Stack>
              <Typography fontSize={16} fontWeight={900} sx={{ mt: 0.5 }}>
                {latestCard.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                二分探索で獲得
              </Typography>
            </Box>
          )}
          <Typography fontSize={14} sx={{ mt: 2 }}>
            {overview.collectedCards}/{overview.totalCards} 枚を獲得
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button component={Link} href="/collection" sx={{ color: PRIMARY, fontWeight: 800, mt: 2, px: 0.5, alignSelf: "flex-start" }}>
            コレクションへ
          </Button>
        </Paper>

        {/* 掲示板：新着の行 */}
        {questions.length > 0 && (
          <Paper component="section" aria-label="掲示板の新着質問" elevation={0} sx={{ ...S1, display: "flex", flexDirection: "column" }}>
            <TileTitle>掲示板の新着質問</TileTitle>
            <Stack divider={<Divider flexItem />}>
              {questions.map((question) => {
                const meta = POST_META[question.id];
                return (
                  <Box key={question.id} component={Link} href={question.href} sx={{ display: "flex", gap: 1.25, py: 1.5, textDecoration: "none", color: "inherit", alignItems: "flex-start" }}>
                    <Box component="img" src="/images/mascots/red-panda/face.png" alt="" sx={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", bgcolor: "#eef1f5", flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={900} fontSize={14} sx={{ lineHeight: 1.45 }}>
                        {question.title}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        {meta && <Chip label={meta.tag} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />}
                        {meta && (
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
                            <ChatBubbleOutlineIcon sx={{ fontSize: 15 }} />
                            <Typography fontSize={12} fontWeight={800}>
                              {meta.replies}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
            <Box sx={{ flex: 1 }} />
            <Button component={Link} href="/quest-board" sx={{ color: PRIMARY, fontWeight: 800, mt: 1, px: 0.5, alignSelf: "flex-start" }}>
              掲示板へ
            </Button>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}
