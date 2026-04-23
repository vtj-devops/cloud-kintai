import type { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import type { Attendance, AttendanceHistory } from "@shared/api/graphql/types";

import getAttendanceMailBody from "../attendanceMailTemplate";

// ----------------------------------------------------------------
// テスト用フィクスチャ
// ----------------------------------------------------------------
const makeStaff = (overrides: Partial<StaffType> = {}): StaffType =>
  ({
    id: "staff001",
    cognitoUserId: null,
    familyName: "山田",
    givenName: "太郎",
    mailAddress: null,
    owner: "owner001",
    role: "STAFF" as StaffType["role"],
    enabled: true,
    status: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  } as StaffType);

const makeAttendance = (overrides: Partial<Attendance> = {}): Attendance => ({
  __typename: "Attendance",
  id: "att001",
  staffId: "staff001",
  workDate: "2024-12-25",
  createdAt: "2024-12-25T00:00:00Z",
  updatedAt: "2024-12-25T00:00:00Z",
  ...overrides,
});

const makeHistory = (
  overrides: Partial<AttendanceHistory> = {}
): AttendanceHistory => ({
  __typename: "AttendanceHistory",
  staffId: "staff001",
  workDate: "2024-12-25",
  createdAt: "2024-12-25T00:00:00Z",
  ...overrides,
});

// ----------------------------------------------------------------
// 返り値の配列インデックス（showXxx 関数の順序に対応）
// ----------------------------------------------------------------
const IDX = {
  greeting: 0,
  blank1: 1,
  message: 2,
  blank2: 3,
  separator1: 4,
  workDate: 5,
  paidHoliday: 6,
  substituteHoliday: 7,
  goDirectly: 8,
  returnDirectly: 9,
  workTime: 10,
  restTime: 11,
  remarks: 12,
  separator2: 13,
  blank3: 14,
  lastMessage: 15,
};

// ----------------------------------------------------------------
// テスト
// ----------------------------------------------------------------
describe("getAttendanceMailBody", () => {
  // ---- 挨拶文 ---------------------------------------------------
  describe("挨拶文（showHelloStaffName）", () => {
    it("familyName と givenName が両方ある場合、フルネームで挨拶する", () => {
      const lines = getAttendanceMailBody(
        makeStaff({ familyName: "山田", givenName: "太郎" }),
        makeAttendance(),
        null
      );
      expect(lines[IDX.greeting]).toBe("こんにちは、山田 太郎 さん");
    });

    it("familyName のみの場合、familyName で挨拶する", () => {
      const lines = getAttendanceMailBody(
        makeStaff({ familyName: "山田", givenName: null }),
        makeAttendance(),
        null
      );
      expect(lines[IDX.greeting]).toBe("こんにちは、山田 さん");
    });

    it("givenName のみの場合、givenName で挨拶する", () => {
      const lines = getAttendanceMailBody(
        makeStaff({ familyName: null, givenName: "太郎" }),
        makeAttendance(),
        null
      );
      expect(lines[IDX.greeting]).toBe("こんにちは、太郎 さん");
    });

    it("名前なしの場合、汎用挨拶を返す", () => {
      const lines = getAttendanceMailBody(
        makeStaff({ familyName: null, givenName: null }),
        makeAttendance(),
        null
      );
      expect(lines[IDX.greeting]).toBe("こんにちは。");
    });
  });

  // ---- 固定テキスト構造 -----------------------------------------
  describe("メール本文の固定構造", () => {
    it("定型メッセージ・区切り線・締め文が正しい位置に含まれる", () => {
      const lines = getAttendanceMailBody(makeStaff(), makeAttendance(), null);
      expect(lines[IDX.message]).toBe("管理者より勤怠情報の更新がありました。");
      expect(lines[IDX.separator1]).toBe("----");
      expect(lines[IDX.separator2]).toBe("----");
      expect(lines[IDX.lastMessage]).toBe(
        "不明な点がある場合は、管理者にお問い合わせください。"
      );
    });

    it("勤務日が YYYY/MM/DD 形式で表示される", () => {
      const lines = getAttendanceMailBody(makeStaff(), makeAttendance(), null);
      expect(lines[IDX.workDate]).toBe("勤務日：2024/12/25");
    });
  });

  // ---- history が null（新規登録） ------------------------------
  describe("history が null のとき（新規登録）", () => {
    it("有給休暇フラグが true のとき '*** → 有' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ paidHolidayFlag: true }),
        null
      );
      expect(lines[IDX.paidHoliday]).toBe("有給休暇：*** → 有");
    });

    it("直行フラグが false のとき '*** → 無' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ goDirectlyFlag: false }),
        null
      );
      expect(lines[IDX.goDirectly]).toBe("直行：*** → 無");
    });

    it("備考が null のとき '変更なし' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ remarks: null }),
        null
      );
      expect(lines[IDX.remarks]).toBe("備考：変更なし");
    });
  });

  // ---- history がある場合（更新） --------------------------------
  describe("history がある場合（更新）", () => {
    it("有給休暇フラグに変更がない場合、'変更なし' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ paidHolidayFlag: false }),
        makeHistory({ paidHolidayFlag: false })
      );
      expect(lines[IDX.paidHoliday]).toBe("有給休暇：変更なし");
    });

    it("有給休暇フラグが false→true に変更された場合、差分を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ paidHolidayFlag: true }),
        makeHistory({ paidHolidayFlag: false })
      );
      expect(lines[IDX.paidHoliday]).toBe("有給休暇：無 → 有");
    });

    it("直帰フラグが false→true に変更された場合、差分を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ returnDirectlyFlag: true }),
        makeHistory({ returnDirectlyFlag: false })
      );
      expect(lines[IDX.returnDirectly]).toBe("直帰：無 → 有");
    });

    it("備考が変更された場合、'旧 → 新' 形式で表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ remarks: "新しい備考" }),
        makeHistory({ remarks: "古い備考" })
      );
      expect(lines[IDX.remarks]).toBe("備考：古い備考 → 新しい備考");
    });

    it("備考が null から値ありに変わった場合、'(なし) → 新' 形式で表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ remarks: "追加された備考" }),
        makeHistory({ remarks: null })
      );
      expect(lines[IDX.remarks]).toBe("備考：(なし) → 追加された備考");
    });

    it("休憩がどちらもない場合、'変更なし' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ rests: [] }),
        makeHistory({ rests: [] })
      );
      expect(lines[IDX.restTime]).toBe("休憩時間：変更なし");
    });
  });
});
