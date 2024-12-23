import { Container } from "@mui/material";

import AttendanceEditor from "../../components/attendance_editor/AttendanceEditor";

export default function AdminAttendanceEditor() {
  return (
    <Container maxWidth="xl" sx={{ pt: 1 }}>
      <AttendanceEditor />
    </Container>
  );
}
