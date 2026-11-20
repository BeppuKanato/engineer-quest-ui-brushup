"use client";

// デザイン確認専用のページ。本体の画面ではない。
// 実績の解除と知識カードの獲得の演出を、レアリティごとに本物のコンポーネントで再生する。
// レジェンダリーは演出の設定がまだ無く、今はコモンの演出に落ちる（presentationFor の既定）。

import { Box, Button, Container, Typography } from "@mui/material";
import { useMemo, useState } from "react";

import type { AwardedCard } from "@/api/learning.api";
import { NewAchievementZone, type AchievementPresentationItem } from "@/components/rewards/AchievementPresentation";
import { cardPresentation, presentationFor } from "@/components/rewards/presentation";
import cardsData from "@/design/data/knowledgeCards.json";
import { LearningRewardsContext } from "@/features/learning/app/LearningRewardsContext";
import { LearningRewardBoundary } from "@/features/learning/rewards/LearningRewardBoundary";

const achievementSamples: Record<string, AchievementPresentationItem> = {
  COMMON: { id: "ach-unit-count-lv1", title: "単元探求者 Lv.1", description: "1個の単元を完了した証です。", rarity: "COMMON" },
  RARE: { id: "ach-streak-3", title: "学習継続 3日", description: "3日連続で学習に取り組んだ証です。", rarity: "RARE" },
  EPIC: { id: "ach-unit-exploration-complete", title: "探索系コンプリート", description: "幅優先探索・深さ優先探索・二分探索・穴掘り法の4単元をすべて完了した証です。", rarity: "EPIC" },
  LEGENDARY: { id: "ach-unit-count-lv3", title: "全単元制覇", description: "7個の単元をすべて完了した証です。", rarity: "LEGENDARY" },
};

const cardById = (id: string): AwardedCard => {
  const card = (cardsData as AwardedCard[]).find((entry) => entry.id === id);
  if (!card) throw new Error(`card not found: ${id}`);
  return card;
};

// BFS の実カードが、ちょうど3レアリティそろっている。
const cardSamples: Record<string, AwardedCard> = {
  COMMON: cardById("knowledge-card-bfs-deque"),
  RARE: cardById("knowledge-card-bfs-shortest-path"),
  EPIC: cardById("knowledge-card-bfs-bidirectional"),
};

const rarityLabels: Record<string, string> = {
  COMMON: "コモン",
  RARE: "レア",
  EPIC: "エピック",
  LEGENDARY: "レジェンダリー",
};

const specText = (rarity: string): string => {
  const spec = presentationFor(rarity);
  const base = `前振り ${spec.durations[0]}ms ／ 開示 ${spec.durations[1]}ms ／ 賞賛 ${spec.durations[2]}ms、放射 ${spec.rays} 本、グロー ${spec.glow}px、回転 ${spec.turns} 回`;
  return rarity === "LEGENDARY" ? `${base}（レジェンダリーの設定はまだ無く、コモンの演出で表示中）` : base;
};

export default function DesignPreviewPage() {
  const [achievementRun, setAchievementRun] = useState<{ rarity: string; runId: number } | null>(null);
  const [cardRun, setCardRun] = useState<{ rarity: string; runId: number } | null>(null);

  const rewardsValue = useMemo(
    () => ({
      rewards: {
        awardedCards: cardRun
          ? [{ phaseKey: "phase-3", card: cardSamples[cardRun.rarity] }]
          : [],
        unlockedAchievements: [],
      },
      dismissAwardedCard: () => setCardRun(null),
    }),
    [cardRun]
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography component="h1" sx={{ fontSize: 24, fontWeight: 800, mb: 1 }}>
        演出プレビュー
      </Typography>
      <Typography sx={{ mb: 4, color: "text.secondary" }}>
        デザイン確認専用のページです。実績の解除と知識カードの獲得の演出を、レアリティごとに本物の部品で再生します。
      </Typography>

      <Typography component="h2" sx={{ fontSize: 20, fontWeight: 800, mb: 1 }}>
        実績の解除
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        {Object.keys(achievementSamples).map((rarity) => (
          <Button
            key={rarity}
            variant={achievementRun?.rarity === rarity ? "contained" : "outlined"}
            onClick={() => setAchievementRun({ rarity, runId: Date.now() })}
          >
            {rarityLabels[rarity]}を再生
          </Button>
        ))}
      </Box>
      <Box sx={{ minHeight: 150, display: "grid", alignItems: "start", mb: 1 }}>
        {achievementRun && (
          <NewAchievementZone
            key={achievementRun.runId}
            items={[achievementSamples[achievementRun.rarity]]}
          />
        )}
      </Box>
      {achievementRun && (
        <Typography sx={{ mb: 5, fontSize: 13, color: "text.secondary" }}>
          現在の設定：{specText(achievementRun.rarity)}
        </Typography>
      )}

      <Typography component="h2" sx={{ fontSize: 20, fontWeight: 800, mb: 1 }}>
        知識カードの獲得
      </Typography>
      <Typography sx={{ mb: 2, color: "text.secondary" }}>
        本物と同じく、カードはクリックで開きます。レジェンダリーのカードはありません（カードはエピックまで）。
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        {Object.keys(cardSamples).map((rarity) => (
          <Button
            key={rarity}
            variant={cardRun?.rarity === rarity ? "contained" : "outlined"}
            onClick={() => setCardRun({ rarity, runId: Date.now() })}
          >
            {rarityLabels[rarity]}を再生
          </Button>
        ))}
      </Box>
      {cardRun && (
        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
          現在の設定：{specText(cardRun.rarity)}
        </Typography>
      )}
      {cardRun && (
        <LearningRewardsContext.Provider value={rewardsValue}>
          <LearningRewardBoundary
            key={cardRun.runId}
            boundary={{ phaseKey: "phase-3" }}
            onDone={() => setCardRun(null)}
          />
        </LearningRewardsContext.Provider>
      )}

      <Typography sx={{ mt: 6, fontSize: 13, color: "text.secondary" }}>
        設定の出どころ：src/components/rewards/presentation.ts（cardPresentation）。レジェンダリーの行はまだ無く、{" "}
        {`presentationFor は不明なレアリティをコモンに落とす`}。
        参考：{Object.keys(cardPresentation).join(" / ")} の3段階が定義済み。
      </Typography>
    </Container>
  );
}
