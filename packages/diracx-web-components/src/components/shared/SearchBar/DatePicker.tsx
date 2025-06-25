import {
  LocalizationProvider,
  DateTimePicker,
  DateTimePickerProps,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import React, { KeyboardEvent } from "react";
import "dayjs/locale/en-gb"; // Import the locale for dayjs
import { TextField, TextFieldProps } from "@mui/material";

interface CustomDateTimePickerProps
  extends Omit<DateTimePickerProps<Dayjs>, "value" | "onChange"> {
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  onDateAccepted?: (value: string | null) => void;
  handleArrowKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

/**
 *
 * @param value - The current value of the date-time picker.
 * @param onChange - Callback function to handle changes in the date-time value.
 * @param onDateAccepted - Callback function to handle when the date is accepted.
 * @param handleArrowKeyDown - Callback function to handle arrow key down events.
 * @returns
 */
export function MyDateTimePicker({
  value,
  onChange,
  onDateAccepted,
  handleArrowKeyDown,
  inputRef,
  ...props
}: CustomDateTimePickerProps) {
  const handleAccept = (newValue: string | null) => {
    if (onDateAccepted) {
      onDateAccepted(newValue);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      try {
        handleAccept(value?.toISOString() || null);
      } catch {}
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      if (handleArrowKeyDown) {
        handleArrowKeyDown(event);
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"en-gb"}>
      <DateTimePicker<Dayjs>
        value={value ? dayjs(value) : null}
        onChange={(val, _ctx) => onChange(val)}
        views={["year", "month", "day", "hours", "minutes", "seconds"]}
        onAccept={(val, _ctx) => handleAccept(val ? val.toISOString() : null)}
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

export default MyDateTimePicker;
