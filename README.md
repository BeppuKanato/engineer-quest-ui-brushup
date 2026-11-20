# engineer-quest-ui-brushup

Engineer Quest の UI 調整（ブラッシュアップ）専用の作業場。本体 `BeppuKanato/engineer-quest` の front の写しで、ここで画面の見せ方を試し、決まったデザインを本体へ Issue 経由で移植する。

## コピー元

- リポジトリ：BeppuKanato/engineer-quest、ブランチ develop
- コミット：2f332c307e5ff00f7a81c4e219fdf862ef2d87b1（2026-11-20）
- 写した日：2026-11-20
- 除外したもの：Dockerfile / Dockerfile.dev / cloudbuild.yaml / .dockerignore（デプロイ系）

この写しは本体と自動では同期しない。本体の front が進んだら、必要に応じて写し直す。

## 動かし方

```bash
npm install
npm run dev   # http://localhost:3000
```

デザインモードが常時オン（`.env` の `NEXT_PUBLIC_DESIGN_MODE=1`）なので、ログインなしで画面が開く。データは `src/design/fixtures.ts` のフィクスチャで描かれ、実績・カード・単元の中身は実データ（`src/design/data/`）、利用者の状態だけが仮。

- ページの棚卸しと進め方：`docs/design-inventory.md`
- 演出の確認：`/design-preview` で、実績解除とカード獲得の演出をレアリティごとに再生できる（デザイン確認専用ページ）
- フィクスチャが無い画面は「フィクスチャはまだ用意されていません」と出る。その画面をデザインする時に足す

## 注意

- 画面は本物の API を呼びに行く作りのままなので、データが必要な画面はそのままでは中身が出ない。デザイン作業では、画面ごとにモックデータを足して使う
- 教材データなど front の中にあるもので描ける画面もある
- ここでの変更を本体へ直接持ち込まない。承認された画面ごとに、本体側で実装 Issue を切って移植する
