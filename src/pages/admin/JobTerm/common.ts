import dayjs from "dayjs";

export type Inputs = {
  closeDate: dayjs.Dayjs | null;
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
};

export const defaultValues: Inputs = {
  closeDate: null,
  startDate: null,
  endDate: null,
};
