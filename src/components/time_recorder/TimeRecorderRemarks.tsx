// cspell: ignore testid
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import { Box, IconButton, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";

import { Attendance } from "../../API";

export interface TimeRecorderRemarksProps {
  attendance: Attendance | undefined | null;
  onSave: (remarks: Attendance["remarks"]) => void;
}

export default function TimeRecorderRemarks({
  attendance,
  onSave,
}: TimeRecorderRemarksProps) {
  const [formState, setFormState] = useState<Attendance["remarks"]>(undefined);
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    setFormState(attendance?.remarks);
  }, [attendance]);

  useEffect(() => {
    setIsChanged(attendance?.remarks !== formState);
  }, [formState]);

  return (
    <Stack>
      <Box>
        <TextField
          data-testid="remarks-text"
          multiline
          minRows={2}
          fullWidth
          value={formState ?? undefined}
          placeholder="労務担当より指示された時のみ(例：客先名やイベント名など)"
          onChange={(event) => {
            setFormState(event.target.value);
          }}
        />
      </Box>
      <Box>
        {isChanged && (
          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            spacing={0}
          >
            <Box>
              <IconButton onClick={() => onSave(formState)}>
                <CheckIcon color="success" data-testid="remarksSave" />
              </IconButton>
            </Box>
            <Box>
              <IconButton
                onClick={() => {
                  setFormState(attendance?.remarks);
                }}
              >
                <ClearIcon color="error" data-testid="remarksClear" />
              </IconButton>
            </Box>
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
