import { disposePyodideRunner, preparePyodide, tracePythonFunction } from "../../../../lib/pyodideRunner";
import { bubbleSortImplementationContent } from "../implementation/implementation.content";

export const bubbleSortTraceEventLimit = 500;
/** 前の採点用入力を持ち込まず、毎回新しいWorkerへD1の引数だけを送る。入口の関数名は呼び出し側が発見して渡す。 */
export async function traceBubbleSortCode(code: string, isCurrent = () => true, entryName?: string) {
  const displayCase = bubbleSortImplementationContent.tests.find(test => test.id === "D1");
  if (!displayCase || displayCase.visibility !== "display") throw new Error("D1 must be a display case");
  disposePyodideRunner();
  try {
    await preparePyodide();
    if (!isCurrent()) throw new Error("Trace cancelled");
    const response = await tracePythonFunction({ code, functionName: entryName ?? displayCase.functionName, args: displayCase.args, maxEvents: bubbleSortTraceEventLimit });
    return response.trace;
  } catch (error) {
    if (isCurrent()) disposePyodideRunner();
    throw error;
  }
}
