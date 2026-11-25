"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  createQuestPost,
  getQuestBoardPosts,
  type QuestPostCategory,
  type QuestPostSummary,
} from "@/api/questBoard.api";
import { StatusChip, isResolvableCategory } from "./BoardChips";
import { useUserSession } from "@/app/component/userSession";
import { developmentMissionThumbnailFor } from "@/design/DevelopmentMissionThumbnail";

export type QuickPostPreset = {
  category: QuestPostCategory;
  courseId?: string;
  /** 文脈の表示名（例：幅優先探索（BFS） › 発展ミッション『ダンジョンの最短脱出』）。 */
  contextLabel: string;
  /** 添付候補のコード（チェックしたときだけ付く）。 */
  code?: string;
  /** 作品共有のときに付く成果。 */
  mission?: { id: string; title: string; score?: number; rank?: string };
};

const dialogTitles: Record<string, string> = {
  QUESTION: "仲間に質問する",
  ERROR_HELP: "仲間に相談する",
  WORK_SHARE: "成果を共有する",
};

const bodyLabels: Record<string, string> = {
  QUESTION: "何が分かりませんか？",
  ERROR_HELP: "何が起きましたか？",
  WORK_SHARE: "工夫したことや感想",
  MEMO: "メモの内容",
};

const bodyPlaceholders: Record<string, string> = {
  QUESTION: "例：キューから取り出すタイミングが分からない",
  ERROR_HELP: "例：テスト3で、期待した出力と違う並びになります",
  WORK_SHARE: "例：ゴールに着いたらすぐ止めるようにしたら点が伸びました",
  MEMO: "学んだことを自分の言葉で",
};

/**
 * 学習の流れの中から、その場で投稿するための小さな投稿UI。
 * 種類・関連単元・文脈は呼び出し元が決め、学習者は本文を書くだけ。
 * タイトルは本文の冒頭から自動で作る。掲示板は非同期なので、
 * 回答がこの場に返らないことは面に書く。
 */
export function QuickPostDialog({
  open,
  onClose,
  preset,
}: {
  open: boolean;
  onClose: () => void;
  preset: QuickPostPreset | null;
}) {
  const router = useRouter();
  const { token } = useUserSession();
  const [body, setBody] = useState("");
  const [attachCode, setAttachCode] = useState(false);
  const [related, setRelated] = useState<QuestPostSummary[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postedId, setPostedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBody("");
    setAttachCode(false);
    setPostedId(null);
    setError(null);
    setRelated([]);
    if (token && preset?.courseId && (preset.category === "QUESTION" || preset.category === "ERROR_HELP")) {
      getQuestBoardPosts(token, { courseId: preset.courseId })
        .then((data) => setRelated(data.posts.slice(0, 3)))
        .catch(() => setRelated([]));
    }
  }, [open, preset, token]);

  if (!preset) return null;
  const category = preset.category;
  const canSubmit = body.trim().length >= 10 && !isSubmitting && Boolean(token);

  const handleSubmit = async () => {
    if (!token || !canSubmit) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const title = body.replace(/\s+/g, " ").trim().slice(0, 60);
      const result = await createQuestPost(token, {
        category,
        title,
        body: body.trim(),
        code: attachCode && preset.code ? preset.code : undefined,
        courseId: preset.courseId,
        missionId: preset.mission?.id,
      });
      setPostedId(result.postId);
    } catch {
      setError("投稿できませんでした。もう一度試してください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 3, m: 2 } } }}
    >
      <Box sx={{ p: 3 }}>
        {postedId ? (
          <Box sx={{ textAlign: "center", py: 1 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 52, color: "#16a34a" }} />
            <Typography sx={{ fontSize: 22, fontWeight: 900, mt: 1 }}>投稿しました</Typography>
            <Typography sx={{ fontSize: 16, mt: 1, lineHeight: 1.8 }}>
              回答やコメントは掲示板に届きます。
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", mt: 3, flexWrap: "wrap" }}>
              <Button onClick={onClose} sx={{ fontWeight: 800 }}>閉じる</Button>
              <Button
                variant="contained"
                onClick={() => { onClose(); router.push(`/quest-board/${encodeURIComponent(postedId)}`); }}
                sx={{ fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
              >
                掲示板で見る
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Typography sx={{ fontSize: 22, fontWeight: 900 }}>
              {dialogTitles[category] ?? "掲示板に投稿する"}
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 700, mt: 1.25, color: "#2563eb" }}>
              {preset.contextLabel}
            </Typography>

            {preset.mission && (
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mt: 2, p: 1.5, border: "1px solid #e2e8f0", borderRadius: 2 }}>
                <Box sx={{ width: 84, height: 60, borderRadius: 1.5, overflow: "hidden", flexShrink: 0, "& svg": { width: "100%", height: "100%", display: "block" } }}>
                  {developmentMissionThumbnailFor(preset.mission.id)}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{preset.mission.title}</Typography>
                  {typeof preset.mission.score === "number" && (
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                      {preset.mission.score}点{preset.mission.rank ? ` ・ ${preset.mission.rank}ランク` : ""}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {related.length > 0 && (
              <Box sx={{ mt: 2.5 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 1 }}>同じ単元の投稿</Typography>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {related.map((post) => (
                    <Box
                      key={post.id}
                      component={Link}
                      href={`/quest-board/${encodeURIComponent(post.id)}`}
                      onClick={onClose}
                      sx={{
                        display: "flex", gap: 1, alignItems: "center", py: 1,
                        borderTop: "1px solid #e2e8f0", color: "inherit", textDecoration: "none",
                        "&:hover": { bgcolor: "#f8fafc" },
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {post.title}
                        </Typography>
                      </Box>
                      {isResolvableCategory(post.category) && (
                        <StatusChip status={post.status} commentCount={post.commentCount} />
                      )}
                      <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                        {isResolvableCategory(post.category) ? "回答" : "コメント"} {post.commentCount}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 2.5 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 1 }}>
                {bodyLabels[category] ?? "内容"}
              </Typography>
              <TextField
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={bodyPlaceholders[category] ?? ""}
                multiline
                minRows={4}
                fullWidth
                autoFocus
              />
              <Typography sx={{ fontSize: 14, mt: 0.75 }}>
                {body.trim().length < 10 ? "10文字以上で入力してください" : `${body.trim().length}文字`}
              </Typography>
            </Box>

            {preset.code && (
              <FormControlLabel
                control={<Checkbox checked={attachCode} onChange={(event) => setAttachCode(event.target.checked)} />}
                label="現在のコードを添付する"
                sx={{ mt: 0.5, "& .MuiFormControlLabel-label": { fontSize: 14, fontWeight: 700 } }}
              />
            )}

            <Typography sx={{ fontSize: 14, mt: 1.5, lineHeight: 1.7 }}>
              掲示板に公開されます。回答は掲示板に届きます（この画面には返ってきません）。
            </Typography>
            {error && (
              <Typography sx={{ fontSize: 14, mt: 1, fontWeight: 700 }}>{error}</Typography>
            )}

            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", mt: 2.5 }}>
              <Button onClick={onClose} sx={{ fontWeight: 800 }}>キャンセル</Button>
              <Button
                variant="contained"
                disabled={!canSubmit}
                onClick={handleSubmit}
                sx={{ minHeight: 44, px: 3, fontWeight: 900, borderRadius: 2, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
              >
                {isSubmitting ? "投稿中..." : category === "WORK_SHARE" ? "成果を共有する" : "投稿する"}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Dialog>
  );
}
