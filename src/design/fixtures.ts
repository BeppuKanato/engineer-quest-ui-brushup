// デザインモード用フィクスチャ。
// 方針：中身のデータ（単元名・実績名・カード名とレアリティ）は本体の seed から写した実データを使い、
// 利用者の状態（進み具合・所持・連続学習日数）だけを「学習の中盤にいる人」の仮状態にする。
// 実データの写しは src/design/data/ にある（本体 develop 2f332c3 の seed から抽出）。

import type { User } from "firebase/auth";
import type { AuthUser, GetMeResponse } from "@/api/auth.api";
import type { HomeResponse, HomeUnit } from "@/api/home.api";

// デザインモード用の仮 Firebase ユーザー。画面側は firebaseUser の uid と
// getIdToken だけを使う。デザインモードでは userSession がこれを渡す。
export const designFirebaseUser = {
  uid: "design-user",
  getIdToken: async () => "design-token",
} as unknown as User;

export const isDesignMode = (): boolean =>
  process.env.NEXT_PUBLIC_DESIGN_MODE === "1";

export const designUser: AuthUser = {
  id: "design-user",
  firebaseUid: "design-user",
  displayName: "サンプル",
  experience: 0,
  knowledgeCardTableNumber: 1,
  selectedProfileAchievementId: null,
  selectedMascotId: "red-panda",
  selectedTargetAchievementId: null,
  hasHexadResponse: true,
};

const unit = (
  partial: Partial<HomeUnit> & Pick<HomeUnit, "id" | "title" | "group">
): HomeUnit => ({
  status: "NOT_STARTED",
  completedPhases: 0,
  totalPhases: 6,
  collectedCards: 0,
  totalCards: 3,
  href: `/courses/roadmap/${partial.id}`,
  resumeHref: `/courses/roadmap/${partial.id}/learn`,
  nextPhase: null,
  ...partial,
});

const bfs = unit({
  id: "course-algorithm-breadth-first-search-v1",
  title: "幅優先探索（BFS）",
  group: "探索",
  status: "COMPLETED",
  completedPhases: 7,
  collectedCards: 3,
});
const dfs = unit({
  id: "course-algorithm-depth-first-search-v1",
  title: "深さ優先探索（DFS）",
  group: "探索",
  status: "COMPLETED",
  completedPhases: 7,
  collectedCards: 3,
});
const binarySearch = unit({
  id: "course-algorithm-binary-search-v1",
  title: "二分探索",
  group: "探索",
  status: "IN_PROGRESS",
  completedPhases: 3,
  collectedCards: 1,
  nextPhase: "動きとコードの対応",
});
const bubbleSort = unit({
  id: "course-algorithm-bubble-sort-v2",
  title: "バブルソート",
  group: "並び替え",
});
const greedy = unit({
  id: "course-algorithm-greedy-coins-v1",
  title: "貪欲法（硬貨問題）",
  group: "最適化",
});
const wallExtension = unit({
  id: "course-algorithm-wall-extension-v1",
  title: "棒倒し法",
  group: "迷路生成",
  status: "IN_PROGRESS",
  completedPhases: 2,
  collectedCards: 1,
  nextPhase: "動きの確認問題",
});
const mazeDigging = unit({
  id: "course-algorithm-maze-digging-v1",
  title: "穴掘り法",
  group: "迷路生成",
});

const units = [bfs, dfs, binarySearch, bubbleSort, greedy, wallExtension, mazeDigging];

