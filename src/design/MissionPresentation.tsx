"use client";
/**
 * 単元ミッションの提示（2026-11-23 決定の形）。
 * 別URLの画面にしない：段階1の初回開始時に、/learn の殻（単元名＋段階チップ）の中で開く
 * 「状態」として出す。ブリッジ画面・フィードバック画面と同じ流儀。
 * 役割は「学習の前に課題を受け取る」最初の印象だけ。条件などの細部は単元画面の帯に
 * 常時あるので、ここでは場面・題・達成条件・始めるボタンに絞る。
 * ミッションはこの後も帯と最終チャレンジのノードで繰り返し出るので、
 * 1回の露出に理解を依存させない。
 */
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FlagIcon from "@mui/icons-material/Flag";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { Fragment } from "react";
import type { UnitMission } from "@/features/learning/app/missionRegistry";
import type { LearningUnit } from "@/features/learning/app/unitRegistry";
import { playerTokens } from "@/features/learning/player/player.tokens";
import { GoalFlag } from "./GoalFlag";
import { missionThumbnailFor } from "./MissionThumbnail";

const presentedCourses = new Set<string>();
export const hasPresentedMission = (courseId: string) => presentedCourses.has(courseId);
export const markMissionPresented = (courseId: string) => { presentedCourses.add(courseId); };

export function MissionPresentation({ unit, mission, onStart }: {
  unit: LearningUnit;
  mission: UnitMission;
  onStart: () => void;
}) {
  const reduced = useReducedMotion();
  const Scene = missionThumbnailFor(unit.courseId);
  return (
    <Box sx={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", bgcolor: playerTokens.background, color: playerTokens.text }}>
      {/* プレイヤーと同じヘッダー（単元名＋段階チップ）。操作はさせない、文脈を示すためのもの。
          段階1が現在地＝「学習の冒頭にいる」ことが見た目で分かる。 */}
      <Box component="header" sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 1.5, px: { xs: 1, sm: 2 }, py: 1, borderBottom: `1px solid ${playerTokens.layers.layer1}` }}>
        <Typography component="h1" sx={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>{unit.title}</Typography>
        <Box aria-hidden sx={{ display: "flex", alignItems: "center", gap: 0.5, overflowX: "auto", flex: 1, py: 0.25 }}>
          {unit.phases.map((phase, index) => {
            const isFinal = phase.transitionOut === "final";
            const current = index === 0;
            return (
              <Fragment key={phase.id}>
                {index > 0 && <ArrowForwardIcon sx={{ fontSize: 14, flexShrink: 0, color: playerTokens.states.completed.stroke }} />}
                <Box sx={{
                  display: "inline-flex", alignItems: "center", gap: 0.5, minHeight: 36, px: 1.25, whiteSpace: "nowrap", fontSize: 13.5, borderRadius: 999,
                  color: current ? playerTokens.surface : playerTokens.text,
                  bgcolor: current ? playerTokens.focus : "transparent",
                  border: `2px solid ${current ? playerTokens.focus : playerTokens.states.idle.stroke}`,
                }}>
                  {isFinal && <FlagIcon sx={{ fontSize: 16 }} />}
                  {isFinal ? "最終チャレンジ" : `${phase.phase}. ${phase.shortName}`}
                </Box>
              </Fragment>
            );
          })}
        </Box>
      </Box>

      <Box component={motion.div}
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.35, ease: "easeOut" }}
        sx={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", px: 3, py: 4 }}>
        <Box sx={{ width: "100%", maxWidth: 900 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label="単元ミッション" size="small" color="primary" sx={{ fontWeight: 800 }} />
            <GoalFlag courseId={unit.courseId} title={mission.title} />
          </Stack>
          {Scene && (
            <Box aria-hidden sx={{ mt: 2, height: { xs: 240, sm: 380 }, borderRadius: 3, overflow: "hidden", bgcolor: "#f1f5f9" }}>
              {Scene}
            </Box>
          )}
          <Typography component="h2" sx={{ mt: 3, fontSize: 24, fontWeight: 900 }}>{mission.title}</Typography>
          <Typography sx={{ mt: 1.5, fontSize: 16, maxWidth: 680 }}>{mission.description}</Typography>
          <Typography sx={{ mt: 2, fontSize: 16 }}>
            <Box component="span" sx={{ fontWeight: 800 }}>達成の条件：</Box>
            {mission.successCondition}
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 16 }}>
            学習の最後に、自分のコードでこの課題に挑戦します（最終チャレンジ）。
          </Typography>
          <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
            <Button variant="contained" size="large" onClick={onStart}
              sx={{ minWidth: 260, height: 54, fontSize: 16, fontWeight: 800, borderRadius: 2 }}>
              学習を始める
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
