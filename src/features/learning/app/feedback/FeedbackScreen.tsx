"use client";

import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import {
  FeedbackObservation,
  FeedbackCandidates,
  useFeedbackV1,
  type FeedbackV1Kind,
} from "@/app/component/feedbackV1";
import { feedbackCandidates } from "@/api/feedbackV1.api";
import { MascotFigure } from "@/app/component/mascotFigure";
import { playerTokens } from "../../player/player.tokens";

const headingSx = {
  color: playerTokens.text, fontWeight: 700, textAlign: "center",
  fontSize: "clamp(20px, 1.8vw, 32px)", outline: "none",
} as const;

const primaryButtonSx = {
  minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, whiteSpace: "nowrap",
  bgcolor: playerTokens.focus, color: playerTokens.surface,
  "&:hover": { bgcolor: playerTokens.states.processing.stroke },
} as const;

/**
 * フィードバック画面（Issue #369、#299 の実装を 2026-11-23 に再設計）。
 * フェーズのフィードバックは、ページ遷移なしの2段構成にする：
 * 第1段は称賛だけ（呼び出し側が header に渡す。終わりました＋正解数＋
 * マスコットの反応）、アニメーションを挟んで第2段のフィードバックへ進む。
 * 同じ場面にマスコットは1体だけ（第1段＝反応役、第2段の次の一歩＝案内役で、
 * 同時には映らない）。自動で進むのが基本で、ボタンでも進める。
 * 動きを減らす設定では自動で進まず、ボタンで進む。
 * フィードバック本文は役割ごとのカード（現在の状態／フィードバック／
 * 次の目標／次の一歩と理由）で出す。旧来の現在位置の図と概念マップは
 * 出さない（位置はフェーズチップが担い、概念はカリキュラム側の記録で
 * 学習者の行動の手がかりにならないため）。
 * 推薦する行動が画面の主ボタンで、「そのまま次へ」の副次的な出口は
 * 生成中・失敗時を含め常時置く（着手は学習者の任意のまま）。
 * フィードバックが適用されない学習者（割り当てなし等）では、
 * 称賛の段が終わるのを待ってから onUnavailable で本来の導線へ進める。
 */
export function FeedbackScreen({ kind, eventId, heading, header, onAction, onProceed, proceedLabel, onUnavailable, children }: {
  kind: Extract<FeedbackV1Kind, "phase" | "unit">;
  eventId: string;
  heading: string;
  /** 称賛ブロック。ある場合は見出しの代わりに画面の頭になる。 */
  header?: ReactNode;
  // Called when the recommended action is clicked. Return true to handle the
  // navigation in-app (e.g. moving between phases) instead of following the link.
  onAction?: (href: string | null) => boolean;
  onProceed: () => void;
  proceedLabel: string;
  onUnavailable: () => void;
  /** 達成した大目標への次の目標の提案など、画面後段への差し込み。 */
  children?: ReactNode;
}) {
  const { result, error, unavailable, retry, retrying } = useFeedbackV1(kind, eventId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const proceededRef = useRef(false);
  const unavailableRef = useRef(false);
  unavailableRef.current = unavailable;
  const reduce = useReducedMotion();
  // ページ遷移なしの2段構成（header がある場合のみ）：称賛の段 → フィードバックの段。
  const [stage, setStage] = useState<"celebration" | "feedback">(header ? "celebration" : "feedback");
  const advance = useCallback(() => {
    // フィードバックが無い場合は、称賛の段を終えてから本来の導線へ進める。
    if (unavailableRef.current) {
      if (!proceededRef.current) {
        proceededRef.current = true;
        onUnavailable();
      }
      return;
    }
    setStage("feedback");
  }, [onUnavailable]);
  useEffect(() => {
    if (!header || stage !== "celebration" || reduce) return;
    const timer = setTimeout(advance, 2100);
    return () => clearTimeout(timer);
  }, [header, stage, reduce, advance]);
  useEffect(() => {
    // header が無い従来形では、従来どおり即時に進める。
    if (unavailable && !header && !proceededRef.current) {
      proceededRef.current = true;
      onUnavailable();
    }
  }, [unavailable, header, onUnavailable]);
  useEffect(() => {
    if (stage === "feedback") {
      scrollRef.current?.scrollTo({ top: 0 });
      headingRef.current?.focus();
    }
  }, [stage]);
  const f = result?.feedback;
  const failed = error || result?.status === "FAILED";
  const sections: ReadonlyArray<readonly [string, string]> = f ? [
    ["現在の状態", f.currentState],
    ...(f.explanation ? [["フィードバック", f.explanation] as const] : []),
    ["次の目標", f.nextGoal],
  ] : [];
  return <Box component="section" data-feedback-scope aria-label={heading}
    sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 2, width: "100%" }}>
    <AnimatePresence mode="wait" initial={false}>
    {stage === "celebration" ? (
      <motion.div key="celebration" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -24 }} transition={{ duration: 0.4 }}
        style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
        {header}
        <Button variant="text" onClick={advance}
          sx={{ minHeight: 48, px: 2, fontSize: 15, fontWeight: 700, color: playerTokens.control }}>
          フィードバックを見る
        </Button>
      </motion.div>
    ) : (
      <motion.div key="feedback" initial={header && !reduce ? { opacity: 0, y: 24 } : false} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {!header && <Typography ref={headingRef} component="h2" tabIndex={-1} sx={headingSx}>{heading}</Typography>}
        <Box ref={scrollRef} sx={{ flex: 1, minHeight: 0, overflowY: "auto", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, pb: 2 }}>
        {header && !unavailable && <Box sx={{ textAlign: "center" }}>
          <Typography ref={headingRef} component="h2" tabIndex={-1} sx={{ fontSize: 18, fontWeight: 900, outline: "none" }}>あなたへの学習フィードバック</Typography>
          <Typography sx={{ fontSize: 14, mt: 0.5 }}>今回の取り組みをもとに作成されました。</Typography>
        </Box>}
        {unavailable ? <Typography role="status" color="text.secondary">フィードバックはありません。次へ進みます。</Typography>
          : failed && !retrying ? <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 640 }}>
              <Alert severity="warning">フィードバックを生成できませんでした。学習は続けられます。</Alert>
              <Button variant="outlined" onClick={retry} disabled={retrying} sx={{ alignSelf: "center", minHeight: 44 }}>再生成</Button>
            </Stack>
          : !f ? <FeedbackGenerating />
          : <Box sx={{ width: "100%", maxWidth: 760 }}>
              <FeedbackObservation id={result.id} href={f.actionHref} candidates={feedbackCandidates(f)} />
              <Box sx={{ mt: 1.5 }}>
                {sections.map(([label, body], i) => (
                  <RevealRow key={label} index={i}>
                    <FeedbackCard label={label} body={body} />
                  </RevealRow>
                ))}
                <RevealRow index={sections.length} last>
                  {/* 案内役：次の一歩はマスコットが「つなぐ」（中身は変えない。2026-11-20 方針の場面表） */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <MascotFigure mascotId="red-panda" alt="相棒" size="S" state="point" grounding="shadow" />
                    <Box sx={{ bgcolor: "#fff", border: "1px solid #dbe3ef", borderRadius: "14px", px: 2, py: 1.25 }}>
                      <Typography sx={{ fontSize: 15, fontWeight: 700 }}>次の一歩、持ってきたよ。</Typography>
                    </Box>
                  </Box>
                  <FeedbackCandidates candidates={feedbackCandidates(f)} onAction={onAction} />
                </RevealRow>
              </Box>
            </Box>}
        {children}
        </Box>
      </motion.div>
    )}
    </AnimatePresence>
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ justifyContent: "center", mt: 1, flexShrink: 0 }}>
      <Button data-feedback-skip variant={f?.actionHref ? "text" : "contained"} onClick={onProceed}
        sx={f?.actionHref ? { minHeight: 48, px: 2, fontSize: 15, fontWeight: 700, color: playerTokens.control } : primaryButtonSx}>
        {proceedLabel}
      </Button>
    </Stack>
  </Box>;
}

