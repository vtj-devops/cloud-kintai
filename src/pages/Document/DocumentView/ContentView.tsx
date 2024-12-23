import "@blocknote/core/style.css";

import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView, useBlockNote } from "@blocknote/react";

export default function ContentView({ content }: { content: string }) {
  const editor: BlockNoteEditor = useBlockNote({
    editable: false,
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
  });

  return <BlockNoteView editor={editor} style={{ padding: 0, margin: 0 }} />;
}
