"use client";

import Box from "@mui/material/Box";
import { motion, useReducedMotion } from "framer-motion";

import { MazeGridDrawing } from "../../player/MazeGridDrawing";
import { playerTokens } from "../../player/player.tokens";
import type { WallExtensionMotivationCanvasState } from "./motivation.types";

/**
 * フェーズ1の見た目を描く。描画そのものは共通グリッド基盤へ委譲し、
 * ここでは出口ボタン（BFS フェーズ1と同じ仕組み）の重ね方だけを持つ。
 * 単品プレビューでは onExit が無く、ボタンは無効表示になる（DFS フェーズ1と同じ）。
 */
export function WallExtensionMotivationCanvas({ canvas }: { canvas: WallExtensionMotivationCanvasState }) {
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : playerTokens.transitionMs / 1000, ease: "easeInOut" } as const;
  return (
    <Box sx={{ height: "100%", minHeight: 220, position: "relative" }}>
      <MazeGridDrawing canvas={canvas} label={`${canvas.data.size}×${canvas.data.size}の迷路の盤面`} />
    </Box>
  );
}
