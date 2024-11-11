// cspell:ignore BlockNote, BlockNoteEditor
import "@blocknote/core/style.css";

import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import {
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Storage } from "aws-amplify";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useAppDispatchV2 } from "../../app/hooks";
import Title from "../../components/Title/Title";
import * as MESSAGE_CODE from "../../errors";
import createDocumentData from "../../hooks/useDocuments/createDocumentData";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "../../lib/reducers/snackbarReducer";

type Inputs = {
  title: string | null | undefined;
  content: string | null | undefined;
  targetRole: string[];
};

const defaultValues: Inputs = {
  title: undefined,
  content: undefined,
  targetRole: [],
};

export default function DocumentPoster() {
  const dispatch = useAppDispatchV2();
  const navigate = useNavigate();

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { isDirty, isValid, isSubmitting },
  } = useForm<Inputs>({
    mode: "onChange",
    defaultValues,
  });

  const onSubmit = (data: Inputs) => {
    if (!data.title || !data.content) {
      return;
    }

    const { title, content, targetRole } = data;
    createDocumentData({ title, content, targetRole })
      .then(() => {
        dispatch(setSnackbarSuccess(MESSAGE_CODE.S13002));
        navigate("/docs");
      })
      .catch(() => dispatch(setSnackbarError(MESSAGE_CODE.E13002)));
  };

  const editor: BlockNoteEditor = useBlockNote({
    onEditorContentChange(e) {
      setValue("content", JSON.stringify(e.topLevelBlocks));
    },
    uploadFile: async (file): Promise<string> => {
      const fileExtension = file.name.split(".").pop();

      if (!fileExtension) {
        throw new Error("ファイルの拡張子が取得できませんでした");
      }

      const fileBuffer = await file.arrayBuffer();
      const hashBuffer = await window.crypto.subtle.digest("SHA-1", fileBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((a) => a.toString(16).padStart(2, "0"))
        .join("");
      const fileName = `${hashHex}.${fileExtension}`;
      await Storage.put(fileName, file, {
        contentType: file.type,
      }).catch((err) => {
        throw err;
      });

      return Storage.get(fileName);
    },
  });

  return (
    <>
      <Breadcrumbs>
        <Link color="inherit" href="/">
          TOP
        </Link>
        <Link color="inherit" href="/docs">
          ドキュメント一覧
        </Link>
        <Typography color="text.primary">作成</Typography>
      </Breadcrumbs>
      <Title>ドキュメントの作成</Title>
      <Container maxWidth="md">
        <Stack direction="column" spacing={2}>
          <Box>
            <Button
              variant="contained"
              size="medium"
              onClick={handleSubmit(onSubmit)}
              disabled={!isDirty || !isValid || isSubmitting}
            >
              保存
            </Button>
          </Box>
          <TextField label="タイトル" size="small" {...register("title")} />
          <Controller
            name="targetRole"
            control={control}
            render={({ field }) => (
              <Autocomplete
                value={field.value}
                multiple
                options={["スタッフ", "管理者"]}
                renderInput={(params) => (
                  <TextField {...params} label="対象者" size="small" />
                )}
                onChange={(_, data) => {
                  field.onChange(data);
                }}
              />
            )}
          />
          <Paper elevation={3} sx={{ p: 3 }}>
            <BlockNoteView editor={editor} />
          </Paper>
        </Stack>
      </Container>
    </>
  );
}