export const homeFixture: HomeResponse = {
  overview: {
    completedUnits: 2,
    totalUnits: 7,
    collectedCards: 7,
    totalCards: 21,
    units,
  },
  today: {
    recommended: binarySearch,
    // 実績名・進捗の分母は実データ（実績表50件）から。進捗の分子は仮状態。
    nearAchievements: [
      { id: "ach-unit-count-lv2", title: "単元探求者 Lv.2", progress: 2, goal: 3, href: "/achievements" },
      { id: "ach-unit-exploration-complete", title: "探索系コンプリート", progress: 2, goal: 4, href: "/achievements" },
    ],
    nearCards: [binarySearch],
  },
  resume: {
    ...binarySearch,
    nextStep: "前回、探す値と真ん中を比べて範囲を絞る問題で一度つまずいたね。今日は、その動きがコードのどこに書かれるかを確かめてみよう",
  },
  hasInProgressUnit: true,
  week: {
    streakDays: 4,
    days: [
      { date: "2026-11-16", label: "月", learned: false, isToday: false },
      { date: "2026-11-17", label: "火", learned: true, isToday: false },
      { date: "2026-11-18", label: "水", learned: true, isToday: false },
      { date: "2026-11-19", label: "木", learned: true, isToday: false },
      { date: "2026-11-20", label: "金", learned: true, isToday: true },
      { date: "2026-11-21", label: "土", learned: false, isToday: false },
      { date: "2026-11-22", label: "日", learned: false, isToday: false },
    ],
  },
  // 掲示板の投稿は利用者が書くものなので、ここは仮の文面（初期コンテンツの想定に合わせた典型的なつまずき）。
  questions: [
    { id: "design-post-6", title: "真ん中より大きいのに右半分を探してしまいます", createdAt: "2026-11-20T13:05:00+09:00", href: "/quest-board/design-post-6" },
    { id: "design-post-1", title: "キューから取り出すタイミングが分かりません", createdAt: "2026-11-19T09:12:00+09:00", href: "/quest-board/design-post-1" },
    { id: "design-post-2", title: "二分探索で範囲が1つになっても終わらないのはなぜ？", createdAt: "2026-11-18T16:40:00+09:00", href: "/quest-board/design-post-2" },
    { id: "design-post-3", title: "バブルソートで交換が止まる条件が分かりません", createdAt: "2026-11-18T11:05:00+09:00", href: "/quest-board/design-post-3" },
    { id: "design-post-4", title: "DFSとBFSはどう使い分けるのですか", createdAt: "2026-11-17T15:22:00+09:00", href: "/quest-board/design-post-4" },
    { id: "design-post-5", title: "貪欲法で大きい硬貨から使う理由が知りたいです", createdAt: "2026-11-16T10:48:00+09:00", href: "/quest-board/design-post-5" },
  ],
  user: {
    displayName: "サンプル",
    selectedMascotId: "red-panda",
    completedMissionNum: 0,
    completedAchievementNum: 9,
    todayCompletedMissionCount: 0,
    dailyMissionGoal: 0,
    continuationDays: 4,
    totalDays: 10,
  },
  missions: { resume: null, recommended: null, recommendedList: [] },
  targetAchievement: null,
  calendar: {
    year: 2026,
    month: 11,
    date: 20,
    learnedDays: [2, 4, 6, 9, 11, 13, 16, 17, 19, 20],
    continuationDays: 4,
    totalDays: 10,
    hasLearnedToday: true,
  },
};

const getMeFixture: GetMeResponse = { user: designUser };

// 今日の復習は、二分探索の動きの確認問題から1問（実在する問題キー）。
const dailyReviewFixture = {
  review: {
    id: "design-review-1",
    date: "2026-11-20",
    courseId: "course-algorithm-binary-search-v1",
    phaseKey: "binary-search-check",
    assessmentId: "binary-search-check",
    questionId: "first-center",
    selectedAt: "2026-11-20T05:00:00+09:00",
    answeredAt: null,
    correct: null,
  },
};

// 大目標は、二分探索の単元完了型が進行中の状態。
const bigGoalFixture = {
  goal: {
    id: "design-big-goal-1",
    type: "UNIT_COMPLETION",
    params: { courseId: "course-algorithm-binary-search-v1" },
    displayText: "二分探索を最後まで進める",
    status: "ACTIVE",
    confirmedAt: "2026-11-19T10:00:00+09:00",
    progress: 4 / 7,
    evaluation: {
      outcome: "ONGOING",
      fraction: 4 / 7,
      detail: { completedPhaseCount: 4, totalPhaseCount: 7 },
    },
    evaluatedAt: "2026-11-20T05:00:00+09:00",
    closedAt: null,
    createdAt: "2026-11-19T10:00:00+09:00",
  },
};

