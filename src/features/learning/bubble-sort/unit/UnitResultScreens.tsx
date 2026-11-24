"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { Box, Button, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { MascotFigure } from "@/app/component/mascotFigure";
import { BubbleSortSolvedThumbnail } from "@/design/MissionThumbnail";

import { findUnitMission } from "../../app/missionRegistry";
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
  // 単元修了の見出しだけは通常の主役サイズ（24）を超える（2026-11-24、Kanato の指定）。
  fontSize: 32, outline: "none",
} as const;

const nextButtonSx = {
  minHeight: 44, bgcolor: playerTokens.focus, color: playerTokens.surface,
  "&:hover": { bgcolor: playerTokens.states.processing.stroke },
} as const;

/**
 * フェーズ完了の称賛ブロック（2026-11-23 再設計）。
 * フィードバック画面の第1段（称賛だけの段）に置く。
 * 称賛は同時に出さず、順序で出す：①終わった（紙吹雪＋✓描画＋見出し）→
 * ②成績（ドットが1つずつ点灯し、点き終わってから事実文が出る）→
 * ③マスコットの反応（表情遷移＋跳躍＋共感の台詞）。
 * 完成図は結果の棒グラフと誤読されるため出さない。
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
  const reduce = useReducedMotion();
  const total = summary?.totalQuestions;
  const first = summary?.firstAttemptCorrect;
  // 成績の点灯数。②の拍：✓の描画が終わる頃から1つずつ点ける。
  const [tally, setTally] = useState(() => (reduce ? (total ?? 0) : 0));
  useEffect(() => {
    if (reduce || total === undefined) return;
    let count = 0;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        count += 1;
        setTally(count);
        if (count >= total) window.clearInterval(interval);
      }, 115);
    }, 500);
    return () => { window.clearTimeout(start); if (interval !== undefined) window.clearInterval(interval); };
  }, [reduce, total]);
  const reacted = total !== undefined && tally >= total;
  const eventual = summary?.eventuallyCorrect;
  // 称賛の熱量は出来事の大きさで変える（場面表）：全問初回正解／全部直し切った／残った問題がある。
  const tier: ResultTier = total !== undefined && first === total ? "perfect"
    : eventual !== undefined && total !== undefined && eventual < total ? "remaining" : "corrected";
  if (!phase.result) return null;
  return <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: "100%" }}>
    <UnitResultCelebration heading={phase.result.heading} headingRef={headingRef} preset={goalAchievement ? "final" : "phase"} />
    {total !== undefined && first !== undefined && (
      <>
        <ResultScoreDots total={total} firstAttemptCorrect={first} eventuallyCorrect={eventual} revealed={tally} />
        {reacted && <motion.p initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }} style={{ margin: 0 }}>
          <Typography component="span" sx={{ display: "block", textAlign: "center", fontSize: 22, fontWeight: 900 }}>
            {tier === "remaining"
              ? `${total}問中、${eventual}問を正解にしました（初回で${first}問正解）。`
              : `全${total}問に正解しました（初回で${first}問正解）。`}
          </Typography>
        </motion.p>}
        {reacted && tier !== "perfect" && <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          {/* ドットの凡例：輪が「未正解」に誤読される（GPT レビュー第5弾⑤）ため、
              初回全問正解以外のケースでは意味を言葉で添える */}
          <LegendDot kind="filled" label="初回で正解" />
          {eventual !== undefined && eventual > first && <LegendDot kind="ring" label="見直して正解" />}
          {tier === "remaining" && <LegendDot kind="grey" label="まだ解けていない" />}
        </Box>}
        <ResultMascotReaction tier={tier} reacted={reacted} remainingCount={total - (eventual ?? total)} />
      </>
    )}
    {achievements}
    {goalAchievement}
  </Box>;
}

type ResultTier = "perfect" | "corrected" | "remaining";

