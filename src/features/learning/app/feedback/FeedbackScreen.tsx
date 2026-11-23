"use client";

import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useRef, type ReactNode } from "react";

import {
  FeedbackObservation,
  FeedbackCandidates,
  useFeedbackV1,
  type FeedbackV1Kind,
} from "@/app/component/feedbackV1";
import { feedbackCandidates } from "@/api/feedbackV1.api";
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
 * フェーズのフィードバックは、完了の称賛（結果）と一体の画面にする：
 * 呼び出し側が header に称賛ブロック（終わりました＋正解数＋マスコット）を
 * 渡し、その下にフィードバック本文（現在の状態／フィードバック／次の目標／
 * 次の一歩と理由）を続ける。header がある場合は見出しを header 側に譲る。
 * 旧来の現在位置の図と概念マップは出さない（位置はフェーズチップが担い、
 * 概念はカリキュラム側の記録で学習者の行動の手がかりにならないため）。
 * 推薦する行動が画面の主ボタンで、「そのまま次へ」の副次的な出口は
 * 生成中・失敗時を含め常時置く（着手は学習者の任意のまま）。
 * フィードバックが適用されない学習者（割り当てなし等）では、
 * 画面に留めず onUnavailable で本来の導線へ自動で進める。
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
  useEffect(() => { headingRef.current?.focus(); }, []);
  const proceededRef = useRef(false);
  useEffect(() => {
    if (unavailable && !proceededRef.current) {
      proceededRef.current = true;
      onUnavailable();
    }
  }, [unavailable, onUnavailable]);
  const f = result?.feedback;
  const failed = error || result?.status === "FAILED";
  return <Box component="section" data-feedback-scope aria-label={heading}
    sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 2, width: "100%" }}>
    {header ?? <Typography ref={headingRef} component="h2" tabIndex={-1} sx={headingSx}>{heading}</Typography>}
    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, pb: 2 }}>
    {unavailable ? <Typography role="status" color="text.secondary">フィードバックはありません。次へ進みます。</Typography>
      : failed && !retrying ? <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 640 }}>
          <Alert severity="warning">フィードバックを生成できませんでした。学習は続けられます。</Alert>
          <Button variant="outlined" onClick={retry} disabled={retrying} sx={{ alignSelf: "center", minHeight: 44 }}>再生成</Button>
        </Stack>
      : !f ? <Alert severity="info" sx={{ width: "100%", maxWidth: 640 }}>フィードバックを準備しています。</Alert>
      : <Stack spacing={2} sx={{ width: "100%", maxWidth: 640 }}>
          <FeedbackObservation id={result.id} href={f.actionHref} candidates={feedbackCandidates(f)} />
          {([["現在の状態", f.currentState], ...(f.explanation ? [["フィードバック", f.explanation] as const] : []), ["次の目標", f.nextGoal]] as const).map(([label, body]) => (
            <div key={label}>
              <Typography fontWeight={900}>{label}</Typography>
              <Typography sx={{ fontSize: 16, overflowWrap: "anywhere" }}>{body}</Typography>
            </div>
          ))}
          <FeedbackCandidates candidates={feedbackCandidates(f)} onAction={onAction} />
        </Stack>}
    {children}
    </Box>
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ justifyContent: "center", mt: 1, flexShrink: 0 }}>
      <Button data-feedback-skip variant={f?.actionHref ? "text" : "contained"} onClick={onProceed}
        sx={f?.actionHref ? { minHeight: 48, px: 2, fontSize: 15, fontWeight: 700, color: playerTokens.control } : primaryButtonSx}>
        {proceedLabel}
      </Button>
    </Stack>
  </Box>;
}
