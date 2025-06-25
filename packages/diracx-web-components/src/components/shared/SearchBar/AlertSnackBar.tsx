import React from "react";

import { Alert, Snackbar } from "@mui/material";

interface AlertSnackBarProps {
  /** Boolean to control the visibility of the snackbar */
  open: boolean;
  /** Function to set the visibility of the snackbar */
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Message to display in the snackbar (optinal)*/
  message?: string;
  /** Severity of the alert, can be "success", "error", "warning", or "info" (optinal)*/
  severity?: "success" | "error" | "warning" | "info";
  /** Duration in milliseconds before the snackbar automatically closes (optinal)*/
  duration?: number;
}

/**
 *  AlertSnackBar component displays a snackbar with an alert message.
 * @returns A Snackbar component that shows an message
 */
export function AlertSnackBar({
  open,
  setOpen,
  message = "You probably can't do that.",
  severity = "error",
  duration = 6000,
}: AlertSnackBarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <Alert
        onClose={() => setOpen(false)}
        severity={severity}
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
