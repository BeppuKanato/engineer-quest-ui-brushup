"use client";

// ホームの設計叩き台 v15（デザイン用）。v15（2026-11-27）：アプリ全体のキャラを
// 場面サムネの主人公ロボットに統一（マスコット廃止）。話者は立場のあるロボになり、
// 記録なし（初回）はコース一覧への誘導に特化し、ロボの立場からの一歩セリフを入れる。
// v14（2026-11-27）：(1) ホームのカードに単元の
// 場面サムネは載せない（コース一覧の仕事。ホームでは情報が増えるだけで識別に効かなかった）。
// (2) 記録なし（初回）は「今日の狙い」の形をやめ、最初の単元のミッション
// 提示＋コース一覧への導線に変える。
// v13（2026-11-27）：空状態の方針を全面に適用。
// 進捗データの欠落（復習）は詰める（狙いが全幅になる）／場所と目標（掲示板・次の実績・
// 目標）は促す形で常駐させる（掲示板は見出しに「掲示板」と明記し、質問が無い状態でも
// 節を残す。実績は進捗0のものも出す。目標は未設定なら案内帯）。
// あわせて「続きから」の単元には単元ミッションの場面サムネを載せる（狙い・前回の続き・
// 復習。絵で単元を識別する）。状態はホームの表示パターン（fixtures の homePatterns）で切替。
// v12（2026-11-27）：(1) 目標帯は LLM の大目標ではなく、
// 学習者が目標に設定した単元ミッションを表示する形に変更（大目標システム廃止に伴う。#508）。
// (2) マスコットは全身を小さく置かず、実アプリ MissionChallenge の MascotBust と同じ
// バストアップ（大きく切り取り、感情が伝わる大きさ）で出す。
// v11：カードの大きさは揃える（ばらつきはノイズ）。
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

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import StyleIcon from "@mui/icons-material/Style";
import FlagIcon from "@mui/icons-material/Flag";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import type { HomeResponse } from "@/api/home.api";
import { isMascotId, type MascotState } from "@/app/component/mascot";
import { RobotFigure } from "@/app/component/robotFigure";
import { knowledgeCardTones } from "@/components/rewards/rarity.tokens";
import achievementsData from "@/design/data/achievements.json";
import knowledgeCardsData from "@/design/data/knowledgeCards.json";
import { resolveReviewMaterial, reviewUnitName } from "@/features/learning/daily-review/reviewMaterials";

const PRIMARY = "#2563eb";
// 完了した量（進捗ゲージ）の色。アプリ全体で緑に統一する（2026-11-23）。
const GREEN = "#16a34a";
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

/**
 * 話者の見せ方（2026-11-27、全体ロボ化）：場面サムネの主人公ロボットを出す。
 * 形は楕円の胴体＋楕円の腕、脚なし（脚を付けると人型の怖さが出る）。枠の下端に
 * 影で接地させて置く。
 */
