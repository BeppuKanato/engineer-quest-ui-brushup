"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { LEARNING_EDITOR_THEME, learningEditorTextCursor, setupLearningEditor } from "../../code/learningEditor";
import { Box, Button, Chip, Tab, Tabs, Typography } from "@mui/material";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { disposePyodideRunner, preparePyodide } from "../../../../lib/pyodideRunner";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { implementationInputLevels, implementationInputLevelText, type ImplementationInputLevel } from "../../implementation/inputLevel";
import { useImplementationInputLevel } from "../../implementation/useImplementationInputLevel";

import { missionThumbnailFor } from "@/design/MissionThumbnail";
import { findUnitMission } from "../../app/missionRegistry";
import { DrawnCheck } from "../../app/DrawnCheck";
import { ResultConfetti } from "../../app/ResultConfetti";
import { useSoundEffect } from "../../../../app/component/soundFeedback";
import { useErrorLineDecoration } from "../../../../hooks/useErrorLineDecoration";
import { useTodoLineDecoration } from "../../../../hooks/useTodoLineDecoration";
import { playerTokens } from "../../player/player.tokens";
import { BubbleSortTraceDialog } from "../trace/BubbleSortTraceDialog";
import { traceBubbleSortCode } from "../trace/acquireTrace";
import { convertBubbleSortTrace } from "../trace/convertTrace";
import { bubbleSortTraceText } from "../trace/trace.content";
import type { BubbleSortTracePlayback } from "../trace/trace.types";
import { FreeExecutionConsole } from "./FreeExecutionConsole";
import { runBubbleSortFreeCode, type FreeExecutionResult } from "./freeExecution";
import { bubbleSortEditorText as text } from "./editor.content";
import { editorTokens as colors } from "./editor.tokens";
import { ImplementationHintContent } from "./ImplementationHints";
import { ImplementationResults } from "./ImplementationResults";
import { bubbleSortImplementationContent as content } from "./implementation.content";
import { allTestsPassed, runImplementationTests, recordHintUsage, runningMessage, type BubbleSortImplementationSummary, type HintLevel, type HintUsage, type TestOutcome } from "./implementation";

/** 達成モーダルの中で、本がバラバラ→番号順に並び替わる短い演出。
    導入で見た「困った棚」が、自分のコードで解決されたことを絵で回収する。 */
function SortingShelfCelebration() {
  const reduce = useReducedMotion();
  const initial = [4, 2, 5, 1, 3];
  const palette = ["#7d8ca3", "#a3826d", "#7da383", "#8d7da3", "#a37d7d"];
  const [sorted, setSorted] = useState(false);
  useEffect(() => {
    if (reduce) { setSorted(true); return; }
    const timer = setTimeout(() => setSorted(true), 700);
    return () => clearTimeout(timer);
  }, [reduce]);
  const shelfY = 126, bookW = 44, innerW = 400, startX = 30;
  const gap = (innerW - initial.length * bookW) / (initial.length + 1);
  const slotX = (index: number) => startX + gap + index * (bookW + gap);
  const sortedValues = [...initial].sort((a, b) => a - b);
  return <svg viewBox="0 0 460 210" role="img" aria-label="本が番号順に並び替わる棚" style={{ display: "block", width: "100%", height: "auto" }}>
    <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
    <rect x={startX - 10} y={shelfY} width={innerW + 20} height="10" rx="2" fill="#8d6e63" />
    <rect x={startX + 22} y={shelfY + 10} width="12" height="44" fill="#8d6e63" />
    <rect x={startX + innerW - 34} y={shelfY + 10} width="12" height="44" fill="#8d6e63" />
    {initial.map((value, i) => {
      const h = 26 + (value / 5) * 74;
      const target = sorted ? sortedValues.indexOf(value) : i;
      return <motion.g key={value} initial={false}
        animate={{ x: slotX(target) - slotX(i) }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 16, delay: 0.1 + i * 0.09 }}>
        <rect x={slotX(i)} y={shelfY - h} width={bookW} height={h} rx="3" fill={palette[i]} />
        <text x={slotX(i) + bookW / 2} y={shelfY - h / 2 + 6} textAnchor="middle" fontSize="17" fontWeight="900" fill="#ffffff">{value}</text>
      </motion.g>;
    })}
  </svg>;
}

/** 書き方カードのイラスト。描いているのは「始める時点のコード」そのもの：
    実線の行＝もう書かれている、青い点線の空白＝自分で書く場所。
    埋まっている量がコードの埋まり具合と一致する（スカスカ→半分→ほぼ埋まってる）。 */
