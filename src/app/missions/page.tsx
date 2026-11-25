"use client";

import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { developmentMissionThumbnailFor } from "@/design/DevelopmentMissionThumbnail";
import { RankMedal } from "@/design/RankMedal";
import { developmentMissions } from "@/design/developmentMissions";
import LockIcon from "@mui/icons-material/Lock";
import { Box, Button, Chip, Container, Paper, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

// 発展ミッション一覧の下書き（2026-11-25、Issue #507）。
// 課題の場面イラストを主役にし、解法は指定しない。解放条件と自己ベスト（メダル付き）を載せる。
export default function MissionsPage() {
  const router = useRouter();
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1440, pt: { xs: 3, md: 4 } }}>
        <AppBreadcrumbs items={[{ label: "発展ミッション" }]} />
      </Container>
      <Container maxWidth="lg" sx={{ pt: 3, pb: 6 }}>
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900 }}>発展ミッション</Typography>
        <Typography component="p" sx={{ fontSize: 16, mt: 0.75, mb: 3 }}>
          学んだアルゴリズムを、別の課題で使う挑戦です。解き方は決まっていません。正しい解き方ならクリアでき、良い解き方ほどスコアが上がります。
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2.5 }}>
          {developmentMissions.map((mission) => (
            <Paper key={mission.id} elevation={0} sx={{ border: "1px solid #dbe3ef", borderRadius: 3, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <Box sx={{ height: 168, flexShrink: 0 }}>{developmentMissionThumbnailFor(mission.id)}</Box>
              <Box sx={{ p: 3, pt: 2.25, display: "flex", flexDirection: "column", flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  {mission.unlocked
                    ? <Chip size="small" label="挑戦できる" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 700 }} />
                    : <Chip size="small" icon={<LockIcon sx={{ fontSize: 14 }} />} label={`${mission.unlockUnitName}を終えると解放`} sx={{ bgcolor: "#eef2f7", fontWeight: 700 }} />}
                  <Chip size="small" variant="outlined" label={`解放条件：${mission.unlockUnitName}の単元完了`} />
                </Box>
                <Typography component="p" sx={{ fontSize: 18, fontWeight: 900 }}>{mission.title}</Typography>
                <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.8, mt: 0.75 }}>{mission.problem}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.75 }}>
                  {mission.selfBest ? (
                    <>
                      <RankMedal rank={mission.selfBest.rank} size={28} />
                      <Typography component="p" sx={{ fontSize: 15 }}>自己ベスト：{mission.selfBest.points}点</Typography>
                    </>
                  ) : (
                    <Typography component="p" sx={{ fontSize: 15 }}>自己ベスト：まだ記録なし</Typography>
                  )}
                </Box>
                <Box sx={{ flex: 1 }} />
                <Button
                  variant="contained"
                  disabled={!mission.unlocked}
                  onClick={() => router.push(`/missions/${mission.id}`)}
                  sx={{ mt: 2.5, minHeight: 48, alignSelf: "flex-start", px: 3, fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
                >
                  {mission.unlocked ? "挑戦する →" : `${mission.unlockUnitName}を終えると挑戦できる`}
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
