import { Box, Button, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { BookShelfFigure } from "./BookShelfFigure";
import { bubbleSortImplementationContent as content } from "./implementation.content";
import { arrayDifferences, isDrawableArrayValue, resultKinds, type TestOutcome } from "./implementation";

const labels = content.display;

/**
 * テストタブの表示方針：
 * - 詳細に開くのは「不一致の公開テスト」だけ（直す作業がある場所に場所を使う）。
 *   期待する並びを点線ゴーストで重ね、ズレた本に枠を付け、基本テストからは
 *   自分のコードの動きを見る導線を出す。
 * - 通過・未実行の公開テストと、非公開テストはコンパクトな行（ミニ棚＋一文）。
 * - 全テストが同じエラーで実行できなかった回は、繰り返しをやめて
 *   1枚のエラーパネルに集約する（該当行のコードと、箇所へ飛ぶボタンを出す）。
 * - コード編集後は前回の結果を「前回」と明示して残す（stale）。判定には使わない。
 * 状態は「通過／不一致／実行不可・実行エラー／未実行」を区別する。
 */
export function ImplementationResults({ outcomes, diagnostics = outcomes, stale = false, code, onFocusLine, onShowTrace }: {
  outcomes: readonly TestOutcome[];
  diagnostics?: readonly TestOutcome[];
  stale?: boolean;
  code?: string;
  onFocusLine?: (line: number) => void;
  onShowTrace?: () => void;
}) {
  const kinds = resultKinds(diagnostics);
  const passed = outcomes.filter(outcome => outcome.passed).length;
  const reducedMotion = useReducedMotion();
  const statusOf = (outcome: TestOutcome | undefined) => !outcome ? labels.statuses.unexecuted
    : outcome.passed ? labels.statuses.passed
    : outcome.error === "syntax" ? labels.statuses.errorSyntax
    : outcome.error === "runtime" ? labels.statuses.errorRuntime
    : outcome.error === "timeout" ? labels.statuses.errorTimeout
    : labels.statuses.failed;
  // 全件が同一種のエラー＝コード自体が実行できていないので、テスト別の行は作らない。
  const aggregatedKind = !stale && outcomes.length === content.tests.length && outcomes.every(outcome => outcome.error)
    ? (new Set(outcomes.map(outcome => outcome.error)).size === 1 ? outcomes[0].error : undefined)
    : undefined;
  if (aggregatedKind) {
    const line = outcomes.find(outcome => outcome.errorLine !== undefined)?.errorLine;
    const lineText = line !== undefined && code ? code.split("\n")[line - 1]?.trim() : undefined;
    const guidance = labels.guidance[aggregatedKind];
    return <Box>
      <Box role="alert" sx={{ border: "2px solid #111827", borderRadius: 2, bgcolor: "#fff", p: 2 }}>
        <Typography component="p" sx={{ fontSize: 18, fontWeight: 900 }}>
          {aggregatedKind === "syntax" ? "文法エラー" : aggregatedKind === "runtime" ? "実行時エラー" : "タイムアウト"}
          {line ? `（${line}行目付近）` : ""}
        </Typography>
        <Typography component="p" sx={{ fontSize: 16, mt: 1 }}>{labels.messages[aggregatedKind]}</Typography>
        {lineText && <Box component="pre" sx={{ m: 0, mt: 1.5, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 15, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{line}行目：{lineText}</Box>}
        {guidance && <Typography component="p" sx={{ fontSize: 14, mt: 1.5 }}>{guidance}</Typography>}
        {line !== undefined && onFocusLine && <Button variant="outlined" onClick={() => onFocusLine(line)}
          sx={{ mt: 1.5, minHeight: 44, fontWeight: 700, color: "#111827", borderColor: "#111827" }}>エラー箇所を確認</Button>}
      </Box>
      <Typography component="p" sx={{ fontSize: 15, fontWeight: 700, mt: 2 }}>テストはまだ実行されていません</Typography>
    </Box>;
  }
  return <Box>
    {stale && <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>前回のテスト結果です。コードが変更されています。再実行すると更新されます。</Typography>}
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
      <Typography component="p" sx={{ fontSize: 22, fontWeight: 900 }}>{stale ? "前回 " : ""}{passed} / {content.tests.length} 本通過</Typography>
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
      const compactRow = (values: readonly number[] | null, caption: string, hidden = false) => <Box key={test.id} data-test-id={test.id} sx={{ border: "1px solid #dbe3ef", borderRadius: 2, bgcolor: "#fff", p: 1.5, mb: 2 }}>
        {header}
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          {values && <Box aria-hidden sx={{ width: 150, height: 64, flexShrink: 0, border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden" }}>
            <BookShelfFigure values={hidden ? values.map(() => 3) : [...values]} label={test.label} hiddenValues={hidden} />
          </Box>}
          <Typography component="p" sx={{ fontSize: 14 }}>{caption}</Typography>
        </Box>
      </Box>;
      // 実行できなかったテスト（集約されなかった分）は1行に留める。
      if (outcome?.error) return compactRow(null, "実行できませんでした。上のメッセージを確認してください。");
      if (test.visibility === "judgement") {
        return compactRow(input, !outcome
          ? "内容は非公開のテストです。実行すると、通過したかどうかが分かります。"
          : outcome.passed
            ? "期待どおりの並びになりました。"
            : "期待する並びと違う結果になりました。", true);
      }
      // 公開テスト：通過・未実行はコンパクトに。
      if (!outcome) return compactRow(input, input ? `${labels.inputLabel}：[${input.join(", ")}]。テストを実行すると、結果の棚がここに出ます。` : "");
      if (outcome.passed) return compactRow(actual, "期待する並びと一致しました。");
      // 不一致だけ詳細に開く。
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
                <BookShelfFigure values={actual} differences={differences ?? []} ghost={expected} label={labels.actualLabel} />
              </Box>
              <Typography component="p" sx={{ fontSize: 14, mt: 0.75 }}>
                {differences === null
                  ? labels.lengthMismatch
                  : differences.length > 0
                    ? `点線が期待する並びです。${labels.different.replace("{count}", String(differences.length))}`
                    : labels.invalid}
              </Typography>
              {/* 基本テストは「動きを見る」と同じ入力なので、失敗したらその場から再生へ行ける。 */}
              {test.id === "D1" && onShowTrace && <Button size="small" startIcon={<VisibilityIcon />} onClick={onShowTrace}
                sx={{ mt: 0.5, minHeight: 36, fontWeight: 700, color: "#2563eb" }}>自分のコードの動きを見る</Button>}
            </>
          : <Typography component="p" sx={{ fontSize: 14 }}>{labels.invalid}</Typography>}
      </Box>;
    })}
  </Box>;
}
