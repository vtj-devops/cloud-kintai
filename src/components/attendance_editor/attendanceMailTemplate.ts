import { StaffType } from "@/hooks/useStaffs/useStaffs";
import { AttendanceDateTime } from "@/lib/AttendanceDateTime";
import { AttendanceTime } from "@/lib/AttendanceTime";

import { Attendance, AttendanceHistory } from "../../API";

function showBlankLine(): string {
  return "";
}

function showSeparateLine(): string {
  return "----";
}

function showHelloStaffName(staff: StaffType) {
  const { familyName, givenName } = staff;
  if (!familyName && !givenName) return "こんにちは。";

  return familyName && givenName
    ? `こんにちは、${familyName} ${givenName} さん`
    : `こんにちは、${familyName || givenName} さん`;
}

function showMessage() {
  return "管理者より勤怠情報の更新がありました。";
}

// --------------------------------------------------
//  勤務日
// --------------------------------------------------
function showWorkDate(attendance: Attendance) {
  const workDate = new AttendanceDateTime()
    .setDateString(attendance.workDate)
    .toDisplayDateFormat();
  return `勤務日：${workDate}`;
}

// --------------------------------------------------
//  有給休暇
// --------------------------------------------------
function showPaidHolidayFlag(
  attendance: Attendance,
  history: AttendanceHistory | null
) {
  if (!history) {
    const { paidHolidayFlag } = attendance;
    return `有給休暇：*** → ${paidHolidayFlag ? "有" : "無"}`;
  }

  const result = (() => {
    const { paidHolidayFlag } = attendance;
    if (
      ((paidHolidayFlag === undefined || paidHolidayFlag === null) &&
        (history.paidHolidayFlag === undefined ||
          history.paidHolidayFlag === null)) ||
      paidHolidayFlag === history.paidHolidayFlag
    ) {
      return "変更なし";
    }

    return `${history.paidHolidayFlag ? "有" : "無"} → ${
      paidHolidayFlag ? "有" : "無"
    }`;
  })();

  return `有給休暇：${result}`;
}

// --------------------------------------------------
//  振替休日
// --------------------------------------------------
function showSubstituteHolidayDate(
  attendance: Attendance,
  history: AttendanceHistory | null
) {
  if (!history) {
    const substituteHolidayDate = (() => {
      if (!attendance.substituteHolidayDate) return null;
      return new AttendanceDateTime()
        .setDateString(attendance.substituteHolidayDate)
        .toDisplayDateFormat();
    })();
    return `振替休日：${substituteHolidayDate}`;
  }

  const result = (() => {
    const substituteHolidayDate = (() => {
      if (!attendance.substituteHolidayDate) return null;
      return new AttendanceDateTime()
        .setDateString(attendance.substituteHolidayDate)
        .toDisplayDateFormat();
    })();

    if (
      (substituteHolidayDate === null &&
        history.substituteHolidayDate === null) ||
      substituteHolidayDate === history.substituteHolidayDate
    ) {
      return "変更なし";
    }

    const historySubstituteHolidayDate = (() => {
      if (!history.substituteHolidayDate) return null;
      return new AttendanceDateTime()
        .setDateString(history.substituteHolidayDate)
        .toDisplayDateFormat();
    })();

    return `${historySubstituteHolidayDate || "(なし)"} → ${
      substituteHolidayDate || "(なし)"
    }`;
  })();

  return `振替休日：${result}`;
}

// --------------------------------------------------
//  直行
// --------------------------------------------------
function showGoDirectlyFlag(
  attendance: Attendance,
  history: AttendanceHistory | null
) {
  if (!history) {
    const { goDirectlyFlag } = attendance;
    return `直行：*** → ${goDirectlyFlag ? "有" : "無"}`;
  }

  const result = (() => {
    const { goDirectlyFlag } = attendance;
    if (
      ((goDirectlyFlag === undefined || goDirectlyFlag === null) &&
        (history.goDirectlyFlag === undefined ||
          history.goDirectlyFlag === null)) ||
      goDirectlyFlag === history.goDirectlyFlag
    ) {
      return "変更なし";
    }

    return `${history.goDirectlyFlag ? "有" : "無"} → ${
      goDirectlyFlag ? "有" : "無"
    }`;
  })();

  return `直行：${result}`;
}

