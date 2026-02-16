import "@/features/admin/staff/ui/styles.scss";

import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import {
  Container,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";

import { useAppDispatchV2 } from "@/app/hooks";
import { AuthContext } from "@/context/AuthContext";
import * as MESSAGE_CODE from "@/errors";
import {
  CreateStaffDialog,
  MoreActionButton,
  SyncCognitoUser,
} from "@/features/admin/staff/ui/actions";
import { EditButton } from "@/features/admin/staff/ui/EditButton";
import {
  AccountStatusTableCell,
  CreatedAtTableCell,
  RoleTableCell,
  StaffNameTableCell,
  StatusTableCell,
  UpdatedAtTableCell,
  WorkTypeTableCell,
} from "@/features/admin/staff/ui/table";
import { setSnackbarError } from "@/shared/lib/store/snackbarSlice";

export default function AdminStaff() {
  const dispatch = useAppDispatchV2();
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";

  const {
    staffs,
    loading: staffLoading,
    error: staffError,
    refreshStaff,
    createStaff,
    updateStaff,
    deleteStaff,
  } = useStaffs({ isAuthenticated });

  const [searchQuery, setSearchQuery] = useState("");

  if (staffLoading) {
    return <LinearProgress />;
  }

  if (staffError) {
    dispatch(setSnackbarError(MESSAGE_CODE.E00001));
    return null;
  }

  return (
    <>
      <Container
        maxWidth="xl"
        sx={{ height: 1, pt: 2, px: { xs: 1, sm: 2, md: 3 } }}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <CreateStaffDialog
              staffs={staffs}
              refreshStaff={refreshStaff}
              createStaff={createStaff}
              updateStaff={updateStaff}
            />
            <SyncCognitoUser
              staffs={staffs}
              refreshStaff={refreshStaff}
              createStaff={createStaff}
              updateStaff={updateStaff}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            まれにユーザー情報が同期されない場合があります。その際は適宜同期を行ってください。
          </Typography>
          <TextField
            label="スタッフ名またはスタッフIDで検索"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
          <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>アカウント状態</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>名前</TableCell>
                  <TableCell>メールアドレス</TableCell>
                  <TableCell>権限</TableCell>
                  <TableCell>勤務形態</TableCell>
                  <TableCell>汎用コード</TableCell>
                  <TableCell>作成日時</TableCell>
                  <TableCell>更新日時</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffs
                  .filter((staff) => {
                    const fullName = `${staff.familyName || ""}${
                      staff.givenName || ""
                    }`;
                    const staffId = staff.id || "";
                    return (
                      fullName.includes(searchQuery) ||
                      staffId.includes(searchQuery)
                    );
                  })
                  .toSorted((a, b) => {
                    const aSortKey = a.sortKey || "";
                    const bSortKey = b.sortKey || "";
                    return aSortKey.localeCompare(bSortKey);
                  })
                  .map((staff, index) => (
                    <TableRow key={index} className="table-row">
                      <TableCell>
                        <Stack direction="row" spacing={0}>
                          <EditButton staff={staff} />
                          <MoreActionButton
                            staff={staff}
                            updateStaff={updateStaff}
                            deleteStaff={deleteStaff}
                          />
                        </Stack>
                      </TableCell>
                      <AccountStatusTableCell staff={staff} />
                      <StatusTableCell staff={staff} />
                      <StaffNameTableCell staff={staff} />
                      <TableCell>{staff.mailAddress}</TableCell>
                      <RoleTableCell staff={staff} />
                      <WorkTypeTableCell staff={staff} />
                      <TableCell>{staff.sortKey || ""}</TableCell>
                      <CreatedAtTableCell staff={staff} />
                      <UpdatedAtTableCell staff={staff} />
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Container>
    </>
  );
}
