"use client";
// 単元画面の地図の作り直し案（2026-11-23）：波マップは旧アプリの直線構造の器で、
// 任意フェーズ（枝）と発展ミッション（出口）を押し込むほど崩れるため、構造から作り直した2案。
// 案1＝路線図型（本線＋支線＋終点からの発着）、案2＝縦の道型（スクロールする道＋脇道）。
// どちらも二分探索（学習中・段階4が現在地）のダミー状態で描く。残りの画面は現行のまま。
import { Box, Button, Chip, Container, LinearProgress, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlagIcon from "@mui/icons-material/Flag";
import ScienceIcon from "@mui/icons-material/Science";
import BuildIcon from "@mui/icons-material/Build";
import Link from "next/link";
import type { ReactNode } from "react";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { appLearningTokens as tokens } from "@/features/learning/app/appLearning.tokens";
import { learningPhaseIcons } from "@/features/learning/app/learningPhaseIcons";
import { findLearningUnit } from "@/features/learning/app/unitRegistry";
import { findDevelopmentLinks, findUnitMission } from "@/features/learning/app/missionRegistry";
import { missionThumbnailFor } from "./MissionThumbnail";

const COURSE_ID = "course-algorithm-binary-search-v1";
const unit = findLearningUnit(COURSE_ID)!;
const mission = findUnitMission(COURSE_ID)!;
const devLinks = findDevelopmentLinks(COURSE_ID);
/** ダミー状態：段階1〜3完了、段階4が現在地。 */
const DONE = 3;
const CURRENT = 3;

/** 地図以外の画面（現行の単元画面と同じ）。地図だけを差し替えて比べるための殻。 */
export function UnitPreviewShell({ children }: { children: ReactNode }) {
  const Scene = missionThumbnailFor(COURSE_ID);
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: tokens.background, pb: 8 }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1200, pt: 3 }}>
        <AppBreadcrumbs items={[{ label: "コース", href: "/courses" }, { label: unit.title }]} />
        <Typography component="h1" sx={{ mt: 2, fontSize: 24, fontWeight: 900 }}>
          {unit.title}
        </Typography>
        <Typography sx={{ mt: 1, lineHeight: 1.9 }}>{unit.intro}</Typography>
        <Box sx={{ mt: 3, p: { xs: 2, md: 3 }, bgcolor: "#fff", border: `2px solid ${tokens.progress.next}`, borderRadius: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            {Scene && (
              <Box sx={{ width: { xs: "100%", md: 220 }, flexShrink: 0, borderRadius: 2, overflow: "hidden", bgcolor: "#eef4fb", "& svg": { display: "block", width: "100%", height: "auto" } }}>
                {Scene}
              </Box>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Chip label="目標ミッション" color="primary" size="small" sx={{ fontWeight: 700 }} />
              <Typography component="h2" sx={{ mt: 1, fontSize: 18, fontWeight: 900 }}>
                {mission.title}
              </Typography>
              <Typography sx={{ mt: 0.5, lineHeight: 1.8 }}>{mission.description}</Typography>
              <Typography sx={{ mt: 1, fontSize: 14 }}>達成の条件：{mission.successCondition}</Typography>
            </Box>
            <Stack spacing={1.5} sx={{ width: { xs: "100%", md: 230 }, flexShrink: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                次は『{unit.phases[CURRENT].shortName}』
              </Typography>
              <Button variant="contained" size="large" sx={{ fontWeight: 700 }}>
                学習を進める
              </Button>
              <Button variant="outlined" disabled sx={{ fontWeight: 700 }}>
                ミッションに挑戦する
              </Button>
              <Typography sx={{ fontSize: 14, color: "text.secondary", textAlign: "center" }}>段階1〜6を終えたら挑戦できる</Typography>
              <Button variant="outlined" sx={{ fontWeight: 700 }}>
                目標に設定する
              </Button>
            </Stack>
          </Stack>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 3 }}>
          <Typography sx={{ fontWeight: 900 }}>段階 {DONE} / 6 完了</Typography>
          <Chip label="ミッション未挑戦" size="small" sx={{ fontWeight: 700 }} />
        </Stack>
        <LinearProgress variant="determinate" value={(DONE / 6) * 100} sx={{ mt: 1, height: 8, borderRadius: 999, bgcolor: "#e2e8f0", "& .MuiLinearProgress-bar": { bgcolor: "#16a34a", borderRadius: 999 } }} />
        {children}
      </Container>
    </Box>
  );
}

type StationState = "done" | "current" | "todo";

function stationSx(state: StationState, size: number) {
  return {
    width: size,
    height: size,
    borderRadius: "50%",
    border: `3px solid ${state === "current" ? tokens.progress.next : tokens.progress.stroke}`,
    bgcolor: state === "done" ? tokens.progress.completed : state === "current" ? tokens.progress.next : tokens.progress.idle,
    color: state === "current" ? tokens.surface : tokens.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
    boxShadow: state === "current" ? `0 0 0 5px ${tokens.background}, 0 0 0 9px #93c5fd, 0 12px 24px rgba(37, 99, 235, 0.35)` : "0 8px 18px rgba(15, 23, 42, 0.16)",
  };
}

function StationLabel({ title, status, width = 190 }: { title: string; status: string; width?: number }) {
  return (
    <Box sx={{ position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", width, textAlign: "center", pointerEvents: "none" }}>
      <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{title}</Typography>
      <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{status}</Typography>
    </Box>
  );
}

function CurrentChip() {
  return (
    <Box sx={{ position: "absolute", bottom: "calc(100% + 12px)", left: "50%", transform: "translateX(-50%)", bgcolor: tokens.progress.next, color: "#fff", px: 1.5, py: 0.5, borderRadius: 999, fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", pointerEvents: "none" }}>
      ここから始める
    </Box>
  );
}

const smoothPath = (pts: { x: number; y: number }[]) => {
  if (pts.length < 3) return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x},${p2.y}`;
  }
  return d;
};

/* ================= 案1：路線図型 ================= */

const R = {
  phases: [
    { x: 110, y: 250 },
    { x: 278, y: 214 },
    { x: 446, y: 250 },
    { x: 614, y: 286 },
    { x: 782, y: 250 },
    { x: 950, y: 214 },
  ],
  terminus: { x: 1108, y: 250 },
  branch15: { x: 250, y: 104 },
  branch65: { x: 1085, y: 116 },
  dev: [
    { x: 872, y: 486 },
    { x: 1040, y: 500 },
  ],
  W: 1200,
  H: 620,
};

export function RouteMapUnit() {
  const all = [...R.phases, R.terminus];
  const fork15 = { x: (R.phases[0].x + R.phases[1].x) / 2, y: (R.phases[0].y + R.phases[1].y) / 2 };
  const fork65 = { x: (R.phases[5].x + R.terminus.x) / 2, y: (R.phases[5].y + R.terminus.y) / 2 };
  const pct = (p: { x: number; y: number }) => ({ left: `${(p.x / R.W) * 100}%`, top: `${(p.y / R.H) * 100}%` });
  return (
    <Box component="section" aria-label="この単元の流れ（路線図案）" sx={{ position: "relative", width: "100%", aspectRatio: `${R.W} / ${R.H}`, border: `1px solid ${tokens.border}`, borderRadius: "24px", overflow: "hidden", mt: 1 }}>
      <svg viewBox={`0 0 ${R.W} ${R.H}`} width="100%" height="100%" aria-hidden style={{ position: "absolute", inset: 0 }}>
        <path d={smoothPath(all)} fill="none" stroke="#c3d4ec" strokeWidth={9} strokeLinecap="round" />
        <path d={smoothPath(R.phases.slice(0, CURRENT + 1))} fill="none" stroke={tokens.progress.next} strokeWidth={9} strokeLinecap="round" />
        {/* 支線（任意フェーズ） */}
        <line x1={fork15.x} y1={fork15.y} x2={R.branch15.x} y2={R.branch15.y} stroke="#c3d4ec" strokeWidth={5} strokeLinecap="round" />
        <line x1={fork65.x} y1={fork65.y} x2={R.branch65.x} y2={R.branch65.y} stroke="#c3d4ec" strokeWidth={5} strokeLinecap="round" />
        <circle cx={fork15.x} cy={fork15.y} r={7} fill="#fff" stroke={tokens.progress.stroke} strokeWidth={3} />
        <circle cx={fork65.x} cy={fork65.y} r={7} fill="#fff" stroke={tokens.progress.stroke} strokeWidth={3} />
        {/* 終点から出る線（発展ミッション） */}
        {devLinks.slice(0, 2).map((d, i) => (
          <line key={d.title} x1={R.terminus.x} y1={R.terminus.y} x2={R.dev[i].x} y2={R.dev[i].y} stroke={d.ready ? tokens.progress.next : "#94a3b8"} strokeWidth={2.5} strokeDasharray="5 6" />
        ))}
        {/* スタート旗・ゴール旗 */}
        <g aria-hidden>
          <line x1={R.phases[0].x} y1={R.phases[0].y} x2={R.phases[0].x} y2={R.phases[0].y - 46} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
          <polygon points={`${R.phases[0].x},${R.phases[0].y - 46} ${R.phases[0].x},${R.phases[0].y - 22} ${R.phases[0].x + 28},${R.phases[0].y - 34}`} fill={tokens.progress.next} />
          <text x={R.phases[0].x - 6} y={R.phases[0].y - 56} fontSize={24} fontWeight={700} fill={tokens.progress.next}>スタート</text>
        </g>
        <g aria-hidden>
          <line x1={R.terminus.x} y1={R.terminus.y} x2={R.terminus.x} y2={R.terminus.y - 46} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
          <polygon points={`${R.terminus.x},${R.terminus.y - 46} ${R.terminus.x},${R.terminus.y - 22} ${R.terminus.x - 28},${R.terminus.y - 34}`} fill="#d97706" />
          <text x={R.terminus.x + 6} y={R.terminus.y - 56} textAnchor="end" fontSize={24} fontWeight={700} fill="#d97706">ゴール</text>
        </g>
      </svg>
      {R.phases.map((p, i) => {
        const state: StationState = i < DONE ? "done" : i === CURRENT ? "current" : "todo";
        const Icon = learningPhaseIcons[i];
        const size = state === "current" ? 100 : 88;
        return (
          <Box key={i} sx={{ position: "absolute", ...pct(p), transform: "translate(-50%, -50%)", width: size, height: size }}>
            <Box sx={stationSx(state, size)}>
              <Icon sx={{ fontSize: 40 }} />
              {state === "done" && <CheckCircleIcon aria-hidden sx={{ position: "absolute", right: 0, bottom: 0, fontSize: 26 }} />}
            </Box>
            {state === "current" && <CurrentChip />}
            <StationLabel title={`${unit.phases[i].phase}. ${unit.phases[i].shortName}`} status={state === "done" ? "達成済み" : state === "current" ? "進行中" : "未着手"} width={168} />
          </Box>
        );
      })}
      {/* 終点＝ミッション挑戦 */}
      <Box sx={{ position: "absolute", ...pct(R.terminus), transform: "translate(-50%, -50%)", width: 108, height: 108 }}>
        <Box sx={stationSx("todo", 108)}>
          <FlagIcon sx={{ fontSize: 46 }} />
        </Box>
        <StationLabel title="7. ミッション挑戦" status="未着手" width={168} />
      </Box>
      {/* 支線の駅＝任意フェーズ */}
      {[
        { p: R.branch15, label: "予測・実験", Icon: ScienceIcon, above: true },
        { p: R.branch65, label: "実装の橋渡し", Icon: BuildIcon, above: true },
      ].map(({ p, label, Icon, above }) => (
        <Box key={label} sx={{ position: "absolute", ...pct(p), transform: "translate(-50%, -50%)", width: 64, height: 64 }}>
          <Box sx={{ width: 64, height: 64, borderRadius: "50%", border: `2.5px dashed ${tokens.progress.next}`, bgcolor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: tokens.progress.next }}>
            <Icon sx={{ fontSize: 28 }} />
          </Box>
          <Box sx={{ position: "absolute", ...(above ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }), left: "50%", transform: "translateX(-50%)", width: 150, textAlign: "center", pointerEvents: "none" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{label}</Typography>
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>任意</Typography>
          </Box>
        </Box>
      ))}
      {/* 発展ミッションの駅 */}
      {devLinks.slice(0, 2).map((d, i) => (
        <Box key={d.title} component={Link} href="/missions" sx={{ position: "absolute", ...pct(R.dev[i]), transform: "translate(-50%, -50%)", width: 64, height: 64, textDecoration: "none" }}>
          <Box sx={{ width: 64, height: 64, borderRadius: "50%", border: d.ready ? `2.5px solid ${tokens.progress.next}` : "2.5px solid #cbd5e1", bgcolor: d.ready ? "#fff" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: d.ready ? tokens.progress.next : "#94a3b8" }}>
            <EmojiEventsIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box sx={{ position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", width: 190, textAlign: "center", pointerEvents: "none" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "text.primary" }}>{d.title}</Typography>
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{d.status}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/* ================= 案2：縦の道型 ================= */

const V = { W: 1200, H: 1780, step: 190, top: 110 };
const vX = (i: number) => 600 + 185 * Math.sin(i * 0.9);
const vY = (i: number) => V.top + i * V.step;
/** 止まる場所：段階0〜5、6=終点、7・8=発展 */
const vStops = Array.from({ length: 9 }, (_, i) => ({ x: vX(i), y: vY(i) }));
const vPathPts = Array.from({ length: 45 }, (_, k) => {
  const t = k / 44;
  const y = V.top + t * (vY(8) - V.top);
  const x = 600 + 185 * Math.sin((y - V.top) / V.step * 0.9);
  return { x, y };
});

export function VerticalPathUnit() {
  const pct = (p: { x: number; y: number }) => ({ left: `${(p.x / V.W) * 100}%`, top: `${(p.y / V.H) * 100}%` });
  const branch15 = { x: vStops[0].x + 330, y: (vY(0) + vY(1)) / 2 };
  const branch65 = { x: vStops[5].x - 330, y: (vY(5) + vY(6)) / 2 };
  const fork15 = { x: vX(0.5), y: (vY(0) + vY(1)) / 2 };
  const fork65 = { x: vX(5.5), y: (vY(5) + vY(6)) / 2 };
  const sideLabel = (p: { x: number; y: number }, title: string, status: string, side?: "left" | "right") => {
    const right = side ? side === "right" : p.x < 600;
    return (
      <Box sx={{ position: "absolute", top: "50%", ...(right ? { left: "calc(100% + 16px)" } : { right: "calc(100% + 16px)" }), transform: "translateY(-50%)", width: 230, textAlign: right ? "left" : "right", pointerEvents: "none" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{title}</Typography>
        <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{status}</Typography>
      </Box>
    );
  };
  return (
    <Box component="section" aria-label="この単元の流れ（縦の道案）" sx={{ position: "relative", width: "100%", aspectRatio: `${V.W} / ${V.H}`, border: `1px solid ${tokens.border}`, borderRadius: "24px", overflow: "hidden", mt: 1 }}>
      <svg viewBox={`0 0 ${V.W} ${V.H}`} width="100%" height="100%" aria-hidden style={{ position: "absolute", inset: 0 }}>
        <path d={smoothPath(vPathPts)} fill="none" stroke="#c3d4ec" strokeWidth={9} strokeLinecap="round" />
        <path d={smoothPath(vPathPts.filter((p) => p.y <= vY(CURRENT)))} fill="none" stroke={tokens.progress.next} strokeWidth={9} strokeLinecap="round" />
        {/* 終点より先（発展への道）は破線で続ける */}
        <path d={smoothPath(vPathPts.filter((p) => p.y >= vY(6)))} fill="none" stroke="#94a3b8" strokeWidth={3} strokeDasharray="4 10" strokeLinecap="round" />
        {/* 脇道（任意フェーズ） */}
        <line x1={fork15.x} y1={fork15.y} x2={branch15.x} y2={branch15.y} stroke={tokens.progress.next} strokeWidth={2.5} strokeDasharray="5 6" />
        <line x1={fork65.x} y1={fork65.y} x2={branch65.x} y2={branch65.y} stroke={tokens.progress.next} strokeWidth={2.5} strokeDasharray="5 6" />
        <g aria-hidden>
          <line x1={vStops[0].x} y1={vStops[0].y} x2={vStops[0].x - 46} y2={vStops[0].y} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
          <polygon points={`${vStops[0].x - 46},${vStops[0].y} ${vStops[0].x - 46},${vStops[0].y + 26} ${vStops[0].x - 20},${vStops[0].y + 13}`} fill={tokens.progress.next} />
          <text x={vStops[0].x - 54} y={vStops[0].y - 8} textAnchor="end" fontSize={24} fontWeight={700} fill={tokens.progress.next}>スタート</text>
        </g>
        <g aria-hidden>
          <line x1={vStops[6].x} y1={vStops[6].y} x2={vStops[6].x - 46} y2={vStops[6].y} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
          <polygon points={`${vStops[6].x - 46},${vStops[6].y} ${vStops[6].x - 46},${vStops[6].y + 26} ${vStops[6].x - 20},${vStops[6].y + 13}`} fill="#d97706" />
          <text x={vStops[6].x - 54} y={vStops[6].y - 8} textAnchor="end" fontSize={24} fontWeight={700} fill="#d97706">ゴール</text>
        </g>
      </svg>
      {vStops.slice(0, 6).map((p, i) => {
        const state: StationState = i < DONE ? "done" : i === CURRENT ? "current" : "todo";
        const Icon = learningPhaseIcons[i];
        const size = state === "current" ? 104 : 92;
        return (
          <Box key={i} sx={{ position: "absolute", ...pct(p), transform: "translate(-50%, -50%)", width: size, height: size }}>
            <Box sx={stationSx(state, size)}>
              <Icon sx={{ fontSize: 42 }} />
              {state === "done" && <CheckCircleIcon aria-hidden sx={{ position: "absolute", right: 0, bottom: 0, fontSize: 27 }} />}
            </Box>
            {state === "current" && <CurrentChip />}
            {sideLabel(p, `${unit.phases[i].phase}. ${unit.phases[i].shortName}`, state === "done" ? "達成済み" : state === "current" ? "進行中" : "未着手", i === 0 ? "right" : undefined)}
          </Box>
        );
      })}
      {/* 終点＝ミッション挑戦 */}
      <Box sx={{ position: "absolute", ...pct(vStops[6]), transform: "translate(-50%, -50%)", width: 112, height: 112 }}>
        <Box sx={stationSx("todo", 112)}>
          <FlagIcon sx={{ fontSize: 48 }} />
        </Box>
        {sideLabel(vStops[6], "7. ミッション挑戦", "未着手")}
      </Box>
      {/* 脇道＝任意フェーズ */}
      {[
        { p: branch15, label: "予測・実験", Icon: ScienceIcon },
        { p: branch65, label: "実装の橋渡し", Icon: BuildIcon },
      ].map(({ p, label, Icon }) => (
        <Box key={label} sx={{ position: "absolute", ...pct(p), transform: "translate(-50%, -50%)", width: 72, height: 72 }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "50%", border: `2.5px dashed ${tokens.progress.next}`, bgcolor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: tokens.progress.next }}>
            <Icon sx={{ fontSize: 30 }} />
          </Box>
          {sideLabel(p, label, "任意")}
        </Box>
      ))}
      {/* 発展ミッション */}
      {devLinks.slice(0, 2).map((d, i) => {
        const p = vStops[7 + i];
        return (
          <Box key={d.title} component={Link} href="/missions" sx={{ position: "absolute", ...pct(p), transform: "translate(-50%, -50%)", width: 72, height: 72, textDecoration: "none" }}>
            <Box sx={{ width: 72, height: 72, borderRadius: "50%", border: d.ready ? `2.5px solid ${tokens.progress.next}` : "2.5px solid #cbd5e1", bgcolor: d.ready ? "#fff" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: d.ready ? tokens.progress.next : "#94a3b8" }}>
              <EmojiEventsIcon sx={{ fontSize: 30 }} />
            </Box>
            {sideLabel(p, d.title, d.status)}
          </Box>
        );
      })}
    </Box>
  );
}
