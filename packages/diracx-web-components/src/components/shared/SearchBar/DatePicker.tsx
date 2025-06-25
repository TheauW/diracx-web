import {
  LocalizationProvider,
  DateTimePicker,
  DateTimePickerProps,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import React, { KeyboardEvent, useState } from "react";
import "dayjs/locale/en-gb"; // Import the locale for dayjs
import { TextField, TextFieldProps } from "@mui/material";
import { AlertSnackBar } from "./AlertSnackBar";

interface CustomDateTimePickerProps
  extends Omit<DateTimePickerProps<Dayjs>, "value" | "onChange"> {
  value: string | null;
  onDateAccepted: (value: string | null) => void;
  handleArrowKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  handleBackspaceKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

/**
 *
 * @param value - The current value of the date-time picker.
 * @param onDateAccepted - Callback function to handle when the date is accepted.
 * @param handleArrowKeyDown - Callback function to handle arrow key down events.
 *  @param handleBackspaceKeyDown - Callback function to handle backspace key down events.
 * @returns
 */
export function MyDateTimePicker({
  value,
  onDateAccepted,
  handleArrowKeyDown,
  handleBackspaceKeyDown,
  inputRef,
  ...props
}: CustomDateTimePickerProps) {
  const [dateValue, setDateValue] = useState<Dayjs | null>(
    value ? dayjs(value) : null,
  );
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      try {
        onDateAccepted(dateValue?.toISOString() || null);
      } catch {
        setOpenSnackbar(true);
      }
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      if (handleArrowKeyDown) {
        handleArrowKeyDown(event);
      }
    }
    if (event.key === "Backspace") {
      if (handleBackspaceKeyDown) {
        handleBackspaceKeyDown(event);
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"en-gb"}>
      <div onClick={(e) => e.stopPropagation()}>
        <DateTimePicker<Dayjs>
          value={dateValue}
          onChange={(val) => setDateValue(val)}
          views={["year", "month", "day", "hours", "minutes", "seconds"]}
          onAccept={(val, _ctx) =>
            onDateAccepted(val ? val.toISOString() : null)
          }
          slots={{
            textField: ForwardedTextField, // Use the forwarded ref TextField
          }}
          slotProps={{
            textField: {
              onKeyDown: handleKeyDown,
              inputRef: inputRef, // Pass the ref to the TextField
            },
          }}
          {...props}
        />
      </div>
      <AlertSnackBar
        open={openSnackbar}
        setOpen={setOpenSnackbar}
        message="Invalid date format"
      />
    </LocalizationProvider>
  );
}

/**
 *  ForwardedTextField is a wrapper around the MUI TextField component
 *  that allows it to be used with the DateTimePicker component.
 *  It forwards the ref to the input element and applies custom styles.
 */
const ForwardedTextField = React.forwardRef<HTMLElement, TextFieldProps>(
  function ForwardedTextField(props, ref) {
    return (
      <TextField
        {...props}
        inputRef={ref}
        variant="standard"
        sx={{
          // Remove the underline from the TextField
          "& .MuiInput-underline:before": { borderBottom: "none" },
          "& .MuiInput-underline:after": { borderBottom: "none" },
        }}
      />
    );
  },
);
