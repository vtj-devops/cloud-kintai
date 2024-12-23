// cspell:ignore notistack
import CloseIcon from "@mui/icons-material/Close";
import { IconButton, styled } from "@mui/material";
import {
  closeSnackbar,
  enqueueSnackbar,
  MaterialDesignContent,
  SnackbarProvider,
} from "notistack";
import { useEffect } from "react";

import { useAppDispatchV2, useAppSelectorV2 } from "../../app/hooks";
import {
  selectSnackbar,
  setSnackbarError,
  setSnackbarSuccess,
  setSnackbarWarn,
} from "../../lib/reducers/snackbarReducer";

const StyledMaterialDesignContent = styled(MaterialDesignContent)(() => ({
  "&.notistack-MuiContent-success": {
    backgroundColor: "#7fff7f",
    // 薄い黒
    color: "#333333",
  },
  "&.notistack-MuiContent-error": {
    backgroundColor: "#ff7f7f",
    color: "#333333",
  },
  "&.notistack-MuiContent-warning": {
    backgroundColor: "#ffff7f",
    color: "#333333",
  },
}));

export default function SnackbarGroup() {
  const snackbar = useAppSelectorV2(selectSnackbar);
  const dispatch = useAppDispatchV2();

  useEffect(() => {
    if (snackbar.success) {
      enqueueSnackbar(snackbar.success, {
        variant: "success",
        className: "snackbar-success",
        autoHideDuration: 6000,
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
      });
      dispatch(setSnackbarSuccess(null));
    }

    if (snackbar.error) {
      enqueueSnackbar(snackbar.error, {
        variant: "error",
        className: "snackbar-error",
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
      });
      dispatch(setSnackbarError(null));
    }

    if (snackbar.warn) {
      enqueueSnackbar(snackbar.warn, {
        variant: "warning",
        className: "snackbar-warn",
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
      });
      dispatch(setSnackbarWarn(null));
    }
  }, [snackbar]);

  return (
    <SnackbarProvider
      action={(snackbarKey) => (
        <IconButton color="inherit" onClick={() => closeSnackbar(snackbarKey)}>
          <CloseIcon />
        </IconButton>
      )}
      Components={{
        success: StyledMaterialDesignContent,
        error: StyledMaterialDesignContent,
        warning: StyledMaterialDesignContent,
      }}
    />
  );
}
