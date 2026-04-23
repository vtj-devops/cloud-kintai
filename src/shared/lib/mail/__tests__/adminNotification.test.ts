import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";

import {
  formatBelongingLabel,
  formatStaffDisplayName,
  resolveAdminNotificationRecipients,
  sendAdminNotificationMail,
} from "../adminNotification";

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: {
    graphql: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock("@shared/api/graphql/documents/queries", () => ({
  sendMail: "sendMail",
}));

const makeStaff = (overrides: Partial<ReturnType<typeof makeStaff>> = {}) => ({
  id: "s1",
  familyName: "山田",
  givenName: "太郎",
  mailAddress: "admin@example.com",
  role: StaffRole.ADMIN,
  shiftGroup: null as string | null,
  workType: null as string | null,
  ...overrides,
});

describe("formatStaffDisplayName", () => {
  it("姓と名が揃っている場合はスペース区切りで返す", () => {
    expect(formatStaffDisplayName("山田", "太郎")).toBe("山田 太郎");
  });

  it("姓のみの場合は姓を返す", () => {
    expect(formatStaffDisplayName("山田", null)).toBe("山田");
  });

  it("名のみの場合は名を返す", () => {
    expect(formatStaffDisplayName(null, "太郎")).toBe("太郎");
  });

  it("両方 null の場合はデフォルトのフォールバックを返す", () => {
    expect(formatStaffDisplayName(null, null)).toBe("スタッフ");
  });

  it("カスタムフォールバックを使用できる", () => {
    expect(formatStaffDisplayName(undefined, undefined, "不明")).toBe("不明");
  });

  it("空文字はトリムされてフォールバックになる", () => {
    expect(formatStaffDisplayName("  ", "  ")).toBe("スタッフ");
  });
});

describe("formatBelongingLabel", () => {
  it("shiftGroup が設定されている場合はそれを返す", () => {
    expect(formatBelongingLabel({ shiftGroup: "グループA" })).toBe("グループA");
  });

  it("shiftGroup がなく workType がある場合は workType を返す", () => {
    expect(formatBelongingLabel({ shiftGroup: null, workType: "正社員" })).toBe("正社員");
  });

  it("両方 null の場合は「未設定」を返す", () => {
    expect(formatBelongingLabel({ shiftGroup: null, workType: null })).toBe("未設定");
  });

  it("staff が null の場合は「未設定」を返す", () => {
    expect(formatBelongingLabel(null)).toBe("未設定");
  });

  it("staff が undefined の場合は「未設定」を返す", () => {
    expect(formatBelongingLabel(undefined)).toBe("未設定");
  });

  it("空白のみは trimされて「未設定」になる", () => {
    expect(formatBelongingLabel({ shiftGroup: "  ", workType: "  " })).toBe("未設定");
  });
});

describe("resolveAdminNotificationRecipients", () => {
  const originalEnv = process.env.VITE_ADMIN_NOTIFICATION_EMAILS;

  afterEach(() => {
    process.env.VITE_ADMIN_NOTIFICATION_EMAILS = originalEnv;
  });

  it("ADMIN ロールのメールアドレスを返す", () => {
    const staffs = [
      makeStaff({ id: "s1", mailAddress: "admin@example.com", role: StaffRole.ADMIN }),
      makeStaff({ id: "s2", mailAddress: "staff@example.com", role: StaffRole.STAFF }),
    ];
    const result = resolveAdminNotificationRecipients(staffs);
    expect(result).toEqual(["admin@example.com"]);
  });

  it("STAFF_ADMIN ロールのメールアドレスも含む", () => {
    const staffs = [
      makeStaff({ id: "s1", mailAddress: "admin@example.com", role: StaffRole.ADMIN }),
      makeStaff({
        id: "s2",
        mailAddress: "staffadmin@example.com",
        role: StaffRole.STAFF_ADMIN,
      }),
    ];
    const result = resolveAdminNotificationRecipients(staffs);
    expect(result).toHaveLength(2);
  });

  it("管理者が 0 人の場合はエラーをスロー", () => {
    const staffs = [makeStaff({ role: StaffRole.STAFF, mailAddress: "staff@example.com" })];
    expect(() => resolveAdminNotificationRecipients(staffs)).toThrow();
  });

  it("メールアドレスが未設定のスタッフは除外", () => {
    const staffs = [
      makeStaff({ id: "s1", mailAddress: null as unknown as string, role: StaffRole.ADMIN }),
      makeStaff({ id: "s2", mailAddress: "admin2@example.com", role: StaffRole.ADMIN }),
    ];
    const result = resolveAdminNotificationRecipients(staffs);
    expect(result).toEqual(["admin2@example.com"]);
  });
});

describe("sendAdminNotificationMail", () => {
  const { graphqlClient } = jest.requireMock("@shared/api/amplify/graphqlClient") as {
    graphqlClient: { graphql: jest.Mock };
  };

  beforeEach(() => {
    graphqlClient.graphql.mockResolvedValue({});
  });

  it("正常系: graphql を呼び出してメールを送信する", async () => {
    const staffs = [makeStaff()];
    await sendAdminNotificationMail({ staffs, subject: "テスト件名", body: "テスト本文" });
    expect(graphqlClient.graphql).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          data: expect.objectContaining({
            subject: "テスト件名",
            body: "テスト本文",
          }),
        }),
      }),
    );
  });

  it("subject が空の場合はエラー", async () => {
    const staffs = [makeStaff()];
    await expect(sendAdminNotificationMail({ staffs, subject: "", body: "本文" })).rejects.toThrow();
  });

  it("body が空の場合はエラー", async () => {
    const staffs = [makeStaff()];
    await expect(
      sendAdminNotificationMail({ staffs, subject: "件名", body: "  " }),
    ).rejects.toThrow();
  });
});
