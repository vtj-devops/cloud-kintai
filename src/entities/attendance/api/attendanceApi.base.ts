import { createApi } from "@reduxjs/toolkit/query/react";
import { graphqlBaseQuery } from "@shared/api/graphql/graphqlBaseQuery";

export const baseAttendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: graphqlBaseQuery(),
  tagTypes: ["Attendance"],
  endpoints: () => ({}),
});