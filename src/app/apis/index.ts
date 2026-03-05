import { appConfigApi } from "@entities/app-config/api/appConfigApi";
import { attendanceApi } from "@entities/attendance/api/attendanceApi";
import { calendarApi } from "@entities/calendar/api/calendarApi";
import { shiftApi } from "@entities/shift/api/shiftApi";
import { workflowApi } from "@entities/workflow/api/workflowApi";
import { workflowTemplateApi } from "@entities/workflow-template/api/workflowTemplateApi";
import type { Middleware, Reducer } from "@reduxjs/toolkit";

export type RegisteredRtkApi = {
  reducerPath: string;
  reducer: Reducer;
  middleware: Middleware;
  util?: {
    resetApiState: () => unknown;
  };
};

export const rtkApis: RegisteredRtkApi[] = [
  attendanceApi,
  calendarApi,
  appConfigApi,
  shiftApi,
  workflowApi,
  workflowTemplateApi,
];
