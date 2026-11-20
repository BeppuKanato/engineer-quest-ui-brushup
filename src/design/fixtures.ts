// デザインモード用フィクスチャ。
// 方針：中身のデータ（単元名・実績名・カード名とレアリティ）は本体の seed から写した実データを使い、
// 利用者の状態（進み具合・所持・連続学習日数）だけを「学習の中盤にいる人」の仮状態にする。
// 実データの写しは src/design/data/ にある（本体 develop 2f332c3 の seed から抽出）。

import type { AuthUser, GetMeResponse } from "@/api/auth.api";
import type { HomeResponse, HomeUnit } from "@/api/home.api";

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
  totalPhases: 7,
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
  completedPhases: 4,
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
    nextStep: "中央の要素と探す値を比べる動きを、コードに写すところから始めよう",
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
    { id: "design-post-1", title: "キューから取り出すタイミングが分かりません", createdAt: "2026-11-19T09:12:00+09:00", href: "/quest-board/design-post-1" },
    { id: "design-post-2", title: "二分探索で範囲が1つになっても終わらないのはなぜ？", createdAt: "2026-11-18T16:40:00+09:00", href: "/quest-board/design-post-2" },
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

const fixtures: Record<string, unknown> = {
  "/auth/me": getMeFixture,
  "/auth/ensure": getMeFixture,
  "/home": homeFixture,
  "/daily-review/today": dailyReviewFixture,
  "/big-goals/current": bigGoalFixture,
};

// パスに対応するフィクスチャを返す。無い場合は undefined。
export const resolveFixture = (path: string): unknown => {
  const key = path.split("?")[0];
  return fixtures[key];
};
