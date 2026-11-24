"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import type { AssessmentAnswer } from "../../assessment/assessment";
import { getLearningStep } from "../../review/reviewContent";
import { bubbleSortCheckContent } from "../check/check.content";
import type { BubbleSortCheckQuestion } from "../check/check.types";
import { BubbleSortExecutionCanvas } from "../execution/BubbleSortExecutionCanvas";
import { bubbleSortExecutionContent } from "../execution/execution.content";
import type { BubbleSortUnitPhaseSummary } from "./unit.types";

/**
 * ログと結び付けた「あの場面」（2026-11-24 試作。GPT レビュー #3/#6 の最優先指摘）。
 *
 * 称賛の根拠になった学習行動を、文章ではなく場面そのもので見せる。
 * 材料はすべて記録（完了保存の根拠 evidence）からコードが組み立てる：
 * - 対象の問題：初回は不正解で、最後は正解した問題が「ちょうど1問」だけのときだけ出す。
 *   複数あると、どの問題の話か文章と結び付けられないため出さない（無理に結び付けない）。
 * - 場面の図：その問題の stepId が指すフェーズ2の盤面（復習ダイアログと同じ再利用）。
 * - 最初／見直しての答え：試行の記録にある実際の回答。
 * LLM の文章とは一切照合しない（役割分離：文章の意味には触れず、記録の事実だけを出す）。
 */
export function buildCorrectedScene(summary: BubbleSortUnitPhaseSummary | undefined): ReactNode | null {
  const records = summary?.assessmentEvidence?.records;
  if (!records) return null;
  const corrected = records.filter(r => r.attempts.length > 1 && !r.attempts[0].correct && r.attempts[r.attempts.length - 1].correct);
  if (corrected.length !== 1) return null;
  const record = corrected[0];
  const questionIndex = bubbleSortCheckContent.questions.findIndex(q => q.id === record.questionId);
  const question = bubbleSortCheckContent.questions[questionIndex];
  if (!question) return null;
  const firstLabel = answerLabel(question, record.attempts[0].answer);
  const lastLabel = answerLabel(question, record.attempts[record.attempts.length - 1].answer);
  if (!firstLabel || !lastLabel) return null;
  const step = getLearningStep(bubbleSortExecutionContent, question.stepId);
  return <CorrectedScene position={questionIndex + 1} prompt={question.prompt} canvas={step.canvas} firstLabel={firstLabel} lastLabel={lastLabel} />;
}

function answerLabel(question: BubbleSortCheckQuestion, answer: AssessmentAnswer): string | null {
  if (answer.kind === "node") return `左から${Number(answer.nodeId) + 1}番目のマス`;
  if (answer.kind === "choice" && "choices" in question) return question.choices.find(c => c.id === answer.choiceId)?.text ?? null;
  return null;
}

function CorrectedScene({ position, prompt, canvas, firstLabel, lastLabel }: {
  position: number; prompt: string;
  canvas: Parameters<typeof BubbleSortExecutionCanvas>[0]["canvas"];
  firstLabel: string; lastLabel: string;
}) {
  return <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #dbe3ef" }}>
    <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 1.5 }}>あの場面（{position}問目）</Typography>
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      <Box sx={{ width: 440, height: 300, flexShrink: 0, border: "1px solid #dbe3ef", borderRadius: 2, overflow: "hidden" }}>
        <BubbleSortExecutionCanvas canvas={canvas} />
      </Box>
      <Stack spacing={1.25} sx={{ flex: 1, minWidth: 220, justifyContent: "center" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.6 }}>{prompt}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ border: "1.5px solid #64748b", borderRadius: 999, px: 1, py: 0.25, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>最初</Box>
          <Typography sx={{ fontSize: 16 }}>{firstLabel}</Typography>
          <CloseIcon sx={{ fontSize: 19, color: "#64748b" }} />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ border: "1.5px solid #16a34a", borderRadius: 999, px: 1, py: 0.25, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>見直して</Box>
          <Typography sx={{ fontSize: 16 }}>{lastLabel}</Typography>
          <CheckCircleIcon sx={{ fontSize: 19, color: "#16a34a" }} />
        </Box>
      </Stack>
    </Box>
  </Box>;
}
