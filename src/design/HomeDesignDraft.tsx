"use client";

// ホームの設計叩き台 v11（デザイン用）。v11：カードの大きさは揃える（ばらつきはノイズ）。
// 余白対策は「残した情報を大きくする」：本文16・見出し18、面の余白とアイコンも拡大。
// 幅はアプリ共通の外枠（1440）に従う
// 目的（2026-11-20 確認）：開いてすぐに学習を再開できる画面。
// - 最上段は今日の行動を2枚並べる：今日の狙い（主・枠線で強調）と今日の復習（1問）。
//   切り替えタブは選ばれていない方が隠れるのでやめ、両方を常に見せる
// - 「現在地」の帯は置かない。全体の進捗と単元内の進捗は、狙いの右側に分けて明示する
//   （全体図はコース画面の仕事）
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
import type { ReactNode } from "react";
import type { HomeResponse } from "@/api/home.api";
import { isMascotId } from "@/app/component/mascot";
import { MascotFigure } from "@/app/component/mascotFigure";
import { knowledgeCardTones } from "@/components/rewards/rarity.tokens";
import achievementsData from "@/design/data/achievements.json";
import knowledgeCardsData from "@/design/data/knowledgeCards.json";
import { resolveReviewMaterial, reviewUnitName } from "@/features/learning/daily-review/reviewMaterials";

const PRIMARY = "#2563eb";
const STREAK_ORANGE = "#ea580c";

const S1 = { bgcolor: "#fff", borderRadius: 3, p: { xs: 3, md: 4 }, boxShadow: "none" } as const;

const achievementTitle = (title: string) => title.replace(/Lv\.(\d+)/g, "第$1段階");

function TileTitle({ children }: { children: ReactNode }) {
  return (
    <Typography component="h2" fontSize={18} fontWeight={900} sx={{ mb: 2 }}>
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
          次の一歩
        </Typography>
        <Typography fontSize={18} sx={{ mt: 0.25 }}>{nextStep}</Typography>
      </Box>
    </Box>
  );
}

