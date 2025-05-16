"use client";

import { Box } from "@mui/material";
import { useApplicationId } from "../../hooks/application";
import { ApplicationState } from "../../types/ApplicationMetadata";
import { JobDataTable } from "./JobDataTable";

/**
 * Build the Job Monitor application
 *
 * @returns Job Monitor content
 */
export default function JobMonitor() {
  const appId = useApplicationId();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        overflow: "hidden",
      }}
    >
      {/* The key is used to force a re-render of the component when the appId changes */}
      <JobDataTable key={appId} />
    </Box>
  );
}

/**
 * This function validates and converts the state of the application
 * It ensure that the state is in the correct format
 * even if the structure changed between versions
 *
 * @param state - The state of the application
 * @returns The parsed state of the application and a boolean indicating if the state was converted
 * @throws Error if the state is not valid
 */
export function validateAndConvertState(
  state: ApplicationState,
): [ApplicationState, boolean] {
  // This is an example.
  // The previous structure did not have the pagination field, so we add it if it is missing
  let parsed;
  let isValid = true;
  try {
    parsed = JSON.parse(state);
    isValid =
      typeof parsed === "object" &&
      typeof parsed.columnVisibility === "object" &&
      typeof parsed.columnPinning === "object" &&
      typeof parsed.rowSelection === "object" &&
      typeof parsed.pagination === "object" &&
      "pageIndex" in parsed.pagination &&
      "pageSize" in parsed.pagination;

    if (isValid) return [state, false];
  } catch (e) {
    // Convert the state to the new version
    isValid = false;
    if (e instanceof SyntaxError) {
      // The state is not a valid JSON
      throw new Error("The state is not a valid JSON");
    }
  }

  const newState = {
    columnVisibility: parsed.columnVisibility,
    columnPinning: parsed.columnPinning,
    rowSelection: parsed.rowSelection,
    pagination: {
      pageIndex: 0,
      pageSize: 25,
    },
  };

  return [JSON.stringify(newState), true];
}