/** ドットの凡例（見本＋言葉）。ドット本体（ResultScoreDots）と同じ見た目で示す。 */
function LegendDot({ kind, label }: { kind: "filled" | "ring" | "grey"; label: string }) {
  return <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
    <Box sx={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
      bgcolor: kind === "filled" ? "#2563eb" : "transparent",
      border: kind === "grey" ? "2.5px solid #c3cad4" : "2.5px solid #2563eb" }} />
    <Typography sx={{ fontSize: 14 }}>{label}</Typography>
  </Box>;
}

/**
 * 結果画面のマスコット（反応役。2026-11-20 方針の場面表）。
 * 数字と事実はシステム文（ドット＋事実文）が担い、詳しい根拠は第2段の
 * 文章側 praise 要素が担う。台詞は反応に加えて一言だけ内容に触れ、
 * フィードバックで振り返る期待を作る（GPT レビュー §1②。praise との
 * 重複は許容する——自分の学習記録に「ネタバレ」はない。2026-11-23 改訂）
 * （同じ内容を2回言わない）。動きも担う：成績の点灯中は小さく揺れて待ち、
 * 点き終わった瞬間に反応する。熱量は出来事の大きさで変える：
 * 全問初回正解＝驚き→お祝い＋大きな跳躍、全部直し切った＝応援＋小さい跳び、
 * 残った問題がある＝応援のみ（跳ばない）。責めない。
 */
function ResultMascotReaction({ tier, reacted, remainingCount }: {
  tier: ResultTier;
  reacted: boolean;
  remainingCount: number;
}) {
  const reduce = useReducedMotion();
  const [jumped, setJumped] = useState(false);
  const state = tier === "perfect" ? (reacted ? "celebrate" : "surprise") : "cheer";
  const jumping = reacted && !jumped && !reduce && tier !== "remaining";
  const jumpKeyframes = tier === "perfect"
    ? { y: [0, -38, 0, -14, 0], rotate: [0, -3, 3, 0, 0] }
    : { y: [0, -16, 0, -6, 0], rotate: [0, 0, 0, 0, 0] };
  return <Box sx={{ display: "flex", alignItems: "center", gap: 2, maxWidth: 640 }}>
    <motion.div
      animate={reduce ? { y: 0, rotate: 0 }
        : jumping ? jumpKeyframes
        : { y: [0, -5, 0], rotate: 0 }}
      transition={jumping ? { duration: tier === "perfect" ? 0.85 : 0.6, ease: "easeOut" }
        : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      onAnimationComplete={() => { if (reacted && !jumped) setJumped(true); }}>
      <motion.div key={state} initial={reduce ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
        <MascotFigure mascotId="red-panda" alt="相棒" size="L" motion="none" grounding="shadow" state={state} />
      </motion.div>
    </motion.div>
    {reacted && <motion.p initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }} style={{ margin: 0 }}>
      <Typography component="span" sx={{ display: "block", fontSize: 18, fontWeight: 700 }}>
        {tier === "perfect"
          ? "すごい…！一問も止まらずに解き切ったね。フィードバックで振り返ってみよう。"
          : tier === "corrected"
            ? "つまずいても、見直して自分の力で直せたね。そこをフィードバックで振り返ろう。"
            : `残った${remainingCount}問は、あとで見直せるよ。どこで止まったか、フィードバックで確認しよう。`}
      </Typography>
    </motion.p>}
  </Box>;
}

/**
 * 第2段（フィードバック）の頭に引き継ぐ結果の要約（2026-11-23 連続性対応）。
 * 第1段で見た事実を小さく残し、祝福から振り返りへ切れ目なく移るため。
 */
export function PhaseResultSummaryLine({ summary }: { summary?: BubbleSortUnitPhaseSummary }) {
  const total = summary?.totalQuestions;
  const first = summary?.firstAttemptCorrect;
  if (total === undefined || first === undefined) return null;
  const eventual = summary?.eventuallyCorrect ?? first;
  const text = eventual >= total
    ? `全${total}問に正解（初回で${first}問正解）`
    : `${total}問中${eventual}問正解（初回で${first}問正解）`;
  return <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
    <ResultScoreDots total={total} firstAttemptCorrect={first} eventuallyCorrect={summary?.eventuallyCorrect} dotSize={13} />
    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{text}</Typography>
  </Box>;
}

