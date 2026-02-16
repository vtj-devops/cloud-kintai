import { Button, Container, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { designTokenVar } from "@/shared/designSystem";

const PAGE_PADDING_TOP = designTokenVar("component.page.paddingTop", "24px");
const PAGE_SECTION_GAP = designTokenVar("component.page.sectionGap", "16px");

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container
      maxWidth="xl"
      disableGutters
      className="pt-6"
      style={{ paddingTop: PAGE_PADDING_TOP }}
    >
      <Stack
        direction="column"
        spacing={0}
        alignItems="center"
        justifyContent="center"
        className="min-h-[60vh]"
        style={{ gap: PAGE_SECTION_GAP }}
      >
        <div className="py-4 text-center">
          {/* 404コード */}
          <Typography
            variant="h1"
            component="div"
            className="mb-2 text-[72px] font-bold leading-none text-primary md:text-[120px]"
          >
            404
          </Typography>

          {/* メインメッセージ */}
          <Typography
            variant="h2"
            component="h1"
            className="mb-1 text-2xl font-semibold text-foreground md:text-[32px]"
          >
            ページが見つかりません
          </Typography>

          {/* サブメッセージ */}
          <Typography
            variant="body1"
            className="mb-4 max-w-[500px] text-sm text-[var(--ds-color-neutral-600,#5E726A)] md:text-base"
          >
            お探しのページは存在しないか、移動された可能性があります。
            <br />
            ホームページに戻るか、前のページに戻ってください。
          </Typography>

          {/* アクションボタン */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
            className="mt-4"
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleGoHome}
              className="min-w-40"
            >
              ホームに戻る
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={handleGoBack}
              className="min-w-40"
            >
              前のページに戻る
            </Button>
          </Stack>
        </div>
      </Stack>
    </Container>
  );
}
