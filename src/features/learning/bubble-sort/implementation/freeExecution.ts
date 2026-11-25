import { disposePyodideRunner, preparePyodide, runCourseMissionTests } from "../../../../lib/pyodideRunner";
import { bubbleSortImplementationContent as content } from "./implementation.content";
import { discoverEntryFunction } from "./implementation";
import { analyzeExecutionError } from "../../../../lib/executionError";

export const freeOutputLimit = 16_000;
export type FreeExecutionResult = {
  stdout: string; outputTruncated: boolean;
} & ({ returned: true; actual: unknown; error: "mismatch" | null } | { returned: false; error: "syntax" | "runtime" | "timeout" | "unavailable" | "nofunction"; errorLine?: number; errorException?: string; errorName?: string });
export const freeDisplayCase = content.tests.find(test => test.id === "D1" && test.visibility === "display");

/** 判定用の引数・stdoutが残ったWorkerを再利用せず、D1だけで実行する。入口の関数は名前を固定せず発見する。 */
export async function runBubbleSortFreeCode(code: string, onPrepared: () => void = () => {}, isCurrent = () => true): Promise<FreeExecutionResult> {
  if (!freeDisplayCase || freeDisplayCase.visibility !== "display") throw new Error("D1 must be a display case");
  disposePyodideRunner();
  try { await preparePyodide(); }
  catch { if (isCurrent()) disposePyodideRunner(); return { stdout: "", outputTruncated: false, returned: false, error: "unavailable" }; }
  if (!isCurrent()) throw new Error("Free execution cancelled");
  onPrepared();
  const entryName = await discoverEntryFunction(code);
  if (!entryName) return { stdout: "", outputTruncated: false, returned: false, error: "nofunction" };
  const displayCase = { ...freeDisplayCase, functionName: entryName };
  let stdout = "", outputTruncated = false, lines = 0;
  try {
    const response = await runCourseMissionTests(code, [displayCase], {
      maxOutputChars: freeOutputLimit,
      onStdout: line => {
        const chunk = (lines++ ? "\n" : "") + line;
        if (stdout.length + chunk.length > freeOutputLimit) outputTruncated = true;
        stdout += chunk.slice(0, Math.max(0, freeOutputLimit - stdout.length));
      },
    });
    const result = response.results.find(result => result.id === displayCase.id);
    if (!result) throw new Error("Missing display result");
    return { stdout, outputTruncated, returned: true, actual: result.actual, error: result.passed ? null : "mismatch" };
  } catch (error) {
    if (isCurrent()) disposePyodideRunner();
    const analysis = analyzeExecutionError(error);
    return { stdout, outputTruncated, returned: false, error: analysis.kind, ...(analysis.line !== undefined ? { errorLine: analysis.line } : {}), ...(analysis.exception !== undefined ? { errorException: analysis.exception } : {}), ...(analysis.name !== undefined ? { errorName: analysis.name } : {}) };
  }
}
