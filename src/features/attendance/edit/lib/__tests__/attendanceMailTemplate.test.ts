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
  }) as StaffType;

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
  overrides: Partial<AttendanceHistory> = {},
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
        null,
      );
      expect(lines[IDX.greeting]).toBe("こんにちは、山田 太郎 さん");
    });

    it("familyName のみの場合、familyName で挨拶する", () => {
      const lines = getAttendanceMailBody(
        makeStaff({ familyName: "山田", givenName: null }),
        makeAttendance(),
        null,
      );
      expect(lines[IDX.greeting]).toBe("こんにちは、山田 さん");
    });

    it("givenName のみの場合、givenName で挨拶する", () => {
      const lines = getAttendanceMailBody(
        makeStaff({ familyName: null, givenName: "太郎" }),
        makeAttendance(),
        null,
      );
      expect(lines[IDX.greeting]).toBe("こんにちは、太郎 さん");
    });

    it("名前なしの場合、汎用挨拶を返す", () => {
      const lines = getAttendanceMailBody(
        makeStaff({ familyName: null, givenName: null }),
        makeAttendance(),
        null,
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
        "不明な点がある場合は、管理者にお問い合わせください。",
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
        null,
      );
      expect(lines[IDX.paidHoliday]).toBe("有給休暇：*** → 有");
    });

    it("直行フラグが false のとき '*** → 無' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ goDirectlyFlag: false }),
        null,
      );
      expect(lines[IDX.goDirectly]).toBe("直行：*** → 無");
    });

    it("備考が null のとき '変更なし' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ remarks: null }),
        null,
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
        makeHistory({ paidHolidayFlag: false }),
      );
      expect(lines[IDX.paidHoliday]).toBe("有給休暇：変更なし");
    });

    it("有給休暇フラグが false→true に変更された場合、差分を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ paidHolidayFlag: true }),
        makeHistory({ paidHolidayFlag: false }),
      );
      expect(lines[IDX.paidHoliday]).toBe("有給休暇：無 → 有");
    });

    it("直帰フラグが false→true に変更された場合、差分を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ returnDirectlyFlag: true }),
        makeHistory({ returnDirectlyFlag: false }),
      );
      expect(lines[IDX.returnDirectly]).toBe("直帰：無 → 有");
    });

    it("備考が変更された場合、'旧 → 新' 形式で表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ remarks: "新しい備考" }),
        makeHistory({ remarks: "古い備考" }),
      );
      expect(lines[IDX.remarks]).toBe("備考：古い備考 → 新しい備考");
    });

    it("備考が null から値ありに変わった場合、'(なし) → 新' 形式で表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ remarks: "追加された備考" }),
        makeHistory({ remarks: null }),
      );
      expect(lines[IDX.remarks]).toBe("備考：(なし) → 追加された備考");
    });

    it("休憩がどちらもない場合、'変更なし' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ rests: [] }),
        makeHistory({ rests: [] }),
      );
      expect(lines[IDX.restTime]).toBe("休憩時間：変更なし");
    });

    // ---- 直行（有→無・変更なし）----------------------------------
    it("直行フラグに変更がない場合、'変更なし' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ goDirectlyFlag: true }),
        makeHistory({ goDirectlyFlag: true }),
      );
      expect(lines[IDX.goDirectly]).toBe("直行：変更なし");
    });

    it("直行フラグが true→false に変更された場合、差分を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ goDirectlyFlag: false }),
        makeHistory({ goDirectlyFlag: true }),
      );
      expect(lines[IDX.goDirectly]).toBe("直行：有 → 無");
    });

    // ---- 直帰（変更なし）------------------------------------------
    it("直帰フラグに変更がない場合、'変更なし' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ returnDirectlyFlag: false }),
        makeHistory({ returnDirectlyFlag: false }),
      );
      expect(lines[IDX.returnDirectly]).toBe("直帰：変更なし");
    });

    // ---- 振替休日 --------------------------------------------------
    it("history なし・振替休日日付あり の場合、日付を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ substituteHolidayDate: "2024-12-26" }),
        null,
      );
      expect(lines[IDX.substituteHoliday]).toBe("振替休日：2024/12/26");
    });

    it("振替休日日付が両方 null の場合、'変更なし' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ substituteHolidayDate: null }),
        makeHistory({ substituteHolidayDate: null }),
      );
      expect(lines[IDX.substituteHoliday]).toBe("振替休日：変更なし");
    });

    it("振替休日日付が null→値あり に変わった場合、差分を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ substituteHolidayDate: "2024-12-26" }),
        makeHistory({ substituteHolidayDate: null }),
      );
      expect(lines[IDX.substituteHoliday]).toBe(
        "振替休日：(なし) → 2024/12/26",
      );
    });

    it("振替休日日付が値あり→null に変わった場合、差分を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ substituteHolidayDate: null }),
        makeHistory({ substituteHolidayDate: "2024-12-26" }),
      );
      expect(lines[IDX.substituteHoliday]).toBe(
        "振替休日：2024/12/26 → (なし)",
      );
    });

    // ---- 勤務時間 --------------------------------------------------
    it("history なし・勤務時間あり の場合、開始・終了を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({
          startTime: "2024-12-25T09:00:00Z",
          endTime: "2024-12-25T18:00:00Z",
        }),
        null,
      );
      expect(lines[IDX.workTime]).toContain("勤務時間：");
      expect(lines[IDX.workTime]).toContain("→");
    });

    it("history なし・勤務時間 null の場合、'--:--' で表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ startTime: null, endTime: null }),
        null,
      );
      expect(lines[IDX.workTime]).toContain("--:--");
    });

    it("勤務時間に変更がない場合、'変更なし' を表示する", () => {
      const time = "2024-12-25T09:00:00Z";
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ startTime: time, endTime: time }),
        makeHistory({ startTime: time, endTime: time }),
      );
      expect(lines[IDX.workTime]).toBe("勤務時間：変更なし");
    });

    it("勤務時間が変更された場合、'旧 → 新' 形式で表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({
          startTime: "2024-12-25T10:00:00Z",
          endTime: "2024-12-25T19:00:00Z",
        }),
        makeHistory({
          startTime: "2024-12-25T09:00:00Z",
          endTime: "2024-12-25T18:00:00Z",
        }),
      );
      expect(lines[IDX.workTime]).toContain("→");
      expect(lines[IDX.workTime]).toContain("勤務時間：");
    });

    it("勤務時間が null から値ありに変わった場合、'--:--' から表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({
          startTime: "2024-12-25T09:00:00Z",
          endTime: "2024-12-25T18:00:00Z",
        }),
        makeHistory({ startTime: null, endTime: null }),
      );
      expect(lines[IDX.workTime]).toContain("--:--");
    });

    // ---- 休憩時間（新規・追加・削除・変更） -----------------------
    it("history なし・休憩あり の場合、休憩を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({
          rests: [
            {
              __typename: "Rest",
              startTime: "2024-12-25T12:00:00Z",
              endTime: "2024-12-25T13:00:00Z",
            },
          ],
        }),
        null,
      );
      expect(lines[IDX.restTime]).toContain("~");
    });

    it("history なし・休憩時間 null の場合、'--:--' で表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({
          rests: [
            {
              __typename: "Rest",
              startTime: null,
              endTime: null,
            },
          ],
        }),
        null,
      );
      expect(lines[IDX.restTime]).toContain("--:--");
    });

    it("休憩が追加された場合、'[追加]' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({
          rests: [
            {
              __typename: "Rest",
              startTime: "2024-12-25T12:00:00Z",
              endTime: "2024-12-25T13:00:00Z",
            },
          ],
        }),
        makeHistory({ rests: [] }),
      );
      expect(lines[IDX.restTime]).toContain("[追加]");
    });

    it("休憩が削除された場合、'[削除]' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ rests: [] }),
        makeHistory({
          rests: [
            {
              __typename: "AttendanceHistory",
              startTime: "2024-12-25T12:00:00Z",
              endTime: "2024-12-25T13:00:00Z",
            } as never,
          ],
        }),
      );
      expect(lines[IDX.restTime]).toContain("[削除]");
    });

    it("休憩が変更された場合、差分を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({
          rests: [
            {
              __typename: "Rest",
              startTime: "2024-12-25T12:30:00Z",
              endTime: "2024-12-25T13:30:00Z",
            },
          ],
        }),
        makeHistory({
          rests: [
            {
              __typename: "AttendanceHistory",
              startTime: "2024-12-25T12:00:00Z",
              endTime: "2024-12-25T13:00:00Z",
            } as never,
          ],
        }),
      );
      expect(lines[IDX.restTime]).toContain("→");
    });

    it("休憩が変更なしの場合、'[なし]' を表示する", () => {
      const restTime = "2024-12-25T12:00:00Z";
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({
          rests: [
            {
              __typename: "Rest",
              startTime: restTime,
              endTime: restTime,
            },
          ],
        }),
        makeHistory({
          rests: [
            {
              __typename: "AttendanceHistory",
              startTime: restTime,
              endTime: restTime,
            } as never,
          ],
        }),
      );
      expect(lines[IDX.restTime]).toContain("[なし]");
    });

    it("休憩の startTime/endTime が null の場合、'--:--' で表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ rests: [] }),
        makeHistory({
          rests: [
            {
              __typename: "AttendanceHistory",
              startTime: null,
              endTime: null,
            } as never,
          ],
        }),
      );
      expect(lines[IDX.restTime]).toContain("--:--");
    });

    // ---- 有給休暇（both null）-------------------------------------
    it("有給休暇フラグが両方 null の場合、'変更なし' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ paidHolidayFlag: null }),
        makeHistory({ paidHolidayFlag: null }),
      );
      expect(lines[IDX.paidHoliday]).toBe("有給休暇：変更なし");
    });

    // ---- 備考（値→null・両方空）-----------------------------------
    it("備考が値あり→null に変わった場合、'旧 → (なし)' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ remarks: null }),
        makeHistory({ remarks: "元の備考" }),
      );
      expect(lines[IDX.remarks]).toBe("備考：元の備考 → (なし)");
    });

    it("備考が両方空文字の場合、'変更なし' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ remarks: "" }),
        makeHistory({ remarks: "" }),
      );
      expect(lines[IDX.remarks]).toBe("備考：変更なし");
    });

    it("備考が両方 null の場合、'変更なし' を表示する", () => {
      const lines = getAttendanceMailBody(
        makeStaff(),
        makeAttendance({ remarks: null }),
        makeHistory({ remarks: null }),
      );
      expect(lines[IDX.remarks]).toBe("備考：変更なし");
    });
  });
});
