import type { PythonTestCase } from "../../../../lib/pyodideRunner";
import type { ImplementationInputLevel } from "../../implementation/inputLevel";
import { bubbleSortMainValues, bubbleSortTransferValues, runBubbleSort } from "../bubbleSort";
import { bubbleSortCode, type BubbleSortCodeLineId } from "../code-mapping/bubbleSortCode";
import { bubbleSortConsolidationContent } from "../consolidation/consolidation.content";

export type ImplementationTest = PythonTestCase & { readonly visibility: "display" | "judgement" };

/** 期待する並びは教材データの正本（bubbleSort の組み立て）から導き、フェーズ1〜6の教材とずらさない。 */
const testCase = (id: string, label: string, visibility: ImplementationTest["visibility"], values: readonly number[]): ImplementationTest => ({
  id, label, visibility, functionName: "bubble_sort",
  args: [[...values]], expected: [...runBubbleSort(values)],
});

const parsonsQuestion = bubbleSortConsolidationContent.questions.find(question => question.kind === "parsons");
if (!parsonsQuestion || parsonsQuestion.kind !== "parsons") throw new Error("Phase 6 Parsons question is required");

const skeletonLineIds = ["for-pass", "for-compare", "if-larger"] as const;

/**
 * 入力量レベル別の初期テンプレート（Issue #328）。
 * 「骨格から書く」「穴埋めで書く」は、正解コード（bubbleSortCode）の行から組み立てる。
 * 残す行は正解コードの行そのものを使い、置き換える行は、その行のインデントを保った
 * プレースホルダ行（raise NotImplementedError ＋「ここを書く」の目印）にする。
 * プレースホルダが残っていると必ずテストに失敗する。
 */
const codeLineText = (id: BubbleSortCodeLineId): string => {
  const line = bubbleSortCode.lines.find(line => line.id === id);
  if (!line) throw new Error("Missing canonical line");
  return line.text;
};
const placeholderLine = (id: BubbleSortCodeLineId, description: string): string => {
  const indent = /^ */u.exec(codeLineText(id))?.[0] ?? "";
  return `${indent}raise NotImplementedError  # ここを書く：${description}`;
};
const placeholderGuide = "    # 「ここを書く」の行が、まだ書けていない場所です。その行を消して、自分のコードを書いてください。";

/**
 * 自由実装の初期コード（2026-11-25、再設計の自由実装形）。
 * 関数名も形も固定しない。決まりは「リストを受け取って、並び替えた新しい
 * リストを返す関数を1つ書く」ことだけ。入口の関数は実行時に発見する
 * （implementation.ts の discoverEntryFunction）。
 */
const fullTemplate = "# ここを書く：リストを受け取って、並び替えた新しいリストを返す関数を書く\n# 関数の名前は自由です。引数はリスト1つにしてください。\n";

/** 骨格：制御構造（2つのループと条件分岐）と最後の return だけを残し、本体の行をすべてプレースホルダにする。 */
const skeletonTemplate = [
  codeLineText("define-function"),
  placeholderGuide,
  placeholderLine("copy-values", "並び替えるためのコピーを用意する"),
  placeholderLine("count-values", "要素の個数 n を用意する"),
  codeLineText("for-pass"),
  codeLineText("for-compare"),
  codeLineText("if-larger"),
  placeholderLine("swap-values", "2つの値を入れ替える"),
  codeLineText("return-result"),
].join("\n");

/** 穴埋め：要点の行（コピーの用意と、値の入れ替え）だけをプレースホルダにする。 */
const fillInTemplate = [
  codeLineText("define-function"),
  placeholderGuide,
  placeholderLine("copy-values", "元のリストを変えないよう、コピーを用意する"),
  codeLineText("count-values"),
  codeLineText("for-pass"),
  codeLineText("for-compare"),
  codeLineText("if-larger"),
  placeholderLine("swap-values", "左が大きければ、2つの値を入れ替える"),
  codeLineText("return-result"),
].join("\n");

const levelTemplates: Readonly<Record<ImplementationInputLevel, string>> = {
  full: fullTemplate,
  skeleton: skeletonTemplate,
  "fill-in": fillInTemplate,
};

/**
 * 自動チェック（網羅＋性質ベース）。小さい並びは網羅し、残りは種を固定した
 * 乱数で生成する（毎回同じケースになり、結果が再現できる）。
 * 期待する並びは教材データの正本から導く。入口の関数名は実行時に差し替える。
 */