// 掲示板の行に要るタグと返信数は、ホームのAPIにまだ無いので叩き台では仮置きする。
const POST_META: Record<string, { tag: string; replies: number }> = {
  "design-post-1": { tag: "幅優先探索", replies: 3 },
  "design-post-2": { tag: "二分探索", replies: 1 },
  "design-post-3": { tag: "バブルソート", replies: 2 },
  "design-post-4": { tag: "深さ優先探索", replies: 5 },
  "design-post-5": { tag: "貪欲法", replies: 0 },
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

export function HomeDesignDraft({ data, currentGoal, goalText }: { data: HomeResponse; review?: ReactNode; currentGoal?: ReactNode; goalText?: string }) {
  const { overview, today, resume, week, questions } = data;
  const mascotId = isMascotId(data.user.selectedMascotId) ? data.user.selectedMascotId : "red-panda";
  const current = today.recommended;
  // 再開先と推奨先が同じ単元なら、前回の続きは独立させず狙いの中の引用に畳む。
  const sameUnit = Boolean(resume && current && resume.id === current.id);
  const nearAchievement = today.nearAchievements[0];
  const nearAchievementData = nearAchievement ? achievementsData.find((a) => a.id === nearAchievement.id) : undefined;
  const latestTone = latestCard ? knowledgeCardTones[latestCard.rarity as keyof typeof knowledgeCardTones] : undefined;

  return (
    <Stack spacing={3}>
      {/* (0) 目標：最上部に切り出し、進捗ゲージと一緒に見せる */}
      {goalText && current && (
        <Paper component="section" aria-label="目標" elevation={0} sx={S1}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2, md: 4 }} alignItems={{ md: "center" }} justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
              <FlagIcon sx={{ color: PRIMARY, fontSize: 28 }} />
              <Typography fontSize={14} fontWeight={800} sx={{ whiteSpace: "nowrap" }}>
                目標
              </Typography>
              <Typography fontSize={22} fontWeight={900}>
                {goalText}
              </Typography>
            </Stack>
            <Box sx={{ minWidth: { md: 260 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography fontSize={12} fontWeight={800}>
                  学習ステップの進捗
                </Typography>
                <Typography fontSize={14} fontWeight={800}>
                  {current.completedPhases}/{current.totalPhases} ステップ
                </Typography>
              </Stack>
              <Box sx={{ height: 10, borderRadius: 5, bgcolor: "#e7edf5", mt: 1, overflow: "hidden" }}>
                <Box sx={{ height: "100%", width: `${(current.completedPhases / current.totalPhases) * 100}%`, bgcolor: PRIMARY, borderRadius: 5 }} />
              </Box>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* (1) 今日の行動：狙い（主）と復習（副）を横に並べる */}
      {current && (
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: reviewMaterial ? { xs: "1fr", lg: "2fr 1fr" } : "1fr",
            alignItems: "stretch",
          }}
        >
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            aria-label="今日の狙い"
            style={{ background: "#ffffff", border: `2px solid ${PRIMARY}`, borderRadius: 12, padding: 32 }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Box sx={{ flex: 1, minWidth: 0, maxWidth: 780 }}>
                <Typography component="h3" fontSize={22} fontWeight={900}>
                  {current.title}
                </Typography>
                {current.nextPhase && (
                  <Typography fontSize={18} sx={{ mt: 0.75 }}>次は『{current.nextPhase}』。中央の要素と探す値を比べる動きを、コードに写していきます。</Typography>
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
                  sx={{ mt: 2.5, bgcolor: PRIMARY, fontWeight: 900, fontSize: 16, px: 4, py: 1.75, borderRadius: 2.5 }}
                >
                  {current.nextPhase ? `${current.nextPhase}へ` : "単元を見る"}
                </Button>
              </Box>
            </Stack>
          </motion.section>

          {/* 今日の復習：狙いの横に独立した小さい行動として置く */}
          {reviewMaterial && (
            <Paper component="section" aria-label="今日の復習" elevation={0} sx={{ ...S1, display: "flex", flexDirection: "column" }}>
              <TileTitle>今日の復習（1問）</TileTitle>
              <Typography fontSize={18} fontWeight={900} sx={{ lineHeight: 1.6 }}>
                {reviewMaterial.question.prompt}
              </Typography>
              <Typography fontSize={18} sx={{ mt: 1.25 }}>
                {reviewUnitName(reviewMaterial.courseId)} ・ 動きの確認問題から。前に間違えた問題です
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                今日の分はこの1問だけです
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button component={Link} href="/daily-review" variant="contained" sx={{ mt: 2.5, bgcolor: PRIMARY, fontWeight: 900, px: 3, py: 1.25, borderRadius: 2.5, alignSelf: "flex-start" }}>
                復習する
              </Button>
            </Paper>
          )}
        </Box>
      )}
      {!goalText && data.hasInProgressUnit && currentGoal}

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

      {/* (2) 直近の状況：1枚の面の中で4領域が仕切りで分かれる */}
      <Paper component="section" aria-label="最近の状況" elevation={0} sx={{ ...S1, p: 0, overflow: "hidden" }}>
      <Box
        sx={{
          display: "grid",
          gap: 0,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          alignItems: "stretch",
        }}
      >
        {/* 学習ストリーク */}
        <Box component="section" aria-label="学習ストリーク" sx={{ display: "flex", flexDirection: "column", p: { xs: 3, md: 4 } }}>
          <TileTitle>学習ストリーク</TileTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocalFireDepartmentIcon sx={{ color: STREAK_ORANGE, fontSize: 34 }} />
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
                    width: 30,
                    height: 30,
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
                  {day.learned ? <LocalFireDepartmentIcon sx={{ fontSize: 16 }} /> : Number(day.date.slice(8))}
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
        </Box>

        {/* 実績：達成が近いものを1つ、トロフィーの色でレアリティが分かる形で */}
        {nearAchievement && (
          <Box component="section" aria-label="実績" sx={{ display: "flex", flexDirection: "column", p: { xs: 3, md: 4 }, borderLeft: { sm: "1px solid #e7edf5" } }}>
            <TileTitle>次の実績</TileTitle>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "#dbeafe",
                  color: "#1d4ed8",
                  flexShrink: 0,
                }}
              >
                <EmojiEventsIcon sx={{ fontSize: 36 }} />
              </Box>
              <Box>
                <Typography fontSize={18} fontWeight={900} sx={{ lineHeight: 1.4 }}>
                  {achievementTitle(nearAchievement.title)}
                </Typography>
                <Typography variant="caption" fontWeight={800} sx={{ color: "#1d4ed8" }}>
                  {nearAchievementData ? knowledgeCardTones[nearAchievementData.rarity as keyof typeof knowledgeCardTones]?.label ?? "" : ""}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.75} sx={{ mt: 2 }} aria-hidden>
              {Array.from({ length: nearAchievement.goal }, (_, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: i < nearAchievement.progress ? PRIMARY : "#e7edf5",
                    border: i === nearAchievement.progress ? `2px solid ${PRIMARY}` : "2px solid transparent",
                  }}
                />
              ))}
            </Stack>
            <Typography fontSize={18} sx={{ mt: 1.5 }}>
              あと{nearAchievement.goal - nearAchievement.progress}単元で達成（{nearAchievement.progress}/{nearAchievement.goal}単元完了）
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button component={Link} href="/achievements" sx={{ color: PRIMARY, fontWeight: 800, mt: 2, px: 0.5, alignSelf: "flex-start" }}>
              実績一覧へ
            </Button>
          </Box>
        )}

        {/* 知識カード：最近の1枚と全体の数 */}
        <Box component="section" aria-label="知識カード" sx={{ display: "flex", flexDirection: "column", p: { xs: 3, md: 4 }, borderLeft: { lg: "1px solid #e7edf5" }, borderTop: { xs: "1px solid #e7edf5", lg: "none" } }}>
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
              <Typography fontSize={18} fontWeight={900} sx={{ mt: 0.5 }}>
                {latestCard.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                二分探索で獲得
              </Typography>
            </Box>
          )}
          <Typography fontSize={18} sx={{ mt: 2 }}>
            {overview.collectedCards}/{overview.totalCards} 枚を獲得
          </Typography>

          <Box sx={{ flex: 1 }} />

          <Button component={Link} href="/collection" sx={{ color: PRIMARY, fontWeight: 800, mt: 2, px: 0.5, alignSelf: "flex-start" }}>
            コレクションへ
          </Button>
        </Box>

        {/* 掲示板：新着の行 */}
        {questions.length > 0 && (
          <Box component="section" aria-label="掲示板の新着質問" sx={{ display: "flex", flexDirection: "column", p: { xs: 3, md: 4 }, borderLeft: { sm: "1px solid #e7edf5" }, borderTop: { xs: "1px solid #e7edf5", lg: "none" } }}>
            <TileTitle>掲示板の新着質問</TileTitle>
            <Box sx={{ flex: 1, minHeight: 0, maxHeight: 160, overflowY: "auto", mr: -1.5, pr: 1.5 }}>
            <Stack divider={<Divider flexItem />}>
              {questions.map((question) => {
                const meta = POST_META[question.id];
                return (
                  <Box key={question.id} component={Link} href={question.href} sx={{ display: "flex", gap: 1.25, py: 1.5, textDecoration: "none", color: "inherit", alignItems: "flex-start" }}>
                    <Box component="img" src="/images/mascots/red-panda/face.png" alt="" sx={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", bgcolor: "#eef1f5", flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={900} fontSize={18} sx={{ lineHeight: 1.45 }}>
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
            </Box>
            <Button component={Link} href="/quest-board" sx={{ color: PRIMARY, fontWeight: 800, mt: 1, px: 0.5, alignSelf: "flex-start" }}>
              掲示板へ
            </Button>
          </Box>
        )}
      </Box>
      </Paper>
    </Stack>
  );
}
