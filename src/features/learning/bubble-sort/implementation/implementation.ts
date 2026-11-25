import { runProgramTests } from "../../../../lib/pyodideRunner";
import { analyzeExecutionError } from "../../../../lib/executionError";
import type { ImplementationInputLevel } from "../../implementation/inputLevel";
import type { ArrayBarsCanvasState } from "../../player/arrayBars.types";
import { bubbleSortAutoTests, bubbleSortImplementationContent as content, programInputText, type ProgramTest } from "./implementation.content";

export type HintLevel = 1 | 2 | 3 | 4;
export type HintUsage = readonly [number, number, number, number];
export type FormatIssue = "empty" | "nonNumeric" | "length";
export type TestOutcome = { readonly id: string; readonly passed: boolean; readonly actual?: unknown; readonly error?: "syntax" | "runtime" | "timeout"; readonly errorLine?: number; readonly errorException?: string; readonly errorName?: string; readonly autoPassed?: number; readonly autoTotal?: number; readonly formatIssue?: FormatIssue };

/** 単元フロー接続時に渡す要約。集計はテスト実行とヒント利用から導く。 */
export type BubbleSortImplementationSummary = {
  readonly code?: string;
  readonly testRuns: number;
  readonly hintUsage: HintUsage;
  /** 完了時点の書き方（自由／橋渡しの型）。テストと完了条件は書き方によらず同一。 */
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

/** 名前つきテストだけを見る全通過判定（自動チェック等の追加 outcome が混ざってもよい）。 */
export function allNamedTestsPassed(tests: readonly ProgramTest[], outcomes: readonly TestOutcome[]): boolean {
  return tests.length > 0 && tests.every(test => outcomes.some(outcome => outcome.id === test.id && outcome.passed));
}

/**
 * プログラムの標準出力を、数値の並びとして読む。
 * 空・数値でないもの混入・個数の不一致は、実行エラーとは別の「出力の形」の問題として返す。
 */
export function parseProgramOutput(stdout: string, expectedLength: number): { values: number[] } | { issue: FormatIssue } {
  const tokens = stdout.split(/\s+/u).filter(token => token.length > 0);
  if (tokens.length === 0) return { issue: "empty" };
  const values: number[] = [];
  for (const token of tokens) {
    const value = Number(token);
    if (!Number.isFinite(value)) return { issue: "nonNumeric" };
    values.push(value);
  }
  if (values.length !== expectedLength) return { issue: "length" };
  return { values };
}

const arraysEqual = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

function outcomeFromResult(test: ProgramTest, stdout: string, error: string | null): TestOutcome {
  if (error !== null) {
    const analysis = analyzeExecutionError(new Error(error));
    return { id: test.id, passed: false, error: analysis.kind, ...(analysis.line !== undefined ? { errorLine: analysis.line } : {}), ...(analysis.exception !== undefined ? { errorException: analysis.exception } : {}), ...(analysis.name !== undefined ? { errorName: analysis.name } : {}) };
  }
  const parsed = parseProgramOutput(stdout, test.expected.length);
  if ("issue" in parsed) return { id: test.id, passed: false, formatIssue: parsed.issue };
  return { id: test.id, passed: arraysEqual(parsed.values, test.expected), ...(test.visibility === "display" ? { actual: parsed.values } : {}) };
}

/** 例外でも他のケースを試すため、テストは1件ずつ実行する。判定用の生の標準出力はUI状態に渡さない。 */
export async function runImplementationTests(code: string, tests: readonly ProgramTest[], progress: (outcomes: readonly TestOutcome[]) => void, isCurrent = () => true) {
  const outcomes: TestOutcome[] = [];
  for (const test of tests) {
    if (!isCurrent()) break;
    try {
      const response = await runProgramTests(code, [{ id: test.id, input: programInputText(test.inputValues) }]);
      const result = response.results.find(item => item.id === test.id);
      if (!result) throw new Error("Missing test result");
      outcomes.push(outcomeFromResult(test, result.stdout, result.error));
    } catch (error) {
      const analysis = analyzeExecutionError(error);
      outcomes.push({ id: test.id, passed: false, error: analysis.kind, ...(analysis.line !== undefined ? { errorLine: analysis.line } : {}), ...(analysis.exception !== undefined ? { errorException: analysis.exception } : {}), ...(analysis.name !== undefined ? { errorName: analysis.name } : {}) });
    }
    progress([...outcomes]);
  }
  return outcomes;
}

/** 自動チェック（網羅＋性質ベース）を1回の実行でまとめて判定する。 */
export async function runAutoTests(code: string): Promise<TestOutcome> {
  try {
    const response = await runProgramTests(code, bubbleSortAutoTests.map(test => ({ id: test.id, input: programInputText(test.inputValues) })));
    let passedCount = 0;
    let firstError: string | null = null;
    for (const test of bubbleSortAutoTests) {
      const result = response.results.find(item => item.id === test.id);
      if (!result) continue;
      if (result.error !== null) { if (firstError === null) firstError = result.error; continue; }
      const parsed = parseProgramOutput(result.stdout, test.expected.length);
      if (!("issue" in parsed) && arraysEqual(parsed.values, test.expected)) passedCount++;
    }
    if (firstError !== null && passedCount === 0) {
      const analysis = analyzeExecutionError(new Error(firstError));
      return { id: "AUTO", passed: false, error: analysis.kind, autoPassed: 0, autoTotal: bubbleSortAutoTests.length, ...(analysis.line !== undefined ? { errorLine: analysis.line } : {}), ...(analysis.exception !== undefined ? { errorException: analysis.exception } : {}), ...(analysis.name !== undefined ? { errorName: analysis.name } : {}) };
    }
    return { id: "AUTO", passed: passedCount === bubbleSortAutoTests.length, autoPassed: passedCount, autoTotal: bubbleSortAutoTests.length };
  } catch (error) {
    const analysis = analyzeExecutionError(error);
    return { id: "AUTO", passed: false, error: analysis.kind, autoPassed: 0, autoTotal: bubbleSortAutoTests.length, ...(analysis.line !== undefined ? { errorLine: analysis.line } : {}), ...(analysis.exception !== undefined ? { errorException: analysis.exception } : {}), ...(analysis.name !== undefined ? { errorName: analysis.name } : {}) };
  }
}