// --------------------------------------------------
//  直帰
// --------------------------------------------------
function showReturnDirectlyFlag(
  attendance: Attendance,
  history: AttendanceHistory | null
) {
  if (!history) {
    const { returnDirectlyFlag } = attendance;
    return `直帰：*** → ${returnDirectlyFlag ? "有" : "無"}`;
  }

  const result = (() => {
    const { returnDirectlyFlag } = attendance;
    if (
      ((returnDirectlyFlag === undefined || returnDirectlyFlag === null) &&
        (history.returnDirectlyFlag === undefined ||
          history.returnDirectlyFlag === null)) ||
      returnDirectlyFlag === history.returnDirectlyFlag
    ) {
      return "変更なし";
    }

    return `${history.returnDirectlyFlag ? "有" : "無"} → ${
      returnDirectlyFlag ? "有" : "無"
    }`;
  })();

  return `直帰：${result}`;
}

// --------------------------------------------------
//  勤務時間
// --------------------------------------------------
function showWorkTime(
  attendance: Attendance,
  history: AttendanceHistory | null
) {
  if (!history) {
    const { startTime, endTime } = attendance;
    const afterStartTime = (() => {
      if (!startTime) return AttendanceTime.None;
      return new AttendanceDateTime().setDateString(startTime).toTimeFormat();
    })();
    const afterEndTime = (() => {
      if (!endTime) return AttendanceTime.None;
      return new AttendanceDateTime().setDateString(endTime).toTimeFormat();
    })();

    return [
      "勤務時間：",
      AttendanceTime.None,
      " ~ ",
      AttendanceTime.None,
      " → ",
      afterStartTime,
      " ~ ",
      afterEndTime,
    ].join("");
  }

  const result = (() => {
    const { startTime, endTime } = attendance;
    if (startTime === history.startTime && endTime === history.endTime) {
      return "変更なし";
    }

    // Before
    const beforeStartTime = (() => {
      if (!history.startTime) return AttendanceTime.None;
      return new AttendanceDateTime()
        .setDateString(history.startTime)
        .toTimeFormat();
    })();
    const beforeEndTime = (() => {
      if (!history.endTime) return AttendanceTime.None;
      return new AttendanceDateTime()
        .setDateString(history.endTime)
        .toTimeFormat();
    })();

    // After
    const afterStartTime = (() => {
      if (!startTime) return AttendanceTime.None;
      return new AttendanceDateTime().setDateString(startTime).toTimeFormat();
    })();
    const afterEndTime = (() => {
      if (!endTime) return AttendanceTime.None;
      return new AttendanceDateTime().setDateString(endTime).toTimeFormat();
    })();

    return [
      beforeStartTime,
      " ~ ",
      beforeEndTime,
      " → ",
      afterStartTime,
      " ~ ",
      afterEndTime,
    ].join("");
  })();

  return `勤務時間：${result}`;
}

