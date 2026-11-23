"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Button, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { MascotFigure } from "@/app/component/mascotFigure";

import { DrawnCheck } from "../../app/DrawnCheck";
import { PhaseNextButton } from "../../app/PhaseNextButton";
import { ResultConfetti } from "../../app/ResultConfetti";
import { ResultScoreDots } from "../../app/ResultScoreDots";
import { UnitPathMiniMap } from "../../app/UnitPathMiniMap";
import type { LearningRewards } from "../../app/rewards";
import { UnitResultCelebration } from "../../bfs/unit/UnitResultCelebration";

import { playerTokens } from "../../player/player.tokens";
import { bubbleSortImplementationContent } from "../implementation/implementation.content";
import { bubbleSortUnitPhases, bubbleSortUnitText, type BubbleSortUnitPhase } from "./unit.content";
import type { BubbleSortUnitPhaseSummary } from "./unit.types";
import { BubbleSortResultFigure } from "./BubbleSortResultFigure";

const headingSx = {
  color: playerTokens.text, fontWeight: 900, textAlign: "center",
  fontSize: 24, outline: "none",
} as const;

const nextButtonSx = {
  minHeight: 44, bgcolor: playerTokens.focus, color: playerTokens.surface,
  "&:hover": { bgcolor: playerTokens.states.processing.stroke },
} as const;

/**
 * フェーズ完了の称賛ブロック（2026-11-23 再設計）。
 * フィードバック画面の頭に置き、称賛とフィードバックを1画面にする。
 * 中身は「終わった」事実と成果だけ：紙吹雪＋見出し、正解数（ドットと事実文）、
 * マスコットの反応、実績の解除。完成図は結果の棒グラフと誤読されるため出さない。
 * フィードバックが無い場合の独立結果画面（UnitResultScreen）もこのブロックを使う。
 */
export function PhaseResultHeader({ phase, summary, achievements, goalAchievement }: {
  phase: BubbleSortUnitPhase;
  summary?: BubbleSortUnitPhaseSummary;
  achievements?: ReactNode;
  goalAchievement?: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  if (!phase.result) return null;
  return <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: "100%" }}>
    <UnitResultCelebration heading={phase.result.heading} headingRef={headingRef} preset={goalAchievement ? "final" : "phase"} />
    {summary?.totalQuestions !== undefined && summary.firstAttemptCorrect !== undefined && (
      <>
        <ResultScoreDots total={summary.totalQuestions} firstAttemptCorrect={summary.firstAttemptCorrect} />
        <Typography component="p" sx={{ textAlign: "center", fontSize: 22, fontWeight: 900 }}>
          全{summary.totalQuestions}問に正解しました（初回で{summary.firstAttemptCorrect}問正解）。
        </Typography>
        <ResultMascotReaction perfect={summary.firstAttemptCorrect === summary.totalQuestions} />
      </>
    )}
    {achievements}
    {goalAchievement}
  </Box>;
}

/**
 * 結果画面のマスコット（反応役。2026-11-20 方針の場面表）。
 * 数字と事実はシステム文（ドット＋事実文）が担うので、台詞は共感だけにする
 * （同じ内容を2回言わない）。熱量は出来事で変える：全問初回正解のときだけ
 * 驚き→お祝いの表情遷移を入れ、それ以外は応援の反応に留める。
 */
