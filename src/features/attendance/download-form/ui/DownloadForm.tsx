import useCloseDates from "@entities/attendance/model/useCloseDates";
import { StaffType, useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useContext, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "@/context/AuthContext";
import { AttendanceDate } from "@/entities/attendance/lib/AttendanceDate";
// ...existing code
import {
  CARD_BORDER_WIDTH,
  LIST_WIDTHS,
  SELECTOR_MAX_WIDTH,
  STANDARD_PADDING,
} from "@/shared/config/uiDimensions";

import AggregateExportButton from "./AggregateExportButton";
import ExportButton from "./ExportButton";
import StaffSelector from "./StaffSelector";

export type Inputs = {
  startDate: dayjs.Dayjs | undefined;
  endDate: dayjs.Dayjs | undefined;
  staffs: StaffType[];
};

const defaultValues: Inputs = {
  startDate: undefined,
  endDate: undefined,
  staffs: [],
};

export default function DownloadForm() {
  const navigate = useNavigate();
  const [selectedStaff, setSelectedStaff] = useState<StaffType[]>([]);
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const { staffs, loading: staffLoading, error: staffError } = useStaffs({
    isAuthenticated,
  });
  const {
    closeDates,
    loading: closeDateLoading,
    error: closeDateError,
  } = useCloseDates();

  const { control, setValue, watch } = useForm<Inputs>({
    mode: "onChange",
    defaultValues,
  });

  // special holiday inclusion is determined inside the export components via AppConfig

  // derive workDates from watched start/end date so we can pass to ExportButton
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const startDate = watch("startDate") ?? dayjs();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const endDate = watch("endDate") ?? dayjs();

  // Derived state: compute workDates from startDate and endDate
  const workDates = useMemo(() => {
    const dates: string[] = [];
    let date = startDate;
    while (date.isBefore(endDate) || date.isSame(endDate)) {
      dates.push(date.format(AttendanceDate.DataFormat));
      date = date.add(1, "day");
    }
    return dates;
  }, [startDate, endDate]);

  useEffect(() => {
    if (!isMobile) {
      setIsExpanded(true);
      return;
    }
    setIsExpanded(false);
  }, [isMobile]);

  if (staffLoading || closeDateLoading) {
    return <CircularProgress />;
  }

  if (staffError || closeDateError) {
    return <div>エラーが発生しました</div>;
  }

  return (
    <Stack
      spacing={4}
      alignItems={{ xs: "stretch", md: "center" }}
      sx={{
        border: CARD_BORDER_WIDTH,
        borderColor: "primary.main",
        borderRadius: "5px",
        pb: STANDARD_PADDING.CARD,
        width: "100%",
        minWidth: 0,
        overflowX: "hidden",
      }}
    >
      <Box
        sx={{
          p: STANDARD_PADDING.SMALL,
          width: LIST_WIDTHS.FULL,
          boxSizing: "border-box",
          textAlign: "center",
          backgroundColor: "primary.main",
          color: "primary.contrastText",
          borderRadius: "3px 3px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <Typography
          component="span"
          sx={{ fontWeight: 700, letterSpacing: "0.02em" }}
        >
          ダウンロードオプション
        </Typography>
        {isMobile && (
          <IconButton
            size="small"
            onClick={() => setIsExpanded((prev) => !prev)}
            sx={{ color: "primary.contrastText" }}
            aria-label={isExpanded ? "collapse" : "expand"}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>
      <Collapse in={isExpanded} timeout="auto" unmountOnExit={false}>
        <Box sx={{ width: "100%" }}>
          <Stack
            spacing={3}
            sx={{
              width: "100%",
              maxWidth: 880,
              px: { xs: 1, sm: 2, md: 0 },
              boxSizing: "border-box",
              margin: "0 auto",
              minWidth: 0,
            }}
          >
            <Box>
              <Stack spacing={1}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  sx={{ width: "100%" }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <DesktopDatePicker
                          {...field}
                          label="開始日"
                          format={AttendanceDate.DisplayFormat}
                          slotProps={{
                            textField: {
                              variant: "outlined",
                              size: "small",
                              fullWidth: true,
                            },
                          }}
                        />
                      )}
                    />
                  </Box>
                  <Box sx={{ display: { xs: "none", sm: "block" } }}>〜</Box>
                  <Box sx={{ flex: 1 }}>
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <DesktopDatePicker
                          {...field}
                          label="終了日"
                          format={AttendanceDate.DisplayFormat}
                          slotProps={{
                            textField: {
                              variant: "outlined",
                              size: "small",
                              fullWidth: true,
                            },
                          }}
                        />
                      )}
                    />
                  </Box>
                </Stack>
                <Stack spacing={2} sx={{ maxWidth: SELECTOR_MAX_WIDTH }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    sx={{
                      flexWrap: "wrap",
                      rowGap: 1,
                      columnGap: 1,
                    }}
                  >
                    <Box sx={{ whiteSpace: "nowrap" }}>集計対象月から:</Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ flexWrap: "wrap", rowGap: 1 }}
                    >
                      <Chip
                        icon={<AddCircleOutlineOutlinedIcon fontSize="small" />}
                        label="新規"
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                          navigate("/admin/master/job_term");
                        }}
                      />
                      {closeDates
                        .toSorted((a, b) =>
                          dayjs(b.closeDate).diff(dayjs(a.closeDate))
                        )
                        .map((closeDate, index) => (
                          <Chip
                            key={index}
                            label={dayjs(closeDate.closeDate).format("YYYY/MM")}
                            variant="outlined"
                            color="primary"
                            onClick={() => {
                              setValue("startDate", dayjs(closeDate.startDate));
                              setValue("endDate", dayjs(closeDate.endDate));
                            }}
                          />
                        ))}
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={1}>
                <Box sx={{ mt: 2 }}>
                  <StaffSelector
                    control={control}
                    staffs={staffs}
                    selectedStaff={selectedStaff}
                    setSelectedStaff={setSelectedStaff}
                    setValue={setValue}
                  />
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Box>
        <Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ width: "100%" }}
          >
            <ExportButton
              workDates={workDates}
              selectedStaff={selectedStaff}
              fullWidth={isMobile}
            />
            <AggregateExportButton
              workDates={workDates}
              selectedStaff={selectedStaff}
              fullWidth={isMobile}
            />
          </Stack>
        </Box>
      </Collapse>
    </Stack>
  );
}
