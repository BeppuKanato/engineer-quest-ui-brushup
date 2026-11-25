"use client";

// 入力の見方（図解）（2026-11-25）。入力の文章説明を読む前に、
// 例の入力をそのまま図にして、記号の意味が凡例で分かるようにする。

import type { DevMission } from "@/design/developmentMissions";
import { Box, Typography } from "@mui/material";

export const MissionInputVisual: React.FC<{ visual: DevMission["inputVisual"] }> = ({ visual }) => {
  const legendByMark = new Map(visual.legend.map((l) => [l.mark, l]));
  return (
    <Box>
      {visual.kind === "grid" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "flex-start" }}>
          {visual.rows.map((row, ri) => (
            <Box key={ri} sx={{ display: "flex", gap: "3px" }}>
              {row.split("").map((ch, ci) => {
                const l = legendByMark.get(ch);
                return (
                  <Box
                    key={ci}
                    sx={{
                      width: 30, height: 30, borderRadius: 1,
                      bgcolor: l?.bg ?? "#f1f5f9", color: l?.fg ?? "#111827",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 900, fontFamily: "monospace",
                    }}
                  >
                    {ch}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      )}
      {visual.kind === "versions" && (
        <Box sx={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {visual.states.map((s, i) => {
            const l = legendByMark.get(String(s));
            return (
              <Box key={i} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700 }}>{i + 1}</Typography>
                <Box
                  sx={{
                    width: 32, height: 42, borderRadius: 1.5, position: "relative", overflow: "hidden",
                    bgcolor: l?.bg ?? "#f1f5f9", color: l?.fg ?? "#111827",
                    border: "2px solid #5b7186",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 900, fontFamily: "monospace",
                  }}
                >
                  {s}
                  {s === 1 && (
                    <Box component="svg" viewBox="0 0 32 42" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden>
                      <path d="M8 6 l7 9 l-4 8 l9 9" stroke="#64748b" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </Box>
                  )}
                </Box>
                <Typography component="p" sx={{ fontSize: 14 }}>{i === 0 ? "版の番号" : ""}</Typography>
              </Box>
            );
          })}
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
        {visual.legend.map((l) => (
          <Box key={l.mark} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: 0.75, bgcolor: l.bg, color: l.fg, border: "1px solid #5b7186", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, fontFamily: "monospace" }}>
              {l.mark}
            </Box>
            <Typography component="p" sx={{ fontSize: 14 }}>{l.label}</Typography>
          </Box>
        ))}
      </Box>
      <Typography component="p" sx={{ fontSize: 14, mt: 1 }}>{visual.firstLine}</Typography>
    </Box>
  );
};