// 単元画面の下書き用：学習の進み具合（2026-11-22 の再設計で段階7はミッション挑戦に
// 置き換わるため、進捗の段階は1〜6で数える。段階7のキー自体を進捗に入れない）。
const phase = (phaseKey: string, status: "COMPLETED" | "NOT_STARTED", completedAt: string | null) => ({
  phaseKey,
  status,
  summary: null,
  startedAt: "2026-11-19T10:00:00+09:00",
  completedAt,
});
const binarySearchProgress = {
  courseId: "course-algorithm-binary-search-v1",
  unit: { status: "IN_PROGRESS", lastPhaseKey: "binary-search-check", startedAt: "2026-11-16T10:00:00+09:00", completedAt: null },
  phases: [
    phase("binary-search-motivation", "COMPLETED", "2026-11-16T10:30:00+09:00"),
    phase("binary-search-execution", "COMPLETED", "2026-11-17T10:30:00+09:00"),
    phase("binary-search-check", "COMPLETED", "2026-11-19T10:30:00+09:00"),
    phase("binary-search-code-mapping", "NOT_STARTED", null),
    phase("binary-search-code-check", "NOT_STARTED", null),
    phase("binary-search-consolidation", "NOT_STARTED", null),
  ],
};
const bfsProgress = {
  courseId: "course-algorithm-breadth-first-search-v1",
  unit: { status: "IN_PROGRESS", lastPhaseKey: "bfs-consolidation", startedAt: "2026-11-10T10:00:00+09:00", completedAt: null },
  phases: [
    phase("bfs-motivation", "COMPLETED", "2026-11-10T10:30:00+09:00"),
    phase("bfs-execution", "COMPLETED", "2026-11-11T10:30:00+09:00"),
    phase("bfs-check", "COMPLETED", "2026-11-12T10:30:00+09:00"),
    phase("bfs-code-mapping", "COMPLETED", "2026-11-13T10:30:00+09:00"),
    phase("bfs-code-check", "COMPLETED", "2026-11-14T10:30:00+09:00"),
    phase("bfs-consolidation", "COMPLETED", "2026-11-15T10:30:00+09:00"),
  ],
};
// DFS は「ミッション達成済み」の状態確認用（2026-11-23）：段階6つ完了＋単元COMPLETED。
const dfsProgress = {
  courseId: "course-algorithm-depth-first-search-v1",
  unit: { status: "COMPLETED", lastPhaseKey: "dfs-consolidation", startedAt: "2026-11-03T10:00:00+09:00", completedAt: "2026-11-09T15:00:00+09:00" },
  phases: [
    phase("dfs-motivation", "COMPLETED", "2026-11-03T10:30:00+09:00"),
    phase("dfs-execution", "COMPLETED", "2026-11-04T10:30:00+09:00"),
    phase("dfs-check", "COMPLETED", "2026-11-05T10:30:00+09:00"),
    phase("dfs-code-mapping", "COMPLETED", "2026-11-06T10:30:00+09:00"),
    phase("dfs-code-check", "COMPLETED", "2026-11-07T10:30:00+09:00"),
    phase("dfs-consolidation", "COMPLETED", "2026-11-08T10:30:00+09:00"),
  ],
};

// 未着手（バブルソート）と学習中（棒倒し法）の状態確認用（2026-11-23）。
// 進捗フィクスチャが無い単元は単元画面がエラー表示になるため、明示的に置く。
const bubbleSortProgress = {
  courseId: "course-algorithm-bubble-sort-v2",
  unit: null,
  phases: [],
};
const wallExtensionProgress = {
  courseId: "course-algorithm-wall-extension-v1",
  unit: { status: "IN_PROGRESS", lastPhaseKey: "wall-extension-execution", startedAt: "2026-11-18T10:00:00+09:00", completedAt: null },
  phases: [
    phase("wall-extension-motivation", "COMPLETED", "2026-11-18T10:30:00+09:00"),
    phase("wall-extension-execution", "COMPLETED", "2026-11-19T10:30:00+09:00"),
    phase("wall-extension-check", "NOT_STARTED", null),
    phase("wall-extension-code-mapping", "NOT_STARTED", null),
    phase("wall-extension-code-check", "NOT_STARTED", null),
    phase("wall-extension-consolidation", "NOT_STARTED", null),
  ],
};

