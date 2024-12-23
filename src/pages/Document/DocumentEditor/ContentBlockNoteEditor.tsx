import "@blocknote/core/style.css";

import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import { Storage } from "aws-amplify";
import { UseFormSetValue } from "react-hook-form";

import { DocumentInputs } from "./common";

export default function ContentBlockNoteEditor({
  content,
  setValue,
}: {
  content: string;
  setValue: UseFormSetValue<DocumentInputs>;
}) {
  const editor: BlockNoteEditor = useBlockNote({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    initialContent: (() => {
      if (!content) return undefined;

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(content);
      } catch (e) {
        return undefined;
      }
    })(),
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

  return <BlockNoteView editor={editor} />;
}
