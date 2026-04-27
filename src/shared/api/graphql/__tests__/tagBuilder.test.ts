import { buildListAndItemTags } from "../tagBuilder";

describe("buildListAndItemTags", () => {
  const idExtractor = (item: { id?: string | null }) => item.id ?? "unknown";

  it("returns only the LIST tag when result is undefined", () => {
    expect(buildListAndItemTags("Staff", undefined, idExtractor)).toEqual([
      { type: "Staff", id: "LIST" },
    ]);
  });

  it("returns only the LIST tag when result is null", () => {
    expect(buildListAndItemTags("Staff", null, idExtractor)).toEqual([
      { type: "Staff", id: "LIST" },
    ]);
  });

  it("returns only the LIST tag when result is an empty array", () => {
    expect(buildListAndItemTags("Staff", [], idExtractor)).toEqual([
      { type: "Staff", id: "LIST" },
    ]);
  });

  it("returns LIST tag plus one tag per item", () => {
    const items = [{ id: "id-1" }, { id: "id-2" }];
    expect(buildListAndItemTags("Staff", items, idExtractor)).toEqual([
      { type: "Staff", id: "LIST" },
      { type: "Staff", id: "id-1" },
      { type: "Staff", id: "id-2" },
    ]);
  });

  it("uses the fallback value from idExtractor when id is undefined", () => {
    const items = [{ id: undefined }, { id: "id-2" }];
    expect(buildListAndItemTags("Staff", items, idExtractor)).toEqual([
      { type: "Staff", id: "LIST" },
      { type: "Staff", id: "unknown" },
      { type: "Staff", id: "id-2" },
    ]);
  });

  it("preserves the TagType string in every returned object", () => {
    const result = buildListAndItemTags("Workflow", [{ id: "w-1" }], idExtractor);
    result.forEach((tag) => {
      expect(tag.type).toBe("Workflow");
    });
  });

  it("works with a custom idExtractor that combines multiple fields", () => {
    const items = [
      { staffId: "s1", year: 2024 },
      { staffId: "s2", year: 2024 },
    ];
    const extractor = (item: { staffId: string; year: number }) =>
      `${item.staffId}:${item.year}`;
    expect(buildListAndItemTags("Stats", items, extractor)).toEqual([
      { type: "Stats", id: "LIST" },
      { type: "Stats", id: "s1:2024" },
      { type: "Stats", id: "s2:2024" },
    ]);
  });
});
