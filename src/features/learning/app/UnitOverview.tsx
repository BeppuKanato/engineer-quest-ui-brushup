"use client";
import { Alert, Box, Button, Chip, Container, LinearProgress, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckIcon from "@mui/icons-material/Check";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlagIcon from "@mui/icons-material/Flag";
import ScienceIcon from "@mui/icons-material/Science";
import BuildIcon from "@mui/icons-material/Build";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAchievements, type AchievementItem } from "@/api/achievements.api";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { CourseThumbnail } from "@/app/courses/component/courseThumbnail";
import { missionThumbnailFor } from "@/design/MissionThumbnail";
import { useUserSession } from "@/app/component/userSession";
import { startLearningUnit } from "@/api/learning.api";
import { appLearningTokens as tokens } from "./appLearning.tokens";
import { findLearningUnit, learnUrl, resumePhaseIndex, type LearningUnit } from "./unitRegistry";
import { learningPhaseIcons } from "./learningPhaseIcons";
import { WAVE, wavePath, wavePoint } from "./unitPathGeometry";
import { useLearningProgress, learningErrorMessage } from "./useLearningProgress";
import { ProgressLoadingSkeleton } from "./ProgressLoadingSkeleton";
import { ConceptProgressMap } from "./ConceptProgressMap";
import { useLearningLog } from "./useLearningLog";
import { findDevelopmentLinks, findUnitMission, missionPlayUrl, type DevelopmentMissionLink } from "./missionRegistry";


// 波形の形状は unitPathGeometry に共通化（最終リザルトのミニマップと共有）。
// 再設計（2026-11-22）：段階は1〜6で数え、波の7番目の点は「ミッション挑戦」。
// 段階7（自分で実装）はミッション挑戦に置き換わったため、進捗の分母は6。

