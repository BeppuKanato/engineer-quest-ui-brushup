"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FlagIcon from "@mui/icons-material/Flag";
import SearchIcon from "@mui/icons-material/Search";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import confetti from "canvas-confetti";
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
 * 生成中・失敗時を含め常時置く（着手は学習者の任意のまま）。ただし推薦先が
 * 次のフェーズそのものの場合は出口を二重に出さず、推薦を次の学習として出す。
 * フィードバックが適用されない学習者（割り当てなし等）では、
 * 称賛の段が終わるのを待ってから onUnavailable で本来の導線へ進める。
 */
export function FeedbackScreen({ kind, eventId, heading, header, summary, nextPhaseKey, onAction, onProceed, proceedLabel, onUnavailable, children }: {
  kind: Extract<FeedbackV1Kind, "phase" | "unit">;
  eventId: string;
  heading: string;
  /** 称賛ブロック。ある場合は見出しの代わりに画面の頭になる。 */
  header?: ReactNode;
  /** 第1段の結果の要約。第2段の頭に小さく引き継ぐ（連続性）。 */
  summary?: ReactNode;
  /** 次のフェーズのキー。推薦先がこれと一致する場合は「選択」ではなく次そのものとして出す。 */
  nextPhaseKey?: string | null;
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
  // 第2段の出現演出をタップで即時完了させる（繰り返し見る際の待ち時間対策）。
  const [fastForward, setFastForward] = useState(false);
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
    // 称賛の順序演出（✓描画→成績の点灯→マスコットの反応、約2.2秒）が
    // 済んで、眺める間を置いてから進む。
    const timer = setTimeout(advance, 3400);
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
      // 祝福の紙吹雪は段の切り替わりで収束させる（第2段は振り返りの場で、
      // 紙吹雪を持ち越すと演出の切り替わりが曖昧になる。GPT レビュー §4）。
      if (header) confetti.reset();
      scrollRef.current?.scrollTo({ top: 0 });
      headingRef.current?.focus();
    }
  }, [stage, header]);
  const f = result?.feedback;
  const failed = error || result?.status === "FAILED";
  // 文章の構造（2026-11-23 改訂）: praise（根拠のある称賛）→ strength / improvement
  // （Feed Back を強みと改善点に分割）→ nextGoal（Feed Up）。旧形式
  // （currentState / explanation）もそのまま表示できるよう残す。
  const sections: ReadonlyArray<{ label: string; body: string; headline?: string | null }> = f ? [
    ...(f.strength ? [{ label: "できていること", body: f.strength, headline: f.strengthHeadline }]
      : f.currentState ? [{ label: "現在の状態", body: f.currentState }] : []),
    ...(f.improvement ? [{ label: "改善点", body: f.improvement, headline: f.improvementHeadline }]
      : !f.strength && f.explanation ? [{ label: "フィードバック", body: f.explanation }] : []),
    { label: "次の目標", body: f.nextGoal },
  ] : [];
  const praise = f?.praise ?? null;
  const rowOffset = praise ? 1 : 0;
  // 推薦先が次のフェーズそのものなら、それは「選べる候補」ではなく次の学習
  // そのもの（GPT レビュー §5）。選択の体裁と二重の進むボタンをやめる。
  const actionPhase = f?.actionHref ? new URL(f.actionHref, "http://localhost").searchParams.get("phase") : null;
  const actionIsNext = !!actionPhase && !!nextPhaseKey && actionPhase === nextPhaseKey;
  // マスコットの表情の拍：節の役割に表情を対応させる（文章の内容解析はしない）。
  // 受け渡し=point → praise が出たら celebrate → 改善点で thinking → 次の一歩で point に戻る。
  // 全節に付けるのではなく、この2拍だけに絞る（切り替えすぎると落ち着かない）。
  const [beat, setBeat] = useState<"point" | "celebrate" | "thinking">("point");
  useEffect(() => {
    if (stage !== "feedback" || !f || reduce) return;
    if (fastForward) { setBeat("point"); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (rowIndex: number, s: "celebrate" | "thinking" | "point") =>
      timers.push(setTimeout(() => setBeat(s), (0.3 + rowIndex * 0.95 + 0.2) * 1000));
    if (praise) at(0, "celebrate");
    const impIdx = sections.findIndex(s => s.label === "改善点");
    if (impIdx >= 0) at(impIdx + rowOffset, "thinking");
    at(sections.length + rowOffset, "point");
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, fastForward]);
  return <Box component="section" data-feedback-scope aria-label={heading}
    sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 2, width: "100%" }}>
    <AnimatePresence mode="popLayout" initial={false}>
    {stage === "celebration" ? (
      <motion.div key="celebration" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -24 }} transition={{ duration: 0.4 }}
        style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
        {header}
        <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 2.6, duration: 0.4 }} style={{ display: "flex" }}>
          {/* 第1段の出口は画面の主CTAにする（GPT レビュー §1①）。自動遷移の先回り用でもある */}
          <Button variant="contained" onClick={advance} sx={primaryButtonSx}>
            今回の学びを振り返る
          </Button>
        </motion.div>
      </motion.div>
    ) : (
      <motion.div key="feedback" initial={header && !reduce ? { opacity: 0, y: 24 } : false} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }} onClick={() => setFastForward(true)}
        style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {!header && <Typography ref={headingRef} component="h2" tabIndex={-1} sx={headingSx}>{heading}</Typography>}
        <Box ref={scrollRef} sx={{ flex: 1, minHeight: 0, overflowY: "auto", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, pb: 2 }}>
        {header && !unavailable && <Box sx={{ textAlign: "center" }}>
          <Typography ref={headingRef} component="h2" tabIndex={-1} sx={{ fontSize: 18, fontWeight: 900, outline: "none" }}>あなたへの学習フィードバック</Typography>
          <Typography sx={{ fontSize: 14, mt: 0.5 }}>今回の取り組みをもとに作成されました。</Typography>
        </Box>}
        {summary && !unavailable && <Box sx={{ display: "flex", justifyContent: "center" }}>{summary}</Box>}
        {unavailable ? <Typography role="status" color="text.secondary">フィードバックはありません。次へ進みます。</Typography>
          : failed && !retrying ? <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 640 }}>
              <Alert severity="warning">フィードバックを生成できませんでした。学習は続けられます。</Alert>
              <Button variant="outlined" onClick={retry} disabled={retrying} sx={{ alignSelf: "center", minHeight: 44 }}>再生成</Button>
            </Stack>
          : !f ? <FeedbackGenerating />
          : <Box sx={{ width: "100%", maxWidth: 760 }}>
              <FeedbackDelivery state={beat} />
              <FeedbackObservation id={result.id} href={f.actionHref} candidates={feedbackCandidates(f)} />
              <Box sx={{ mt: 1.5 }}>
                {praise && <RevealRow key={`praise-${fastForward}`} index={0} fast={fastForward}>
                  {/* 主役: praise は根拠のある称賛。画面で1つだけの強調面（2px 枠）で出し、
                      出現時に枠が一度だけ光って気づきへ注意を引く（常時の発光はしない）。
                      見出し（生成側の praiseHeadline）があれば、結論を先に置いて
                      本文を「根拠の確認」として読ませる見出し先行の形にする */}
                  <motion.div initial={false}
                    animate={reduce || fastForward ? undefined : { boxShadow: ["0 0 0 0 rgba(37,99,235,0)", "0 0 0 8px rgba(37,99,235,0.16)", "0 0 0 0 rgba(37,99,235,0)"] }}
                    transition={{ duration: 1.2, delay: 0.55, times: [0, 0.35, 1] }}
                    style={{ backgroundColor: "#fff", border: `2px solid ${playerTokens.focus}`, borderRadius: 16, padding: "20px 22px" }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 800, color: playerTokens.control, mb: 0.75 }}>あなたの学び</Typography>
                    {f?.praiseHeadline && <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.5, mb: 1 }}>{f.praiseHeadline}</Typography>}
                    <Typography sx={{ fontSize: 18, fontWeight: f?.praiseHeadline ? 500 : 700, lineHeight: 1.8 }}>{praise}</Typography>
                  </motion.div>
                </RevealRow>}
                {sections.map((section, i) => (
                  <RevealRow key={`${section.label}-${fastForward}`} index={i + rowOffset} fast={fastForward}>
                    <FeedbackCard label={section.label} body={section.body} headline={section.headline} />
                  </RevealRow>
                ))}
                <RevealRow key={`next-${fastForward}`} index={sections.length + rowOffset} last fast={fastForward}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                    <ArrowForwardIcon sx={{ fontSize: 20, color: playerTokens.focus }} />
                    <Typography sx={{ fontSize: 16, fontWeight: 800, color: playerTokens.control }}>次の一歩</Typography>
                  </Box>
                  <FeedbackCandidates candidates={feedbackCandidates(f)} onAction={onAction} framing={actionIsNext ? "next" : "choice"} />
                </RevealRow>
              </Box>
            </Box>}
        {children}
        </Box>
      </motion.div>
    )}
    </AnimatePresence>
    {!actionIsNext && <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ justifyContent: "center", mt: 1, flexShrink: 0 }}>
      <Button data-feedback-skip variant={f?.actionHref ? "text" : "contained"} onClick={onProceed}
        sx={f?.actionHref ? { minHeight: 48, px: 2, fontSize: 16, fontWeight: 700, color: playerTokens.control } : primaryButtonSx}>
        {proceedLabel}
      </Button>
    </Stack>}
  </Box>;
}

