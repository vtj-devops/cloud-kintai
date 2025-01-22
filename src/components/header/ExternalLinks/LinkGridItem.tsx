import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import LinkIcon from "@mui/icons-material/Link";
import TrainIcon from "@mui/icons-material/Train";
import { Grid, Link, Stack, Typography } from "@mui/material";

export function LinkGridItem({
  url,
  title,
  iconType,
}: {
  url: string;
  title: string;
  iconType: string;
}) {
  const IconMap = new Map<string, JSX.Element>([
    ["link", <LinkIcon key="link" fontSize="large" />],
    ["train", <TrainIcon key="train" fontSize="large" />],
    ["holiday", <BeachAccessIcon key="holiday" fontSize="large" />],
  ]);

  return (
    <Grid item xs={4}>
      <Link href={url} target="_blank" color={"inherit"} underline="none">
        <Stack
          direction="column"
          spacing={0}
          alignItems="center"
          sx={{
            p: 1,
            "&:hover": {
              backgroundColor: "#f0f0f0",
            },
          }}
        >
          {IconMap.get(iconType)}
          <Typography variant="caption">{title}</Typography>
        </Stack>
      </Link>
    </Grid>
  );
}
