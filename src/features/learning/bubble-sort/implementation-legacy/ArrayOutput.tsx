import { Box, Typography } from "@mui/material";
import { playerTokens } from "../../player/player.tokens";
import { BookShelfFigure } from "./BookShelfFigure";
import { bubbleSortImplementationContent as content } from "./implementation.content";
import { arrayDifferences, isDrawableArrayValue } from "./implementation";

const labels = content.display;

/**
 * 戻り値のリストを、ミッションと同じ本棚の絵で描く。期待する並びと長さが同じなら、
 * 期待と違う場所を主色の枠で示し、件数を併記する（色だけに頼らない）。
 */
export function ArrayOutput({ expected, actual, height = 210 }: { expected: unknown; actual: unknown; height?: number }) {
  if (!isDrawableArrayValue(actual)) return <Typography component="p" sx={{ fontSize: 16 }}>{labels.invalid}</Typography>;
  const differences = arrayDifferences(expected, actual);
  const ghost = differences && differences.length > 0 && isDrawableArrayValue(expected) ? expected : undefined;
  return <>
    {ghost && <Box sx={{ display: "flex", gap: 2, mb: 0.75, alignItems: "center" }}>
      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 14 }}>
        <Box aria-hidden sx={{ width: 14, height: 14, bgcolor: "#7d8ca3", borderRadius: 0.5 }} />あなたの結果
      </Box>
      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 14 }}>
        <Box aria-hidden sx={{ width: 14, height: 14, border: "2px dashed #64748b", borderRadius: 0.5 }} />期待する並び
      </Box>
    </Box>}
    <Box sx={{ height, display: "flex", bgcolor: playerTokens.surface, border: "1px solid #e5e7eb", borderRadius: 1, my: 1 }}>
      <BookShelfFigure values={actual} differences={differences ?? []} ghost={ghost} label="作られた並び" />
    </Box>
    {differences === null
      ? <Typography component="p" sx={{ fontSize: 16 }}>{labels.lengthMismatch}</Typography>
      : differences.length > 0 && <Typography component="p" data-array-different-count={differences.length} sx={{ fontSize: 16 }}>
          {labels.different.replace("{count}", String(differences.length))}
        </Typography>}
  </>;
}
