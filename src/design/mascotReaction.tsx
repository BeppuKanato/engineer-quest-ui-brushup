"use client";

// 結果画面でのキャラクターの反応の試作（デザイン用）。
// 方式は方針3章の決定どおり：状態ごとの表情の切り替え＋全体の動き（Motion）。
// 出来事の瞬間に表情が切り替わり、跳ねの強さは実績のレアリティで変わる。
// 2026-11-27：キャラは全体ロボ化に合わせて RobotFigure（SVG）に差し替え。

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RobotFigure } from "@/app/component/robotFigure";

export type ReactionStrength = 1 | 2 | 3;
type FaceState = "normal" | "surprise" | "celebrate";

const LINES: Record<ReactionStrength, string> = {
  1: "フェーズをクリアしたね",
  2: "実績が開いたよ。次の単元まであと少し",
  3: "単元クリア！ 実績も開いたよ",
};

export default function MascotReaction({ size = 220 }: { size?: number }) {
  const reduceMotion = useReducedMotion();
  const [face, setFace] = useState<FaceState>("normal");
  const [strength, setStrength] = useState<ReactionStrength>(2);
  const [line, setLine] = useState<string>("");
  const [jumpKey, setJumpKey] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const play = (s: ReactionStrength) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStrength(s);
    setLine("");
    setFace("normal");
    // 結果が出る瞬間に驚きへ切り替わり、続けてお祝いと跳ね。
    timers.current.push(setTimeout(() => setFace("surprise"), 550));
    timers.current.push(
      setTimeout(() => {
        setFace("celebrate");
        setLine(LINES[s]);
        setJumpKey((k) => k + 1);
      }, 1050),
    );
  };

  const jump =
    strength === 1
      ? { y: [0, -6, 0], scaleX: [1, 1, 1], scaleY: [1, 0.98, 1], rotate: [0, 0, 0] }
      : strength === 2
        ? {
            y: [0, -28, 0, -9, 0],
            scaleX: [1, 0.96, 1.05, 0.99, 1],
            scaleY: [1, 1.05, 0.93, 1.02, 1],
            rotate: [0, 0, 0, 0, 0],
          }
        : {
            y: [0, -68, 0, -22, 0],
            scaleX: [1, 0.92, 1.1, 0.98, 1],
            scaleY: [1, 1.1, 0.88, 1.04, 1],
            rotate: [0, -2, 2, 0, 0],
          };
  const jumpDuration = strength === 1 ? 0.45 : strength === 2 ? 0.7 : 0.95;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button type="button" onClick={() => play(1)}>
          弱（コモン相当）
        </button>
        <button type="button" onClick={() => play(2)}>
          中（レア相当）
        </button>
        <button type="button" onClick={() => play(3)}>
          強（エピック相当）
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
        <motion.div
          key={jumpKey}
          animate={jumpKey === 0 || reduceMotion ? { y: 0, scaleX: 1, scaleY: 1, rotate: 0 } : jump}
          transition={{ duration: jumpDuration, ease: "easeOut", times: undefined }}
          style={{ width: size, height: size, position: "relative", flexShrink: 0 }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={face}
              initial={{ opacity: 0, scale: face === "surprise" ? 1.06 : 1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              style={{
                position: "absolute",
                inset: 0,
              }}
            >
              <RobotFigure alt="" state={face} size="XL" grounding="shadow" sx={{ width: "100%", height: "100%" }} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <div
          aria-live="polite"
          style={{
            minHeight: 48,
            maxWidth: 320,
            padding: "10px 14px",
            borderRadius: 12,
            background: "var(--hatch-widget-surface, #f3f4f6)",
            color: "inherit",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          {line || "ボタンを押すと、結果が出た想定で反応します"}
        </div>
      </div>
    </div>
  );
}