/**
 * フィードバックの受け渡し（案内役。2026-11-20 方針の場面表を 2026-11-23 に改訂）。
 * 仲介の対象は「次の一歩」の提案だけではなく、機械が出した文章全体。
 * 到着の場面でマスコットが全体を手渡すことで、「システムの文書を読む」から
 * 「相棒が持ってきたものを受け取る」に変える。本文には一切触れない。
 */
function FeedbackDelivery({ state = "point" }: { state?: "point" | "celebrate" | "thinking" }) {
  const reduce = useReducedMotion();
  return <motion.div initial={reduce ? false : { opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.35 }}
    style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
    <MascotFigure mascotId="red-panda" alt="相棒" size="M" state={state} motion="float" grounding="shadow" />
    <Box sx={{ bgcolor: "#fff", border: "1px solid #dbe3ef", borderRadius: "14px", px: 2, py: 1.25 }}>
      <Typography sx={{ fontSize: 18, fontWeight: 700 }}>フィードバック、持ってきたよ。</Typography>
    </Box>
  </motion.div>;
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

/** 節ごとのアイコン（役割の見分け。色は意味の統一に従う：緑=できている、旗=目標）。 */
const SECTION_ICONS: Record<string, ReactNode> = {
  "できていること": <CheckCircleIcon sx={{ fontSize: 20, color: "#16a34a" }} />,
  "改善点": <SearchIcon sx={{ fontSize: 20, color: "#64748b" }} />,
  "次の目標": <FlagIcon sx={{ fontSize: 20, color: playerTokens.focus }} />,
};

/** フィードバック本文のカード。文章の役割（節）ごとに1枚にし、本文の受け皿を広く取る。
 *  headline（生成側の要点文）があれば、ラベルの下に太字で先に置く（見出し先行）。
 *  要点がある節は本文（=根拠）を既定で畳み、「くわしく見る」でその場で開く——
 *  既定で読む量は要約層だけにし、全文は読みたい人が開く形（2026-11-24）。 */
function FeedbackCard({ label, body, headline }: { label: string; body: string; headline?: string | null }) {
  const icon = SECTION_ICONS[label];
  const [expanded, setExpanded] = useState(false);
  const collapsible = Boolean(headline);
  return <Box sx={{ bgcolor: "#fff", border: "1px solid #dbe3ef", borderRadius: "16px", px: 2.75, py: 2.25 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
      {icon}
      <Typography sx={{ fontSize: 16, fontWeight: 800, color: playerTokens.control }}>{label}</Typography>
    </Box>
    {headline && <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.6, mb: collapsible && !expanded ? 0 : 0.5 }}>{headline}</Typography>}
    {(!collapsible || expanded) && <Typography sx={{ fontSize: 16, lineHeight: 1.8, overflowWrap: "anywhere" }}>{body}</Typography>}
    {collapsible && <Button variant="text" size="small"
      onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
      endIcon={expanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
      sx={{ fontSize: 14, fontWeight: 700, color: playerTokens.focus, px: 0.5, mt: 0.75, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>
      {expanded ? "閉じる" : "くわしく見る"}
    </Button>}
  </Box>;
}

/**
 * 読み進める演出の1行（2026-11-23、GPT案1+案3の採用形）。
 * 左の点と縦線が、行が視界に入るたびに上から順に満ちていく。
 * 本文は常時DOMにあり、演出は出現の動きだけ（読めない状態は作らない）。
 * OSの「動きを減らす」設定では全て即時表示にする。
 */
function RevealRow({ children, index = 0, last = false, fast = false }: { children: ReactNode; index?: number; last?: boolean; fast?: boolean }) {
  const reduce = useReducedMotion();
  // 読み進める順に1つずつ出す（2026-11-23 改訂）。以前は全行がほぼ同時に出て
  // 「いっぺんに出すだけ」だった。タップは不要で、全コンテンツは最初から
  // DOM にある。受け渡し（0〜0.35s）のあと praise から 0.95s 間隔で続く
  // （0.55s では出現の速さが読む速さを追い越す、という GPT レビューの指摘で
  // 延長）。左の線も同じ歩調で上から満ちていく。全行が出そろうまで約5秒。
  // fast（画面タップ）では残りを即時に出す——繰り返し見る学習者の待ち時間をなくす。
  const delay = reduce || fast ? 0 : 0.3 + index * 0.95;
  // fast のときは呼び出し側が key を変えて再マウントするので、初期値を最終状態にして即時表示にする
  // （進行中の遅延アニメーションは transition の差し替えだけでは止まらないため）。
  const instant = reduce || fast;
  return <Box sx={{ display: "flex", gap: 2 }}>
    <Box sx={{ width: 20, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <motion.div initial={{ scale: instant ? 1 : 0 }} animate={{ scale: 1 }}
        transition={{ duration: 0.25, delay }} style={{ marginTop: 24, display: "flex" }}>
        <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#fff", border: `2.5px solid ${playerTokens.focus}` }} />
      </motion.div>
      {!last && <Box sx={{ position: "relative", width: 2, flex: 1, minHeight: 12, mt: 0.75 }}>
        <Box sx={{ position: "absolute", left: 0, top: 0, bottom: -32, width: 2, bgcolor: "#dbe3ef" }}>
          <motion.div initial={{ scaleY: instant ? 1 : 0 }} animate={{ scaleY: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.15 }}
            style={{ position: "absolute", inset: 0, backgroundColor: playerTokens.focus, transformOrigin: "top" }} />
        </Box>
      </Box>}
    </Box>
    <motion.div initial={{ opacity: instant ? 1 : 0, y: instant ? 0 : 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ flex: 1, minWidth: 0, paddingBottom: last ? 4 : 18 }}>
      {children}
    </motion.div>
  </Box>;
}