function ResultMascotReaction({ perfect }: { perfect: boolean }) {
  const reduce = useReducedMotion();
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    if (!perfect || reduce) return;
    const timer = setTimeout(() => setCelebrating(true), 750);
    return () => clearTimeout(timer);
  }, [perfect, reduce]);
  const state = perfect ? (celebrating || reduce ? "celebrate" : "surprise") : "cheer";
  return <Box sx={{ display: "flex", alignItems: "center", gap: 2, maxWidth: 640 }}>
    <motion.div key={state} initial={reduce ? false : { opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <MascotFigure mascotId="red-panda" alt="相棒" size="L" motion="bounce" grounding="shadow" state={state} />
    </motion.div>
    <Typography component="p" sx={{ fontSize: 18, fontWeight: 700 }}>
      {perfect
        ? "すごい…！一問も止まらずに解き切ったね！"
        : "つまずいても、見直して自分の力で直せたね。そこがすごいよ。"}
    </Typography>
  </Box>;
}

/** フィードバックが無い場合に単体で出すリザルト画面。称賛ブロック＋次への導線だけを持つ。 */
export function UnitResultScreen({ phase, summary, onNext, nextLabel, achievements, goalAchievement }: {
  phase: BubbleSortUnitPhase;
  summary?: BubbleSortUnitPhaseSummary;
  onNext: () => void;
  /** 次の画面が分かるボタン名（フィードバック画面が続く場合は「フィードバックを見る」）。 */
  nextLabel?: string;
  achievements?: ReactNode;
  /** 大目標の達成の提示（#370）。ある場合は紙吹雪も最大級に引き上げる。 */
  goalAchievement?: ReactNode;
}) {
  if (!phase.result) return null;
  return <Box component="section" aria-label={`${phase.formalName}のリザルト`}
    sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "safe center", gap: 2, p: 2 }}>
    <PhaseResultHeader phase={phase} summary={summary} achievements={achievements} goalAchievement={goalAchievement} />
    <PhaseNextButton label={nextLabel ?? "次へ進む"} onClick={onNext} />
  </Box>;
}

/** フェーズの到達状況を1行の事実文にする。記録がないフェーズは「完了」だけを出す。 */
function summaryLine(index: number, summary?: BubbleSortUnitPhaseSummary): string | null {
  if (!summary) return null;
  if (summary.totalQuestions !== undefined && summary.firstAttemptCorrect !== undefined) {
    return `初回 ${summary.firstAttemptCorrect}/${summary.totalQuestions} 問正解`;
  }
  if (summary.testRuns !== undefined) {
    const usedHints = (summary.hintUsage ?? []).map((count, level) => count > 0 ? `ヒント${level + 1}を${count}回` : null).filter(Boolean);
    return `テスト実行 ${summary.testRuns} 回` + (usedHints.length ? `、${usedHints.join("、")}` : "、ヒントは未使用");
  }
  return null;
}

/** 最終リザルトの要約タイル。値は記録（サマリ）からの事実だけを出す。 */
function StatTile({ label, value }: { label: string; value: string }) {
  return <Box sx={{ flex: "1 1 150px", maxWidth: 204, border: `1px solid ${playerTokens.layers.layer1}`, borderRadius: 2, bgcolor: playerTokens.surface, px: 1.5, py: 1.25, textAlign: "center" }}>
    <Typography component="p" sx={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, color: playerTokens.focus }}>{value}</Typography>
    <Typography component="p" sx={{ fontSize: 14 }}>{label}</Typography>
  </Box>;
}