function LevelFillIllustration({ level }: { level: ImplementationInputLevel }) {
  const rows: Record<ImplementationInputLevel, readonly { w: number; write: boolean }[]> = {
    "full": [{ w: 0.5, write: false }, { w: 0.85, write: true }, { w: 0.65, write: true }, { w: 0.92, write: true }, { w: 0.72, write: true }, { w: 0.8, write: true }, { w: 0.45, write: true }],
    "skeleton": [{ w: 0.5, write: false }, { w: 0.7, write: false }, { w: 0.6, write: true }, { w: 0.85, write: false }, { w: 0.75, write: true }, { w: 0.62, write: true }, { w: 0.45, write: false }],
    "fill-in": [{ w: 0.5, write: false }, { w: 0.82, write: false }, { w: 0.66, write: false }, { w: 0.7, write: true }, { w: 0.9, write: false }, { w: 0.6, write: false }, { w: 0.45, write: true }],
  };
  const list = rows[level];
  return <svg viewBox="0 0 300 96" aria-hidden style={{ display: "block", width: "100%", height: "auto" }}>
    <rect x="1" y="1" width="298" height="94" rx="8" fill="#f8fafc" stroke="#dbe3ef" strokeWidth="2" />
    {list.map((row, i) => row.write
      ? <rect key={i} x="16" y={12 + i * 11} width={268 * row.w} height="7" rx="3.5" fill="#ffffff" stroke="#2563eb" strokeWidth="1.6" strokeDasharray="4 3" />
      : <rect key={i} x="16" y={12 + i * 11} width={268 * row.w} height="7" rx="3.5" fill="#94a3b8" />)}
  </svg>;
}

