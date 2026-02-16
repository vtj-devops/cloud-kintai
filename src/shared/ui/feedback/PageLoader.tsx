import { CircularProgress, Typography } from "@mui/material";

export default function PageLoader() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-1"
      role="status"
      aria-live="polite"
    >
      <CircularProgress size={32} />
      <Typography variant="body2" color="text.secondary">
        読み込み中です…
      </Typography>
    </div>
  );
}