export function UnitOverview({ courseId }: { courseId: string }) {
  const unit = findLearningUnit(courseId), router = useRouter();
  const { firebaseUser } = useUserSession();
  const { progress, loading, error, reload, authenticated } = useLearningProgress(unit?.courseId);
  const [starting, setStarting] = useState(false), [startError, setStartError] = useState<string | null>(null);
  const [goalSet, setGoalSet] = useState(false);
  const log = useLearningLog(courseId);
  const mission = unit ? findUnitMission(unit.courseId) : undefined;
  const next = unit && progress ? resumePhaseIndex(unit, progress) : null;
  const learningPhases = unit?.phases.slice(0, 6) ?? [];
  const completed = progress?.phases.filter(phase => learningPhases.some(item => item.id === phase.phaseKey) && phase.status === "COMPLETED").length ?? 0;
  const missionDone = progress?.unit?.status === "COMPLETED";
  const missionReady = next === 6;
  const waveNext = missionDone ? null : next;
  const nextPhase = next !== null && next < 6 ? unit?.phases[next] : null;
  const start = async (reviewIndex?: number) => {
    if (!unit || !progress || !firebaseUser || starting) return;
    const index = reviewIndex ?? next ?? 0;
    setStarting(true); setStartError(null);
    try {
      await startLearningUnit(await firebaseUser.getIdToken(), courseId, unit.phases[index].id);
      log({ eventType: "unit_start", phaseKey: unit.phases[index].id, payload: { resume: !!progress.unit, review: reviewIndex !== undefined } });
      router.push(learnUrl(courseId) + (reviewIndex !== undefined ? `?phase=${encodeURIComponent(unit.phases[index].id)}` : ""));
    } catch (error) { setStartError(learningErrorMessage(error)); setStarting(false); }
  };
  const goMission = () => { if (unit) router.push(missionPlayUrl(unit.courseId)); };
  return <Box sx={{ minHeight: "100dvh", bgcolor: tokens.background, color: tokens.text }}>
    <AppHeader />
    <Container maxWidth={false} sx={{ maxWidth: 1440, pt: { xs: 3, md: 4 } }}>
      <AppBreadcrumbs items={[{ label: "コース", href: "/courses" }, { label: unit?.title ?? "単元" }]} />
    </Container>
    <Container component={motion.main} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ pt: 1, pb: 5, maxWidth: 1200 }}>
      <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900, mt: 2 }}>{unit?.title ?? "単元"}</Typography>
      {!unit ? <Box sx={{ py: 6 }}><Typography>この単元は準備中です。</Typography><Typography>公開まで、ほかのコースをご覧ください。</Typography></Box> : !authenticated && !loading ? <Button component={Link} href="/auth/login">ログインして学習する</Button> : loading ? <ProgressLoadingSkeleton variant="overview" /> : error ?
        <Alert severity="error" action={<Button onClick={reload}>再読み込み</Button>}>{error}</Alert> : progress && <>
          <Typography sx={{ mt: 1.5, lineHeight: 1.8 }}>{unit.intro}</Typography>
          {mission && (
            <Box component="section" aria-label="目標ミッション" sx={{ mt: 2.5, p: { xs: 2, md: 3 }, bgcolor: "#fff", border: "2px solid #2563eb", borderRadius: 3 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ xs: "stretch", md: "center" }}>
                <Box aria-hidden sx={{ width: { xs: "100%", md: 220 }, maxWidth: 280, flexShrink: 0, alignSelf: "center" }}>
                  {missionThumbnailFor(unit.courseId) ?? <CourseThumbnail courseId={unit.courseId} />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip label="目標ミッション" size="small" sx={{ fontWeight: 800, bgcolor: "#2563eb", color: "#fff" }} />
                    {goalSet && <Chip icon={<CheckIcon />} label="自分の目標に設定済み" size="small" sx={{ fontWeight: 800, bgcolor: "#dcfce7", color: "#15803d", "& .MuiChip-icon": { color: "inherit" } }} />}
                  </Stack>
                  <Typography component="h2" sx={{ fontSize: 18, fontWeight: 900, mt: 1.5, lineHeight: 1.5 }}>{mission.title}</Typography>
                  <Typography sx={{ mt: 0.5, lineHeight: 1.8 }}>{mission.description}</Typography>
                  <Typography sx={{ mt: 1, fontSize: 14 }}>達成の条件：{mission.successCondition}</Typography>
                </Box>
                <Stack spacing={1.5} sx={{ width: { xs: "100%", md: 260 }, flexShrink: 0 }}>
                  {missionDone ? (
                    <Button variant="contained" component={Link} href={learnUrl(courseId)} sx={{ fontWeight: 800 }}>単元の結果を見る</Button>
                  ) : missionReady ? (
                    <Button variant="contained" onClick={goMission} sx={{ fontWeight: 800 }}>ミッションに挑戦する</Button>
                  ) : (
                    <>
                      {nextPhase && <Typography sx={{ fontSize: 14, fontWeight: 700 }}>次は『{nextPhase.formalName}』</Typography>}
                      <Button variant="contained" onClick={() => void start()} disabled={starting} sx={{ fontWeight: 800 }}>{progress.unit ? "学習を進める" : "学習を始める"}</Button>
                      <Button variant="text" disabled sx={{ fontWeight: 700 }}>ミッションに挑戦する</Button>
                      <Typography sx={{ fontSize: 14, color: "text.secondary", textAlign: "center" }}>段階1〜6を終えたら挑戦できる</Typography>
                    </>
                  )}
                  {!missionDone && (
                    <Button variant="outlined" startIcon={goalSet ? <CheckIcon /> : undefined} onClick={() => setGoalSet(value => !value)} sx={{ fontWeight: 700 }}>
                      {goalSet ? "目標に設定済み" : "目標に設定する"}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          )}
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 2.5 }}>
            <Typography sx={{ fontWeight: 700 }}>段階 {completed} / 6 完了</Typography>
            <Chip
              label={missionDone ? "ミッション達成済み" : missionReady ? "ミッションに挑戦できる" : "ミッション未挑戦"}
              size="small"
              sx={{ fontWeight: 800, bgcolor: missionDone ? "#dcfce7" : missionReady ? "#dbeafe" : "#f1f5f9", color: missionDone ? "#15803d" : missionReady ? "#1e40af" : "#475569" }}
            />
            {progress.unit?.status === "COMPLETED" && <Chip icon={<CheckCircleIcon />} label="単元完了" size="small" sx={{ fontWeight: 800, bgcolor: "#dcfce7", color: "#15803d", "& .MuiChip-icon": { color: "inherit" } }} />}
          </Stack>
          <LinearProgress aria-label="単元の進捗" variant="determinate" value={completed / 6 * 100} sx={{ my: 2, height: 8, borderRadius: 4, bgcolor: "#e2e8f0", "& .MuiLinearProgress-bar": { bgcolor: "#16a34a", borderRadius: 4 } }} />
          {startError && <Alert severity="error" sx={{ my: 2 }}>{startError}</Alert>}
          <UnitPathMap unit={unit} next={waveNext} completedIds={new Set(progress.phases.filter(phase => phase.status === "COMPLETED").map(phase => phase.phaseKey))} hasProgress={!!progress.unit} starting={starting} missionReady={missionReady} missionDone={missionDone} devLinks={findDevelopmentLinks(courseId)} onStart={(index, isCurrent) => void start(isCurrent ? undefined : index)} onMission={goMission} />
          {findDevelopmentLinks(courseId).length > 0 && (
            <Box sx={{ mt: 1, textAlign: "right" }}>
              <Link href="/missions" style={{ color: "#2563eb", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                発展ミッション一覧へ
              </Link>
            </Box>
          )}
          <ConceptProgressMap courseId={courseId} />
          <UnitAchievements courseId={courseId} />
        </>}
    </Container>
  </Box>;
}

function UnitPathMap({ unit, next, completedIds, hasProgress, starting, missionReady, missionDone, devLinks, onStart, onMission }: {
  unit: LearningUnit;
  next: number | null;
  completedIds: ReadonlySet<string>;
  hasProgress: boolean;
  starting: boolean;
  missionReady: boolean;
  missionDone: boolean;
  devLinks: DevelopmentMissionLink[];
  onStart: (index: number, isCurrent: boolean) => void;
  onMission: () => void;
}) {
  const theme = useTheme();
  const vertical = useMediaQuery(theme.breakpoints.down("sm"));
  const reduced = useReducedMotion();
  const count = unit.phases.length;
  // 縦向きは横向きの座標を入れ替える（x が進み具合、y が波の振れ）。
  const point = (index: number) => {
    const wave = wavePoint(count === 1 ? 0 : index / (count - 1));
    return vertical ? { x: wave.y, y: wave.x } : { x: wave.x, y: wave.y };
  };
  const path = (until: number) => {
    const full = wavePath(until);
    if (!vertical) return full;
    return full.replace(/([ML])([\d.]+),([\d.]+)/g, (_, cmd, x, y) => `${cmd}${y},${x}`);
  };
  // 発展ミッションのノードがある単元は、箱の下に余白を足して扇の置き場所にする。
  const extH = devLinks.length > 0 ? WAVE.height + 120 : WAVE.height;
  const xDen = vertical ? extH : WAVE.width;
  const yDen = vertical ? WAVE.width : extH;
  const viewBox = vertical ? `0 0 ${extH} ${WAVE.width}` : `0 0 ${WAVE.width} ${extH}`;
  // 任意フェーズの置き場所（波の座標系でのずらし）：1.5 は本線の上、6.5 は本線の下に逃がし、
  // 破線で本線とつなぐ。本線の上に置くと前後の段階ラベルと重なるため。
  const optionals =
    count >= 7
      ? [
          { t: 0.5 / (count - 1), dx: -14, dy: -60, label: "予測・実験", Icon: ScienceIcon, labelSide: "above" as const },
          { t: 5.5 / (count - 1), dx: -20, dy: 126, label: "実装の橋渡し", Icon: BuildIcon, labelSide: "below" as const },
        ]
      : [];
  const optionalPos = (o: (typeof optionals)[number]) => {
    const wave = wavePoint(o.t);
    return vertical ? { x: wave.y + o.dy, y: wave.x + o.dx } : { x: wave.x + o.dx, y: wave.y + o.dy };
  };
  // 発展ミッションのノード：ゴールの左下に扇状に付ける（最大2つ。残りは一覧へのリンクで受ける）。
  const goalWave = wavePoint(1);
  const devPos = (i: number) => {
    const wx = goalWave.x - (i === 0 ? 205 : 45);
    const wy = goalWave.y + 195;
    return vertical ? { x: wy, y: wx } : { x: wx, y: wy };
  };
  const doneUntil = next === null ? 1 : count === 1 ? 0 : next / (count - 1);
  const first = point(0), last = point(count - 1);
  return (
    <Box
      component="section"
      aria-label="この単元の流れ"
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: vertical ? `${extH} / ${WAVE.width}` : `${WAVE.width} / ${extH}`,
        border: `1px solid ${tokens.border}`,
        borderRadius: "24px",
        overflow: "hidden",
        mt: 1,
      }}
    >
      {/* 図はミッション帯が担うため、波の地図には敷かない（段階のラベルと重なるため）。 */}
      <svg viewBox={viewBox} width="100%" height="100%" aria-hidden style={{ position: "absolute", inset: 0 }}>
        <path d={path(1)} fill="none" stroke="#c3d4ec" strokeWidth={9} strokeLinecap="round" />
        <motion.path
          d={path(doneUntil)}
          fill="none"
          stroke={tokens.progress.next}
          strokeWidth={9}
          strokeLinecap="round"
          initial={{ pathLength: reduced ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduced ? 0 : 0.9, ease: "easeOut", delay: 0.15 }}
        />
        {/* スタートとゴールの旗。最初の段階が現在地のときは、チップと重なるためスタート旗を出さない。 */}
        {next !== 0 && (
          <g aria-hidden>
            <line x1={first.x} y1={first.y} x2={vertical ? first.x - 46 : first.x} y2={vertical ? first.y : first.y - 46} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
            <polygon
              points={vertical ? `${first.x - 46},${first.y} ${first.x - 46},${first.y + 26} ${first.x - 20},${first.y + 13}` : `${first.x},${first.y - 46} ${first.x},${first.y - 22} ${first.x + 28},${first.y - 34}`}
              fill={tokens.progress.next}
            />
            <text x={vertical ? first.x - 52 : first.x - 6} y={vertical ? first.y - 10 : first.y - 56} textAnchor={vertical ? "end" : "start"} fontSize={24} fontWeight={700} fill={tokens.progress.next}>スタート</text>
          </g>
        )}
        {/* ゴール旗。ミッション挑戦が現在地のときは「ここから始める」と重なるため出さない。 */}
        {next !== count - 1 && (
        <g aria-hidden>
          <line x1={last.x} y1={last.y} x2={vertical ? last.x - 46 : last.x} y2={vertical ? last.y : last.y - 46} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
          <polygon
            points={vertical ? `${last.x - 46},${last.y} ${last.x - 46},${last.y + 26} ${last.x - 20},${last.y + 13}` : `${last.x},${last.y - 46} ${last.x},${last.y - 22} ${last.x - 28},${last.y - 34}`}
            fill="#d97706"
          />
          <text x={vertical ? last.x - 52 : last.x + 6} y={vertical ? last.y - 10 : last.y - 56} textAnchor="end" fontSize={24} fontWeight={700} fill="#d97706">ゴール</text>
        </g>
        )}
        {/* 任意フェーズと本線をつなぐ破線 */}
        {optionals.map((o) => {
          const wave = wavePoint(o.t);
          const from = vertical ? { x: wave.y, y: wave.x } : { x: wave.x, y: wave.y };
          const to = optionalPos(o);
          return <line key={o.label} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={tokens.progress.next} strokeWidth={2.5} strokeDasharray="5 6" />;
        })}
        {/* 発展ミッションのノードとゴールをつなぐ破線 */}
        {devLinks.slice(0, 2).map((d, i) => {
          const to = devPos(i);
          return <line key={d.title} x1={last.x} y1={last.y} x2={to.x} y2={to.y} stroke={d.ready ? tokens.progress.next : "#94a3b8"} strokeWidth={2.5} strokeDasharray="5 6" />;
        })}
      </svg>
      {unit.phases.map((phase, index) => {
        const isMission = index === count - 1;
        const done = isMission ? missionDone : completedIds.has(phase.id);
        const current = index === next;
        const reachable = index <= (next ?? count - 1);
        const Icon = isMission ? FlagIcon : learningPhaseIcons[index];
        const status = done ? "達成済み" : isMission ? (missionReady ? "挑戦できる" : "未着手") : current && hasProgress ? "進行中" : "未着手";
        const label = isMission ? "ミッション挑戦" : `${phase.phase}. ${phase.shortName}`;
        const position = point(index);
        const size = current ? 118 : 102;
        return (
          <Box
            key={phase.id}
            sx={{ position: "absolute", left: `${(position.x / xDen) * 100}%`, top: `${(position.y / yDen) * 100}%`, transform: "translate(-50%, -50%)", width: size, height: size }}
          >
            <Box
              component={motion.div}
              initial={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.2 + index * 0.07 }}
              sx={{ width: "100%", height: "100%" }}
            >
            <Button
              aria-label={`${label}：${status}`}
              aria-current={current ? "step" : undefined}
              disabled={!reachable || starting}
              onClick={() => { if (isMission) onMission(); else onStart(index, current); }}
              sx={{
                width: size, height: size, minWidth: size, borderRadius: "50%",
                border: `3px solid ${current ? tokens.progress.next : tokens.progress.stroke}`,
                bgcolor: done ? tokens.progress.completed : current ? tokens.progress.next : tokens.progress.idle,
                color: current ? tokens.surface : tokens.text,
                position: "relative",
                boxShadow: current
                  ? `0 0 0 5px ${tokens.background}, 0 0 0 9px #93c5fd, 0 12px 24px rgba(37, 99, 235, 0.35)`
                  : reachable ? "0 8px 18px rgba(15, 23, 42, 0.16)" : "none",
                transition: "background-color 200ms, transform 200ms",
                "&:hover": { transform: "translateY(-3px)", bgcolor: done ? tokens.progress.completed : current ? tokens.progress.next : tokens.progress.idle },
              }}
            >
              <Icon sx={{ fontSize: 44 }} />
              {done && <CheckCircleIcon aria-hidden sx={{ position: "absolute", right: 0, bottom: 0, fontSize: 28 }} />}
            </Button>
            {current && (
              <Box
                component={motion.span}
                style={{ x: "-50%" }}
                animate={reduced ? undefined : { y: [0, -4, 0] }}
                transition={reduced ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                sx={{ position: "absolute", bottom: "calc(100% + 12px)", left: "50%", bgcolor: tokens.progress.next, color: "#fff", px: 1.5, py: 0.5, borderRadius: 999, fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", pointerEvents: "none" }}
              >
                ここから始める
              </Box>
            )}
            <Box sx={{ position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", width: vertical ? 150 : 190, maxWidth: "38vw", textAlign: "center", pointerEvents: "none" }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{isMission ? "7. ミッション挑戦" : `${phase.phase}. ${phase.shortName}`}</Typography>
              <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{status}</Typography>
            </Box>
            </Box>
          </Box>
        );
      })}
      {/* 任意フェーズ（2026-11-23「置く」と決定）：1.5＝予測・実験（段階1と2の間）、
          6.5＝実装の橋渡し（段階6とミッション挑戦の間）。本線から少し離して破線でつなぎ、
          本線の円より小さく破線の輪で「任意」を表す。進捗の分母（6）には入れない。 */}
      {optionals.map((o) => {
        const pos = optionalPos(o);
        const size = 80;
        const Icon = o.Icon;
        return (
          <Box
            key={o.label}
            aria-label={`任意フェーズ：${o.label}`}
            sx={{ position: "absolute", left: `${(pos.x / xDen) * 100}%`, top: `${(pos.y / yDen) * 100}%`, transform: "translate(-50%, -50%)", width: size, height: size }}
          >
            <Box sx={{ width: size, height: size, borderRadius: "50%", border: `2.5px dashed ${tokens.progress.next}`, bgcolor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: tokens.progress.next }}>
              <Icon sx={{ fontSize: 30 }} />
            </Box>
            <Box
              sx={{
                position: "absolute",
                ...(o.labelSide === "above" ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
                left: "50%",
                transform: "translateX(-50%)",
                width: 150,
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{o.label}</Typography>
              <Typography sx={{ fontSize: 14, color: "text.secondary" }}>任意</Typography>
            </Box>
          </Box>
        );
      })}
      {/* 発展ミッションのノード（2026-11-23）：ゴールの先にノードとして付ける。
          ボタンの帯ではなく、流れの続きとして見せるのが「接続」の形。 */}
      {devLinks.slice(0, 2).map((d, i) => {
        const pos = devPos(i);
        const size = 64;
        return (
          <Box
            key={d.title}
            component={Link}
            href="/missions"
            aria-label={`発展ミッション：${d.title}（${d.status}）`}
            sx={{
              position: "absolute",
              left: `${(pos.x / xDen) * 100}%`,
              top: `${(pos.y / yDen) * 100}%`,
              transform: "translate(-50%, -50%)",
              width: size,
              height: size,
              textDecoration: "none",
            }}
          >
            <Box
              sx={{
                width: size,
                height: size,
                borderRadius: "50%",
                border: d.ready ? `2.5px solid ${tokens.progress.next}` : "2.5px solid #cbd5e1",
                bgcolor: d.ready ? "#fff" : "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: d.ready ? tokens.progress.next : "#94a3b8",
              }}
            >
              <EmojiEventsIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box sx={{ position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", width: 180, textAlign: "center", pointerEvents: "none" }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "text.primary" }}>{d.title}</Typography>
              <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{d.status}</Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/** その単元に関連する実績（courseId が一致するもの）のプレビュー。取得できなくても画面は壊さない。 */
function UnitAchievements({ courseId }: { courseId: string }) {
  const { firebaseUser } = useUserSession();
  const [items, setItems] = useState<AchievementItem[] | null>(null);
  useEffect(() => {
    if (!firebaseUser) return;
    let current = true;
    void firebaseUser.getIdToken().then(token => getAchievements(token)).then(
      response => { if (current) setItems(response.groups.flatMap(group => group.achievements).filter(item => item.courseId === courseId)); },
      () => { if (current) setItems([]); },
    );
    return () => { current = false; };
  }, [firebaseUser, courseId]);
  if (!items || items.length === 0) return null;
  return (
    <Box component="section" aria-label="この単元の実績" sx={{ mt: 4 }}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
        <EmojiEventsIcon sx={{ color: "#b45309" }} />
        <Typography component="h2" variant="h6" fontWeight={950}>この単元の実績</Typography>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        {items.map(item => {
          const achieved = item.status === "achieved";
          return (
            <Box key={item.id} sx={{ display: "flex", gap: 1.5, p: 2, border: `1px solid ${tokens.border}`, borderRadius: 2, bgcolor: tokens.surface, opacity: achieved ? 1 : 0.75 }}>
              <EmojiEventsIcon aria-hidden sx={{ color: achieved ? "#b45309" : "#94a3b8", fontSize: 32, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{item.title}</Typography>
                  {achieved && <Chip label="達成済み" size="small" sx={{ height: 22, fontSize: 12, fontWeight: 800, bgcolor: "#dcfce7", color: "#15803d" }} />}
                </Stack>
                <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>{item.conditionLabel ?? item.description}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