/**
 * 生成待ち（案内役。2026-11-20 方針の場面表）。
 * 考え中のマスコットと、段階に沿った一言（記録を確認している→次の一歩を
 * 考えている）で待たせる。中身には先触れしない。
 */
function FeedbackGenerating() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setStep(1), 3500);
    return () => clearTimeout(timer);
  }, []);
  return <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 2, maxWidth: 640, py: 2 }}>
    <MascotFigure mascotId="red-panda" alt="相棒" size="M" state="thinking" motion="float" grounding="shadow" />
    <Box>
      <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
        {step === 0 ? "学習の記録を確認しているよ。" : "次の一歩を考えているよ。"}
      </Typography>
      <Typography sx={{ fontSize: 14, mt: 0.5 }}>フィードバックを準備しています。</Typography>
    </Box>
  </Box>;
}

/** フィードバック本文のカード。文章の役割（節）ごとに1枚にし、本文の受け皿を広く取る。 */
function FeedbackCard({ label, body }: { label: string; body: string }) {
  return <Box sx={{ bgcolor: "#fff", border: "1px solid #dbe3ef", borderRadius: "16px", px: 2.75, py: 2.25 }}>
    <Typography sx={{ fontSize: 15, fontWeight: 800, color: playerTokens.control, mb: 0.75 }}>{label}</Typography>
    <Typography sx={{ fontSize: 16, lineHeight: 1.8, overflowWrap: "anywhere" }}>{body}</Typography>
  </Box>;
}

/**
 * 読み進める演出の1行（2026-11-23、GPT案1+案3の採用形）。
 * 左の点と縦線が、行が視界に入るたびに上から順に満ちていく。
 * 本文は常時DOMにあり、演出は出現の動きだけ（読めない状態は作らない）。
 * OSの「動きを減らす」設定では全て即時表示にする。
 */
function RevealRow({ children, index = 0, last = false }: { children: ReactNode; index?: number; last?: boolean }) {
  const reduce = useReducedMotion();
  const delay = Math.min(index * 0.12, 0.36);
  return <Box sx={{ display: "flex", gap: 2 }}>
    <Box sx={{ width: 20, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <motion.div initial={{ scale: reduce ? 1 : 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.25, delay }} style={{ marginTop: 24, display: "flex" }}>
        <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#fff", border: `2.5px solid ${playerTokens.focus}` }} />
      </motion.div>
      {!last && <Box sx={{ position: "relative", width: 2, flex: 1, minHeight: 12, mt: 0.75 }}>
        <Box sx={{ position: "absolute", left: 0, top: 0, bottom: -32, width: 2, bgcolor: "#dbe3ef" }}>
          <motion.div initial={{ scaleY: reduce ? 1 : 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.45, delay: delay + 0.1 }}
            style={{ position: "absolute", inset: 0, backgroundColor: playerTokens.focus, transformOrigin: "top" }} />
        </Box>
      </Box>}
    </Box>
    <motion.div initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }} transition={{ duration: 0.35, delay }}
      style={{ flex: 1, minWidth: 0, paddingBottom: last ? 4 : 18 }}>
      {children}
    </motion.div>
  </Box>;
}
