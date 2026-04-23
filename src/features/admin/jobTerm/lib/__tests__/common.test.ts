import dayjs from "dayjs";

import { buildCandidateCloseDates } from "../common";

describe("buildCandidateCloseDates", () => {
  it("closeDates が空のとき、今月から 12 ヶ月分を返す", () => {
    const result = buildCandidateCloseDates([]);
    expect(result).toHaveLength(12);
    const now = dayjs().startOf("month");
    expect(result[0].isSame(now, "month")).toBe(true);
    expect(result[11].isSame(now.add(11, "month"), "month")).toBe(true);
  });

  it("closeDates が既存の月を含む場合、重複なしで返す", () => {
    const thisMonth = dayjs().startOf("month").toISOString();
    const result = buildCandidateCloseDates([
      { __typename: "CloseDate", closeDate: thisMonth, id: "cd001", owner: "owner", createdAt: "", updatedAt: "" },
    ]);
    // thisMonth は upcoming にも含まれるため、重複排除されて 12 件のまま
    expect(result).toHaveLength(12);
  });

  it("closeDates に未来にない月が含まれる場合、件数が増える", () => {
    const pastMonth = dayjs().subtract(2, "month").startOf("month").toISOString();
    const result = buildCandidateCloseDates([
      { __typename: "CloseDate", closeDate: pastMonth, id: "cd001", owner: "owner", createdAt: "", updatedAt: "" },
    ]);
    // 過去月は upcoming に含まれないため、合計13件
    expect(result).toHaveLength(13);
  });

  it("返り値は昇順にソートされている", () => {
    const pastMonth = dayjs().subtract(1, "month").startOf("month").toISOString();
    const result = buildCandidateCloseDates([
      { __typename: "CloseDate", closeDate: pastMonth, id: "cd001", owner: "owner", createdAt: "", updatedAt: "" },
    ]);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].valueOf()).toBeGreaterThanOrEqual(result[i - 1].valueOf());
    }
  });

  it("複数の同じ月を closeDates に渡しても重複しない", () => {
    const sameMonth = dayjs().add(6, "month").startOf("month").toISOString();
    const result = buildCandidateCloseDates([
      { __typename: "CloseDate", closeDate: sameMonth, id: "cd001", owner: "owner", createdAt: "", updatedAt: "" },
      { __typename: "CloseDate", closeDate: sameMonth, id: "cd002", owner: "owner", createdAt: "", updatedAt: "" },
    ]);
    // 6ヶ月後は upcoming にも含まれているため 12 件のまま
    expect(result).toHaveLength(12);
  });
});
