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
  "course-algorithm-maze-digging-v1": {
    courseId: "course-algorithm-maze-digging-v1",
    title: "壁を掘って、つながる迷路を作る",
    description: "壁の塊から通路を掘り進める。行き止まりになったら戻って、別の場所を掘ろう。",
    successCondition: "全部のマスが通路でつながったとき達成",
  },
  "course-algorithm-wall-extension-v1": {
    courseId: "course-algorithm-wall-extension-v1",
    title: "柱から壁を伸ばして迷路を作る",
    description: "等間隔に立てた柱から、決まった規則で壁を伸ばす。規則どおりに伸ばして、迷路を完成させよう。",
    successCondition: "すべての柱から壁を伸ばし終えたとき達成",
  },
  "course-algorithm-bubble-sort-v2": {
    courseId: "course-algorithm-bubble-sort-v2",
    title: "本を番号順に並べ替える",
    description: "バラバラに並んだ本を、隣同士を比べて入れ替えながら、小さい順に並べ替えよう。",
    successCondition: "全部の本が番号順に並んだとき達成",
  },
  "course-algorithm-greedy-coins-v1": {
    courseId: "course-algorithm-greedy-coins-v1",
    title: "お釣りを硬貨の枚数最小で払う",
    description: "金額に合わせて、そのつど使える一番大きい硬貨を選ぶ。硬貨の合計枚数をいちばん少なく払おう。",
    successCondition: "硬貨の合計枚数が最小のとき達成",
  },
};

export const findUnitMission = (courseId: string): UnitMission | undefined => unitMissions[courseId];

// 発展ミッションとの接続の下書き（2026-11-23）：単元画面の波マップのゴールの先に、
// この単元で挑戦できるようになる発展ミッションをノードとして付ける。
// 題は旧「作る」クエストの流用。状態はダミーの学習状況に合わせた仮置き。
export type DevelopmentMissionLink = {
  title: string;
  /** ノードの下に出す状態（挑戦できる／この単元を終えると挑戦できる、など）。 */
  status: string;
  ready: boolean;
};

export const developmentLinks: Record<string, DevelopmentMissionLink[]> = {
  "course-algorithm-breadth-first-search-v1": [
    { title: "ダンジョンの最短脱出", status: "挑戦できる", ready: true },
    { title: "ゲームのスキルツリー", status: "挑戦できる", ready: true },
  ],
  "course-algorithm-depth-first-search-v1": [
    { title: "ダンジョンの最短脱出", status: "挑戦できる", ready: true },
    { title: "ゲームのスキルツリー", status: "挑戦できる", ready: true },
  ],
  "course-algorithm-binary-search-v1": [
    { title: "ショップの商品検索", status: "この単元を終えると挑戦できる", ready: false },
    { title: "ダンジョンの最短脱出", status: "挑戦できる", ready: true },
  ],
};

export const findDevelopmentLinks = (courseId: string): DevelopmentMissionLink[] => developmentLinks[courseId] ?? [];

/** ミッション提示の URL（遷移図の想定）。ページ自体は次の下書き。 */
export const missionUrl = (courseId: string) => `/courses/roadmap/${encodeURIComponent(courseId)}/mission`;
/** ミッション挑戦の URL（遷移図の想定）。ページ自体は次の下書き。 */
export const missionPlayUrl = (courseId: string) => `/courses/roadmap/${encodeURIComponent(courseId)}/mission/play`;
