import { Button } from "@mui/material";

type ChangeRequestQuickViewButtonProps = {
  badgeContent: number;
  onClick: () => void;
};

export function ChangeRequestQuickViewButton({
  badgeContent,
  onClick,
}: ChangeRequestQuickViewButtonProps) {
  if (badgeContent <= 0) {
    return null;
  }

  return (
    <Button
      size="small"
      variant="contained"
      color="warning"
      sx={{ fontWeight: "bold" }}
      onClick={onClick}
      data-testid="quick-view-change-request"
    >
      申請確認
    </Button>
  );
}
