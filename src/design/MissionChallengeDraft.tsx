"use client";

// 発展ミッション挑戦画面の下書き（2026-11-25、Issue #507）。
// 土台はフェーズ7の自由実装の枠（プログラム形式）を流用し、スコアパネルと
// 関連知識カードの参照要素（Issue #510）を足したもの。
import { MascotFigure } from "@/app/component/mascotFigure";
import cardsData from "@/design/data/knowledgeCards.json";
import {
  defaultTierId, findDevelopmentMission, ownedCardIds, pointsForCount, rankForPoints,
  rankThresholds, scoreTiers, type DevMission,
} from "@/design/developmentMissions";
import { LEARNING_EDITOR_THEME, setupLearningEditor } from "@/features/learning/code/learningEditor";
import { preparePyodide, runProgramFree, runProgramTests } from "@/lib/pyodideRunner";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Box, Button, Chip, Tab, Tabs, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Outcome = { status: "unrun" | "pass" | "fail" | "error"; answer?: string; count?: number; error?: string };

type CardRecord = { id: string; title: string; label: string; rarity: string; description: string; useCase: string };
const allCards = cardsData as unknown as CardRecord[];

const draftKey = (missionId: string) => `engineer-quest:mission-code:${missionId}`;

export function MissionChallengeDraft({ missionId }: { missionId: string }) {
  const router = useRouter();
  const mission = findDevelopmentMission(missionId);
  const [code, setCode] = useState<string>(() => {
    if (!mission) return "";
    try { return localStorage.getItem(draftKey(mission.id)) ?? mission.starterCode; } catch { return mission.starterCode; }
  });
  const [panel, setPanel] = useState<"statement" | "tests" | "console" | "hints" | "cards">("statement");
  const [runtime, setRuntime] = useState<"loading" | "ready" | "error">("loading");
  const [running, setRunning] = useState(false);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [freeOut, setFreeOut] = useState<{ stdout: string; error: string | null } | null>(null);
  const [tierId, setTierId] = useState(defaultTierId);
  const [result, setResult] = useState<{ points: number; rank: string; count: number } | null>(null);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  useEffect(() => {
    let active = true;
    preparePyodide().then(() => { if (active) setRuntime("ready"); }).catch(() => { if (active) setRuntime("error"); });
    return () => { active = false; };
  }, []);

  if (!mission) {
    return <Box sx={{ p: 4 }}><Typography>ミッションが見つかりません。</Typography></Box>;
  }
  const tier = scoreTiers.find((t) => t.id === tierId) ?? scoreTiers[1];
  const relatedCards = mission.relatedCardIds
    .map((id) => allCards.find((c) => c.id === id))
    .filter((c): c is CardRecord => !!c);
  const scoringTest = mission.tests.find((t) => t.scoring);
  const passedCount = mission.tests.filter((t) => outcomes[t.id]?.status === "pass").length;

  const persist = (next: string) => {
    setCode(next);
    try { localStorage.setItem(draftKey(mission.id), next); } catch { /* noop */ }
  };

  const runTests = async () => {
    if (running || runtime !== "ready") return;
    setRunning(true);
    setPanel("tests");
    try {
      const { results } = await runProgramTests(code, mission.tests.map((t) => ({ id: t.id, input: t.input })));
      const next: Record<string, Outcome> = {};
      for (const t of mission.tests) {
        const r = results.find((x) => x.id === t.id);
        if (!r || r.error) { next[t.id] = { status: "error", error: r?.error ?? "実行できませんでした" }; continue; }
        const lines = r.stdout.split("\n").map((s) => s.trim()).filter((s) => s !== "");
        const answer = lines[0] ?? "";
        const count = Number.parseInt(lines[1] ?? "", 10);
        next[t.id] = {
          status: answer === t.expectedAnswer ? "pass" : "fail",
          answer,
          count: Number.isNaN(count) ? undefined : count,
        };
      }
      setOutcomes(next);
      const allPass = mission.tests.every((t) => next[t.id]?.status === "pass");
      if (allPass && scoringTest) {
        const count = next[scoringTest.id]?.count;
        if (typeof count === "number") {
          const points = pointsForCount(count, mission.scoring);
          setResult({ points, rank: rankForPoints(points), count });
        }
      } else {
        setResult(null);
      }
    } finally {
      setRunning(false);
    }
  };

  const runFree = async () => {
    if (running || runtime !== "ready") return;
    setRunning(true);
    setPanel("console");
    try {
      const out = await runProgramFree(code, mission.tests[0].input);
      setFreeOut({ stdout: out.stdout, error: out.stderr ? out.stderr : null });
    } finally {
      setRunning(false);
    }
  };

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const stamp = (o?: Outcome) => {
    if (!o || o.status === "unrun") return <Chip size="small" label="○ 未実行" variant="outlined" sx={{ borderColor: "#c3cad4", fontWeight: 700 }} />;
    if (o.status === "pass") return <Chip size="small" label="✓ 通過" sx={{ bgcolor: "#16a34a", color: "#fff", fontWeight: 700 }} />;
    if (o.status === "error") return <Chip size="small" label="！ 実行エラー" variant="outlined" sx={{ borderColor: "#111827", fontWeight: 700 }} />;
    return <Chip size="small" label="× 不一致" variant="outlined" sx={{ borderColor: "#111827", fontWeight: 700 }} />;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
      {/* ミッションバンド */}
      <Box sx={{ flexShrink: 0, bgcolor: "#fff", border: "2px solid #2563eb", borderRadius: 3, px: 2.5, py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Chip size="small" label="発展ミッション" sx={{ bgcolor: "#2563eb", color: "#fff", fontWeight: 700 }} />
          <Typography component="p" sx={{ fontSize: 18, fontWeight: 900 }}>{mission.title}</Typography>
          <Chip size="small" variant="outlined" label={`解放条件：${mission.unlockUnitName}の単元完了`} />
        </Box>
        <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.8, mt: 0.75 }}>{mission.problem}</Typography>
        <Typography component="p" sx={{ fontSize: 14, mt: 0.5 }}>達成の条件：{mission.successCondition}</Typography>
      </Box>

      {/* スコアパネル（常時表示） */}
      <Box sx={{ flexShrink: 0, bgcolor: "#fff", border: "1px solid #dbe3ef", borderRadius: 3, px: 2.5, py: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1.4fr 1.2fr 1fr" }, gap: 2.5 }}>
          <Box>
            <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>スコア条件</Typography>
            <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.7 }}>
              {mission.countLabel}で計算します（少ないほど高得点）。答えと一緒に出力してください。
            </Typography>
          </Box>
          <Box>
            <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>ランク表（1000点満点）</Typography>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {rankThresholds.map((t) => (
                <Chip key={t.rank} size="small" label={`${t.rank}：${t.min}点〜`} sx={{ fontWeight: 700, bgcolor: result?.rank === t.rank ? "#fef3c7" : "#eef2f7" }} />
              ))}
            </Box>
          </Box>
          <Box>
            <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>目標ティア</Typography>
            <Box sx={{ display: "flex", gap: 0.75 }}>
              {scoreTiers.map((t) => (
                <Chip
                  key={t.id}
                  size="small"
                  clickable
                  label={`${t.label}（${t.rank}・${t.points}点）`}
                  onClick={() => setTierId(t.id)}
                  sx={t.id === tierId
                    ? { bgcolor: "#2563eb", color: "#fff", fontWeight: 700 }
                    : { bgcolor: "#eef2f7", fontWeight: 700 }}
                />
              ))}
            </Box>
          </Box>
          <Box>
            <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>自己ベスト</Typography>
            <Typography component="p" sx={{ fontSize: 15 }}>
              {mission.selfBest ? `${mission.selfBest.points}点・${mission.selfBest.rank}ランク` : "まだ記録なし"}
            </Typography>
          </Box>
        </Box>
        {result && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2, pt: 2, borderTop: "1px solid #eef2f7", flexWrap: "wrap" }}>
            <MascotFigure mascotId="red-panda" alt="相棒" state="celebrate" size="S" />
            <Typography component="p" sx={{ fontSize: 16, fontWeight: 700 }}>ミッション達成！ 自分の解き方で課題を解き切ったね。</Typography>
            <Typography component="p" sx={{ fontSize: 22, fontWeight: 900 }}>
              {result.points}点・{result.rank}ランク
            </Typography>
            <Typography component="p" sx={{ fontSize: 14 }}>
              {mission.countLabel}：{result.count}
              {mission.selfBest
                ? result.points > mission.selfBest.points
                  ? `／自己ベスト更新（前回 ${mission.selfBest.points}点）`
                  : `／自己ベスト ${mission.selfBest.points}点まであと ${mission.selfBest.points - result.points}点`
                : "／初めての記録です"}
              {result.points >= tier.points ? `／目標ティア「${tier.label}」に到達` : `／目標「${tier.label}」まであと ${tier.points - result.points}点`}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button variant="outlined" onClick={() => { setOutcomes({}); setResult(null); }} sx={{ fontWeight: 800 }}>もう一度挑戦する</Button>
            <Button variant="contained" onClick={() => router.push("/missions")} sx={{ fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>発展ミッション一覧へ</Button>
          </Box>
        )}
      </Box>

      {/* ワークスペース */}
      <Box sx={{ flex: 1, minHeight: 0, display: { xs: "block", md: "grid" }, gridTemplateColumns: "minmax(0, 1.5fr) minmax(340px, 1fr)", gap: 2, overflowY: { xs: "auto", md: "hidden" } }}>
        <Box sx={{ display: "flex", flexDirection: "column", border: "2px solid #dbe3ef", borderRadius: 3, bgcolor: "#fff", overflow: "hidden", minHeight: { xs: 420, md: 0 }, "&:focus-within": { borderColor: "#2563eb" } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, borderBottom: "1px solid #eef2f7", flexWrap: "wrap" }}>
            <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mr: 1 }}>Pythonコード</Typography>
            <Button size="small" variant="outlined" disabled={running || runtime !== "ready"} onClick={runFree} sx={{ fontWeight: 800 }}>試しに実行</Button>
            <Button size="small" variant="contained" disabled={running || runtime !== "ready"} onClick={runTests} sx={{ fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>テストとスコアを実行</Button>
            <Typography component="p" role="status" sx={{ fontSize: 13, ml: "auto" }}>
              {runtime === "loading" ? "実行環境を準備しています…" : runtime === "error" ? "実行環境を読み込めませんでした" : running ? "実行中…" : "実行できます。"}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <Editor
              language="python"
              theme={LEARNING_EDITOR_THEME}
              beforeMount={setupLearningEditor}
              value={code}
              onChange={(v) => persist(v ?? "")}
              onMount={onMount}
              options={{ minimap: { enabled: false }, fontSize: 15, lineHeight: 1.7, scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 12 } }}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", border: "1px solid #dbe3ef", borderRadius: 3, bgcolor: "#fff", overflow: "hidden", minHeight: { xs: 360, md: 0 } }}>
          <Tabs value={panel} onChange={(_, v) => setPanel(v)} variant="fullWidth" sx={{ borderBottom: "1px solid #eef2f7", minHeight: 44 }}>
            <Tab value="statement" label="問題" sx={{ fontWeight: 800, minHeight: 44, fontSize: 13.5, px: 0.5 }} />
            <Tab value="tests" label="テスト" sx={{ fontWeight: 800, minHeight: 44, fontSize: 13.5, px: 0.5 }} />
            <Tab value="console" label="コンソール" sx={{ fontWeight: 800, minHeight: 44, fontSize: 13.5, px: 0.5 }} />
            <Tab value="hints" label="ヒント" sx={{ fontWeight: 800, minHeight: 44, fontSize: 13.5, px: 0.5 }} />
            <Tab value="cards" label="カード" sx={{ fontWeight: 800, minHeight: 44, fontSize: 13.5, px: 0.5 }} />
          </Tabs>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
            {panel === "statement" && (
              <Box>
                <Typography component="p" sx={{ fontSize: 16, fontWeight: 900, mb: 1 }}>{mission.title}</Typography>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 1.5 }}>入力</Typography>
                <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.8 }}>{mission.statement.inputFormat}</Typography>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 1.5 }}>出力</Typography>
                <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.8 }}>{mission.statement.outputFormat}</Typography>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 1.5 }}>条件</Typography>
                {mission.statement.conditions.map((c) => (
                  <Typography key={c} component="p" sx={{ fontSize: 15, lineHeight: 1.8 }}>・{c}</Typography>
                ))}
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 1.5 }}>入力の例</Typography>
                <Box component="pre" sx={{ m: 0, mt: 0.5, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 13.5, overflowX: "auto" }}>{mission.statement.exampleInput}</Box>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 1.5 }}>出力の例</Typography>
                <Box component="pre" sx={{ m: 0, mt: 0.5, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 13.5, overflowX: "auto" }}>{mission.statement.exampleOutput}</Box>
              </Box>
            )}
            {panel === "tests" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography component="p" sx={{ fontSize: 15, fontWeight: 700 }}>
                  {passedCount} / {mission.tests.length} 件通過
                </Typography>
                {mission.tests.map((t) => {
                  const o = outcomes[t.id];
                  return (
                    <Box key={t.id} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography component="p" sx={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{t.label}</Typography>
                        {t.scoring && <Chip size="small" label="スコア計測" sx={{ bgcolor: "#fef3c7", fontWeight: 700 }} />}
                        {stamp(o)}
                      </Box>
                      <Box component="pre" sx={{ m: 0, mt: 1, p: 1, bgcolor: "#f8fafc", borderRadius: 1, fontFamily: "monospace", fontSize: 12.5, overflowX: "auto", maxHeight: 120, overflowY: "auto" }}>{t.input}</Box>
                      {o?.status === "fail" && (
                        <Typography component="p" sx={{ fontSize: 14, mt: 1 }}>
                          あなたの答え：{o.answer || "（出力なし）"}／期待する答え：{t.expectedAnswer}
                        </Typography>
                      )}
                      {o?.status === "error" && (
                        <Typography component="p" sx={{ fontSize: 14, mt: 1, whiteSpace: "pre-wrap" }}>{o.error}</Typography>
                      )}
                      {o?.status === "pass" && typeof o.count === "number" && (
                        <Typography component="p" sx={{ fontSize: 14, mt: 1 }}>{mission.countLabel}：{o.count}</Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
            {panel === "console" && (
              <Box>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700 }}>入力（最初のテスト）</Typography>
                <Box component="pre" sx={{ m: 0, mt: 0.5, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 13, overflowX: "auto" }}>{mission.tests[0].input}</Box>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 2 }}>出力</Typography>
                {freeOut
                  ? <Box component="pre" sx={{ m: 0, mt: 0.5, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 13.5, whiteSpace: "pre-wrap" }}>{freeOut.error ?? (freeOut.stdout || "（出力なし）")}</Box>
                  : <Typography component="p" sx={{ fontSize: 15, mt: 0.5 }}>「試しに実行」を押すと、ここに出力が表示されます。</Typography>}
              </Box>
            )}
            {panel === "hints" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {mission.hints.map((h, i) => (
                  <Box key={h} sx={{ display: "flex", gap: 1.25 }}>
                    <Box sx={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", bgcolor: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900 }}>{i + 1}</Box>
                    <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.8 }}>{h}</Typography>
                  </Box>
                ))}
                <Typography component="p" sx={{ fontSize: 14 }}>解き方そのものは示しません。考え方の手がかりだけを置いています。</Typography>
              </Box>
            )}
            {panel === "cards" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.7 }}>
                  このミッションに関連する知識カードです。持っているカードは中身を確認できます。
                </Typography>
                {relatedCards.map((card) => {
                  const owned = ownedCardIds.has(card.id);
                  const open = openCard === card.id;
                  return (
                    <Box key={card.id} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography component="p" sx={{ fontSize: 15, fontWeight: 800, flex: 1 }}>{card.title}</Typography>
                        <Chip size="small" label={card.label} variant="outlined" />
                        <Chip size="small" label={owned ? "所持" : "未所持"} sx={owned ? { bgcolor: "#dcfce7", color: "#166534", fontWeight: 700 } : { bgcolor: "#eef2f7", fontWeight: 700 }} />
                      </Box>
                      {owned ? (
                        <>
                          <Button size="small" onClick={() => setOpenCard(open ? null : card.id)} sx={{ fontWeight: 800, px: 0, mt: 0.5 }}>
                            {open ? "閉じる" : "中身を見る"}
                          </Button>
                          {open && (
                            <Box sx={{ mt: 0.5 }}>
                              <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.8 }}>{card.description}</Typography>
                              <Typography component="p" sx={{ fontSize: 14, lineHeight: 1.8, mt: 0.75 }}>使いどころ：{card.useCase}</Typography>
                            </Box>
                          )}
                        </>
                      ) : (
                        <Typography component="p" sx={{ fontSize: 14, mt: 0.5 }}>プレビュー：{card.label}についてのカードです。単元で獲得すると中身を開けます。</Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function MissionChallengePage({ missionId }: { missionId: string }) {
  const mission = findDevelopmentMission(missionId);
  return (
    <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", bgcolor: "#f5f8fc" }}>
      <Box sx={{ flexShrink: 0, px: 2.5, pt: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Button onClick={() => { window.location.href = "/missions"; }} sx={{ fontWeight: 800, px: 0 }}>← 発展ミッション一覧へ</Button>
        <Typography component="p" sx={{ fontSize: 15 }}>発展ミッション／{mission?.title ?? ""}</Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, px: 2.5, pb: 2.5, pt: 1.5 }}>
        <MissionChallengeDraft missionId={missionId} />
      </Box>
    </Box>
  );
}
