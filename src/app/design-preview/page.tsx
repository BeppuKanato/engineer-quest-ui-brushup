"use client";

// デザイン確認専用のページ。本体の画面ではない。
// 実績の解除と知識カードの獲得の演出を、レアリティごとに本物のコンポーネントで再生する。
// レジェンダリーは「色は金、強さはエピックと同じ」で設定済み（2026-11-20、一旦の決定）。

import { Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import type { AwardedCard } from "@/api/learning.api";
import { NewAchievementZone, type AchievementPresentationItem } from "@/components/rewards/AchievementPresentation";
import { cardPresentation, presentationFor } from "@/components/rewards/presentation";
import cardsData from "@/design/data/knowledgeCards.json";
import { MascotSvg, mascotExpressionLabels, type MascotExpression } from "@/design/mascotSvg";
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
  return rarity === "LEGENDARY" ? `${base}（レジェンダリーは色だけ金で、強さはエピックと同じ）` : base;
};

const mascotExpressions = Object.keys(mascotExpressionLabels) as MascotExpression[];
const waitCaptions = ["記録を確認している", "次の一歩を考えている"];

export default function DesignPreviewPage() {
  const [achievementRun, setAchievementRun] = useState<{ rarity: string; runId: number } | null>(null);
  const [cardRun, setCardRun] = useState<{ rarity: string; runId: number } | null>(null);
  const [mascotExpr, setMascotExpr] = useState<MascotExpression>("normal");
  const [reaction, setReaction] = useState<{ level: 1 | 2 | 3; nonce: number } | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [waitStep, setWaitStep] = useState(0);

  useEffect(() => {
    if (!waiting) return;
    setWaitStep(0);
    const timer = setInterval(() => setWaitStep((step) => (step + 1) % waitCaptions.length), 2200);
    return () => clearInterval(timer);
  }, [waiting]);

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
        マスコット（SVG 試作）
      </Typography>
      <Typography sx={{ mb: 2, color: "text.secondary" }}>
        方針（1体・パーツ分け SVG）の試作です。色と特徴は現在の PNG から取り、画風は平たく作り直しました。
        表情はパーツの組み合わせで切り替わります。待機中は、まばたきとしっぽと体の小さな動きが入ります。
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        {mascotExpressions.map((expr) => (
          <Chip
            key={expr}
            label={mascotExpressionLabels[expr]}
            color={!waiting && mascotExpr === expr ? "primary" : "default"}
            variant={!waiting && mascotExpr === expr ? "filled" : "outlined"}
            onClick={() => {
              setWaiting(false);
              setMascotExpr(expr);
            }}
          />
        ))}
      </Box>
      <Stack direction="row" spacing={4} sx={{ alignItems: "flex-start", flexWrap: "wrap", mb: 2 }}>
        <Box
          sx={{
            width: 248,
            height: 248,
            display: "grid",
            placeItems: "center",
            borderRadius: 3,
            bgcolor: "#F6F8FB",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <MascotSvg expression={waiting ? "thinking" : mascotExpr} reaction={reaction} size={232} />
        </Box>
        <Box sx={{ minWidth: 220 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>反応の強さ</Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
            {([1, 2, 3] as const).map((level) => (
              <Button
                key={level}
                variant="outlined"
                onClick={() => {
                  setWaiting(false);
                  setMascotExpr("celebrate");
                  setReaction({ level, nonce: Date.now() });
                }}
              >
                {level === 1 ? "弱（頷く）" : level === 2 ? "中（小さく跳ねる）" : "強（大きく跳ねる）"}
              </Button>
            ))}
          </Box>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>生成待ちの場面</Typography>
          <Button variant={waiting ? "contained" : "outlined"} onClick={() => setWaiting((value) => !value)}>
            {waiting ? "生成待ちを止める" : "生成待ちを再生"}
          </Button>
          {waiting && (
            <Typography sx={{ mt: 1.5, fontSize: 14 }}>
              {waitCaptions[waitStep]}…
            </Typography>
          )}
        </Box>
      </Stack>
      <Typography sx={{ mb: 5, fontSize: 13, color: "text.secondary" }}>
        試作の出どころ：src/design/mascotSvg.tsx。表情の名前は今の7種（通常・嬉しい・応援・考え中・驚き・お祝い・顔だけ）を引き継いでいます。
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
        設定の出どころ：src/components/rewards/presentation.ts（cardPresentation）。
        定義済み：{Object.keys(cardPresentation).join(" / ")}。
      </Typography>
    </Container>
  );
}
