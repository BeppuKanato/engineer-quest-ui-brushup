// デザインモード用フィクスチャ。
// 方針：中身のデータ（単元名・実績名・カード名とレアリティ）は本体の seed から写した実データを使い、
// 利用者の状態（進み具合・所持・連続学習日数）だけを「学習の中盤にいる人」の仮状態にする。
// 実データの写しは src/design/data/ にある（本体 develop 2f332c3 の seed から抽出）。

import type { User } from "firebase/auth";
import type { AuthUser, GetMeResponse } from "@/api/auth.api";
import type { HomeResponse, HomeUnit } from "@/api/home.api";
import achievementsData from "./data/achievements.json";

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

// 実績の仮状態：BFS・DFSの単元実績（各3件）と全体実績3件が達成済み（合計9件、ペルソナと一致）。
const designAchievedIds = new Set([
  "ach-unit-bfs-complete", "ach-phase-bfs-implementation-clear", "ach-phase-bfs-implementation-nohint",
  "ach-unit-dfs-complete", "ach-phase-dfs-implementation-clear", "ach-phase-dfs-implementation-nohint",
  "ach-unit-count-lv1", "ach-knowledge-lv1", "ach-streak-3",
]);
const achievementsFixture = {
  groups: [{
    category: "ALL",
    label: "すべて",
    achievements: (achievementsData as { id: string; title: string; description: string; category: string; conditionType: string; conditionValue: number | null; conditionUnitIds?: string[]; rarity: string; iconKey: string; isSecret: boolean; courseId?: string }[]).map(a => {
      const achieved = designAchievedIds.has(a.id);
      // 系コンプリート（UNIT_GROUP_COMPLETE）は conditionValue を持たず、分母は対象単元数。
      const goal = a.conditionValue ?? a.conditionUnitIds?.length ?? 1;
      // ペルソナの部分進捗（ホームの仮状態と一致させる）：ストリーク4日、完了2単元、カード7枚、探索系2/4。
      const partialProgress: Record<string, number> = {
        "ach-streak-7": 4, "ach-unit-count-lv2": 2, "ach-unit-count-lv3": 2,
        "ach-knowledge-lv2": 7, "ach-unit-exploration-complete": 2,
      };
      return {
        id: a.id,
        category: a.category,
        conditionType: a.conditionType,
        conditionValue: a.conditionValue,
        courseId: a.courseId ?? null,
        seriesKey: "",
        seriesTitle: "",
        level: 1,
        status: achieved ? "achieved" : a.isSecret ? "secret_locked" : "visible_locked",
        title: a.title,
        description: a.description,
        conditionLabel: null,
        goal,
        progress: achieved ? goal : (partialProgress[a.id] ?? 0),
        href: "/achievements",
        actionLabel: "",
        achievedAt: achieved ? "2026-11-20T00:00:00+09:00" : null,
        rarity: a.rarity,
        iconKey: a.iconKey,
        isProfileSelected: false,
      };
    }),
  }],
  targetAchievementId: null,
  profileAchievementId: null,
};