function MascotBust({ state, width = 168, height = 128 }: { mascotId?: string; state: MascotState; width?: number; height?: number; imgSize?: number }) {
  return (
    <Box sx={{ width, height, flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" }} aria-hidden>
      <RobotFigure alt="" state={state} size="XL" grounding="shadow" sx={{ width: Math.round(height * 0.94), height }} />
    </Box>
  );
}

// フィードバックの「次の一歩」の引用。話者はマスコット。
function FeedbackQuote({ mascotId, nextStep }: { mascotId: string; nextStep: string }) {
  const id = isMascotId(mascotId) ? mascotId : "red-panda";
  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      <MascotBust mascotId={id} state="normal" width={148} height={102} imgSize={182} />
      <Box sx={{ bgcolor: "#f1f5fb", borderLeft: `4px solid ${PRIMARY}`, borderRadius: 2, px: 2, py: 1.5, flex: 1 }}>
        <Typography fontSize={14} fontWeight={800}>
          次の一歩
        </Typography>
        <Typography fontSize={18} sx={{ mt: 0.25 }}>{nextStep}</Typography>
      </Box>
    </Box>
  );
}

// 復習の問題は実在の教材から引く（フィクスチャと同じキー）。
const reviewMaterial = resolveReviewMaterial({
  courseId: "course-algorithm-binary-search-v1",
  phaseKey: "binary-search-check",
  assessmentId: "binary-search-check",
  questionId: "first-center",
});

// 最近手に入れたカード（叩き台では固定の1枚）。1枚も持っていなければ出さない。
const latestCardFixture = knowledgeCardsData.find((card) => card.id === "knowledge-card-binary-search-halving-range");

export function HomeDesignDraft({ data, goalText, hasReview = true }: { data: HomeResponse; goalText?: string; hasReview?: boolean }) {
  const { overview, today, resume, week, questions } = data;
  const mascotId = isMascotId(data.user.selectedMascotId) ? data.user.selectedMascotId : "red-panda";
  const current = today.recommended;
  // ホームの掲示板は「修了した単元の未解決質問」を出す。新着順ではなく、
  // 自分が答えられる質問であること（理由）と状態（まだ回答がない等）を付けて提示する。
  const boardQuestions = questions.slice(0, 2);
  // 再開先と推奨先が同じ単元なら、前回の続きは独立させず狙いの中の引用に畳む。
  const sameUnit = Boolean(resume && current && resume.id === current.id);
  // 狙いのボタンの文言は単元の状態で決める（未着手に「再開する」とは言わない）。
  const aimLabel = current?.status === "IN_PROGRESS" ? "学習を再開する" : current?.status === "COMPLETED" ? "復習する" : "学習をはじめる";
  // 記録なし（初回）：何も始めていない人には「今日の狙い」の形自体が嘘になる
  // （選んでもいない単元が今日の分として出る）。専用の「はじめよう」に切り替える。
  const isFresh = Boolean(current && !resume && overview.completedUnits === 0 && current.status === "NOT_STARTED");
  const nearAchievement = today.nearAchievements[0];
  const nearAchievementData = nearAchievement ? achievementsData.find((a) => a.id === nearAchievement.id) : undefined;
  const latestCard = overview.collectedCards > 0 ? latestCardFixture : undefined;
  const latestTone = latestCard ? knowledgeCardTones[latestCard.rarity as keyof typeof knowledgeCardTones] : undefined;
  // 復習は「完了した段階」から出る。無いパターンでは節ごと詰めて狙いを全幅にする。
  const review = hasReview ? reviewMaterial : null;

  return (
    <Stack spacing={3}>
      {/* (0) 目標：最上部に切り出し、進捗ゲージと一緒に見せる。
          中身は LLM の大目標ではなく、学習者が目標に設定した単元ミッション（#508）。
          設定したときだけ帯を出し、対象の単元名をチップで明示する */}
      {/* 目標が未設定なら、帯の場所で設定を促す（場所と目標は常駐させる方針）。
          目標そのものの表示ではなく「ここに何が出るか」の案内なので、帯の形は保ちつつ
          中身は案内文＋コース一覧への行き先にする */}
      {!goalText && (
        <Paper component="section" aria-label="目標" elevation={0} sx={S1}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2, md: 4 }} alignItems={{ md: "center" }} justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
              <FlagIcon sx={{ color: PRIMARY, fontSize: 28, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography fontSize={14} fontWeight={800}>
                  目標
                </Typography>
                <Typography fontSize={22} fontWeight={900} sx={{ mt: 0.5 }}>
                  目標はまだ設定されていません
                </Typography>
                <Typography fontSize={16} sx={{ mt: 0.5 }}>
                  コース一覧や単元画面で旗を立てると、ここに単元ミッションと進み具合が表示されます
                </Typography>
              </Box>
            </Stack>
            <Button component={Link} href="/courses" variant="outlined" sx={{ borderColor: PRIMARY, color: PRIMARY, fontWeight: 900, fontSize: 16, px: 3, py: 1.25, borderRadius: 2.5, flexShrink: 0 }}>
              コース一覧で目標を設定する
            </Button>
          </Stack>
        </Paper>
      )}
      {goalText && current && (
        <Paper component="section" aria-label="目標" elevation={0} sx={S1}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2, md: 4 }} alignItems={{ md: "center" }} justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
              <FlagIcon sx={{ color: PRIMARY, fontSize: 28, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography fontSize={14} fontWeight={800} sx={{ whiteSpace: "nowrap" }}>
                    目標
                  </Typography>
                  <Chip label={current.title} size="small" sx={{ height: 22, fontSize: 14, fontWeight: 700 }} />
                </Stack>
                <Typography fontSize={22} fontWeight={900} sx={{ mt: 0.5 }}>
                  {goalText}
                </Typography>
              </Box>
            </Stack>
            <Box sx={{ minWidth: { md: 260 }, flexShrink: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography fontSize={14} fontWeight={800}>
                  学習ステップの進捗
                </Typography>
                <Typography fontSize={16} fontWeight={900}>
                  {current.completedPhases} / {current.totalPhases} ステップ完了
                </Typography>
              </Stack>
              <Box sx={{ height: 12, borderRadius: 6, bgcolor: "#e7edf5", mt: 1, overflow: "hidden" }}>
                <Box sx={{ height: "100%", width: `${(current.completedPhases / current.totalPhases) * 100}%`, bgcolor: GREEN, borderRadius: 5 }} />
              </Box>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* (1) 記録なし（初回）専用：コース一覧への誘導に特化する。
          話者は場面サムネの主人公ロボット。セリフはロボの立場（あいまいな判断ができない
          コンピュータで、学習者のコードで動く）から書く。単元を始めるボタンは置かない
          （選ぶのはコース一覧の仕事） */}
      {current && isFresh && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          aria-label="はじめよう"
          style={{ background: "#ffffff", border: `2px solid ${PRIMARY}`, borderRadius: 12, padding: 32 }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Box sx={{ flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" }} aria-hidden>
              <RobotFigure alt="" state="cheer" size="XL" grounding="shadow" sx={{ width: 131, height: 140 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ bgcolor: "#f1f5fb", borderLeft: `4px solid ${PRIMARY}`, borderRadius: 2, px: 2, py: 1.5 }}>
                <Typography fontSize={18} sx={{ lineHeight: 1.6 }}>
                  ボクはコンピュータ。あいまいな判断はできないけど、キミのコードがあれば動ける。学習の一歩を、いっしょに踏み出そう。
                </Typography>
              </Box>
              <Typography component="h3" fontSize={24} fontWeight={900} sx={{ mt: 2.5 }}>
                学ぶ単元を選ぼう
              </Typography>
              <Typography fontSize={16} sx={{ mt: 1, lineHeight: 1.8 }}>
                全{overview.totalUnits}単元。どの単元にも、困っている場面とミッションがある。最初は「幅優先探索（BFS）」がおすすめ。
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                {overview.units.map((u) => (
                  <Chip key={u.id} label={u.title} size="small" sx={{ height: 24, fontSize: 14, fontWeight: 700 }} />
                ))}
              </Stack>
              <Button component={Link} href="/courses" variant="contained" sx={{ mt: 3, bgcolor: PRIMARY, fontWeight: 900, fontSize: 18, px: 5, py: 2, borderRadius: 2.5 }}>
                コース一覧を見る
              </Button>
            </Box>
          </Stack>
        </motion.section>
      )}

      {/* (1) 今日の行動：狙い（主）と復習（副）を横に並べる */}
      {current && !isFresh && (
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: review ? { xs: "1fr", lg: "2fr 1fr" } : "1fr",
            alignItems: "stretch",
          }}
        >
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            aria-label="今日の狙い"
            style={{ background: "#ffffff", border: `2px solid ${PRIMARY}`, borderRadius: 12, padding: 24 }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Box sx={{ flex: 1, minWidth: 0, maxWidth: 780 }}>
                <Typography component="h3" fontSize={24} fontWeight={900}>
                  {current.title}
                </Typography>
                {sameUnit && resume?.nextStep ? (
                  <Box sx={{ display: "flex", gap: 2, mt: 2, alignItems: "center" }}>
                    <MascotBust mascotId={mascotId} state="point" width={190} height={140} imgSize={235} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ bgcolor: "#f1f5fb", borderLeft: `4px solid ${PRIMARY}`, borderRadius: 2, px: 2, py: 1.5 }}>
                        {/* 台詞は単元ごとに変わる（前回フィードバックの次の一歩）。文を固定で書くと
                            別の単元のパターンで内容が食い違うので、データから出す */}
                        <Typography fontSize={22} fontWeight={500} sx={{ lineHeight: 1.5 }}>{resume.nextStep}</Typography>
                      </Box>
                      {current.nextPhase && (
                        <Typography fontSize={16} fontWeight={700} sx={{ mt: 2 }}>
                          次は『{current.nextPhase}』
                        </Typography>
                      )}
                      <Button
                        component={Link}
                        href={current.status === "IN_PROGRESS" ? current.resumeHref : current.href}
                        variant="contained"
                        sx={{ mt: 1, bgcolor: PRIMARY, fontWeight: 900, fontSize: 18, px: 5, py: 2, borderRadius: 2.5 }}
                      >
                        {aimLabel}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    {current.nextPhase && (
                      <Typography fontSize={16} fontWeight={700} sx={{ mt: 2 }}>
                        次は『{current.nextPhase}』
                      </Typography>
                    )}
                    <Button
                      component={Link}
                      href={current.status === "IN_PROGRESS" ? current.resumeHref : current.href}
                      variant="contained"
                      sx={{ mt: 1, bgcolor: PRIMARY, fontWeight: 900, fontSize: 18, px: 5, py: 2, borderRadius: 2.5 }}
                    >
                      {aimLabel}
                    </Button>
                  </>
                )}
              </Box>
            </Stack>
          </motion.section>

          {/* 今日の復習：狙いの横に独立した小さい行動として置く */}
          {review && (
            <Paper component="section" aria-label="今日の復習" elevation={0} sx={{ ...S1, display: "flex", flexDirection: "column" }}>
              <TileTitle>今日の復習（1問）</TileTitle>
              <Typography fontSize={18} fontWeight={900} sx={{ lineHeight: 1.6 }}>
                {review.question.prompt}
              </Typography>
              <Typography fontSize={18} sx={{ mt: 1.25 }}>
                {reviewUnitName(review.courseId)} ・ 動きの確認問題から。前に間違えた問題です
              </Typography>
              <Typography fontSize={14} color="text.primary" sx={{ display: "block", mt: 0.5 }}>
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

      {/* (2) 直近の状況：1枚の面の中に、左＝自分の記録3段／右＝掲示板（縦長） */}
      <Paper component="section" aria-label="最近の状況" elevation={0} sx={{ ...S1, p: 0, overflow: "hidden" }}>
        <Box sx={{ display: "grid", gap: 0, gridTemplateColumns: { xs: "1fr", lg: "2.1fr 1fr" }, alignItems: "stretch" }}>
          <Box>
            {/* 学習ストリーク */}
            <Box component="section" aria-label="学習ストリーク" sx={{ px: { xs: 3, md: 4 }, py: 3 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 1.5, md: 3 }} alignItems={{ md: "center" }}>
                <Box sx={{ width: { md: 300 }, flexShrink: 0 }}>
                  <TileTitle>学習ストリーク</TileTitle>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocalFireDepartmentIcon sx={{ color: STREAK_ORANGE, fontSize: 34 }} />
                    <Typography fontSize={24} fontWeight={900}>
                      {week.streakDays}日連続
                    </Typography>
                  </Stack>
                </Box>
                <Stack direction="row" gap={0.75} sx={{ width: { md: 430 }, flexShrink: 0 }}>
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
                          fontSize: 14,
                          fontWeight: 800,
                        }}
                      >
                        {day.learned ? <LocalFireDepartmentIcon sx={{ fontSize: 16 }} /> : Number(day.date.slice(8))}
                      </Box>
                      <Typography fontSize={14} fontWeight={day.isToday ? 900 : 600} color="text.primary">
                        {day.label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
                <Button component={Link} href="/history" sx={{ color: PRIMARY, fontWeight: 800, px: 0.5, whiteSpace: "nowrap", flexShrink: 0 }}>
                  履歴を見る
                </Button>
              </Stack>
            </Box>
            <Divider />
            {/* 実績：達成が近いものを1つ、進捗は形で見せる */}
            {nearAchievement && (
              <Box component="section" aria-label="実績" sx={{ px: { xs: 3, md: 4 }, py: 3 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 1.5, md: 3 }} alignItems={{ md: "center" }}>
                  <Box sx={{ width: { md: 300 }, flexShrink: 0 }}>
                    <TileTitle>次の実績</TileTitle>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          bgcolor: "#dbeafe",
                          color: "#1d4ed8",
                          flexShrink: 0,
                        }}
                      >
                        <EmojiEventsIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Box>
                        <Typography fontSize={18} fontWeight={900} sx={{ lineHeight: 1.4 }}>
                          {achievementTitle(nearAchievement.title)}
                        </Typography>
                        <Typography fontSize={14} fontWeight={800} sx={{ color: "#1d4ed8" }}>
                          {nearAchievementData ? knowledgeCardTones[nearAchievementData.rarity as keyof typeof knowledgeCardTones]?.label ?? "" : ""}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Box sx={{ width: { md: 430 }, flexShrink: 0 }}>
                    <Stack direction="row" spacing={0.75} aria-hidden>
                      {Array.from({ length: nearAchievement.goal }, (_, i) => (
                        <Box
                          key={i}
                          sx={{
                            flex: 1,
                            height: 10,
                            borderRadius: 5,
                            bgcolor: i < nearAchievement.progress ? PRIMARY : "#e7edf5",
                            border: i === nearAchievement.progress ? `2px solid ${PRIMARY}` : "2px solid transparent",
                          }}
                        />
                      ))}
                    </Stack>
                    <Typography fontSize={16} sx={{ mt: 1 }}>
                      あと{nearAchievement.goal - nearAchievement.progress}単元で達成
                    </Typography>
                  </Box>
                  <Button component={Link} href="/achievements" sx={{ color: PRIMARY, fontWeight: 800, px: 0.5, whiteSpace: "nowrap", flexShrink: 0 }}>
                    実績一覧へ
                  </Button>
                </Stack>
              </Box>
            )}
            <Divider />
            {/* 知識カード：最近の1枚と全体の数 */}
            <Box component="section" aria-label="知識カード" sx={{ px: { xs: 3, md: 4 }, py: 3 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 1.5, md: 3 }} alignItems={{ md: "center" }}>
                <Box sx={{ width: { md: 300 }, flexShrink: 0 }}>
                  <TileTitle>知識カード</TileTitle>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "#ccfbf1",
                        color: "#0f766e",
                        flexShrink: 0,
                      }}
                    >
                      <StyleIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography fontSize={18} fontWeight={800}>
                      {overview.collectedCards}/{overview.totalCards} 枚を獲得
                    </Typography>
                  </Stack>
                </Box>
                <Box sx={{ width: { md: 430 }, flexShrink: 0 }}>
                {latestCard && latestTone && (
                  <Box sx={{ bgcolor: "#ffffff", border: `1.5px solid ${latestTone.border}`, borderRadius: 2, px: 2, py: 1.5, width: { md: 360 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={14} fontWeight={800} sx={{ color: latestTone.color }}>
                        {latestCard.label}
                      </Typography>
                      <Typography fontSize={14} fontWeight={900} sx={{ color: latestTone.color }}>
                        {latestTone.label}
                      </Typography>
                    </Stack>
                    <Typography fontSize={18} fontWeight={900} sx={{ mt: 0.5 }}>
                      {latestCard.title}
                    </Typography>
                    <Typography fontSize={14} color="text.primary">
                      二分探索で獲得
                    </Typography>
                  </Box>
                )}
                </Box>
                <Button component={Link} href="/collection" sx={{ color: PRIMARY, fontWeight: 800, px: 0.5, whiteSpace: "nowrap", flexShrink: 0 }}>
                  コレクションへ
                </Button>
              </Stack>
            </Box>
          </Box>
          {/* 掲示板：右の縦長の列。場所なので常駐させ、見出しで「掲示板」と一目で分かるようにする。
              中身は修了した単元の未解決質問。無いときは状態に応じた案内を出す */}
          <Box component="section" aria-label="掲示板" sx={{ display: "flex", flexDirection: "column", p: { xs: 3, md: 4 }, borderLeft: { lg: "1px solid #e7edf5" }, borderTop: { xs: "1px solid #e7edf5", lg: "none" } }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#eef4ff", color: PRIMARY, flexShrink: 0 }}>
                <ForumOutlinedIcon sx={{ fontSize: 22 }} />
              </Box>
              <Typography component="h2" fontSize={18} fontWeight={900}>
                掲示板
              </Typography>
            </Stack>
            <Typography fontSize={16} fontWeight={700} sx={{ mt: 2 }}>
              学んだ知識を活かそう
            </Typography>
            <Typography fontSize={14} sx={{ mt: 0.5 }}>
              {boardQuestions.length > 0
                ? "あなたが修了した単元で、仲間が質問しています。"
                : overview.completedUnits > 0
                  ? "いま答えられる質問はありません。"
                  : "単元を修了すると、その単元で仲間がしている質問に、ここから答えられるようになります。"}
            </Typography>
            {boardQuestions.length > 0 && (
              <Box>
                <Stack divider={<Divider flexItem />}>
                  {boardQuestions.map((question) => (
                    <Box key={question.id} sx={{ py: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        {question.courseTitle && <Chip label={question.courseTitle} size="small" sx={{ height: 22, fontSize: 14, fontWeight: 700 }} />}
                        <Typography fontSize={14} fontWeight={800} color={question.commentCount === 0 ? PRIMARY : "text.primary"}>
                          {question.commentCount === 0 ? "まだ回答がありません" : `回答 ${question.commentCount}件 ・ まだ解決していません`}
                        </Typography>
                      </Stack>
                      <Typography fontWeight={900} fontSize={18} sx={{ lineHeight: 1.45, mt: 0.75 }}>
                        {question.title}
                      </Typography>
                      {question.excerpt && (
                        <Typography fontSize={14} sx={{ mt: 0.5, lineHeight: 1.7 }}>{question.excerpt}</Typography>
                      )}
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1 }}>
                        {question.authorName && <Typography fontSize={14}>{question.authorName} さん</Typography>}
                        <Box sx={{ flex: 1 }} />
                        <Button component={Link} href={question.href} variant="contained" size="small" sx={{ bgcolor: PRIMARY, fontWeight: 800 }}>
                          回答してみる
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
            <Box sx={{ flex: 1 }} />
            <Button component={Link} href="/quest-board" sx={{ color: PRIMARY, fontWeight: 800, mt: 1, px: 0.5, alignSelf: "flex-start" }}>
              掲示板へ
            </Button>
          </Box>
        </Box>
      </Paper>
    </Stack>
  );
}
