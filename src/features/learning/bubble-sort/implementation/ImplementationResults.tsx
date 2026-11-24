import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

import { BookShelfFigure } from "./BookShelfFigure";
import { bubbleSortImplementationContent as content } from "./implementation.content";
import { arrayDifferences, isDrawableArrayValue, resultKinds, type TestOutcome } from "./implementation";

const labels = content.display;

/**
 * テストタブ：テスト1件＝本棚1枚のカードで見せる。
 * 実行前は入力の棚、実行後は結果の棚。未通過は期待する並びを点線の
 * ゴーストで重ね、ズレた本に枠を付けるので、文章を読まなくても
 * 「何ができて何が違うか」が図で分かる。通過は緑のスタンプ。
 */
export function ImplementationResults({ outcomes, diagnostics = outcomes }: { outcomes: readonly TestOutcome[]; diagnostics?: readonly TestOutcome[] }) {
  const kinds = resultKinds(diagnostics);
  const passed = outcomes.filter(outcome => outcome.passed).length;
  const reducedMotion = useReducedMotion();
  return <Box>
    {kinds.length > 0 && <Box role="status" aria-label={labels.errorLabel} sx={{ mb: 2 }}>
      {kinds.map(kind => {
        const line = diagnostics.find(outcome => outcome.error === kind)?.errorLine;
        return <Typography component="p" key={kind} data-error-kind={kind} data-error-line={line} sx={{ fontSize: 16 }}>{labels.messages[kind]}{line ? labels.lineNote.replace("{line}", String(line)) : ""}</Typography>;
      })}
    </Box>}
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 1 }}>
      <Typography component="p" sx={{ fontSize: 22, fontWeight: 900 }}>{passed} / {content.tests.length} 本通過</Typography>
    </Box>
    {content.tests.map(test => {
      const outcome = outcomes.find(item => item.id === test.id);
      const status = !outcome ? labels.statuses.unexecuted : outcome.passed ? labels.statuses.passed : labels.statuses.failed;
      const input = isDrawableArrayValue(test.args[0]) ? test.args[0] : null;
      const expected = isDrawableArrayValue(test.expected) ? test.expected : null;
      const actual = outcome && !outcome.error && isDrawableArrayValue(outcome.actual) ? outcome.actual : null;
      const differences = actual && expected ? arrayDifferences(expected, actual) : null;
      return <Box key={test.id} data-test-id={test.id} sx={{ border: "1px solid #dbe3ef", borderRadius: 2, bgcolor: "#fff", p: 1.5, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography component="p" sx={{ fontSize: 16, fontWeight: 800, flex: 1, minWidth: 0 }}>{test.label}</Typography>
          <Box component={motion.span} key={status.label}
            initial={reducedMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }} transition={{ duration: reducedMotion ? 0 : 0.3 }}
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.5, borderRadius: 999, fontSize: 14, fontWeight: 800,
              ...(outcome?.passed
                ? { bgcolor: "#16a34a", color: "#fff" }
                : outcome
                  ? { border: "2px solid #111827", color: "#111827" }
                  : { border: "2px solid #c3cad4", color: "#111827" }) }}>
            <span aria-hidden="true">{status.icon}</span>{status.label}
          </Box>
        </Box>
        {test.visibility === "judgement"
          ? <>
              <Box sx={{ height: 168, border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden" }}>
                <BookShelfFigure values={Array.from({ length: input?.length ?? 4 }, () => 3)} label="内容は非公開のテスト" hiddenValues />
              </Box>
              <Typography component="p" sx={{ fontSize: 14, mt: 0.75 }}>
                {!outcome
                  ? "内容は非公開のテストです。実行すると、通過したかどうかが分かります。"
                  : outcome.error
                    ? "実行できませんでした。上のメッセージを確認してください。"
                    : outcome.passed
                      ? "期待どおりの並びになりました。"
                      : "期待する並びと違う結果になりました。"}
              </Typography>
            </>
          : actual && expected
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
            </>
          : outcome?.error
            ? <Typography component="p" sx={{ fontSize: 16 }}>実行できませんでした。上のメッセージを確認してください。</Typography>
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
