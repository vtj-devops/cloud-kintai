import { DailyReportStatus } from "@shared/api/graphql/types";

import { sendDailyReportSubmissionNotification } from "../sendDailyReportSubmissionNotification";

jest.mock("@shared/lib/mail/adminNotification", () => ({
  formatBelongingLabel: jest.fn(() => "グループA"),
  formatStaffDisplayName: jest.fn(() => "山田 太郎"),
  sendAdminNotificationMail: jest.fn().mockResolvedValue(undefined),
}));

const { sendAdminNotificationMail } = jest.requireMock("@shared/lib/mail/adminNotification") as {
  sendAdminNotificationMail: jest.Mock;
};

const STAFF = {
  id: "staff1",
  familyName: "山田",
  givenName: "太郎",
  mailAddress: "yamada@example.com",
  role: "ADMIN" as const,
  shiftGroup: "グループA",
  workType: null,
};

const BASE_REPORT = {
  id: "report1",
  staffId: "staff1",
  reportDate: "2024-03-15",
  title: "本日の業務報告",
  content: "作業を完了しました。",
  status: DailyReportStatus.SUBMITTED,
  updatedAt: "2024-03-15T18:00:00Z",
} as Parameters<typeof sendDailyReportSubmissionNotification>[0]["report"];

describe("sendDailyReportSubmissionNotification", () => {
  beforeAll(() => {
    process.env.VITE_BASE_PATH = "https://example.com";
  });

  afterAll(() => {
    delete process.env.VITE_BASE_PATH;
  });

  beforeEach(() => {
    sendAdminNotificationMail.mockClear();
  });

  it("SUBMITTED ステータスのときメールを送信する", async () => {
    await sendDailyReportSubmissionNotification({ staffs: [STAFF], report: BASE_REPORT });
    expect(sendAdminNotificationMail).toHaveBeenCalledTimes(1);
  });

  it("SUBMITTED 以外のステータスでは何もしない", async () => {
    const report = { ...BASE_REPORT, status: DailyReportStatus.DRAFT };
    await sendDailyReportSubmissionNotification({ staffs: [STAFF], report });
    expect(sendAdminNotificationMail).not.toHaveBeenCalled();
  });

  it("report.id が未設定の場合はエラーをスロー", async () => {
    const report = { ...BASE_REPORT, id: undefined as unknown as string };
    await expect(
      sendDailyReportSubmissionNotification({ staffs: [STAFF], report }),
    ).rejects.toThrow("Daily report identifier is missing.");
  });

  it("VITE_BASE_PATH が未設定の場合はエラーをスロー", async () => {
    delete process.env.VITE_BASE_PATH;
    await expect(
      sendDailyReportSubmissionNotification({ staffs: [STAFF], report: BASE_REPORT }),
    ).rejects.toThrow();
    process.env.VITE_BASE_PATH = "https://example.com";
  });

  it("送信内容に reportUrl が含まれる", async () => {
    await sendDailyReportSubmissionNotification({ staffs: [STAFF], report: BASE_REPORT });
    const call = sendAdminNotificationMail.mock.calls[0][0];
    expect(call.body).toContain("/admin/daily-report/report1");
  });

  it("title が空のときは「(無題)」を使う", async () => {
    const report = { ...BASE_REPORT, title: "" };
    await sendDailyReportSubmissionNotification({ staffs: [STAFF], report });
    const call = sendAdminNotificationMail.mock.calls[0][0];
    expect(call.body).toContain("(無題)");
  });

  it("content が空のときはデフォルト概要を使う", async () => {
    const report = { ...BASE_REPORT, content: null };
    await sendDailyReportSubmissionNotification({ staffs: [STAFF], report });
    const call = sendAdminNotificationMail.mock.calls[0][0];
    expect(call.body).toContain("内容は本文をご確認ください。");
  });

  it("reportDate が null のときは「-」を表示する", async () => {
    const report = { ...BASE_REPORT, reportDate: null as unknown as string };
    await sendDailyReportSubmissionNotification({ staffs: [STAFF], report });
    const call = sendAdminNotificationMail.mock.calls[0][0];
    expect(call.subject).toContain("-");
  });

  it("fallbackAuthorName が使われる（submitter が見つからない場合）", async () => {
    const { formatStaffDisplayName } = jest.requireMock("@shared/lib/mail/adminNotification") as {
      formatStaffDisplayName: jest.Mock;
    };
    formatStaffDisplayName.mockImplementationOnce(
      (_f: unknown, _g: unknown, fallback: string) => fallback,
    );
    await sendDailyReportSubmissionNotification({
      staffs: [],
      report: BASE_REPORT,
      fallbackAuthorName: "担当者不明",
    });
    expect(formatStaffDisplayName).toHaveBeenCalledWith(
      undefined,
      undefined,
      "担当者不明",
    );
  });
});
