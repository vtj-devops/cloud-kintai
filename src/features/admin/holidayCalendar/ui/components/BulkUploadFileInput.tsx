import { Box, Typography } from "@mui/material";
import { AppButton } from "@shared/ui/button";
import { useState } from "react";

type BulkUploadFileInputProps<TParsed> = {
  accept?: string;
  encoding: string;
  parse: (text: string, file: File) => TParsed;
  onParsed: (parsed: TParsed, file: File) => void;
  onFileSelected?: (file: File) => void;
  onParseError?: (error: unknown, file: File) => void;
  onReadError?: (file: File) => void;
  clearInputOnChange?: boolean;
  treatEmptyResultAsError?: boolean;
  fileName?: string;
  onFileNameChange?: (nextFileName: string | undefined) => void;
};

export function BulkUploadFileInput<TParsed>({
  accept = ".csv",
  encoding,
  parse,
  onParsed,
  onFileSelected,
  onParseError,
  onReadError,
  clearInputOnChange = false,
  treatEmptyResultAsError = false,
  fileName,
  onFileNameChange,
}: BulkUploadFileInputProps<TParsed>) {
  const [internalFileName, setInternalFileName] = useState<string | undefined>();
  const currentFileName = fileName ?? internalFileName;

  const setFileName = (nextFileName: string | undefined) => {
    onFileNameChange?.(nextFileName);
    if (fileName === undefined) {
      setInternalFileName(nextFileName);
    }
  };

  return (
    <Box>
      <AppButton as="label" variant="outline">
        ファイルを選択
        <input
          type="file"
          hidden
          accept={accept}
          onChange={(event) => {
            const uploadFile = event.target.files?.item(0);
            if (!uploadFile) {
              return;
            }

            onFileSelected?.(uploadFile);
            setFileName(uploadFile.name);

            const reader = new FileReader();
            reader.readAsText(uploadFile, encoding);
            reader.onload = (loadEvent) => {
              const result = loadEvent.target?.result ?? reader.result;
              if (typeof result !== "string") {
                onReadError?.(uploadFile);
                return;
              }

              if (treatEmptyResultAsError && result.length === 0) {
                onReadError?.(uploadFile);
                return;
              }

              try {
                onParsed(parse(result, uploadFile), uploadFile);
              } catch (error) {
                if (onParseError) {
                  onParseError(error, uploadFile);
                  return;
                }
                throw error;
              }
            };

            reader.onerror = () => {
              onReadError?.(uploadFile);
            };

            if (clearInputOnChange) {
              event.target.value = "";
            }
          }}
        />
      </AppButton>
      <Typography>{currentFileName}</Typography>
    </Box>
  );
}