/**
 * 単元フィードバックの頭に引き継ぐ、単元全体の要約（2026-11-24）。
 * 段階の要約行と同じ文法（ドット＋事実文）で、確認問題3段階の合計と
 * 実装のテスト実行回数を1行にまとめる。記録がなければ出さない。
 */
export function UnitResultSummaryLine({ summaries }: { summaries: Readonly<Record<number, BubbleSortUnitPhaseSummary>> }) {
  const assessed = bubbleSortUnitPhases.map((_, index) => summaries[index])
    .filter(summary => summary?.totalQuestions !== undefined && summary.firstAttemptCorrect !== undefined);
  const firstCorrectTotal = assessed.reduce((sum, summary) => sum + (summary?.firstAttemptCorrect ?? 0), 0);
  const questionTotal = assessed.reduce((sum, summary) => sum + (summary?.totalQuestions ?? 0), 0);
  const eventuallyTotal = assessed.reduce((sum, summary) => sum + (summary?.eventuallyCorrect ?? summary?.firstAttemptCorrect ?? 0), 0);
  const implementation = summaries[bubbleSortUnitPhases.length - 1];
  if (questionTotal === 0 && implementation?.testRuns === undefined) return null;
  const text = questionTotal > 0
    ? (eventuallyTotal >= questionTotal
      ? `全${questionTotal}問に正解（初回で${firstCorrectTotal}問正解）`
      : `${questionTotal}問中${eventuallyTotal}問正解（初回で${firstCorrectTotal}問正解）`)
    : "";
  const implText = implementation?.testRuns !== undefined ? `自分で実装 テスト${implementation.testRuns}回で通過` : "";
  return <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
    {questionTotal > 0 && <ResultScoreDots total={questionTotal} firstAttemptCorrect={firstCorrectTotal} eventuallyCorrect={eventuallyTotal} dotSize={13} />}
    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{[text, implText].filter(Boolean).join("・")}</Typography>
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

/** 最終リザルトの要約タイル。主役は数値ではなく達成の見出し（2026-11-24）。 */
function StatTile({ headline, value, label, sub }: { headline: string; value: string; label: string; sub?: string }) {
  return <Box sx={{ flex: "1 1 200px", maxWidth: 272, border: `1px solid ${playerTokens.layers.layer1}`, borderRadius: 2, bgcolor: playerTokens.surface, px: 1.5, py: 1.5, textAlign: "center" }}>
    <Typography component="p" sx={{ fontSize: 20, fontWeight: 900, lineHeight: 1.3 }}>{headline}</Typography>
    <Typography component="p" sx={{ fontSize: 24, fontWeight: 900, lineHeight: 1.25, color: playerTokens.focus }}>{value}</Typography>
    <Typography component="p" sx={{ fontSize: 14 }}>{label}</Typography>
    {sub && <Typography component="p" sx={{ fontSize: 14 }}>{sub}</Typography>}
  </Box>;
}

/** 単元完了時の最終リザルト。Kanato は賞賛あり派（2026-11-24）：この画面も
 * 紙吹雪・トロフィー・大きめのマスコットで修了を祝い、同時に成果の記録も担う。
 * 次の一歩はフィードバックが担う。 */
export function UnitFinalResult({ summaries, onReviewPhase, rewards, renderRewards, onShowFeedback, newAchievements, goalAchievement }: {
  rewards?: LearningRewards;
  renderRewards?: (rewards: LearningRewards) => ReactNode;
  newAchievements?: ReactNode;
  summaries: Readonly<Record<number, BubbleSortUnitPhaseSummary>>;
  onReviewPhase: (index: number) => void;
  /** フィードバック専用画面への入口（#369）。単元のフィードバックがある場合だけ渡される。 */
  onShowFeedback?: () => void;
  /** 大目標の達成の提示（#370）。単元完了と重なる達成を結果の一部として出す。 */
  goalAchievement?: ReactNode;
}) {
  const headingRef = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => { headingRef.current?.focus(); }, []);
  // 実績ゾーンの出現は2条件（2026-11-24）：(1) トロフィー→学習経路の描画→
  // ゴールの鼓動という冒頭の流れが終わること、(2) ゾーンの位置が実際に画面内に
  // 入っていること。小さい画面で下に隠れている間に解除音と出現が終わってしまう
  // のを防ぐ（時間で遅らせるだけでは「見た」ことにならないため）。
  const [pathDone, setPathDone] = useState(false);
  const [zoneSeen, setZoneSeen] = useState(false);
  const zoneAnchorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced) { setPathDone(true); return; }
    const timer = setTimeout(() => setPathDone(true), 2300);
    return () => clearTimeout(timer);
  }, [reduced]);
  useEffect(() => {
    const el = zoneAnchorRef.current;
    if (!el || typeof IntersectionObserver === "undefined") { setZoneSeen(true); return; }
    const io = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setZoneSeen(true); io.disconnect(); }
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const rewardsReady = pathDone && zoneSeen;
  const mission = findUnitMission("course-algorithm-bubble-sort-v2");
  // 要約タイルはサマリにある記録だけから組み立てる（記録のない項目は出さない）。
  const assessed = bubbleSortUnitPhases.map((_, index) => summaries[index])
    .filter(summary => summary?.totalQuestions !== undefined && summary.firstAttemptCorrect !== undefined);
  const firstCorrectTotal = assessed.reduce((sum, summary) => sum + (summary?.firstAttemptCorrect ?? 0), 0);
  const eventuallyTotal = assessed.reduce((sum, summary) => sum + (summary?.eventuallyCorrect ?? summary?.firstAttemptCorrect ?? 0), 0);
  const questionTotal = assessed.reduce((sum, summary) => sum + (summary?.totalQuestions ?? 0), 0);
  const implementation = summaries[bubbleSortUnitPhases.length - 1];
  const hintTotal = (implementation?.hintUsage ?? []).reduce((sum, count) => sum + count, 0);
  const tiles: { headline: string; value: string; label: string; sub?: string }[] = [];
  // 見出し＝達成、数値＝その証拠（2026-11-24）。どの値でも肯定として読める文にする。
  if (questionTotal > 0) tiles.push({ headline: eventuallyTotal === questionTotal ? "全問正解" : `${eventuallyTotal} 問正解`, value: `${eventuallyTotal} / ${questionTotal} 問`, label: "正解（確認問題・応用問題）", sub: `初回で正解 ${firstCorrectTotal} 問` });
  if (implementation?.testRuns !== undefined) tiles.push({ headline: implementation.testRuns === 1 ? "一発でクリア" : "試行錯誤してクリア", value: `${implementation.testRuns} 回`, label: "自分で実装のテスト実行" });
  if (implementation?.hintUsage !== undefined) tiles.push({ headline: hintTotal > 0 ? "ヒントを手がかりにクリア" : "ヒントなしでクリア", value: hintTotal > 0 ? `${hintTotal} 回` : "未使用", label: "ヒント使用" });
  // スクロールはこの画面専用に持たず、外側（画面全幅）のスクロールに任せる（#150）。
  return <Box component="section" aria-label="単元完了のリザルト"
    sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, p: 2 }}>
    <ResultConfetti preset="final" />
    {/* 修了の象徴はチェックではなくトロフィー（2026-11-24、Kanato の指定）。
        金はこの画面とゴールの星ノードに限る特別色として使う。 */}
    {/* 称賛は一つのシーンとして出す（2026-11-24）：トロフィー・見出し・マスコットを
        淡い金の放射光の中に寄せ、視線を一箇所に集める。 */}
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, width: "100%", maxWidth: 880, py: 2.5, borderRadius: 4,
      background: "radial-gradient(ellipse 72% 92% at 50% 38%, rgba(217, 119, 6, 0.13), rgba(217, 119, 6, 0) 70%)" }}>
      <Box component={motion.div} aria-hidden="true" data-final-result-mark
        initial={reduced ? false : { scale: 0.8, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.6, repeat: 0, ease: "easeOut" }}
        sx={{ width: 144, height: 144, flexShrink: 0, borderRadius: "50%", bgcolor: "#fef3c7", border: "3px solid #d97706", display: "grid", placeItems: "center" }}>
        <EmojiEventsIcon sx={{ fontSize: 84, color: "#d97706" }} />
      </Box>
      <Typography ref={headingRef} component="h2" tabIndex={-1} sx={headingSx}>{bubbleSortUnitText.finalHeading}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <MascotFigure mascotId="red-panda" alt="相棒" size="XL" state="celebrate" motion="float" grounding="shadow" />
        <Box sx={{ bgcolor: "#fff", border: "1px solid #dbe3ef", borderRadius: "14px", px: 2, py: 1.25 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700 }}>動きを理解するところから、自分でコードを書けるところまで到達したね！</Typography>
        </Box>
      </Box>
    </Box>
    <UnitPathMiniMap count={bubbleSortUnitPhases.length} labels={bubbleSortUnitPhases.map(phase => phase.shortName)} />
    {/* 開始時の問いへの答え（2026-11-24）：ミッションの棚が並んだ姿を見せる。 */}
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", maxWidth: 880, p: 2, bgcolor: "#fff", border: "2px solid #2563eb", borderRadius: 2 }}>
      <Box sx={{ width: 300, flexShrink: 0 }}><BubbleSortSolvedThumbnail /></Box>
      <Box>
        <Box component="span" sx={{ display: "inline-block", bgcolor: "#e3ecfd", color: "#2563eb", fontWeight: 800, fontSize: 13, px: 1, py: 0.25, borderRadius: 999 }}>単元ミッション</Box>
        <Typography component="p" sx={{ fontSize: 18, fontWeight: 900, mt: 0.75 }}>{mission?.title}</Typography>
        <Typography component="p" sx={{ fontSize: 14, mt: 0.5 }}>バラバラだった棚が、番号順に整いました。探したい本が、すぐ見つかる棚になりました。</Typography>
      </Box>
    </Box>
    {/* 並びは「成果を確認する→報酬が与えられる→次を狙う→振り返る」の順（2026-11-24）。 */}
    {tiles.length > 0 && <Box data-final-stats sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center", width: "100%", maxWidth: 880 }}>
      {tiles.map(tile => <StatTile key={tile.label} headline={tile.headline} label={tile.label} value={tile.value} sub={tile.sub} />)}
    </Box>}
    <Box ref={zoneAnchorRef} sx={{ width: "100%", maxWidth: 880 }} />
    {rewardsReady && newAchievements}
    <Typography component="p" sx={{ fontWeight: 900, fontSize: 18 }}>{bubbleSortUnitText.summaryHeading}</Typography>
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, width: "100%", maxWidth: 880 }}>
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
    {goalAchievement}
    {rewards && renderRewards?.(rewards)}
    <Typography component="p" sx={{ textAlign: "center", fontSize: 14 }}>{bubbleSortUnitText.reviewNote}</Typography>
    {onShowFeedback ? <>
      <Button variant="contained" onClick={onShowFeedback} sx={{ ...nextButtonSx, minHeight: 48, px: 3, fontSize: 16, fontWeight: 700 }}>フィードバックへ進む</Button>
      <Button variant="text" component={Link} href="/courses" sx={{ mb: 2, minHeight: 44, fontWeight: 700, color: playerTokens.control }}>{bubbleSortUnitText.backToCourses}</Button>
    </> : <Button variant="contained" component={Link} href="/courses" sx={{ ...nextButtonSx, mb: 2 }}>{bubbleSortUnitText.backToCourses}</Button>}
  </Box>;
}
