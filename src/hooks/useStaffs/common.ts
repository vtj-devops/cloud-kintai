import dayjs from "dayjs";

import { StaffRole } from "./useStaffs";

export interface Staff {
  sub: string;
  enabled: boolean;
  status: string;
  givenName?: string;
  familyName?: string;
  mailAddress: string;
  owner: boolean;
  roles: StaffRole[];
  usageStartDate?: dayjs.Dayjs;
  createdAt: dayjs.Dayjs;
  updatedAt: dayjs.Dayjs;
}
