import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

interface TestFileOptions {
  readonly name?: string;
  readonly type?: string;
}

export function createTestFile(content: string, options: TestFileOptions = {}) {
  const { name = "test.csv", type = "text/csv" } = options;
  return new File([content], name, { type });
}

export function setFileInputFiles(file: File) {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const fileList = {
    0: file,
    length: 1,
    item: (index: number) => (index === 0 ? file : null),
    [Symbol.iterator]: function* iterator() {
      yield file;
    },
  };

  Object.defineProperty(fileInput, "files", {
    value: fileList,
    configurable: true,
  });

  fireEvent.change(fileInput);
}

export async function openFileBulkAddDialog() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /ファイルからまとめて追加/ }));
}

export function simulateCsvUpload(
  csvContent: string,
  fileOptions: TestFileOptions = {},
) {
  type FileReaderOnloadHandler = (event: ProgressEvent<FileReader>) => void;
  const readerCallbacks: { onload?: FileReaderOnloadHandler } = {};

  const mockReader = {
    readAsText: jest.fn(),
    result: csvContent,
    set onload(cb: NonNullable<FileReader["onload"]>) {
      readerCallbacks.onload = cb as FileReaderOnloadHandler;
    },
  } as unknown as FileReader;

  jest.spyOn(window, "FileReader").mockImplementation(() => mockReader);

  setFileInputFiles(createTestFile(csvContent, fileOptions));
  readerCallbacks.onload?.({} as ProgressEvent<FileReader>);
}