// 概念の到達マップの下書き用。ラベルと問題数は本体の concepts.json からの実データで、
// 到達の分子・初回正解率は「学習の中盤にいる人」の仮状態。
const concept = (
  conceptId: string, label: string,
  state: "reached" | "in_progress" | "unconfirmed",
  reachedQuestions: number, totalQuestions: number, answeredQuestions: number,
  firstAttemptCorrect: number, firstAttemptQuestions: number, firstAttemptRate: number | null,
) => ({ conceptId, label, state, reachedQuestions, totalQuestions, answeredQuestions, firstAttemptCorrect, firstAttemptQuestions, firstAttemptRate });
const binarySearchConcepts = {
  courseId: "course-algorithm-binary-search-v1",
  concepts: [
    concept("binary-search:center", "中央位置の決定", "in_progress", 2, 5, 2, 1, 2, 50),
    concept("binary-search:range", "探索範囲の更新", "in_progress", 2, 7, 2, 2, 2, 100),
    concept("binary-search:found", "見つかった場合の終了", "in_progress", 1, 3, 1, 1, 1, 100),
    concept("binary-search:absent", "見つからない場合の終了", "unconfirmed", 0, 2, 0, 0, 0, null),
    concept("binary-search:sorted", "整列済みという前提", "unconfirmed", 0, 1, 0, 0, 0, null),
    concept("binary-search:flow", "コード全体の流れ", "unconfirmed", 0, 1, 0, 0, 0, null),
  ],
};
const bfsConcepts = {
  courseId: "course-algorithm-breadth-first-search-v1",
  concepts: [
    concept("bfs:order", "探索順序", "reached", 2, 2, 2, 2, 2, 100),
    concept("bfs:queue", "キューの操作", "reached", 6, 6, 6, 5, 6, 83),
    concept("bfs:discovered", "発見済みノードの扱い", "reached", 5, 5, 5, 5, 5, 100),
    concept("bfs:distance", "距離の記録と更新", "reached", 5, 5, 5, 4, 5, 80),
    concept("bfs:unreachable", "到達できないノード", "reached", 1, 1, 1, 1, 1, 100),
    concept("bfs:flow", "コード全体の流れ", "reached", 2, 2, 2, 1, 2, 50),
  ],
};
const dfsConcepts = {
  courseId: "course-algorithm-depth-first-search-v1",
  concepts: [
    concept("dfs:order", "探索順序", "reached", 3, 3, 3, 3, 3, 100),
    concept("dfs:stack", "スタックの操作", "reached", 6, 6, 6, 5, 6, 83),
    concept("dfs:visited", "訪問済みの扱い", "reached", 5, 5, 5, 5, 5, 100),
    concept("dfs:backtrack", "行き止まりでの巻き戻し", "reached", 4, 4, 4, 3, 4, 75),
    concept("dfs:unreachable", "到達できないノード", "reached", 2, 2, 2, 2, 2, 100),
    concept("dfs:flow", "コード全体の流れ", "reached", 3, 3, 3, 2, 3, 67),
  ],
};
// 概念は段階3・5・6の問題だけを数えるため、未着手・序盤の単元はすべて未確認になる。
const bubbleSortConcepts = {
  courseId: "course-algorithm-bubble-sort-v2",
  concepts: [
    concept("bubble-sort:compare", "隣同士の比較", "unconfirmed", 0, 3, 0, 0, 0, null),
    concept("bubble-sort:swap", "交換の条件", "unconfirmed", 0, 5, 0, 0, 0, null),
    concept("bubble-sort:pass", "一巡の結果", "unconfirmed", 0, 5, 0, 0, 0, null),
    concept("bubble-sort:finish", "並び替えの終了", "unconfirmed", 0, 3, 0, 0, 0, null),
    concept("bubble-sort:cost", "比べる回数の考え方", "unconfirmed", 0, 2, 0, 0, 0, null),
    concept("bubble-sort:flow", "コード全体の流れ", "unconfirmed", 0, 3, 0, 0, 0, null),
  ],
};
const wallExtensionConcepts = {
  courseId: "course-algorithm-wall-extension-v1",
  concepts: [
    concept("wall-extension:pillar", "柱の役割", "unconfirmed", 0, 3, 0, 0, 0, null),
    concept("wall-extension:rule", "壁を伸ばす規則", "unconfirmed", 0, 6, 0, 0, 0, null),
    concept("wall-extension:direction", "伸ばす方向の決め方", "unconfirmed", 0, 5, 0, 0, 0, null),
    concept("wall-extension:connect", "迷路のつながり", "unconfirmed", 0, 4, 0, 0, 0, null),
    concept("wall-extension:unreachable", "囲まれる場所", "unconfirmed", 0, 2, 0, 0, 0, null),
    concept("wall-extension:flow", "コード全体の流れ", "unconfirmed", 0, 3, 0, 0, 0, null),
  ],
};

const fixtures: Record<string, unknown> = {
  "/auth/me": getMeFixture,
  "/auth/ensure": getMeFixture,
  "/home": homeFixture,
  "/daily-review/today": dailyReviewFixture,
  "/big-goals/current": bigGoalFixture,
  "/learning/units/course-algorithm-binary-search-v1/progress": binarySearchProgress,
  "/learning/units/course-algorithm-breadth-first-search-v1/progress": bfsProgress,
  "/learning/units/course-algorithm-binary-search-v1/concept-progress": binarySearchConcepts,
  "/learning/units/course-algorithm-breadth-first-search-v1/concept-progress": bfsConcepts,
  "/learning/units/course-algorithm-depth-first-search-v1/progress": dfsProgress,
  "/learning/units/course-algorithm-depth-first-search-v1/concept-progress": dfsConcepts,
  "/learning/units/course-algorithm-bubble-sort-v2/progress": bubbleSortProgress,
  "/learning/units/course-algorithm-bubble-sort-v2/concept-progress": bubbleSortConcepts,
  "/learning/units/course-algorithm-wall-extension-v1/progress": wallExtensionProgress,
  "/learning/units/course-algorithm-wall-extension-v1/concept-progress": wallExtensionConcepts,
};

// パスに対応するフィクスチャを返す。無い場合は undefined。
export const resolveFixture = (path: string): unknown => {
  const key = path.split("?")[0];
  return fixtures[key];
};
