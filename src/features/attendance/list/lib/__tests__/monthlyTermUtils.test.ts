import { CloseDate } from "@shared/api/graphql/types";
import dayjs from "dayjs";

import { resolveMonthlyTerms } from "../monthlyTermUtils";

const palette = ["#90CAF9", "#A5D6A7", "#FFCC80"];

describe("resolveMonthlyTerms", () => {
  const currentMonth = dayjs("2024-01-01");

  it("returns single fallback term when closeDates is empty", () => {
    const terms = resolveMonthlyTerms(currentMonth, [], palette);
    expect(terms).toHaveLength(1);
    expect(terms[0].source).toBe("fallback");
    expect(terms[0].color).toBe(palette[0]);
  });

  it("returns fallback when closeDates is undefined", () => {
    const terms = resolveMonthlyTerms(currentMonth, undefined, palette);
    expect(terms).toHaveLength(1);
    expect(terms[0].source).toBe("fallback");
  });

  it("returns closeDate terms that overlap with the month", () => {
    const closeDates: CloseDate[] = [
      {
        __typename: "CloseDate",
        id: "cd-1",
        closeDate: "2024-01-15",
        startDate: "2024-01-01",
        endDate: "2024-01-15",
        createdAt: "",
        updatedAt: "",
      },
    ];
    const terms = resolveMonthlyTerms(currentMonth, closeDates, palette);
    expect(terms).toHaveLength(1);
    expect(terms[0].source).toBe("closeDate");
    expect(terms[0].color).toBe(palette[0]);
  });

  it("filters out closeDates that don't overlap with the month", () => {
    const closeDates: CloseDate[] = [
      {
        __typename: "CloseDate",
        id: "cd-1",
        closeDate: "2024-02-28",
        startDate: "2024-02-01",
        endDate: "2024-02-28",
        createdAt: "",
        updatedAt: "",
      },
    ];
    const terms = resolveMonthlyTerms(currentMonth, closeDates, palette);
    expect(terms).toHaveLength(1);
    expect(terms[0].source).toBe("fallback");
  });

  it("assigns colors cyclically from palette", () => {
    const closeDates: CloseDate[] = [
      { __typename: "CloseDate", id: "1", closeDate: "2024-01-10", startDate: "2024-01-01", endDate: "2024-01-10", createdAt: "", updatedAt: "" },
      { __typename: "CloseDate", id: "2", closeDate: "2024-01-20", startDate: "2024-01-11", endDate: "2024-01-20", createdAt: "", updatedAt: "" },
      { __typename: "CloseDate", id: "3", closeDate: "2024-01-31", startDate: "2024-01-21", endDate: "2024-01-31", createdAt: "", updatedAt: "" },
    ];
    const terms = resolveMonthlyTerms(currentMonth, closeDates, palette);
    expect(terms[0].color).toBe(palette[0]);
    expect(terms[1].color).toBe(palette[1]);
    expect(terms[2].color).toBe(palette[2]);
  });

  it("sorts terms by start date", () => {
    const closeDates: CloseDate[] = [
      { __typename: "CloseDate", id: "2", closeDate: "2024-01-31", startDate: "2024-01-21", endDate: "2024-01-31", createdAt: "", updatedAt: "" },
      { __typename: "CloseDate", id: "1", closeDate: "2024-01-10", startDate: "2024-01-01", endDate: "2024-01-10", createdAt: "", updatedAt: "" },
    ];
    const terms = resolveMonthlyTerms(currentMonth, closeDates, palette);
    expect(terms[0].start.isBefore(terms[1].start)).toBe(true);
  });

  it("uses mobile label format when variant is mobile", () => {
    const terms = resolveMonthlyTerms(currentMonth, [], palette, "mobile");
    expect(terms[0].label).not.toContain("年");
    expect(terms[0].label).toContain("〜");
  });
});
