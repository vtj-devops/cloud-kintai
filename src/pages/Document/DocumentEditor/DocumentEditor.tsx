import {
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Storage } from "aws-amplify";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAppDispatchV2 } from "../../../app/hooks";
import Title from "../../../components/Title/Title";
import * as MESSAGE_CODE from "../../../errors";
import fetchDocument from "../../../hooks/useDocuments/fetchDocument";
import updateDocumentData from "../../../hooks/useDocuments/updateDocumentData";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "../../../lib/reducers/snackbarReducer";
import { defaultValues, DocumentInputs } from "./common";
import ContentBlockNoteEditor from "./ContentBlockNoteEditor";

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

export default function DocumentEditor() {
  const navigate = useNavigate();
  const dispatch = useAppDispatchV2();
  const { documentId } = useParams();

  const { register, control, setValue, handleSubmit } = useForm<DocumentInputs>(
    {
      mode: "onChange",
      defaultValues,
    }
  );

  const [documentTitle, setDocumentTitle] = useState<string | null | undefined>(
    undefined
  );

  const [documentContent, setDocumentContent] = useState<
    string | null | undefined
  >(undefined);

  const onSubmit = (data: DocumentInputs) => {
    if (!documentId) return;

    updateDocumentData({
      id: documentId,
      title: data.title,
      content: data.content,
      targetRole: data.targetRole,
    })
      .then(() => {
        dispatch(setSnackbarSuccess(MESSAGE_CODE.S13003));
        navigate(`/docs/${documentId}`);
      })
      .catch(() => dispatch(setSnackbarError(MESSAGE_CODE.E13003)));
  };

  useEffect(() => {
    if (!documentId) return;

    fetchDocument(documentId)
      .then(async (res) => {
        const updatedContent = await updateImageUrl(res.content);
        setDocumentTitle(res.title);
        setDocumentContent(updatedContent);

        setValue("title", res.title);
        setValue("content", updatedContent);

        const targetRole = res.targetRole
          ? res.targetRole.filter(
              (item): item is NonNullable<typeof item> => item !== null
            )
          : [];
        setValue("targetRole", targetRole);
      })
      .catch(() => {
        dispatch(setSnackbarError(MESSAGE_CODE.E13001));
      });
  }, [documentId]);

  if (!documentId) {
    return null;
  }

  if (!documentTitle || !documentContent) {
    return null;
  }

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
          <Link to={`/docs/${documentId}`} color="inherit">
            {documentTitle}
          </Link>
          <Typography color="text.primary">編集</Typography>
        </Breadcrumbs>
      </Box>
      <Title>ドキュメント編集</Title>
      <Container maxWidth="md">
        <Stack direction="column" spacing={2}>
          <Box>
            <Button
              variant="contained"
              size="medium"
              onClick={handleSubmit(onSubmit)}
            >
              保存
            </Button>
          </Box>
          <TextField {...register("title")} />
          <Controller
            name="targetRole"
            control={control}
            render={({ field }) => (
              <Autocomplete
                value={field.value}
                multiple
                options={["スタッフ", "管理者"]}
                renderInput={(params) => (
                  <TextField {...params} label="対象者" />
                )}
                onChange={(_, data) => {
                  field.onChange(data);
                }}
              />
            )}
          />
          <Paper elevation={3}>
            <ContentBlockNoteEditor
              content={documentContent}
              setValue={setValue}
            />
          </Paper>
        </Stack>
      </Container>
    </>
  );
}
