import { runCourseMissionTests, type PythonTestCase } from "../../../../lib/pyodideRunner";
import { analyzeExecutionError } from "../../../../lib/executionError";
import type { ImplementationInputLevel } from "../../implementation/inputLevel";
import type { ArrayBarsCanvasState } from "../../player/arrayBars.types";
import { bubbleSortAutoTests, bubbleSortImplementationContent as content, type ImplementationTest } from "./implementation.content";

export type HintLevel = 1 | 2 | 3 | 4;
export type HintUsage = readonly [number, number, number, number];
export type TestOutcome = { readonly id: string; readonly passed: boolean; readonly actual?: unknown; readonly error?: "syntax" | "runtime" | "timeout"; readonly errorLine?: number; readonly errorException?: string; readonly errorName?: string; readonly autoPassed?: number; readonly autoTotal?: number };

/** 単元フロー接続時（後続Issue）に渡す要約。集計はテスト実行とヒント利用から導く。 */
export type BubbleSortImplementationSummary = {
  readonly code?: string;
  readonly testRuns: number;
  readonly hintUsage: HintUsage;
  /** 完了時点の入力量レベル（Issue #328）。テストと完了条件はレベルによらず同一。 */
  readonly inputLevel: ImplementationInputLevel;
};

export const recordHintUsage = (usage: HintUsage, level: HintLevel): HintUsage => {
  if (level > 1 && usage[level - 2] === 0) return usage;
  return [usage[0] + (level === 1 ? 1 : 0), usage[1] + (level === 2 ? 1 : 0), usage[2] + (level === 3 ? 1 : 0), usage[3] + (level === 4 ? 1 : 0)];
};
/** エラーの分類・行番号の解析は共通モジュール（lib/executionError）が正。 */
export { classifyExecutionError } from "../../../../lib/executionError";
export function resultKinds(outcomes: readonly TestOutcome[]) {
  return (["syntax", "runtime", "timeout", "mismatch"] as const).filter(kind =>
    outcomes.some(outcome => kind === "mismatch" ? !outcome.passed && !outcome.error : outcome.error === kind));
}
export function runningMessage(completed: number, total: number) {
  return content.status.running.replace("{current}", String(Math.min(completed + 1, total))).replace("{total}", String(total));
}

/** 戻り値が数値のリストかどうか（長さ1以上、有限な数だけ）。 */
export const isNumberListValue = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length > 0 &&
  value.every(item => typeof item === "number" && Number.isFinite(item));

/** 棒グラフで描ける数値のリストかどうか（高さで表すため負の値は描けない）。 */
export const isDrawableArrayValue = (value: unknown): value is number[] =>
  isNumberListValue(value) && value.every(item => item >= 0);

/** リストの値を配列描画用の Canvas へ変換する。期待と違う場所は highlight で示せる。結果表示では確定範囲を持たない。 */
export function arrayBarsCanvas(values: readonly number[], differentIndices: readonly number[] = []): ArrayBarsCanvasState {
  return {
    data: { kind: "array-bars" },
    state: { values: [...values], comparing: null, fixedFrom: values.length },
    highlights: differentIndices.map(index => ({ kind: "cell" as const, id: index })),
  };
}

/** 同じ長さのリスト同士で、期待と違う場所の位置を列挙する。リストでない・長さが違う場合は null（長さ違いとして扱う）。 */
export function arrayDifferences(expected: unknown, actual: unknown): readonly number[] | null {
  if (!isNumberListValue(expected) || !isNumberListValue(actual) || expected.length !== actual.length) return null;
  const differences: number[] = [];
  expected.forEach((value, index) => {
    if (actual[index] !== value) differences.push(index);
  });
  return differences;
}

