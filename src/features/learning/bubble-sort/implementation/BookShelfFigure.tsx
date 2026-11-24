import { Box } from "@mui/material";

/**
 * 並びを、ミッションのサムネイルと同じ本棚の世界で描く。
 * 同じ課題だと分かる担い手は絵と色なので、棚・本の色・背の数字は
 * サムネイル（MissionThumbnail）と同一の語彙にする。本の高さは値に比例。
 * differences の位置は主色の枠で示す（色だけに頼らないための併記は呼び出し側の件数文）。
 */
const PALETTE = ["#7d8ca3", "#a3826d", "#7da383", "#8d7da3", "#a37d7d"] as const;

export function BookShelfFigure({ values, differences = [], label }: {
  values: readonly number[];
  differences?: readonly number[];
  label: string;
}) {
  const max = Math.max(...values, 1);
  const n = values.length;
  const shelfX = 22, shelfW = 416, shelfY = 126;
  const gap = 6;
  const bookW = Math.min(44, (shelfW - gap * (n + 1)) / Math.max(n, 1));
  const totalW = bookW * n + gap * Math.max(n - 1, 0);
  const startX = shelfX + (shelfW - totalW) / 2;
  return (
    <Box component="svg" viewBox="0 0 460 210" sx={{ width: "100%", height: "100%", display: "block" }}
      role="img" aria-label={label}>
      <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
      <rect x="26" y="126" width="9" height="58" fill="#8d6e63" />
      <rect x="425" y="126" width="9" height="58" fill="#8d6e63" />
      {values.map((value, index) => {
        const h = 26 + (value / max) * 74;
        const x = startX + index * (bookW + gap);
        const different = differences.includes(index);
        return (
          <g key={index}>
            <rect x={x} y={shelfY - h} width={bookW} height={h} rx="3"
              fill={PALETTE[index % PALETTE.length]}
              stroke={different ? "#2563eb" : "none"} strokeWidth={different ? 3.5 : 0} />
            <text x={x + bookW / 2} y={shelfY - h / 2 + 6} textAnchor="middle"
              fontSize="16" fontWeight="900" fill="#ffffff">{value}</text>
          </g>
        );
      })}
      <rect x="22" y="126" width="416" height="9" rx="3" fill="#8d6e63" />
    </Box>
  );
}