// --------------------------------------------------
//  休憩時間
// --------------------------------------------------
function showRestTime(
  attendance: Attendance,
  history: AttendanceHistory | null
) {
  const { rests } = attendance;
  const afterRests = rests
    ? rests.filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  if (!history) {
    const attendanceResults = afterRests.map((rest) => {
      const startTime = (() => {
        if (!rest.startTime) return AttendanceTime.None;
        return new AttendanceDateTime()
          .setDateString(rest.startTime)
          .toTimeFormat();
      })();
      const endTime = (() => {
        if (!rest.endTime) return AttendanceTime.None;
        return new AttendanceDateTime()
          .setDateString(rest.endTime)
          .toTimeFormat();
      })();
      return `${startTime} ~ ${endTime}`;
    });

    return [
      `休憩時間：${attendanceResults.length === 0 ? "変更なし" : ""}`,
      ...attendanceResults.map((item) => `  ${item}`),
    ].join("\n");
  }

  const beforeRests = history.rests
    ? history.rests.filter(
        (item): item is NonNullable<typeof item> => item !== null
      )
    : [];

  const afterRestsLength = afterRests.length;
  const beforeRestsLength = beforeRests.length;

  const attendanceResults: string[] = [];
  for (let i = 0; i < Math.max(afterRestsLength, beforeRestsLength); i += 1) {
    const afterRest = afterRests[i];
    const beforeRest = beforeRests[i];

    // 休憩時間を削除した場合
    if (!afterRest) {
      const beforeRestStartTime = (() => {
        if (!beforeRest.startTime) return AttendanceTime.None;
        return new AttendanceDateTime()
          .setDateString(beforeRest.startTime)
          .toTimeFormat();
      })();
      const beforeRestEndTime = (() => {
        if (!beforeRest.endTime) return AttendanceTime.None;
        return new AttendanceDateTime()
          .setDateString(beforeRest.endTime)
          .toTimeFormat();
      })();

      attendanceResults.push(
        `[削除]${beforeRestStartTime} ~ ${beforeRestEndTime}`
      );
      continue;
    }

    // 休憩時間を追加した場合
    if (!beforeRest) {
      const afterRestStartTime = (() => {
        if (!afterRest.startTime) return AttendanceTime.None;
        return new AttendanceDateTime()
          .setDateString(afterRest.startTime)
          .toTimeFormat();
      })();
      const afterRestEndTime = (() => {
        if (!afterRest.endTime) return AttendanceTime.None;
        return new AttendanceDateTime()
          .setDateString(afterRest.endTime)
          .toTimeFormat();
      })();

      attendanceResults.push(
        `[追加]${afterRestStartTime} ~ ${afterRestEndTime}`
      );
      continue;
    }

    // 休憩時間を変更した場合
    {
      // Before
      const beforeRestStartTime = (() => {
        if (!beforeRest.startTime) return AttendanceTime.None;
        return new AttendanceDateTime()
          .setDateString(beforeRest.startTime)
          .toTimeFormat();
      })();
      const beforeRestEndTime = (() => {
        if (!beforeRest.endTime) return AttendanceTime.None;
        return new AttendanceDateTime()
          .setDateString(beforeRest.endTime)
          .toTimeFormat();
      })();

      // After
      const afterRestStartTime = (() => {
        if (!afterRest.startTime) return AttendanceTime.None;
        return new AttendanceDateTime()
          .setDateString(afterRest.startTime)
          .toTimeFormat();
      })();
      const afterRestEndTime = (() => {
        if (!afterRest.endTime) return AttendanceTime.None;
        return new AttendanceDateTime()
          .setDateString(afterRest.endTime)
          .toTimeFormat();
      })();

      attendanceResults.push(
        beforeRestStartTime === afterRestStartTime &&
          beforeRestEndTime === afterRestEndTime
          ? `[なし]${beforeRestStartTime} ~ ${beforeRestEndTime}`
          : [
              `${beforeRestStartTime} ~ ${beforeRestEndTime}`,
              `${afterRestStartTime} ~ ${afterRestEndTime}`,
            ].join(" → ")
      );
    }
  }

  return [
    `休憩時間：${attendanceResults.length === 0 ? "変更なし" : ""}`,
    ...attendanceResults.map((item) => `  ${item}`),
  ].join("\n");
}

// --------------------------------------------------
//  備考
// --------------------------------------------------
function showRemarks(
  attendance: Attendance,
  history: AttendanceHistory | null
) {
  if (!history) {
    const { remarks } = attendance;
    return `備考：${remarks || "変更なし"}`;
  }

  const result = (() => {
    const { remarks } = attendance;
    if (
      (remarks === undefined && history.remarks === undefined) ||
      (remarks === null && history.remarks === null) ||
      (remarks === "" && history.remarks === "")
    ) {
      return "変更なし";
    }
    if ((!remarks && !history.remarks) || remarks === history.remarks) {
      return "変更なし";
    }
    return `${history.remarks || "(なし)"} → ${remarks || "(なし)"}`;
  })();

  return `備考：${result}`;
}

function showLastMessage() {
  return "不明な点がある場合は、管理者にお問い合わせください。";
}

export default function getAttendanceMailBody(
  staff: StaffType,
  attendance: Attendance,
  history: AttendanceHistory | null
) {
  return [
    showHelloStaffName(staff),
    showBlankLine(),
    showMessage(),
    showBlankLine(),
    showSeparateLine(),
    showWorkDate(attendance),
    showPaidHolidayFlag(attendance, history),
    showSubstituteHolidayDate(attendance, history),
    showGoDirectlyFlag(attendance, history),
    showReturnDirectlyFlag(attendance, history),
    showWorkTime(attendance, history),
    showRestTime(attendance, history),
    showRemarks(attendance, history),
    showSeparateLine(),
    showBlankLine(),
    showLastMessage(),
  ];
}