const autoCaseValues: readonly (readonly number[])[] = (() => {
  const cases: number[][] = [];
  const permute = (items: number[], rest: number[]) => {
    if (rest.length === 0) { cases.push(items); return; }
    rest.forEach((value, index) => permute([...items, value], [...rest.slice(0, index), ...rest.slice(index + 1)]));
  };
  permute([], [1, 2, 3]);
  for (let length = 1; length <= 3; length++) {
    for (let mask = 0; mask < 2 ** length; mask++) {
      cases.push(Array.from({ length }, (_, i) => ((mask >> i) & 1) + 1));
    }
  }
  let seed = 20261125;
  const random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (let i = 0; i < 18; i++) {
    const length = 1 + Math.floor(random() * 9);
    cases.push(Array.from({ length }, () => Math.floor(random() * 10)));
  }
  return cases;
})();

export const bubbleSortAutoTests: readonly PythonTestCase[] = autoCaseValues.map((values, index) => ({
  id: `A${index + 1}`, label: `自動チェック${index + 1}`, functionName: "bubble_sort",
  args: [[...values]], expected: [...runBubbleSort(values)],
}));

export const bubbleSortImplementationContent = {
  version: 1, id: "bubble-sort-implementation", phase: 7,
  caption: "どんな並びでも番号順に並び替えるコードを完成させて、ミッションを達成しましょう。",
  template: fullTemplate,
  templates: levelTemplates,
  tests: [
    testCase("D1", "基本（動きの説明の並び）", "display", bubbleSortMainValues),
    testCase("D2", "応用（別の並び）", "display", bubbleSortTransferValues),
    testCase("J1", "重複あり", "judgement", [3, 1, 3, 2]),
    testCase("J2", "逆順", "judgement", [5, 4, 3, 2, 1]),
    testCase("J3", "並び済み", "judgement", [1, 2, 3, 4]),
  ] satisfies ImplementationTest[],
  /**
   * 自由実装の仕様と、支援エスカレーション（ヒント → 橋渡し → お手本）の文言。
   * 既存の書き方レベル（骨格・穴埋め）は削除せず、任意フェーズ6.5
   * 「実装の橋渡し」の中身として残す（2026-11-25 Kanato 決定）。
   */
  freeForm: {
    specTitle: "ミッションの仕様",
    specItems: [
      { label: "受け取るもの", text: "数値のリストを1つ" },
      { label: "返すもの", text: "番号順（小さい順）に並び替えた、新しいリスト" },
      { label: "条件", text: "元のリストは書き換えない。重複のある並び、逆順、並び済みの並びでも正しく並ぶこと" },
      { label: "関数の決まり", text: "リストを受け取って返す関数を1つ書く。名前は自由" },
    ],
    startHeading: "自分のコードで、本を番号順に並べ替えよう",
    startLead: "書き方は自由です。仕様を満たす関数を1つ書けば、ミッション達成です。",
    startNote: "詰まったときは、ヒントと「型（橋渡し）」が使えます。テストと達成の条件は、どの書き方でも同じです。",
    startButton: "書き始める",
    resumeButton: "コードに戻る",
    specButton: "仕様を見る",
    modeFree: "自由に書く",
    bridgeLabel: "実装の橋渡し",
    bridgeButton: "型を使う（橋渡し）",
    bridgeChangeButton: "型を変える",
    bridgeBackButton: "自由に書くに戻る",
    bridgeDialogTitle: "実装の橋渡し（任意フェーズ 6.5）",
    bridgeDialogLead: "型を使うと、コードの骨格や要点以外が用意された状態から書けます。型のコードは、今のコードとは別の下書きに残ります。",
    bridgeUseButton: "この型で書く",
    bannerText: "詰まってきたら、型（橋渡し）を使って書くこともできます。",
    bannerDismiss: "閉じる",
    exampleButton: "お手本を見る",
    exampleTitle: "お手本（考え方の確認用）",
    exampleNote: "お手本は、フェーズ6までで学んだコードです。写すためではなく、考え方を確認するために見ましょう。",
    noFunction: "並び替える関数が見つかりません。リストを受け取って、並び替えたリストを返す関数を1つ書いてください。",
    autoLabel: "いろいろな並び（自動チェック）",
    autoShortLabel: "自動チェック",
    autoCaptionNone: "重複・逆順・短い並びなど、いろいろな並びで自動的に確認します。内容は非公開です。",
    autoCaptionPassed: "{total} 件すべて、期待どおりの並びになりました。",
    autoCaptionFailed: "{total} 件中 {passed} 件が期待どおりでした。短い並びや重複のある並びで確かめてみましょう。",
  },
  hints: {
    labels: ["ヒント1：使う部品を見る", "ヒント2：処理の流れを見る", "ヒント3：条件とループの骨格を見る", "ヒント4：並び替えで確認する"],
    descriptions: ["使える変数やコードの部品を確認する", "どのような順序で処理するかを確認する", "コードの構造を確認する", "コードを並べ替えながら復習する"],
    compactLabels: ["ヒント1", "ヒント2", "ヒント3", "ヒント4"],
    variables: [
      { name: "result", description: "並び替えるための、入力をコピーしたリスト" },
      { name: "n", description: "リストの長さ" },
    ],
    tokens: ["result", "values", "n", "for", "if", "list(values)", "len(result)", "range(n - 1)", "range(n - 1 - i)", "result[j] > result[j + 1]", "result[j], result[j + 1] = result[j + 1], result[j]", "return"],
    tokenInstruction: "トークンを選ぶと、カーソル位置に挿入します。",
    tokenGroupLabel: "使う部品のトークン",
    flow: [
      "左端から右端まで、隣同士を比べていく",
      "左が大きければ入れ替える",
      "右端が決まったら、範囲を1つ狭めてくり返す",
    ],
    loopLabel: "範囲が1つになるまでくり返し",
    skeletonLineIds,
    skeletonLines: skeletonLineIds.map(id => {
      const line = bubbleSortCode.lines.find(line => line.id === id);
      if (!line) throw new Error("Missing skeleton line");
      return line;
    }),
    parsonsQuestion,
    closeLabel: "ヒントを閉じる",
    groupLabel: "段階式ヒント",
  },
  display: {
    listLabel: "テスト結果一覧", errorLabel: "直近の実行結果",
    inputLabel: "入力",
    expectedLabel: "期待する並び", actualLabel: "実際の並び", noOutput: "—",
    invalid: "数値のリストではありません", lengthMismatch: "リストの長さが期待と違います",
    different: "期待と違う場所：{count}個",
    statuses: { passed: { icon: "✓", label: "通過" }, failed: { icon: "×", label: "不一致" }, unexecuted: { icon: "○", label: "未実行" },
      errorSyntax: { icon: "!", label: "実行不可" }, errorRuntime: { icon: "!", label: "実行エラー" }, errorTimeout: { icon: "!", label: "タイムアウト" } },
    messages: {
      syntax: "文法エラーのため実行できていないテストがあります。",
      runtime: "実行時エラーが起きているテストがあります。",
      timeout: "実行が終わらないテストがあります（無限ループの可能性があります）。",
      mismatch: "実行はできていますが、結果が期待と違うテストがあります。",
    },
    guidance: {
      syntax: "括弧の対応や、式が途中で終わっていないか確認してみましょう。",
      runtime: "エラーの起きた行で、変数の値がどうなっているか確認してみましょう。",
      timeout: "繰り返しが終わる条件を確認してみましょう。",
    },
    // 例外クラスごとの定型文（LLMなし）。分類名ではなく「何が起きたか」を出す。
    exceptionMessages: {
      NameError: { title: "変数『{name}』が定義されていません", titleNoName: "変数が定義されていません", guidance: "使う前に、その変数へ値を代入しているか確認してみましょう。" },
      IndexError: { title: "リストの範囲外の場所を参照しています", guidance: "リストの長さと、参照している位置（番号）を確認してみましょう。" },
      TypeError: { title: "値の種類が合わず、処理できませんでした", guidance: "その行で使っている値が、期待される種類（数やリストなど）になっているか確認してみましょう。" },
      ZeroDivisionError: { title: "0で割り算をしています", guidance: "割る数が0になっていないか確認してみましょう。" },
      ValueError: { title: "値が処理できる形になっていません", guidance: "その行で渡している値を確認してみましょう。" },
    } as Readonly<Record<string, { title: string; titleNoName?: string; guidance: string }>>,
    notExecuted: "テストはまだ実行されていません",
    notJudged: "テスト結果を判定できませんでした",
    lineNote: "（{line}行目付近）",
  },
  status: {
    loading: "Python実行環境を読み込み中です。", ready: "実行できます。", running: "テストを実行中です（{current}/{total}件目）",
    timeoutNotice: "各テストの実行は最大15秒です。タイムアウト後も残りのテストを続けます。",
    unavailable: "Python実行環境を読み込めませんでした。再読込して試してください。",
    editorLoading: "コードエディタを読み込み中です。",
  },
  controls: { run: "テストを実行する", reload: "実行環境を再読込" },
  result: {
    runsLabel: "テスト実行回数：{count}回", hintLabel: "ヒントレベル{level}：{count}回",
    title: "バブルソートマスター！",
    celebrationHeading: "ミッション達成！",
    celebrationText: "どんな並びでも番号順に並べ替えるコードが完成しました",
    finalButton: "単元の結果を見る",
    closing: "バブルソートのコードを完成させ、基本ケースと境界ケースのすべてのテストを通過しました。この単元の学習は完了です。",
  },
} as const;
