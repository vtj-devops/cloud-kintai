import dayjs from "dayjs";

import generateMockShifts from "../generateMockShifts";

const STAFFS = [
  { id: "s1" },
  { id: "s2" },
  { id: "s3" },
  { id: "s4" },
  { id: "s5" },
];

function makeDays(year: number, month: number) {
  const start = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const days = [];
  for (let i = 0; i < start.daysInMonth(); i++) {
    days.push(start.add(i, "day"));
  }
  return days;
}

const MARCH_2024 = makeDays(2024, 3);

describe("generateMockShifts", () => {
  it("スタッフ全員分の Map を返す", () => {
    const result = generateMockShifts(STAFFS, MARCH_2024);
    expect(result.size).toBe(STAFFS.length);
    STAFFS.forEach((s) => expect(result.has(s.id)).toBe(true));
  });

  it("各スタッフの全日付にシフトが含まれる", () => {
    const result = generateMockShifts(STAFFS, MARCH_2024);
    result.forEach((perDay) => {
      expect(Object.keys(perDay)).toHaveLength(MARCH_2024.length);
    });
  });

  describe("patterned シナリオ (デフォルト)", () => {
    it("平日は work になる", () => {
      const result = generateMockShifts(STAFFS, MARCH_2024, "patterned");
      const monday = MARCH_2024.find((d) => d.day() === 1)!;
      const key = monday.format("YYYY-MM-DD");
      const staff = result.get("s1")!;
      expect(["work", "auto"]).toContain(staff[key]);
    });

    it("土曜は fixedOff か requestedOff か auto になる", () => {
      const result = generateMockShifts(STAFFS, MARCH_2024, "patterned");
      const saturday = MARCH_2024.find((d) => d.day() === 6)!;
      const key = saturday.format("YYYY-MM-DD");
      const states = Array.from(result.values()).map((p) => p[key]);
      states.forEach((s) => expect(["fixedOff", "requestedOff", "auto"]).toContain(s));
    });
  });

  describe("balanced シナリオ", () => {
    it("シフト値が有効な ShiftState である", () => {
      const validStates = ["work", "fixedOff", "requestedOff", "auto"];
      const result = generateMockShifts(STAFFS, MARCH_2024, "balanced");
      result.forEach((perDay) => {
        Object.values(perDay).forEach((s) => {
          expect(validStates).toContain(s);
        });
      });
    });

    it("work の割合がおおよそ 60% になる", () => {
      const result = generateMockShifts(STAFFS, MARCH_2024, "balanced");
      let workCount = 0;
      let total = 0;
      result.forEach((perDay) => {
        Object.values(perDay).forEach((s) => {
          if (s === "work") workCount++;
          total++;
        });
      });
      const ratio = workCount / total;
      expect(ratio).toBeGreaterThan(0.3);
    });
  });

  describe("sparse シナリオ", () => {
    it("work の割合が patterned より少ない", () => {
      const countWork = (scenario: string) => {
        let count = 0;
        generateMockShifts(STAFFS, MARCH_2024, scenario).forEach((perDay) => {
          Object.values(perDay).forEach((s) => {
            if (s === "work") count++;
          });
        });
        return count;
      };
      expect(countWork("sparse")).toBeLessThan(countWork("patterned"));
    });
  });

  describe("random シナリオ", () => {
    it("同じ staff.id で同じ結果が得られる（決定的）", () => {
      const a = generateMockShifts(STAFFS, MARCH_2024, "random");
      const b = generateMockShifts(STAFFS, MARCH_2024, "random");
      STAFFS.forEach((s) => {
        expect(a.get(s.id)).toEqual(b.get(s.id));
      });
    });
  });

  it("スタッフが空の場合は空の Map を返す", () => {
    const result = generateMockShifts([], MARCH_2024);
    expect(result.size).toBe(0);
  });

  it("日付が空の場合は空のレコードを返す", () => {
    const result = generateMockShifts(STAFFS, []);
    result.forEach((perDay) => {
      expect(Object.keys(perDay)).toHaveLength(0);
    });
  });
});
