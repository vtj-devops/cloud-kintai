import PersonIcon from "@mui/icons-material/Person";
import { Chip, Grid, Stack } from "@mui/material";

export function FilterGrid({
  selectedRole,
  setSelectedRole,
}: {
  selectedRole: string;
  setSelectedRole: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <Grid item xs={12}>
      <Stack direction="row" spacing={1}>
        <Chip
          label="すべて"
          color="primary"
          variant={selectedRole === "すべて" ? "filled" : "outlined"}
          icon={<PersonIcon fontSize="small" />}
          onClick={() => setSelectedRole("すべて")}
        />
        <Chip
          label="スタッフ"
          color="primary"
          icon={<PersonIcon fontSize="small" />}
          variant={selectedRole === "スタッフ" ? "filled" : "outlined"}
          onClick={() => setSelectedRole("スタッフ")}
        />
        <Chip
          label="管理者"
          color="primary"
          icon={<PersonIcon fontSize="small" />}
          variant={selectedRole === "管理者" ? "filled" : "outlined"}
          onClick={() => setSelectedRole("管理者")}
        />
      </Stack>
    </Grid>
  );
}
