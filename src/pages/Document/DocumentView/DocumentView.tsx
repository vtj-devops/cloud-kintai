import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Storage } from "aws-amplify";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AttendanceDate } from "@/lib/AttendanceDate";

import { Document as APIDocument } from "../../../API";
import { useAppDispatchV2 } from "../../../app/hooks";
import * as MESSAGE_CODE from "../../../errors";
import fetchDocument from "../../../hooks/useDocuments/fetchDocument";
import { setSnackbarError } from "../../../lib/reducers/snackbarReducer";
import ContentView from "./ContentView";

async function updateImageUrl(content: string) {
  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  const json: any[] = JSON.parse(content);
  return Promise.all(
    json.map(async (block) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (block?.type === "image") {
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const url = new URL(block?.props?.url);
        const key = url.pathname.split("/").pop();
        if (!key) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return block;
        }

        const newUrl = await Storage.get(key).catch(() => null);
        if (newUrl) {
          // eslint-disable-next-line max-len
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
          block.props.url = newUrl;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return block;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return block;
    })
  )
    .then((res) => JSON.stringify(res))
    .catch(() => content);
}

export default function DocumentView() {
  const dispatch = useAppDispatchV2();
  const navigate = useNavigate();
  const { documentId } = useParams();

  const [document, setDocument] = useState<APIDocument | null | undefined>(
    undefined
  );

  if (!documentId) {
    return null;
  }

  useEffect(() => {
    fetchDocument(documentId)
      .then(async (res) => {
        const updatedContent = await updateImageUrl(res.content);
        res.content = updatedContent;
        setDocument(res);
      })
      .catch(() => {
        dispatch(setSnackbarError(MESSAGE_CODE.E13001));
        setDocument(null);
      });
  }, []);

  if (!document) {
    return null;
  }

  const makeDate = (target: dayjs.Dayjs) => {
    const now = dayjs();
    const diff = now.diff(target, "hour");

    if (diff >= 24) {
      return target.format(AttendanceDate.DisplayFormat);
    }

    if (diff >= 1) {
      return `${diff}時間前`;
    }

    const diff2 = now.diff(target, "minute");
    if (diff2 >= 1) {
      return `${diff2}分前`;
    }

    const diff3 = now.diff(target, "second");
    if (diff3 >= 1) {
      return `${diff3}秒前`;
    }

    return "0秒前";
  };

  return (
    <>
      <Box>
        <Breadcrumbs>
          <Link to="/" color="inherit">
            TOP
          </Link>
          <Link to="/docs" color="inherit">
            ドキュメント一覧
          </Link>
          <Typography color="text.primary">{document.title}</Typography>
        </Breadcrumbs>
      </Box>
      <Stack
        direction="column"
        spacing={2}
        sx={{
          px: {
            xs: 0,
            md: 3,
          },
        }}
      >
        <Stack direction="column" spacing={0}>
          <Box>
            <Typography variant="h4">{document.title}</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Box>
              <Typography variant="body2">
                {`作成日： ${makeDate(dayjs(document.createdAt))}`}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2">/</Typography>
            </Box>
            <Box>
              <Typography variant="body2">
                {`更新日： ${makeDate(dayjs(document.updatedAt))}`}
              </Typography>
            </Box>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1}>
          {document.targetRole ? (
            (() => {
              const targetRole = document.targetRole.filter(
                (item): item is NonNullable<typeof item> => item !== null
              );

              if (targetRole.length === 0) {
                return (
                  <Chip label="すべて" icon={<PersonIcon fontSize="small" />} />
                );
              }

              return targetRole.map((role, i) => (
                <Chip
                  label={role}
                  key={i}
                  icon={<PersonIcon fontSize="small" />}
                />
              ));
            })()
          ) : (
            <Chip label="すべて" icon={<PersonIcon fontSize="small" />} />
          )}
        </Stack>
        <Box>
          <Button
            variant="contained"
            size="medium"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/docs/${document.id}/edit`)}
          >
            編集
          </Button>
        </Box>
        <Box>
          <Paper elevation={1} sx={{ pt: 2 }}>
            <ContentView content={document.content} />
          </Paper>
        </Box>
      </Stack>
    </>
  );
}
