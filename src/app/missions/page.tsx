"use client";

import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { developmentMissions, scoreTiers, defaultTierId } from "@/design/developmentMissions";
import FlagIcon from "@mui/icons-material/Flag";
import LockIcon from "@mui/icons-material/Lock";
import { Box, Button, Chip, Container, Paper, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

// 発展ミッション一覧の下書き（2026-11-25、Issue #507）。
// 課題を先に示し、解法は指定しない。解放条件・目標ティア・自己ベストをカードに載せる。
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
          {developmentMissions.map((mission) => {
            const tier = scoreTiers.find((t) => t.id === defaultTierId);
            return (
              <Paper key={mission.id} elevation={0} sx={{ p: 3, border: "1px solid #dbe3ef", borderRadius: 3, display: "flex", flexDirection: "column" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  {mission.unlocked
                    ? <Chip size="small" label="挑戦できる" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 700 }} />
                    : <Chip size="small" icon={<LockIcon sx={{ fontSize: 14 }} />} label={`${mission.unlockUnitName}を終えると解放`} sx={{ bgcolor: "#eef2f7", fontWeight: 700 }} />}
                  <Chip size="small" variant="outlined" label={`解放条件：${mission.unlockUnitName}の単元完了`} />
                </Box>
                <Typography component="p" sx={{ fontSize: 18, fontWeight: 900 }}>{mission.title}</Typography>
                <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.8, mt: 0.75 }}>{mission.problem}</Typography>
                <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", mt: 1.75 }}>
                  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 14 }}>
                    <FlagIcon sx={{ fontSize: 16, color: "#d97706" }} />目標：{tier?.label}（{tier?.rank}ランク・{tier?.points}点）
                  </Box>
                  <Box component="span" sx={{ fontSize: 14 }}>
                    自己ベスト：{mission.selfBest ? `${mission.selfBest.points}点・${mission.selfBest.rank}ランク` : "まだ記録なし"}
                  </Box>
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
              </Paper>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
