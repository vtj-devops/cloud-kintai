import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import {
  Attendance,
  AttendanceHistoryInput,
  CreateAttendanceInput,
  CreateAttendanceMutation,
  GetAttendanceQuery,
  ListAttendancesQuery,
  UpdateAttendanceInput,
  UpdateAttendanceMutation,
} from "@/API";
import { createAttendance, updateAttendance } from "@/graphql/mutations";
import { getAttendance, listAttendances } from "@/graphql/queries";
import { AttendanceDateTime } from "@/lib/AttendanceDateTime";

export class AttendanceDataManager {
  async fetch(id: string) {
    const response = (await API.graphql({
      query: getAttendance,
      variables: { id },
      authMode: "AMAZON_COGNITO_USER_POOLS",
    })) as GraphQLResult<GetAttendanceQuery>;

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data?.getAttendance) {
      throw new Error("Failed to get attendance");
    }

    const attendance: Attendance = response.data.getAttendance;
    return attendance;
  }

  async fetchAll(staffId: string, workDate: string) {
    const attendances: Attendance[] = [];
    let nextToken: string | null = null;
    const isLooping = true;
    while (isLooping) {
      const response = (await API.graphql({
        query: listAttendances,
        variables: {
          filter: {
            staffId: { eq: staffId },
            workDate: { eq: workDate },
          },
          nextToken,
        },
        authMode: "AMAZON_COGNITO_USER_POOLS",
      })) as GraphQLResult<ListAttendancesQuery>;

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      if (!response.data?.listAttendances) {
        throw new Error("Failed to fetch attendance");
      }

      attendances.push(
        ...response.data.listAttendances.items.filter(
          (item): item is NonNullable<typeof item> => item !== null
        )
      );

      if (response.data.listAttendances.nextToken) {
        nextToken = response.data.listAttendances.nextToken;
        continue;
      }

      break;
    }

    if (attendances.length === 0) {
      return null;
    }

    if (attendances.length > 1) {
      const ids = attendances.map((attendance) => attendance.id);
      throw new Error(`Multiple attendances found with IDs: ${ids.join(", ")}`);
    }

    return attendances[0];
  }

  async create(input: CreateAttendanceInput) {
    input.revision = 1;

    const response = (await API.graphql({
      query: createAttendance,
      variables: { input },
      authMode: "AMAZON_COGNITO_USER_POOLS",
    })) as GraphQLResult<CreateAttendanceMutation>;

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data?.createAttendance) {
      throw new Error("Failed to create attendance");
    }

    const attendance: Attendance = response.data.createAttendance;
    return attendance;
  }

  async update(input: UpdateAttendanceInput) {
    const currentAttendance = await this.fetch(input.id).catch((e) => {
      throw e;
    });
    const currentRevision = currentAttendance.revision
      ? currentAttendance.revision
      : 1;

    const inputRevision = input.revision ? input.revision : 1;
    if (currentRevision !== inputRevision) {
      throw new Error("Revision mismatch");
    }

    input.revision = inputRevision + 1;

    const createdAt = new AttendanceDateTime().toISOString();

    const newHistory: AttendanceHistoryInput = {
      staffId: currentAttendance.staffId,
      workDate: currentAttendance.workDate,
      startTime: currentAttendance.startTime,
      endTime: currentAttendance.endTime,
      goDirectlyFlag: currentAttendance.goDirectlyFlag,
      returnDirectlyFlag: currentAttendance.returnDirectlyFlag,
      remarks: currentAttendance.remarks,
      paidHolidayFlag: currentAttendance.paidHolidayFlag,
      substituteHolidayDate: currentAttendance.substituteHolidayDate,
      createdAt,
      rests: currentAttendance.rests
        ? currentAttendance.rests
            .filter((item): item is NonNullable<typeof item> => !!item)
            .map(({ startTime, endTime }) => ({
              startTime,
              endTime,
            }))
        : [],
    };

    input.histories = currentAttendance.histories
      ? currentAttendance.histories
          .filter((item): item is NonNullable<typeof item> => !!item)
          .map(
            (history): AttendanceHistoryInput => ({
              staffId: history.staffId,
              workDate: history.workDate,
              startTime: history.startTime,
              endTime: history.endTime,
              goDirectlyFlag: history.goDirectlyFlag,
              returnDirectlyFlag: history.returnDirectlyFlag,
              remarks: history.remarks,
              paidHolidayFlag: history.paidHolidayFlag,
              substituteHolidayDate: history.substituteHolidayDate,
              createdAt: history.createdAt,
              rests: history.rests
                ? history.rests
                    .filter((item): item is NonNullable<typeof item> => !!item)
                    .map(({ startTime, endTime }) => ({
                      startTime,
                      endTime,
                    }))
                : [],
            })
          )
      : [];

    if (input.histories && input.histories.length > 0) {
      input.histories.push(newHistory);
    } else {
      input.histories = [newHistory];
    }

    const response = (await API.graphql({
      query: updateAttendance,
      variables: { input },
      authMode: "AMAZON_COGNITO_USER_POOLS",
    })) as GraphQLResult<UpdateAttendanceMutation>;

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data?.updateAttendance) {
      throw new Error("Failed to update attendance");
    }

    const attendance: Attendance = response.data.updateAttendance;
    return attendance;
  }
}