/** embedded / onComplete は単元フロー接続（後続Issue）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function BubbleSortImplementationPreview({ embedded = false, onComplete, onLearningEvent, active = true, codeDraftBaseKey, onCodeDraftError, onShowFinalResult }: LearningInstrumentation & { embedded?: boolean; onComplete?: (summary: BubbleSortImplementationSummary) => void; codeDraftBaseKey?: string; onCodeDraftError?: (failed: boolean) => void; onShowFinalResult?: () => void }) {
  // 入力量レベルとレベル別下書き（Issue #328）。単品ページではプレビュー専用のキーで下書きを分ける。
  const draftBaseKey = codeDraftBaseKey ?? `engineer-quest:learning-code:preview:${content.id}`;
  const { level, code, setCode, selectLevel } = useImplementationInputLevel({ draftBaseKey, templates: content.templates, onDraftError: onCodeDraftError });
  const [runtime, setRuntime] = useState<"loading" | "ready" | "error">("loading");
  const [running, setRunning] = useState(false);
  const [tracing, setTracing] = useState(false);
  const [freeStatus, setFreeStatus] = useState<"idle" | "preparing" | "running">("idle");
  const [freeResult, setFreeResult] = useState<FreeExecutionResult | null>(null);
  const [panel, setPanel] = useState<"tests" | "console" | "hints">("tests");
  // 書く量は挑戦を始める前に選ぶ（開始前ゲート）。開始後はコンパクト表示のみ。
  const [started, setStarted] = useState(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  const freeRunning = freeStatus !== "idle";
  const busy = running || tracing || freeRunning;
  const panelId = useId();
  const sidePanel = useRef<HTMLElement>(null);
  const [tracePlayback, setTracePlayback] = useState<BubbleSortTracePlayback | null>(null);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<readonly TestOutcome[]>([]);
  const [lastOutcomes, setLastOutcomes] = useState<readonly TestOutcome[]>([]);
  const [runs, setRuns] = useState(0);
  const traceRuns = useRef(0);
  const [usage, setUsage] = useState<HintUsage>([0, 0, 0, 0]);
  const [hint, setHint] = useState<HintLevel | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const editor = useRef<Parameters<OnMount>[0] | null>(null);
  const [errorLine, setErrorLine] = useState<number | undefined>(undefined);
  useErrorLineDecoration(editor, editorReady, errorLine);
  // 骨格・穴埋めの「ここを書く」行は、書くべき場所として行ごと目印を付ける。
  const todoLines = code.split("\n").flatMap((line, index) => line.includes("ここを書く") ? [index + 1] : []);
  useTodoLineDecoration(editor, editorReady, todoLines);
  // 紙吹雪と歓声は、モーダル内の棚が並び終わる瞬間に合わせる（達成演出の順序）。
  const reduceMotion = useReducedMotion();
  const [confettiReady, setConfettiReady] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const completedRef = useRef(false);
  const { play } = useSoundEffect();
  const prevPassedRef = useRef(0);
  const passed = outcomes.filter(outcome => outcome.passed).length;
  const complete = !running && allTestsPassed(content.tests, outcomes);
  // コードを編集しても、前回の結果は「前回」と明示して残す（進歩の実感を消さない）。
  // 判定・完了は常に現在の outcomes だけで決める。書き方を変えたら前回も消える。
  const displayOutcomes = running || outcomes.length > 0 ? outcomes : lastOutcomes;
  const staleResults = !running && outcomes.length === 0 && lastOutcomes.length > 0;
  const displayPassed = displayOutcomes.filter(outcome => outcome.passed).length;
  const focusErrorLine = (line: number) => {
    const instance = editor.current;
    if (!instance) return;
    setErrorLine(line);
    instance.revealLineInCenter(line);
    instance.setPosition({ lineNumber: line, column: 1 });
    instance.focus();
  };
  const prepare = useCallback(async () => {
    const current = ++generation.current;
    setRuntime("loading");
    try { await preparePyodide(); if (current === generation.current) setRuntime("ready"); }
    catch { if (current === generation.current) { setRuntime("error"); disposePyodideRunner(); } }
  }, []);
  useEffect(() => {
    const lifetime = generation;
    void prepare();
    return () => { lifetime.current++; disposePyodideRunner(); };
  }, [prepare]);
  useEffect(() => {
    if (!complete) { setConfettiReady(false); return; }
    if (reduceMotion) { setConfettiReady(true); return; }
    // 棚の演出は開始0.7秒＋バネの移動で約1.85秒。整列しきった所で撃つ。
    const timer = setTimeout(() => setConfettiReady(true), 1850);
    return () => clearTimeout(timer);
  }, [complete, reduceMotion]);
  // 全テスト通過した瞬間だけ単元フローへ通知する。
  useEffect(() => {
    if (complete && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({ testRuns: runs, hintUsage: usage, inputLevel: level, code });
    }
    if (!complete) { completedRef.current = false; setCelebrationDismissed(false); }
  }, [complete, onComplete, runs, usage, level, code]);
  // テストが新たに通過するたび、小さな確認音で採点の進みを伝える（#305 案A'）。
  // 全通過時の紙吹雪と歓声は ResultConfetti が担当し、演出の強弱を分ける。
  useEffect(() => {
    const passedCount = outcomes.filter(outcome => outcome.passed).length;
    if (passedCount > prevPassedRef.current) play("answerCorrect");
    prevPassedRef.current = passedCount;
  }, [outcomes, play]);
  useEffect(() => {
    const shouldScroll = (panel === "console" && freeRunning) || (panel === "tests" && running);
    if (shouldScroll && window.matchMedia("(max-width: 899px)").matches) sidePanel.current?.scrollIntoView({ block: "start" });
  }, [panel, freeRunning, running]);
  const runFree = async () => {
    if (lock.current || runtime !== "ready" || !editorReady || !code.trim()) return;
    lock.current = true;
    const current = generation.current;
    setFreeStatus("preparing"); setFreeResult(null); setErrorLine(undefined); setPanel("console");
    try {
      const result = await runBubbleSortFreeCode(code, () => { if (current === generation.current) setFreeStatus("running"); }, () => current === generation.current);
      if (current === generation.current) { setFreeResult(result); setErrorLine(result.returned ? undefined : result.errorLine); }
    } catch {
      if (current === generation.current) setFreeResult({ stdout: "", outputTruncated: false, returned: false, error: "unavailable" });
    } finally {
      lock.current = false;
      if (current === generation.current) setFreeStatus("idle");
    }
  };
  const run = async () => {
    if (lock.current || runtime !== "ready" || complete || !code.trim()) return;
    lock.current = true;
    const current = generation.current;
    setPanel("tests");
    onLearningEvent?.({ eventType: "implementation_run", payload: { kind: "test", count: runs + 1, code, level } });
    setRunning(true); setRuns(count => count + 1); setOutcomes([]); setTraceError(null); setErrorLine(undefined);
    try {
      const result = await runImplementationTests(code, content.tests, next => { if (current === generation.current) { setOutcomes(next); setErrorLine(next.find(outcome => outcome.errorLine !== undefined)?.errorLine); } }, () => current === generation.current);
      if (current === generation.current) {
        setLastOutcomes(result);
        onLearningEvent?.({ eventType: "implementation_test_result", payload: { count: runs + 1, code, level, results: result.map(item => ({ id: item.id, passed: item.passed, error: item.error ?? (item.passed ? null : "mismatch") })) } });
        if (allTestsPassed(content.tests, result)) onLearningEvent?.({ eventType: "implementation_complete", payload: { testRuns: runs + 1, hintUsage: usage, code, level } });
      }
    } finally {
      lock.current = false;
      if (current === generation.current) setRunning(false);
    }
  };
  const runTrace = async () => {
    if (lock.current || runtime !== "ready" || !editorReady || !code.trim()) return;
    lock.current = true;
    const current = generation.current;
    traceRuns.current++;
    onLearningEvent?.({ eventType: "implementation_run", payload: { kind: "trace", count: traceRuns.current, code, level } });
    setTracing(true); setTraceError(null);
    try {
      const trace = await traceBubbleSortCode(code, () => current === generation.current);
      if (current === generation.current) {
        const playback = convertBubbleSortTrace(trace);
        setTracePlayback(playback);
        onLearningEvent?.({ eventType: "trace_result", payload: { mode: playback.mode, states: playback.content.steps.length, status: trace.status, partial: !!playback.notice, errorKind: trace.error?.kind ?? null } });
      }
    } catch (error) {
      onLearningEvent?.({ eventType: "trace_result", payload: { status: "failed", states: 0, timeout: error instanceof Error && error.message.includes("タイムアウト") } });
      if (current === generation.current) setTraceError(error instanceof Error && error.message.includes("タイムアウト") ? bubbleSortTraceText.timeout : bubbleSortTraceText.unavailable);
    } finally {
      lock.current = false;
      if (current === generation.current) setTracing(false);
    }
  };
  const outlinedButton = { minHeight: 44, color: colors.text, borderColor: colors.border,
    "&:hover": { borderColor: colors.text, bgcolor: colors.button },
    "&.Mui-disabled": { color: colors.text, borderColor: colors.border, opacity: 0.45 } };
  const traceButton = <Button variant="outlined" startIcon={<VisibilityIcon />} disabled={runtime !== "ready" || busy || !editorReady || !code.trim()} onClick={() => void runTrace()}
    sx={outlinedButton}>{complete ? bubbleSortTraceText.resultButton : bubbleSortTraceText.button}</Button>;
  const insert = (token: string) => {
    const instance = editor.current, selection = instance?.getSelection();
    if (!instance || !selection || busy) return;
    onLearningEvent?.({ eventType: "hint_token_insert", payload: { level: 1, token } });
    instance.pushUndoStop();
    instance.executeEdits("bubble-sort-token", [{ range: selection, text: token, forceMoveMarkers: true }]);
    instance.pushUndoStop(); instance.focus();
  };
  const openHint = (level: HintLevel) => {
    if (level > 1 && usage[level - 2] === 0) return;
    onLearningEvent?.({ eventType: "hint_open", payload: { level, count: usage[level - 1] + 1 } });
    setUsage(current => recordHintUsage(current, level)); setHint(level);
  };
  // レベルの切り替えはログに残し、表示中の結果は切り替えたレベルのコードに合わせて消す（Issue #328）。
  const changeLevel = (next: ImplementationInputLevel) => {
    if (busy || next === level) return;
    onLearningEvent?.({ eventType: "implementation_level_select", payload: { level: next, previousLevel: level } });
    selectLevel(next);
    setOutcomes([]); setLastOutcomes([]); setTraceError(null); setFreeResult(null);
  };
  return <Box component={embedded ? "div" : "main"} sx={{ height: embedded ? "100%" : "100dvh", minHeight: 0, bgcolor: colors.background, color: colors.text, p: { xs: 1, sm: 2 } }}>
    <Box component="section" aria-label="バブルソートの自分で実装"
      sx={{ width: "100%", height: "100%", minHeight: 0, display: "flex", flexDirection: "column", gap: 1, position: "relative" }}>
      {/* 作業開始後は見出し文を畳み、縦をコードに譲る（1093×614で実測：開始前は
          エディタ表示が約3行しか残らなかった）。ミッション自体はバンドが担う。 */}
      {!started && <Typography component="p" sx={{ textAlign: "center", fontWeight: 700, fontSize: "clamp(18px, 1.5vw, 24px)", flexShrink: 0 }}>
        {content.caption}
      </Typography>}
      {/* 最終チャレンジは単元ミッションの達成そのもの（再設計 2026-11-22）。
          「同じ課題だ」と分かるよう、単元画面のミッションバンドと同一の
          サムネイル・チップ・題を使う（絵と色が同一性の担い手）。 */}
      {(() => {
        const mission = findUnitMission("course-algorithm-bubble-sort-v2");
        const thumbnail = missionThumbnailFor("course-algorithm-bubble-sort-v2");
        if (!mission || !thumbnail) return null;
        return <Box sx={{ flexShrink: 0, border: "2px solid #2563eb", borderRadius: 3, bgcolor: "#fff", px: 2, py: 1.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box aria-hidden sx={{ width: started ? 96 : 150, flexShrink: 0, borderRadius: 1.5, overflow: "hidden" }}>{thumbnail}</Box>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip label="単元ミッション" size="small" sx={{ fontWeight: 800, bgcolor: "#2563eb", color: "#fff" }} />
                <Typography component="p" sx={{ fontSize: 16, fontWeight: 800 }}>{mission.title}</Typography>
              </Box>
              <Typography component="p" sx={{ fontSize: 14, mt: 0.5 }}>達成の条件：{mission.successCondition}。下のテストは、その確認です。</Typography>
            </Box>
          </Box>
          {/* 進捗はミッションの一部として見せる：テストの通過ではなく、
              ミッション達成に近づいていることが大きな数字と帯で分かる。 */}
          <Box role="status" aria-live="polite" sx={{ borderTop: "1px solid #dbe3ef", mt: 1.25, pt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
              <Typography component="p" sx={{ fontSize: 16, fontWeight: 800 }}>{complete ? "ミッション達成" : "ミッション達成まで"}</Typography>
              <Typography component="p" sx={{ fontSize: 22, fontWeight: 900 }}>
                <Box component="span" sx={{ color: displayPassed > 0 && !staleResults ? "#16a34a" : "inherit" }}>{staleResults ? "前回 " : ""}{displayPassed}</Box> / {content.tests.length}
              </Typography>
            </Box>
            {staleResults && <Typography component="p" sx={{ fontSize: 14, mt: 0.25 }}>前回のテスト結果です。コードが変更されています。再実行すると更新されます。</Typography>}
            <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${content.tests.length}, minmax(0, 1fr))`, gap: 1, mt: 0.5 }}>
              {content.tests.map(test => {
                const outcome = displayOutcomes.find(item => item.id === test.id);
                const state = !outcome ? "todo" : outcome.passed ? "passed" : outcome.error ? "error" : "failed";
                return <Box key={test.id} sx={{ minWidth: 0 }}>
                  <Box aria-hidden sx={{ height: 8, borderRadius: 999,
                    ...(state === "passed" && staleResults ? { bgcolor: "#fff", border: "2px solid #16a34a" }
                      : state === "passed" ? { bgcolor: "#16a34a" }
                      : state === "todo" ? { bgcolor: "#e5e7eb" }
                      : { bgcolor: "#fff", border: "2px solid #111827" }) }} />
                  <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {state === "passed" ? "✓" : state === "error" ? "!" : state === "failed" ? "×" : "○"} {test.label.split("（")[0]}
                  </Typography>
                </Box>;
              })}
            </Box>
            {/* 達成後はモーダルを閉じても、結果へ進む主ボタンを作業画面に残す。 */}
            {complete && onShowFinalResult && <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
              <Button variant="contained" onClick={onShowFinalResult}
                sx={{ minHeight: 48, px: 3, fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>単元の結果を見る</Button>
            </Box>}
          </Box>
        </Box>;
      })()}
      {complete && confettiReady && <ResultConfetti preset="final" />}
      {!started && !complete ? (
        <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 2, py: 3, pt: { md: 5 } }}>
          <Typography component="p" sx={{ fontSize: 22, fontWeight: 900, textAlign: "center" }}>自分のコードで、本を番号順に並べ替えよう</Typography>
          <Typography component="p" sx={{ fontSize: 16, textAlign: "center" }}>自分に合った書き方を選んで挑戦しましょう。どの書き方でも、テストと達成の条件は同じです。あとから変えることもできます。</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, width: "100%", maxWidth: 1060, mt: 1 }}>
            {implementationInputLevels.map(candidate => (
              <Button key={candidate} variant="outlined" onClick={() => { changeLevel(candidate); setStarted(true); }}
                sx={{ display: "block", textAlign: "left", p: 2.5, borderRadius: 3, border: "2px solid #dbe3ef", bgcolor: "#fff", color: colors.text, textTransform: "none", "&:hover": { borderColor: "#2563eb", bgcolor: "#fff" } }}>
                <Typography component="p" sx={{ fontSize: 18, fontWeight: 900, mb: 1 }}>{implementationInputLevelText.levels[candidate].label}</Typography>
                <Box sx={{ mb: 1.5 }}><LevelFillIllustration level={candidate} /></Box>
                <Typography component="p" sx={{ fontSize: 14, lineHeight: 1.7 }}>{implementationInputLevelText.levels[candidate].description}</Typography>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>{implementationInputLevelText.levels[candidate].guide}</Typography>
                {/* 実際のテンプレートの冒頭。読む前に「どこまで自分で書くか」が見える。 */}
                <Box component="pre" aria-hidden sx={{ m: 0, p: 1.5, height: 176, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.65, whiteSpace: "pre", overflow: "hidden", color: colors.text, WebkitMaskImage: "linear-gradient(to right, black 88%, transparent)", maskImage: "linear-gradient(to right, black 88%, transparent)" }}>
                  {content.templates[candidate].split("\n").slice(0, 7).join("\n")}
                  {content.templates[candidate].split("\n").length > 7 ? "\n…" : ""}
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
                  <Typography component="span" sx={{ fontSize: 15, fontWeight: 800, color: "#2563eb" }}>この書き方で始める →</Typography>
                </Box>
              </Button>
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 2.5, alignItems: "center" }}>
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 14 }}>
              <Box aria-hidden sx={{ width: 22, height: 8, borderRadius: 999, bgcolor: "#94a3b8" }} />用意されている
            </Box>
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 14 }}>
              <Box aria-hidden sx={{ width: 22, height: 8, borderRadius: 999, bgcolor: "#fff", border: "1.6px dashed #2563eb" }} />自分で書く
            </Box>
          </Box>
          <Typography component="p" sx={{ fontSize: 14, textAlign: "center" }}>{implementationInputLevelText.note}</Typography>
        </Box>
      ) : <>
      {!complete && <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 1 }}>
        <Typography component="p" sx={{ fontSize: 15 }}>書き方：<Box component="span" sx={{ fontWeight: 800 }}>{implementationInputLevelText.levels[level].label}</Box></Typography>
        <Button size="small" onClick={() => setStarted(false)} sx={{ minHeight: 36, color: playerTokens.focus, fontWeight: 700 }}>書き方を変える</Button>
      </Box>}
      <>
        <Box data-editor-workspace sx={{ flex: 1, minHeight: 0, overflowY: { xs: "auto", md: "hidden" }, display: { xs: "block", md: "grid" }, gridTemplateColumns: "minmax(0, 1.5fr) minmax(340px, 1fr)", gap: 2 }}>
          <Box aria-label={text.code} sx={{ minWidth: 0, minHeight: { xs: 360, md: 0 }, height: { xs: "70dvh", md: "100%" }, display: "flex", flexDirection: "column", border: "2px solid #dbe3ef", "&:focus-within": { borderColor: "#2563eb" }, borderRadius: 1.5, overflow: "hidden", bgcolor: colors.panel,
            "& .monaco-editor .monaco-scrollable-element, & .monaco-editor .view-lines, & .monaco-editor .inputarea": { cursor: learningEditorTextCursor } }}>
            <Box role="group" aria-label={text.panel} sx={{ flexShrink: 0, p: 1, bgcolor: colors.panelAlt, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "flex-start" }}>
              <Typography component="p" sx={{ fontWeight: 800, fontSize: 16, mr: 0.5, pt: 1.25 }}>{text.code}</Typography>
              {/* 3つの実行は役割が違う。ボタンの下に役割の一文を添えて、文言だけに頼らない。 */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                <Button variant="outlined" startIcon={<PlayArrowIcon />} disabled={runtime !== "ready" || busy || !editorReady || !code.trim()} onClick={() => void runFree()} sx={outlinedButton}>{text.freeRun}</Button>
                <Typography component="p" sx={{ fontSize: 13, textAlign: "center" }}>{text.buttonNotes.free}</Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                {traceButton}
                <Typography component="p" sx={{ fontSize: 13, textAlign: "center" }}>{text.buttonNotes.trace}</Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                <Button variant="contained" startIcon={<FactCheckIcon />} disabled={runtime !== "ready" || busy || !editorReady || !code.trim()} onClick={() => void run()}
                  sx={{ minHeight: 44, bgcolor: playerTokens.focus, color: playerTokens.surface, "&:hover": { bgcolor: playerTokens.states.processing.stroke }, "&.Mui-disabled": { bgcolor: colors.button, color: colors.text, opacity: 0.45 } }}>{content.controls.run}</Button>
                <Typography component="p" sx={{ fontSize: 13, textAlign: "center" }}>{text.buttonNotes.run}</Typography>
              </Box>
              {/* 実行環境の状態は画面下部ではなく、実行ボタンの隣で見せる（読み込み失敗を見落とさない）。 */}
              <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1, pt: 0.75 }}>
                <Typography component="p" role="status" sx={{ fontSize: 14, textAlign: "right" }}>
                  {freeStatus === "preparing" ? text.preparing : freeStatus === "running" ? text.running : tracing ? bubbleSortTraceText.loading : running ? runningMessage(outcomes.length, content.tests.length) : runtime === "error" ? content.status.unavailable : content.status[runtime]}
                </Typography>
                {runtime === "error" && <Button onClick={() => void prepare()} sx={outlinedButton}>{content.controls.reload}</Button>}
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>

              <Editor height="100%" language="python" theme={LEARNING_EDITOR_THEME} beforeMount={setupLearningEditor} value={code} loading={content.status.editorLoading}
                onMount={instance => { editor.current = instance; setEditorReady(true); }}
                onChange={next => { setCode(next ?? ""); setOutcomes([]); setTraceError(null); setFreeResult(null); setErrorLine(undefined); }}
                options={{ fontSize: 16, lineHeight: 29, fontFamily: "monospace", minimap: { enabled: false }, tabSize: 4, insertSpaces: true,
                  readOnly: busy, automaticLayout: true, scrollBeyondLastLine: false, lineNumbersMinChars: 2, wordWrap: "on", padding: { top: 8, bottom: 8 } }} />
            </Box>
          </Box>
          <Box component="aside" ref={sidePanel} sx={{ minWidth: 0, minHeight: 0, mt: { xs: 2, md: 0 }, height: { xs: "74dvh", md: "100%" }, display: "flex", flexDirection: "column", border: `1px solid ${colors.border}`, borderRadius: 1.5, overflow: "hidden", bgcolor: colors.panel }}>
            <Tabs value={panel} onChange={(_, value: "tests" | "console" | "hints") => setPanel(value)} textColor="inherit" aria-label={text.panel}
              sx={{ flexShrink: 0, borderBottom: `1px solid ${colors.border}`, "& .MuiTabs-indicator": { bgcolor: colors.focus }, "& .MuiTab-root": { fontSize: 16 } }}>
              <Tab value="tests" label={text.testsTab} id={`${panelId}-tests`} aria-controls={`${panelId}-tests-panel`} />
              <Tab value="console" label={text.consoleTab} id={`${panelId}-console`} aria-controls={`${panelId}-console-panel`} />
              <Tab value="hints" label={text.hints} id={`${panelId}-hints`} aria-controls={`${panelId}-hints-panel`} />
            </Tabs>
            <Box role="tabpanel" hidden={panel !== "tests"} id={`${panelId}-tests-panel`} aria-labelledby={`${panelId}-tests`}
              sx={{ display: panel === "tests" ? "block" : "none", flex: 1, minHeight: 0, overflowY: "auto", p: 1.5 }}>
              <ImplementationResults outcomes={displayOutcomes} diagnostics={staleResults ? [] : running ? outcomes : lastOutcomes} stale={staleResults} code={code} onFocusLine={focusErrorLine} onShowTrace={() => void runTrace()} onShowHints={() => setPanel("hints")} />
            </Box>
            <Box role="tabpanel" hidden={panel !== "console"} id={`${panelId}-console-panel`} aria-labelledby={`${panelId}-console`}
              sx={{ display: panel === "console" ? "block" : "none", flex: 1, minHeight: 0, overflowY: "auto" }}>
              <FreeExecutionConsole result={freeResult} busy={freeRunning} />
            </Box>
            {/* ヒントはモーダルにせず、コードを見ながら使えるようパネルのタブに常駐させる。
                段階的な支援であることが見えるよう、縦のステップ列で示す。 */}
            <Box role="tabpanel" hidden={panel !== "hints"} id={`${panelId}-hints-panel`} aria-labelledby={`${panelId}-hints`}
              sx={{ display: panel === "hints" ? "block" : "none", flex: 1, minHeight: 0, overflowY: "auto", p: 1.5 }}>
              <Typography component="p" sx={{ fontSize: 16, fontWeight: 800 }}>実装サポート</Typography>
              <Typography component="p" sx={{ fontSize: 14, mt: 0.25, mb: 1.5 }}>困ったときは、必要な分だけヒントを使おう。</Typography>
              <Box role="group" aria-label={content.hints.groupLabel} sx={{ display: "flex", flexDirection: "column" }}>
                {content.hints.labels.map((label, index) => {
                  const locked = index > 0 && usage[index - 1] === 0;
                  const open = hint === index + 1;
                  const used = usage[index] > 0;
                  return <Box key={label} sx={{ display: "flex", gap: 1.5 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Box aria-hidden sx={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 15, fontWeight: 900, flexShrink: 0,
                        ...(open || used ? { bgcolor: "#2563eb", color: "#fff" } : locked ? { border: "2px solid #c3cad4", color: colors.text } : { border: "2px solid #2563eb", color: colors.text }) }}>
                        {used && !open ? "✓" : index + 1}
                      </Box>
                      {index < content.hints.labels.length - 1 && <Box aria-hidden sx={{ width: 2, flex: 1, minHeight: 14, bgcolor: used ? "#2563eb" : "#dbe3ef" }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0, pb: 2 }}>
                      <Button aria-label={label} title={label} disabled={busy || !editorReady || locked} onClick={() => openHint((index + 1) as HintLevel)}
                        sx={{ minHeight: 36, px: 0.5, color: colors.text, fontWeight: 800, fontSize: 16, textTransform: "none", justifyContent: "flex-start", "&.Mui-disabled": { color: colors.text, opacity: 0.55 } }}>
                        {label.replace(/^ヒント\d+：/, "")}
                      </Button>
                      <Typography component="p" sx={{ fontSize: 14 }}>{content.hints.descriptions[index]}</Typography>
                      {locked && <Typography component="p" sx={{ fontSize: 14 }}>前のヒントを使うと開きます</Typography>}
                      {open && <Box sx={{ mt: 1 }}>
                        <ImplementationHintContent level={(index + 1) as HintLevel} onInsert={token => insert(token)} />
                        <Button onClick={() => setHint(null)} sx={{ mt: 1, minHeight: 40, color: playerTokens.control }}>{content.hints.closeLabel}</Button>
                      </Box>}
                    </Box>
                  </Box>;
                })}
              </Box>
            </Box>
          </Box>
        </Box>
        {running && <Box sx={{ flexShrink: 0 }}>
          <Typography component="p" sx={{ textAlign: "center", fontSize: 14 }}>{content.status.timeoutNotice}</Typography>
        </Box>}
      </>
      </>}
      {traceError && <Typography component="p" role="alert">{traceError}</Typography>}
      {/* 全テスト通過の瞬間の賞賛。集大成の達成なので大きく出す。
          閉じれば完成したコードはそのまま見返せる。 */}
      {complete && !celebrationDismissed && <Box data-completion-celebration sx={{ position: "absolute", inset: 0, zIndex: 8, display: "grid", placeItems: "center", bgcolor: "rgba(238, 244, 252, 0.55)", p: 2 }}>
        <Box sx={{ bgcolor: "#fff", border: "2px solid #2563eb", borderRadius: 4, px: 4, py: 3.5, maxWidth: 760, width: "100%", textAlign: "center", boxShadow: 6 }}>
          <Box component="img" src="/images/mascots/red-panda/celebrate.png" alt="" sx={{ width: 120, height: 120, objectFit: "contain", mx: "auto", display: "block" }} />
          <Typography component="p" sx={{ fontSize: 24, fontWeight: 900, mt: 0.5 }}>{content.result.celebrationHeading}</Typography>
          <Box sx={{ maxWidth: 520, mx: "auto", mt: 1.5, borderRadius: 2, overflow: "hidden" }}>
            <SortingShelfCelebration />
          </Box>
          <Typography component="p" sx={{ fontSize: 16, mt: 1.5 }}>{content.result.celebrationText}</Typography>
          <Typography component="p" sx={{ fontSize: 22, fontWeight: 900, mt: 1 }}>{passed} / {content.tests.length}　<Box component="span" sx={{ fontSize: 16, fontWeight: 800 }}>すべてのテストを通過</Box></Typography>
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", mt: 2.5, flexWrap: "wrap" }}>
            {onShowFinalResult && <Button variant="contained" onClick={onShowFinalResult}
              sx={{ minHeight: 48, px: 3, bgcolor: playerTokens.focus, color: playerTokens.surface, "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>{content.result.finalButton}</Button>}
            <Button variant="outlined" onClick={() => setCelebrationDismissed(true)} sx={{ ...outlinedButton, minHeight: 48, px: 3 }}>コードを見る</Button>
          </Box>
        </Box>
      </Box>}
    </Box>
    {tracePlayback && <BubbleSortTraceDialog onLearningEvent={onLearningEvent} active={active} playback={tracePlayback} onClose={() => setTracePlayback(null)} />}
  </Box>;
}