/** 単元完了時の最終リザルト。称号と締めの文はフェーズ7の完了表示と文言を揃える。 */
export function UnitFinalResult({ summaries, onReviewPhase, rewards, renderRewards, onShowFeedback, newAchievements, goalAchievement }: {
  rewards?: LearningRewards;
  renderRewards?: (rewards: LearningRewards) => ReactNode;
  newAchievements?: ReactNode;
  summaries: Readonly<Record<number, BubbleSortUnitPhaseSummary>>;
  onReviewPhase: (index: number) => void;
  /** フィードバック専用画面への入口（#369）。単元のフィードバックがある場合だけ渡される。 */
  onShowFeedback?: () => void;
  /** 大目標の達成の提示（#370）。単元完了と重なる達成を結果の一部として出す。紙吹雪はこの画面の既存の最大級が担い、追加では発火しない。 */
  goalAchievement?: ReactNode;
}) {
  const headingRef = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => { headingRef.current?.focus(); }, []);
  // 要約タイルはサマリにある記録だけから組み立てる（記録のない項目は出さない）。
  const assessed = bubbleSortUnitPhases.map((_, index) => summaries[index])
    .filter(summary => summary?.totalQuestions !== undefined && summary.firstAttemptCorrect !== undefined);
  const firstCorrectTotal = assessed.reduce((sum, summary) => sum + (summary?.firstAttemptCorrect ?? 0), 0);
  const questionTotal = assessed.reduce((sum, summary) => sum + (summary?.totalQuestions ?? 0), 0);
  const implementation = summaries[bubbleSortUnitPhases.length - 1];
  const hintTotal = (implementation?.hintUsage ?? []).reduce((sum, count) => sum + count, 0);
  const tiles: { label: string; value: string }[] = [];
  if (questionTotal > 0) tiles.push({ label: "初回正解（確認問題・応用問題）", value: `${firstCorrectTotal} / ${questionTotal} 問` });
  if (implementation?.testRuns !== undefined) tiles.push({ label: "自分で実装のテスト実行", value: `${implementation.testRuns} 回` });
  if (implementation?.hintUsage !== undefined) tiles.push({ label: "ヒント使用", value: hintTotal > 0 ? `${hintTotal} 回` : "未使用" });
  // スクロールはこの画面専用に持たず、外側（画面全幅）のスクロールに任せる（#150）。
  return <Box component="section" aria-label="単元完了のリザルト"
    sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 2 }}>
    <ResultConfetti preset="final" />
    <Box component={motion.div} aria-hidden="true" data-final-result-mark
      initial={reduced ? false : { scale: 0.8, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.6, repeat: 0, ease: "easeOut" }}
      sx={{ width: 96, height: 96, borderRadius: "50%", bgcolor: playerTokens.layers.layer0, display: "grid", placeItems: "center", mt: 2 }}>
      <DrawnCheck />
    </Box>
    <Typography ref={headingRef} component="h2" tabIndex={-1} sx={headingSx}>{bubbleSortImplementationContent.result.title}</Typography>
    <UnitPathMiniMap count={bubbleSortUnitPhases.length} />
    {tiles.length > 0 && <Box data-final-stats sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center", width: "100%", maxWidth: 640 }}>
      {tiles.map(tile => <StatTile key={tile.label} label={tile.label} value={tile.value} />)}
    </Box>}
    <Typography component="p" sx={{ fontWeight: 900, fontSize: 18 }}>{bubbleSortUnitText.summaryHeading}</Typography>
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, width: "100%", maxWidth: 560 }}>
      {bubbleSortUnitPhases.map((phase, index) => {
        const line = summaryLine(index, summaries[index]);
        return <Box component="li" key={phase.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.75, borderBottom: `1px solid ${playerTokens.layers.layer1}` }}>
          <CheckCircleIcon aria-hidden sx={{ fontSize: 20, color: playerTokens.focus, flexShrink: 0 }} />
          <Typography component="p" sx={{ fontSize: 16 }}>
            {phase.phase}. {phase.formalName}{line ? ` ― ${line}` : ""}
          </Typography>
          <Button size="small" onClick={() => onReviewPhase(index)}
            sx={{ ml: "auto", minHeight: 36, color: playerTokens.control, whiteSpace: "nowrap" }}>復習する</Button>
        </Box>;
      })}
    </Box>
    <Typography component="p" sx={{ textAlign: "center", fontSize: 16, maxWidth: 640 }}>{bubbleSortImplementationContent.result.closing}</Typography>
    {newAchievements}
    {goalAchievement}
    {rewards && renderRewards?.(rewards)}
    <Typography component="p" sx={{ textAlign: "center", fontSize: 14 }}>{bubbleSortUnitText.reviewNote}</Typography>
    {onShowFeedback ? <>
      <Button variant="contained" onClick={onShowFeedback} sx={{ ...nextButtonSx, minHeight: 48, px: 3, fontSize: 16, fontWeight: 700 }}>フィードバックへ進む</Button>
      <Button variant="text" component={Link} href="/courses" sx={{ mb: 2, minHeight: 44, fontWeight: 700, color: playerTokens.control }}>{bubbleSortUnitText.backToCourses}</Button>
    </> : <Button variant="contained" component={Link} href="/courses" sx={{ ...nextButtonSx, mb: 2 }}>{bubbleSortUnitText.backToCourses}</Button>}
  </Box>;
}
