import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import { useState } from "react";

interface ReasonRevision {
  id: number;
  name: string;
}

export default function ReasonRevisionItem() {
  const [reasonRevision, setReasonRevision] = useState<number | "">("");

  const reasonRevisions: ReasonRevision[] = [{ id: 1, name: "打刻忘れ" }];

  const reasonRevisionItems = reasonRevisions.map((reason) => (
    <MenuItem key={reason.id} value={reason.id}>
      {reason.name}
    </MenuItem>
  ));

  return (
    <Stack direction="row" alignItems={"center"}>
      <Box sx={{ fontWeight: "bold", width: "150px" }}>修正理由</Box>
      <Box sx={{ minWidth: 300 }}>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">理由</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={reasonRevision}
            onChange={(event) =>
              setReasonRevision(event.target.value as number)
            }
            label="理由"
          >
            {reasonRevisionItems}
          </Select>
        </FormControl>
      </Box>
    </Stack>
  );
}