export function allTestsPassed(tests: readonly ImplementationTest[], outcomes: readonly TestOutcome[]): boolean {
  return tests.length > 0 && tests.length === outcomes.length && tests.every(test => outcomes.some(outcome => outcome.id === test.id && outcome.passed));
}
/** 名前つきテストだけを見る全通過判定（自動チェック等の追加 outcome が混ざってもよい）。 */
export function allNamedTestsPassed(tests: readonly ImplementationTest[], outcomes: readonly TestOutcome[]): boolean {
  return tests.length > 0 && tests.every(test => outcomes.some(outcome => outcome.id === test.id && outcome.passed));
}
/**
 * 自由実装の入口の発見（2026-11-25）。関数名は固定しない：
 * トップレベルで定義された関数を候補とし、主教材の入力で「同じ長さの
 * 数値リストを返す」ものを入口とみなす。どの候補も返さない（書きかけ等）
 * ときは、候補が1つならそれを、複数なら最後に定義されたものを入口にする
 * （エラーは通常のテスト実行で表面化させる）。関数が1つもなければ null。
 */
export function findEntryCandidates(code: string): readonly string[] {
  const names: string[] = [];
  for (const match of code.matchAll(/^def\s+([A-Za-z_]\w*)\s*\(/gm)) {
    if (!names.includes(match[1])) names.push(match[1]);
  }
  return names;
}

export async function discoverEntryFunction(code: string): Promise<string | null> {
  const candidates = findEntryCandidates(code);
  if (candidates.length === 0) return null;
  const probe = content.tests.find(test => test.id === "D1");
  if (probe) {
    const input = probe.args[0];
    const inputLength = Array.isArray(input) ? input.length : 0;
    for (const name of candidates) {
      try {
        const response = await runCourseMissionTests(code, [{ ...probe, functionName: name }]);
        const result = response.results.find(item => item.id === probe.id);
        if (result && isNumberListValue(result.actual) && result.actual.length === inputLength) return name;
      } catch { /* その候補は入口でない（呼び出しで例外）。次の候補を試す。 */ }
    }
  }
  return candidates.length === 1 ? candidates[0] : candidates[candidates.length - 1];
}

/** 例外でも他のケースを試す。判定用の値・標準出力・生の例外はUI状態に渡さない。 */
export async function runImplementationTests(code: string, tests: readonly ImplementationTest[], progress: (outcomes: readonly TestOutcome[]) => void, isCurrent = () => true, entryName?: string) {
  const outcomes: TestOutcome[] = [];
  for (const test of tests) {
    if (!isCurrent()) break;
    try {
      const response = await runCourseMissionTests(code, [entryName ? { ...test, functionName: entryName } : test]);
      const result = response.results.find(result => result.id === test.id);
      if (!result) throw new Error("Missing test result");
      outcomes.push({ id: test.id, passed: result.passed, ...(test.visibility === "display" ? { actual: result.actual } : {}) });
    } catch (error) {
      const analysis = analyzeExecutionError(error);
      outcomes.push({ id: test.id, passed: false, error: analysis.kind, ...(analysis.line !== undefined ? { errorLine: analysis.line } : {}), ...(analysis.exception !== undefined ? { errorException: analysis.exception } : {}), ...(analysis.name !== undefined ? { errorName: analysis.name } : {}) });
    }
    progress([...outcomes]);
  }
  return outcomes;
}

/** 自動チェック（網羅＋性質ベース）を1回の実行でまとめて判定する。 */
export async function runAutoTests(code: string, entryName: string): Promise<TestOutcome> {
  const cases: readonly PythonTestCase[] = bubbleSortAutoTests.map(test => ({ ...test, functionName: entryName }));
  try {
    const response = await runCourseMissionTests(code, [...cases]);
    const passedCount = cases.filter(test => response.results.find(result => result.id === test.id)?.passed).length;
    return { id: "AUTO", passed: passedCount === cases.length, autoPassed: passedCount, autoTotal: cases.length };
  } catch (error) {
    const analysis = analyzeExecutionError(error);
    return { id: "AUTO", passed: false, error: analysis.kind, autoPassed: 0, autoTotal: cases.length, ...(analysis.line !== undefined ? { errorLine: analysis.line } : {}), ...(analysis.exception !== undefined ? { errorException: analysis.exception } : {}), ...(analysis.name !== undefined ? { errorName: analysis.name } : {}) };
  }
}
