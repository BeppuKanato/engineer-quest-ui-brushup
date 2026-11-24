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
  const lock = useRef(false);
  const generation = useRef(0);
  const completedRef = useRef(false);
  const { play } = useSoundEffect();
  const prevPassedRef = useRef(0);
  const passed = outcomes.filter(outcome => outcome.passed).length;
  const complete = !running && allTestsPassed(content.tests, outcomes);
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
    setOutcomes([]); setTraceError(null); setFreeResult(null);
  };
  return <Box component={embedded ? "div" : "main"} sx={{ height: embedded ? "100%" : "100dvh", minHeight: 0, bgcolor: colors.background, color: colors.text, p: { xs: 1, sm: 2 } }}>
    <Box component="section" aria-label="バブルソートの自分で実装"
      sx={{ width: "100%", height: "100%", minHeight: 0, display: "flex", flexDirection: "column", gap: 1, position: "relative" }}>
      <Typography component="p" sx={{ textAlign: "center", fontWeight: 700, fontSize: "clamp(18px, 1.5vw, 24px)", flexShrink: 0 }}>
        {content.caption}
      </Typography>
      {/* 最終チャレンジは単元ミッションの達成そのもの（再設計 2026-11-22）。
          「同じ課題だ」と分かるよう、単元画面のミッションバンドと同一の
          サムネイル・チップ・題を使う（絵と色が同一性の担い手）。 */}
      {(() => {
        const mission = findUnitMission("course-algorithm-bubble-sort-v2");
        const thumbnail = missionThumbnailFor("course-algorithm-bubble-sort-v2");
        if (!mission || !thumbnail) return null;
        return <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 2, border: "2px solid #2563eb", borderRadius: 3, bgcolor: "#fff", px: 2, py: 1.25 }}>
          <Box aria-hidden sx={{ width: 150, flexShrink: 0, borderRadius: 1.5, overflow: "hidden" }}>{thumbnail}</Box>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Chip label="単元ミッション" size="small" sx={{ fontWeight: 800, bgcolor: "#2563eb", color: "#fff" }} />
              <Typography component="p" sx={{ fontSize: 16, fontWeight: 800 }}>{mission.title}</Typography>
            </Box>
            <Typography component="p" sx={{ fontSize: 14, mt: 0.5 }}>達成の条件：{mission.successCondition}。下のテストは、その確認です。</Typography>
          </Box>
        </Box>;
      })()}
      {complete && <ResultConfetti />}
      {!started && !complete ? (
        <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 2, py: 3, pt: { md: 5 } }}>
          <Typography component="p" sx={{ fontSize: 22, fontWeight: 900, textAlign: "center" }}>自分のコードで、本を番号順に並べ替えよう</Typography>
          <Typography component="p" sx={{ fontSize: 16, textAlign: "center" }}>自分に合った書き方を選んで挑戦しましょう。どの書き方でも、テストと達成の条件は同じです。あとから変えることもできます。</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, width: "100%", maxWidth: 1060, mt: 1 }}>
            {implementationInputLevels.map(candidate => (
              <Button key={candidate} variant="outlined" onClick={() => { changeLevel(candidate); setStarted(true); }}
                sx={{ display: "block", textAlign: "left", p: 2.5, borderRadius: 3, border: "2px solid #dbe3ef", bgcolor: "#fff", color: colors.text, textTransform: "none", "&:hover": { borderColor: "#2563eb", bgcolor: "#fff" } }}>
                <Typography component="p" sx={{ fontSize: 18, fontWeight: 900, mb: 0.75 }}>{implementationInputLevelText.levels[candidate].label}</Typography>
                <Typography component="p" sx={{ fontSize: 14, lineHeight: 1.7, mb: 1.5 }}>{implementationInputLevelText.levels[candidate].description}</Typography>
                {/* 実際のテンプレートの冒頭。読む前に「どこまで自分で書くか」が見える。 */}
                <Box component="pre" aria-hidden sx={{ m: 0, p: 1.5, height: 176, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.65, whiteSpace: "pre", overflow: "hidden", color: colors.text, WebkitMaskImage: "linear-gradient(to right, black 88%, transparent)", maskImage: "linear-gradient(to right, black 88%, transparent)" }}>
                  {content.templates[candidate].split("\n").slice(0, 7).join("\n")}
                  {content.templates[candidate].split("\n").length > 7 ? "\n…" : ""}
                </Box>
              </Button>
            ))}
          </Box>
          <Typography component="p" sx={{ fontSize: 14, textAlign: "center" }}>{implementationInputLevelText.note}</Typography>
        </Box>
      ) : <>
      {/* 進捗はテスト別の状態チップで一本化する（パネル側の集計と二重にしない）。
          どのタブを開いていても、残りが見える。 */}
      <Box role="status" aria-live="polite" sx={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
        {content.tests.map(test => {
          const outcome = outcomes.find(item => item.id === test.id);
          const state = !outcome ? "todo" : outcome.passed ? "passed" : "failed";
          const shortLabel = test.label.split("（")[0];
          return <Box key={test.id} component="span" sx={{
            display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.4, borderRadius: 999, fontSize: 14, fontWeight: 700,
            ...(state === "passed" ? { bgcolor: "#16a34a", color: "#fff", border: "2px solid #16a34a" }
              : state === "failed" ? { bgcolor: "#fff", color: colors.text, border: "2px solid #111827" }
              : { bgcolor: "#fff", color: colors.text, border: "2px solid #c3cad4" }),
          }}>{state === "passed" ? "✓" : state === "failed" ? "×" : "○"} {shortLabel}</Box>;
        })}
        <Typography component="p" sx={{ fontSize: 15, fontWeight: 700, ml: 1 }}>
          {passed === content.tests.length ? "すべてのテストを通過" : `あと${content.tests.length - passed}個のテストで達成`}
        </Typography>
      </Box>
      {!complete && <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
        <Typography component="p" sx={{ fontSize: 15 }}>書き方：<Box component="span" sx={{ fontWeight: 800 }}>{implementationInputLevelText.levels[level].label}</Box></Typography>
        <Button size="small" onClick={() => setStarted(false)} sx={{ minHeight: 36, color: playerTokens.focus, fontWeight: 700 }}>書き方を変える</Button>
      </Box>}
      <>
        <Box data-editor-workspace sx={{ flex: 1, minHeight: 0, overflowY: { xs: "auto", md: "hidden" }, display: { xs: "block", md: "grid" }, gridTemplateColumns: "minmax(0, 1.5fr) minmax(340px, 1fr)", gap: 2 }}>
          <Box aria-label={text.code} sx={{ minWidth: 0, minHeight: { xs: 360, md: 0 }, height: { xs: "70dvh", md: "100%" }, display: "flex", flexDirection: "column", border: `2px solid ${colors.focus}`, borderRadius: 1.5, overflow: "hidden", bgcolor: colors.panel,
            "& .monaco-editor .monaco-scrollable-element, & .monaco-editor .view-lines, & .monaco-editor .inputarea": { cursor: learningEditorTextCursor } }}>
            <Box role="group" aria-label={text.panel} sx={{ flexShrink: 0, p: 1, bgcolor: colors.panelAlt, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              <Typography component="p" sx={{ fontWeight: 800, fontSize: 16, mr: 0.5 }}>{text.code}</Typography>
              <Button variant="outlined" startIcon={<PlayArrowIcon />} disabled={runtime !== "ready" || busy || !editorReady || !code.trim()} onClick={() => void runFree()} sx={outlinedButton}>{text.freeRun}</Button>
              {traceButton}
              <Button variant="contained" startIcon={<FactCheckIcon />} disabled={runtime !== "ready" || busy || !editorReady || !code.trim()} onClick={() => void run()}
                sx={{ minHeight: 44, bgcolor: playerTokens.focus, color: playerTokens.surface, "&:hover": { bgcolor: playerTokens.states.processing.stroke }, "&.Mui-disabled": { bgcolor: colors.button, color: colors.text, opacity: 0.45 } }}>{content.controls.run}</Button>
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
              <ImplementationResults outcomes={outcomes} diagnostics={running ? outcomes : lastOutcomes} />
            </Box>
            <Box role="tabpanel" hidden={panel !== "console"} id={`${panelId}-console-panel`} aria-labelledby={`${panelId}-console`}
              sx={{ display: panel === "console" ? "block" : "none", flex: 1, minHeight: 0, overflowY: "auto" }}>
              <FreeExecutionConsole result={freeResult} busy={freeRunning} />
            </Box>
            {/* ヒントはモーダルにせず、コードを見ながら使えるようパネルのタブに常駐させる。
                段階的な支援であることが見えるよう、縦のステップ列で示す。 */}
            <Box role="tabpanel" hidden={panel !== "hints"} id={`${panelId}-hints-panel`} aria-labelledby={`${panelId}-hints`}
              sx={{ display: panel === "hints" ? "block" : "none", flex: 1, minHeight: 0, overflowY: "auto", p: 1.5 }}>
              <Typography component="p" sx={{ fontSize: 15, fontWeight: 700, mb: 1.5 }}>
                実装サポート　{(() => { let unlocked = 1; for (let i = 0; i < usage.length; i += 1) { if (usage[i] > 0) unlocked = i + 2; else break; } return Math.min(unlocked, 4); })()} / 4 段階が開いています
              </Typography>
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
        <Box sx={{ flexShrink: 0 }}>
          <Typography component="p" role="status" sx={{ textAlign: "center", fontSize: 16 }}>{freeStatus === "preparing" ? text.preparing : freeStatus === "running" ? text.running : tracing ? bubbleSortTraceText.loading : running ? runningMessage(outcomes.length, content.tests.length) : runtime === "error" ? content.status.unavailable : content.status[runtime]}</Typography>
          {running && <Typography component="p" sx={{ textAlign: "center", fontSize: 16 }}>{content.status.timeoutNotice}</Typography>}
          {runtime === "error" && <Button onClick={() => void prepare()} sx={outlinedButton}>{content.controls.reload}</Button>}
        </Box>
      </>
      </>}
      {traceError && <Typography component="p" role="alert">{traceError}</Typography>}
      {/* 全テスト通過の瞬間の賞賛。集大成の達成なので大きく出す。
          閉じれば完成したコードはそのまま見返せる。 */}
      {complete && !celebrationDismissed && <Box data-completion-celebration sx={{ position: "absolute", inset: 0, zIndex: 8, display: "grid", placeItems: "center", bgcolor: "rgba(238, 244, 252, 0.55)", p: 2 }}>
        <Box sx={{ bgcolor: "#fff", border: "2px solid #2563eb", borderRadius: 4, px: 4, py: 3.5, maxWidth: 760, width: "100%", textAlign: "center", boxShadow: 6 }}>
          <Box component="img" src="/images/mascots/red-panda/celebrate.png" alt="" sx={{ width: 120, height: 120, objectFit: "contain", mx: "auto", display: "block" }} />
          <Typography component="p" sx={{ fontSize: 24, fontWeight: 900, mt: 0.5 }}>{content.result.title}</Typography>
          <Box sx={{ maxWidth: 520, mx: "auto", mt: 1.5, borderRadius: 2, overflow: "hidden" }}>
            <SortingShelfCelebration />
          </Box>
          <Typography component="p" sx={{ fontSize: 16, mt: 1.5 }}>自分のコードで、本を番号順に並べ替えられました</Typography>
          <Typography component="p" sx={{ fontSize: 22, fontWeight: 900, mt: 1 }}>{passed} / {content.tests.length}　<Box component="span" sx={{ fontSize: 16, fontWeight: 800 }}>すべてのテストを通過</Box></Typography>
          <Typography component="p" sx={{ fontSize: 14, mt: 0.5 }}>{content.result.runsLabel.replace("{count}", String(runs))}</Typography>
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