const fixtures: Record<string, unknown> = {
  "/achievements": achievementsFixture,
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

type AchievementMaster = { id: string; title: string; description: string; category: string; conditionType: string; conditionValue?: number | null; rarity: string; iconKey: string; courseId?: string; phaseKey?: string };

/** 完了保存で解除される実績をマスタ（achievements.json）から組み立てる。
 * phaseKey を渡すとそのフェーズの実績（自分で実装クリア／ノーヒントクリア）、
 * null なら単元完了の実績を返す。単元完了時は、完了単元数の段位もあわせて返す
 * （ペルソナは BFS・DFS 完了済みなので、この単元で 3 単元目 = Lv.2 が届く。
 * ホームの「次の実績」が Lv.2 を progress 2/3 で出している前提と一致する）。
 * 該当が無ければ空。 */
function designUnlockedAchievements(courseId: string, phaseKey: string | null) {
  const masters = achievementsData as AchievementMaster[];
  const priorUnitCompletes = masters.filter(a => a.conditionType === "UNIT_COMPLETE" && designAchievedIds.has(a.id)).length;
  return masters
    .filter(a => phaseKey === null
      ? (a.courseId === courseId && a.conditionType === "UNIT_COMPLETE")
        || (a.conditionType === "UNIT_COMPLETED_COUNT" && a.conditionValue === priorUnitCompletes + 1)
      : a.courseId === courseId && a.phaseKey === phaseKey && (a.conditionType === "PHASE_COMPLETED" || a.conditionType === "PHASE_NO_HINT_COMPLETE"))
    .map(a => ({
      id: a.id, title: a.title, description: a.description,
      category: a.category, categoryLabel: a.category,
      rarity: a.rarity, iconKey: a.iconKey,
      achievedAt: "2026-11-24T16:55:00+09:00",
    }));
}

// パスに対応するフィクスチャを返す。無い場合は undefined。
export const resolveFixture = (path: string): unknown => {
  const key = path.split("?")[0];
  // フェーズ完了・単元完了の POST は動的パスなのでパターンで受ける。
  // 最小の正常応答を返し、デザインモードでもフェーズ遷移を通せるようにする
  // （報酬・実績の付与は行わない。遷移と画面の確認が目的）。
  const phaseComplete = key.match(/^\/learning\/units\/([^/]+)\/phases\/([^/]+)\/complete$/);
  if (phaseComplete) {
    const courseId = decodeURIComponent(phaseComplete[1]);
    const phaseKey = decodeURIComponent(phaseComplete[2]);
    return {
      courseId,
      phase: { phaseKey, status: "COMPLETED" },
      awardedCard: null,
      // 最終フェーズ（自分で実装）の保存では、実績マスタにある該当実績を解除済みとして返す。
      // これがないと最終リザルトの「新しい実績」ゾーンが常に空になり、目視確認できない
      // （2026-11-24）。歩行ケースはヒント未使用のため、ノーヒントも含める。
      unlockedAchievements: designUnlockedAchievements(courseId, phaseKey),
      achievedBigGoals: [],
    };
  }
  const unitComplete = key.match(/^\/learning\/units\/([^/]+)\/complete$/);
  if (unitComplete) {
    const courseId = decodeURIComponent(unitComplete[1]);
    return {
      courseId,
      unit: { status: "COMPLETED" },
      unlockedAchievements: designUnlockedAchievements(courseId, null),
      achievedBigGoals: [],
    };
  }
  // フィードバック画面の仮データ（2026-11-23）: 文面ありの状態をデザイン確認できるようにする。
  if (key.startsWith("/feedback-v1/phase/") || key.startsWith("/feedback-v1/unit/")) return designFeedbackResult(key);
  return fixtures[key];
};

/**
 * フィードバックの仮データ。内容はバブルソート フェーズ3（動きの確認）直後の想定で、
 * 概念スナップショットの根拠は実際に歩いた記録（1問目だけ初回誤答→見直して正解、
 * 他は初回正解）に合わせている。大目標は再設計で廃止済みのため goalSnapshot は null。
 */
function designFeedbackResult(key: string) {
  // 単元フィードバック用の文面。想定する記録は、実際に歩けるケース
  // （確認3段階で各1問だけ初回誤答→見直して正解＝初回18/21問、実装はテスト1回で通過）。
  if (key.startsWith("/feedback-v1/unit/")) {
    const actionHref = "/courses";
    const nextStep = "コース一覧から次の単元を選び、動きの確認から始める";
    const reason = "バブルソートの学び方は次の単元でも同じ形で使えます。";
    return {
      id: "design-feedback-unit", status: "COMPLETED", goalSnapshot: null,
      conceptSnapshot: null,
      feedback: {
        praise: "動きの確認・コードの確認・応用問題の3つで、取り違えたところをその場で見直して直すやり方が続き、最後は自分の手でコードを完成させました。つまずきを立て直すやり方が、単元を通して身についたのが、今回いちばんの収穫です。",
        praiseHeadline: "見直して直すやり方が、単元を通して身についた！",
        strength: "確認問題の初回正解は21問中18問。比べるペアの進み方、コードの各行の意味、交換が起きる場面の判断がそろっています。実装も、テスト1回で通過しました。",
        strengthHeadline: "動き・コード・応用の判断が、初回でそろっている",
        improvement: "3つの確認で取り違えたのは、どれも初めて見る場面での位置の判断でした。新しい場面では、まず1周終わった時点の並びを確かめてから次を追うと、取り違えが減ります。",
        improvementHeadline: "新しい場面では、まず途中の状態を確かめる",
        nextGoal: "次の単元でも、動きから考える習慣を続ける",
        nextStep, reason, actionLabel: "コース一覧で次の単元を選ぶ", actionHref,
        recommendations: [{ candidateId: "candidate-1", nextStep, reason, actionLabel: "コース一覧で次の単元を選ぶ", actionHref }],
      },
    };
  }
  // イベントIDは {courseId}:{phaseKey}:{nextPhaseKey} の形で、次フェーズの
  // キーも含む。フェーズの判定は自フェーズの区切り位置で行うこと
  // （素朴な includes だと次フェーズ名に誤マッチする）。
  const normKey = key.replaceAll("%3A", ":");
  // フェーズ6（応用問題）用の文面。想定する記録は、実際に歩けるケース
  // （1問目＝新しい配列での入れ替えペアを初回誤答→見直して正解、他は初回正解）。
  if (normKey.includes(":bubble-sort-consolidation:")) {
    const actionHref = "/courses/roadmap/course-algorithm-bubble-sort-v2/learn?phase=bubble-sort-implementation";
    const nextStep = "自分で実装に進み、バブルソートを自分の手で完成させる";
    const reason = "動き・コード・応用までの理解がそろったので、最後は自分の手でコードを組み立てて確かめます。";
    return {
      id: "design-feedback-6", status: "COMPLETED", goalSnapshot: null,
      conceptSnapshot: null,
      feedback: {
        praise: "初めて見る配列で、2周目に最初に入れ替えが起きるペアを一度取り違えたあと、周の進み方を追い直して正しく直せました。習った動きを新しい場面に当てはめられたのが、今回いちばんの収穫です。",
        praiseHeadline: "新しい配列でも、2周目の入れ替えを見つけて直せた！",
        strength: "最初から並んでいる配列・逆向きの配列・同じ値のペアという、交換が起きるかどうかが分かれる場面を、すべて初回で正しく判断できています。コード全体の並びも、流れの順に組み立てられました。",
        strengthHeadline: "交換の起きない場面の判断は、初回でそろっている",
        improvement: "2周目の入れ替えの位置は、初回では取り違えました。新しい配列では、1周終わった時点の並びを先に確定させてから次を追うと、取り違えが減ります。次の実装でも、途中の状態を確かめながら進めてみましょう。",
        improvementHeadline: "新しい配列では、周ごとの状態を書き出してから答える",
        nextGoal: "仕組みの理解を、自分のコードで再現する",
        nextStep, reason, actionLabel: "自分で実装へ進む", actionHref,
        recommendations: [{ candidateId: "candidate-1", nextStep, reason, actionLabel: "自分で実装へ進む", actionHref }],
      },
    };
  }
  // フェーズ5（コードの確認）用の文面。想定する記録は、実際に歩ける
  // ケース（1問目コピーの行を初回誤答→見直して正解、他は初回正解）。
  if (normKey.includes(":bubble-sort-code-check:")) {
    const actionHref = "/courses/roadmap/course-algorithm-bubble-sort-v2/learn?phase=bubble-sort-consolidation";
    const nextStep = "応用問題で、コード全体の動きを自分で組み立てる";
    const reason = "行ごとの意味は確認できたので、次は断片ではなく全体の動きとしてコードを扱うと、実装の土台になります。";
    return {
      id: "design-feedback-5", status: "COMPLETED", goalSnapshot: null,
      conceptSnapshot: null,
      feedback: {
        praise: "最初の問題で、元のリストをそのまま使う案を一度選んだあと、その行の目的（元のリストを変えずに並び替えること）に立ち返って、コピーを作る書き方に直せました。形ではなく意味から考え直せたのが、今回いちばんの収穫です。",
        praiseHeadline: "コピーの行を取り違えても、意味から考え直して直せた！",
        strength: "周の回数と比べる範囲の決め方、比べる相手の指定、入れ替えの代入、返す値は、すべて初回で正しく選べています。図で見た動きが、コードの形に結びついています。",
        strengthHeadline: "ループの範囲と入れ替えの書き方は初回で押さえている",
        improvement: "コピーを作る行では、初回は元の変数をそのまま選んでいました。行の目的を先に言葉にすると、候補を絞れます。次の応用問題でも、行の目的から考える順番を意識してみましょう。",
        improvementHeadline: "式を選ぶときは、その行の目的から逆算する",
        nextGoal: "コードの断片ではなく、動き全体を自分で組み立てる",
        nextStep, reason, actionLabel: "応用問題へ進む", actionHref,
        recommendations: [{ candidateId: "candidate-1", nextStep, reason, actionLabel: "応用問題へ進む", actionHref }],
      },
    };
  }
  const ev = (questionId: string, questionLabel: string, firstCorrect: boolean, retried: boolean) => ({
    phaseKey: "bubble-sort-check", assessmentId: "bubble-sort-check", questionId,
    tags: [] as string[], stageLabel: "動きの確認問題", questionLabel,
    first: { sourceId: "design", sessionId: "design-session", number: 1, correct: firstCorrect },
    latest: { sourceId: "design", sessionId: "design-session", number: retried ? 2 : 1, correct: true },
    retried, sessions: 1,
  });
  const concept = (conceptId: string, label: string, evidence: ReturnType<typeof ev>[]) => ({
    conceptId, label, kind: "assessment", state: "confirmed" as const,
    attemptedQuestions: evidence.length, totalQuestions: evidence.length, implementation: null, evidence,
  });
  const actionHref = "/courses/roadmap/course-algorithm-bubble-sort-v2/learn?phase=bubble-sort-code-mapping";
  const nextStep = "動きとコードの対応を見て、比較と交換がコードのどの行で書かれているか確かめる";
  const reason = "動きの理解は確認できたので、次はその動きがコードでどう表されるかをつなげると、コードを読む土台になります。";
  return {
    id: "design-feedback-1", status: "COMPLETED", goalSnapshot: null,
    conceptSnapshot: {
      id: "design-concept-snapshot", version: 1, courseId: "course-algorithm-bubble-sort-v2",
      title: "バブルソート", relation: "unit-components",
      concepts: [
        concept("design-c1", "ペアの比較と交換", [
          ev("bubble-sort-check-q-next-pair", "次に比べるペア", false, true),
          ev("bubble-sort-check-q-larger-destination", "大きい値の行き先", true, false),
          ev("bubble-sort-check-q-larger-stays", "交換しない場合", true, false),
        ]),
        concept("design-c2", "周の終わりと次の周", [
          ev("bubble-sort-check-q-fixed-at-pass-end", "右端の確定", true, false),
          ev("bubble-sort-check-q-pass-two-first-pair", "2周目の最初のペア", true, false),
        ]),
        concept("design-c3", "比べる範囲の縮小", [
          ev("bubble-sort-check-q-pass-two-pair-count", "2周目のペアの数", true, false),
        ]),
        concept("design-c4", "並び替えの終了", [
          ev("bubble-sort-check-q-why-finished", "終わる理由", true, false),
        ]),
      ],
    },
    feedback: {
      praise: "最初の問題で次のペアの位置を一度取り違えたあと、動きを見直して、自分の力で正しく直せました。つまずいたところを自分で立て直せたのが、今回いちばんの収穫です。",
      praiseHeadline: "次のペアの位置を取り違えても、自分で直せた！",
      strength: "比べるペアの進み方と、大きい値の行き先は追えています。周の終わりに右端のマスが確定することと、比べる範囲が狭くなって並び替えが終わることも、初回で正しく判断できています。",
      strengthHeadline: "ペアの進み方と、大きい値の行き先は追えている",
      improvement: "次のペアの位置は、初回では取り違えました。比べ終わった直後に、視線をどちらのマスへ移すかが決め手です。次の段階でも、比べた直後の動きを意識してみましょう。",
      improvementHeadline: "比べ終わった直後、視線を移す先が決め手",
      nextGoal: "図で見た動きを、コードの行に対応づける",
      nextStep, reason, actionLabel: "動きとコードの対応へ進む", actionHref,
      recommendations: [{ candidateId: "candidate-1", nextStep, reason, actionLabel: "動きとコードの対応へ進む", actionHref }],
    },
  };
}
