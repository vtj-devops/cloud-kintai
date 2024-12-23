import { Box, Stack, TableCell, TableRow } from "@mui/material";
import dayjs from "dayjs";

import { AttendanceTime } from "@/lib/AttendanceTime";

import { Rest } from "../../../../API";

export default function RestTableRow({ rests }: { rests: Rest[] }) {
  return (
    <TableRow>
      <TableCell>休憩時間</TableCell>
      <TableCell>
        {(() => {
          if (rests.length === 0) {
            return "(変更なし)";
          }

          return (
            <Stack spacing={1}>
              {rests.map((rest, index) => {
                const startTime = rest.startTime ? dayjs(rest.startTime) : null;
                const endTime = rest.endTime ? dayjs(rest.endTime) : null;

                return (
                  <Box key={index}>
                    {`${startTime?.format("HH:mm") ?? AttendanceTime.None} 〜 ${
                      endTime?.format("HH:mm") ?? AttendanceTime.None
                    }`}
                  </Box>
                );
              })}
            </Stack>
          );
        })()}
      </TableCell>
    </TableRow>
  );
}
