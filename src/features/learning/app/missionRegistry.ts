// 目標ミッションの下書き（2026-11-22 の再設計方針にもとづく）。
// 文言・成功条件はまだ決まっていない。単元画面とミッション提示の下書きで
// Kanato が見て直すための仮の文面で、実装の仕様ではない。
export type UnitMission = {
  courseId: string;
  /** ミッションの題。学習の目的そのもの。 */
  title: string;
  /** どういう課題か。1〜2文。 */
  description: string;
  /** 何をもって達成か。1行。 */
  successCondition: string;
};

export const unitMissions: Record<string, UnitMission> = {
  "course-algorithm-breadth-first-search-v1": {
    courseId: "course-algorithm-breadth-first-search-v1",
    title: "配送ロボットを最短経路で届ける",
    description: "倉庫の中を、荷物を積んだロボットが走る。通る道の本数がいちばん少なくなる行き方で、目的地まで届けよう。",
    successCondition: "通る道の本数が最小のとき達成",
  },
  "course-algorithm-depth-first-search-v1": {
    courseId: "course-algorithm-depth-first-search-v1",
    title: "迷路を抜けて出口にたどり着く",
    description: "分かれ道では、一本の道を奥まで進む。行き止まりなら戻って、別の道を試す。出口までたどり着こう。",
    successCondition: "出口にたどり着いたとき達成",
  },
  "course-algorithm-binary-search-v1": {
    courseId: "course-algorithm-binary-search-v1",
    title: "ほしい商品をいちばん少ない回数で見つける",
    description: "小さい順に並んだ商品の中から、ほしいものを探す。比べる回数をできるだけ少なく見つけよう。",
    successCondition: "範囲を正しく狭めて、目的の商品を見つけたとき達成",
  },
};

export const findUnitMission = (courseId: string): UnitMission | undefined => unitMissions[courseId];

/** ミッション提示の URL（遷移図の想定）。ページ自体は次の下書き。 */
export const missionUrl = (courseId: string) => `/courses/roadmap/${encodeURIComponent(courseId)}/mission`;
/** ミッション挑戦の URL（遷移図の想定）。ページ自体は次の下書き。 */
export const missionPlayUrl = (courseId: string) => `/courses/roadmap/${encodeURIComponent(courseId)}/mission/play`;
