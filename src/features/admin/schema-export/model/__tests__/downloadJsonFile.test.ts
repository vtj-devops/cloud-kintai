import { downloadJsonFile } from "../downloadJsonFile";

describe("downloadJsonFile", () => {
  const mockCreateObjectURL = jest.fn().mockReturnValue("blob:url");
  const mockRevokeObjectURL = jest.fn();
  const mockClick = jest.fn();

  beforeEach(() => {
    Object.defineProperty(window, "URL", {
      value: {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      },
      writable: true,
    });

    jest.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: mockClick,
    } as unknown as HTMLAnchorElement);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
    mockClick.mockClear();
  });

  it("データを JSON ファイルとしてダウンロードする", () => {
    downloadJsonFile({ key: "value" }, "test.json");
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:url");
  });

  it("anchor の download 属性にファイル名を設定する", () => {
    const anchor = {
      href: "",
      download: "",
      click: mockClick,
    } as unknown as HTMLAnchorElement;
    jest.spyOn(document, "createElement").mockReturnValue(anchor);

    downloadJsonFile({}, "export.json");
    expect(anchor.download).toBe("export.json");
  });

  it("Blob に application/json の Content-Type を指定する", () => {
    const originalBlob = global.Blob;
    const capturedArgs: ConstructorParameters<typeof Blob>[] = [];
    global.Blob = class extends originalBlob {
      constructor(...args: ConstructorParameters<typeof Blob>) {
        super(...args);
        capturedArgs.push(args);
      }
    };
    downloadJsonFile({ a: 1 }, "file.json");
    expect(capturedArgs[0][1]).toEqual({ type: "application/json;charset=utf-8" });
    global.Blob = originalBlob;
  });

  it("配列データも正常にダウンロードできる", () => {
    downloadJsonFile([1, 2, 3], "array.json");
    expect(mockClick).toHaveBeenCalledTimes(1);
  });
});
