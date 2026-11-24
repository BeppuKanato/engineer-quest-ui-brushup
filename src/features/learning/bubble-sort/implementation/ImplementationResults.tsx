import { Box, Button, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { BookShelfFigure } from "./BookShelfFigure";
import { bubbleSortImplementationContent as content } from "./implementation.content";
import { arrayDifferences, isDrawableArrayValue, resultKinds, type TestOutcome } from "./implementation";

const labels = content.display;

/**
 * テストタブ：公開テストは本棚のカード、非公開テストと実行できなかった
 * テストは情報量に合わせたコンパクトな行で見せる。
 * 状態は「通過／不一致／実行不可・実行エラー／未実行」を区別する：
 * コードが間違っていることと、そもそも実行できていないことは別だ。
 * 未通過の公開テストは期待する並びを点線のゴーストで重ね、ズレた本に
 * 枠を付ける。通過は緑のスタンプ。
 */
export function ImplementationResults({ outcomes, diagnostics = outcomes, onShowTrace }: { outcomes: readonly TestOutcome[]; diagnostics?: readonly TestOutcome[]; onShowTrace?: () => void }) {
  const kinds = resultKinds(diagnostics);
  const passed = outcomes.filter(outcome => outcome.passed).length;
  const reducedMotion = useReducedMotion();
  const statusOf = (outcome: TestOutcome | undefined) => !outcome ? labels.statuses.unexecuted
    : outcome.passed ? labels.statuses.passed
    : outcome.error === "syntax" ? labels.statuses.errorSyntax
    : outcome.error === "runtime" ? labels.statuses.errorRuntime
    : outcome.error === "timeout" ? labels.statuses.errorTimeout
    : labels.statuses.failed;
  return <Box>
    {kinds.length > 0 && <Box role="status" aria-label={labels.errorLabel} sx={{ mb: 2 }}>
      {kinds.map(kind => {
        const line = diagnostics.find(outcome => outcome.error === kind)?.errorLine;
        const guidance = kind !== "mismatch" ? labels.guidance[kind] : undefined;
        return <Box key={kind} sx={{ mb: 1 }}>
          <Typography component="p" data-error-kind={kind} data-error-line={line} sx={{ fontSize: 16, fontWeight: 700 }}>{labels.messages[kind]}{line ? labels.lineNote.replace("{line}", String(line)) : ""}</Typography>
          {guidance && <Typography component="p" sx={{ fontSize: 14, mt: 0.25 }}>{guidance}</Typography>}
        </Box>;
      })}
    </Box>}
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 1 }}>
      <Typography component="p" sx={{ fontSize: 22, fontWeight: 900 }}>{passed} / {content.tests.length} 本通過</Typography>
    </Box>
    {content.tests.map(test => {
      const outcome = outcomes.find(item => item.id === test.id);
      const status = statusOf(outcome);
      const input = isDrawableArrayValue(test.args[0]) ? test.args[0] : null;
      const expected = isDrawableArrayValue(test.expected) ? test.expected : null;
      const actual = outcome && !outcome.error && isDrawableArrayValue(outcome.actual) ? outcome.actual : null;
      const differences = actual && expected ? arrayDifferences(expected, actual) : null;
      const stamp = <Box component={motion.span} key={status.label}
        initial={reducedMotion ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }} transition={{ duration: reducedMotion ? 0 : 0.3 }}
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.5, borderRadius: 999, fontSize: 14, fontWeight: 800, flexShrink: 0,
          ...(outcome?.passed
            ? { bgcolor: "#16a34a", color: "#fff" }
            : outcome
              ? { border: "2px solid #111827", color: "#111827" }
              : { border: "2px solid #c3cad4", color: "#111827" }) }}>
        <span aria-hidden="true">{status.icon}</span>{status.label}
      </Box>;
      const header = <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography component="p" sx={{ fontSize: 16, fontWeight: 800, flex: 1, minWidth: 0 }}>{test.label}</Typography>
        {stamp}
      </Box>;
      // 実行できなかったテストは、原因が共通なので図は持たず1行に集約する。
      if (outcome?.error) {
        return <Box key={test.id} data-test-id={test.id} sx={{ border: "1px solid #dbe3ef", borderRadius: 2, bgcolor: "#fff", p: 1.5, mb: 2 }}>
          {header}
          <Typography component="p" sx={{ fontSize: 14 }}>実行できませんでした。上のメッセージを確認してください。</Typography>
        </Box>;
      }
      // 非公開テストは中身を見せられない分、場所を取らない行にする。
      if (test.visibility === "judgement") {
        return <Box key={test.id} data-test-id={test.id} sx={{ border: "1px solid #dbe3ef", borderRadius: 2, bgcolor: "#fff", p: 1.5, mb: 2 }}>
          {header}
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box aria-hidden sx={{ width: 150, height: 64, flexShrink: 0, border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden" }}>
              <BookShelfFigure values={Array.from({ length: input?.length ?? 4 }, () => 3)} label="内容は非公開のテスト" hiddenValues />
            </Box>
            <Typography component="p" sx={{ fontSize: 14 }}>
              {!outcome
                ? "内容は非公開のテストです。実行すると、通過したかどうかが分かります。"
                : outcome.passed
                  ? "期待どおりの並びになりました。"
                  : "期待する並びと違う結果になりました。"}
            </Typography>
          </Box>
        </Box>;
      }
      return <Box key={test.id} data-test-id={test.id} sx={{ border: "1px solid #dbe3ef", borderRadius: 2, bgcolor: "#fff", p: 1.5, mb: 2 }}>
        {header}
        {actual && expected
          ? <>
              {differences && differences.length > 0 && <Box sx={{ display: "flex", gap: 2, mb: 0.75, alignItems: "center" }}>
                <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 14 }}>
                  <Box aria-hidden sx={{ width: 14, height: 14, bgcolor: "#7d8ca3", borderRadius: 0.5 }} />あなたの結果
                </Box>
                <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 14 }}>
                  <Box aria-hidden sx={{ width: 14, height: 14, border: "2px dashed #64748b", borderRadius: 0.5 }} />期待する並び
                </Box>
              </Box>}
              <Box sx={{ height: 168, border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden" }}>
                <BookShelfFigure values={actual} differences={differences ?? []} ghost={outcome?.passed ? undefined : expected} label={labels.actualLabel} />
              </Box>
              <Typography component="p" sx={{ fontSize: 14, mt: 0.75 }}>
                {outcome?.passed
                  ? "期待する並びと一致しました。"
                  : differences === null
                    ? labels.lengthMismatch
                    : differences.length > 0
                      ? `点線が期待する並びです。${labels.different.replace("{count}", String(differences.length))}`
                      : labels.invalid}
              </Typography>
              {/* 基本テストは「動きを見る」と同じ入力なので、失敗したらその場から再生へ行ける。 */}
              {test.id === "D1" && outcome && !outcome.passed && onShowTrace && <Button size="small" startIcon={<VisibilityIcon />} onClick={onShowTrace}
                sx={{ mt: 0.5, minHeight: 36, fontWeight: 700, color: "#2563eb" }}>自分のコードの動きを見る</Button>}
            </>
          : input
            ? <>
                <Box sx={{ height: 168, border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden" }}>
                  <BookShelfFigure values={input} label={labels.inputLabel} />
                </Box>
                <Typography component="p" sx={{ fontSize: 14, mt: 0.75 }}>{labels.inputLabel}：[{input.join(", ")}]。テストを実行すると、結果の棚がここに出ます。</Typography>
              </>
            : null}
      </Box>;
    })}
  </Box>;
}
