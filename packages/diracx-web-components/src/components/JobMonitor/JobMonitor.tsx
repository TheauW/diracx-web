"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  blue,
  orange,
  grey,
  green,
  red,
  lightBlue,
  purple,
  teal,
  blueGrey,
  lime,
  amber,
} from "@mui/material/colors";
import { lighten, darken, useTheme, Box } from "@mui/material";
import {
  createColumnHelper,
  ColumnPinningState,
  RowSelectionState,
  VisibilityState,
  PaginationState,
  ColumnDef,
} from "@tanstack/react-table";

import { useApplicationId } from "../../hooks/application";
import { Filter } from "../../types/Filter";
import { Job, SearchBody, CategoryType } from "../../types";
import { JobDataTable } from "./JobDataTable";
import { JobSearchBar } from "./JobSearchBar";

/**
 * Build the Job Monitor application
 *
 * @returns Job Monitor content
 */
export default function JobMonitor() {
  const appId = useApplicationId();
  const theme = useTheme();

  // Load the initial state from local storage
  const initialState = sessionStorage.getItem(`${appId}_State`);

  const parsedInitialState =
    typeof initialState === "string" ? JSON.parse(initialState) : null;

  // State for filters
  const [filters, setFilters] = useState<Filter[]>(
    parsedInitialState ? parsedInitialState.filters : [],
  );

  // State for search body
  const [searchBody, setSearchBody] = useState<SearchBody>({
    search: parsedInitialState
      ? parsedInitialState.filters.map((filter: Filter) => ({
          parameter: filter.parameter,
          operator: filter.operator,
          value: filter.value,
          values: filter.values,
        }))
      : [], // Default to an empty array if no filters are present
    sort: [{ parameter: "JobID", direction: "desc" }],
  });

  // States for table settings
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    parsedInitialState
      ? parsedInitialState.columnVisibility
      : {
          JobGroup: false,
          JobType: false,
          Owner: false,
          OwnerGroup: false,
          VO: false,
          StartExecTime: false,
          EndExecTime: false,
          UserPriority: false,
        },
  );
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    parsedInitialState
      ? parsedInitialState.columnPinning
      : {
          left: ["JobID"], // Pin JobID column by default
        },
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    parsedInitialState ? parsedInitialState.rowSelection : {},
  );
  const [pagination, setPagination] = useState<PaginationState>(
    parsedInitialState
      ? parsedInitialState.pagination
      : {
          pageIndex: 0,
          pageSize: 25,
        },
  );

  // Save the state of the app in local storage
  useEffect(() => {
    const state = {
      filters: [...filters],
      columnVisibility: { ...columnVisibility },
      columnPinning: {
        left: [...(columnPinning.left || [])],
        right: [...(columnPinning.right || [])],
      },
      rowSelection: { ...rowSelection },
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    };

    sessionStorage.setItem(`${appId}_State`, JSON.stringify(state));
  }, [
    appId,
    filters,
    columnVisibility,
    columnPinning,
    rowSelection,
    pagination,
  ]);

  // Handle the application of filters
  const handleApplyFilters = () => {
    setSearchBody((prev) => ({
      ...prev,
      search: filters.map(({ parameter, operator, value, values }) => ({
        parameter: fromHumanReadableText(parameter, columns),
        operator,
        value,
        values,
      })),
    }));
    setPagination((prevState) => ({
      ...prevState,
      pageIndex: 0,
    }));
  };

  // Status colors
  const statusColors: Record<string, string> = useMemo(
    () => ({
      Submitting: purple[500],
      Received: blueGrey[500],
      Checking: teal[500],
      Staging: lightBlue[500],
      Waiting: amber[600],
      Matched: blue[300],
      Running: blue[900],
      Rescheduled: lime[700],
      Completing: orange[500],
      Completed: green[300],
      Done: green[500],
      Failed: red[500],
      Stalled: amber[900],
      Killed: red[900],
      Deleted: grey[500],
    }),
    [],
  );

  /**
   * Renders the status cell with colors
   */
  const renderStatusCell = useCallback(
    (status: string) => {
      return (
        <Box
          sx={{
            display: "inline-block",
            borderRadius: "10px",
            padding: "3px 10px",
            backgroundColor:
              theme.palette.mode === "light"
                ? lighten(statusColors[status] ?? "default", 0.1)
                : darken(statusColors[status] ?? "default", 0.3),
            color: "white",
            fontWeight: "bold",
          }}
        >
          {status}
        </Box>
      );
    },
    [theme, statusColors],
  );

  const columnHelper = useMemo(() => createColumnHelper<Job>(), []);

  /**
   * The head cells for the data grid (desktop version)
   */
  const columns = useMemo(
    () => [
      columnHelper.accessor("JobID", {
        id: "JobID",
        header: "ID",
        meta: { type: CategoryType.NUMBER, hideSuggestion: true },
      }),
      columnHelper.accessor("Status", {
        id: "Status",
        header: "Status",
        cell: (info) => renderStatusCell(info.getValue()),
        meta: {
          type: CategoryType.STRING,
          values: Object.keys(statusColors).sort(),
          hideSuggestion: false,
        },
      }),
      columnHelper.accessor("MinorStatus", {
        id: "MinorStatus",
        header: "Minor Status",
      }),
      columnHelper.accessor("ApplicationStatus", {
        id: "ApplicationStatus",
        header: "Application Status",
      }),
      columnHelper.accessor("Site", {
        id: "Site",
        header: "Site",
      }),
      columnHelper.accessor("JobName", {
        id: "JobName",
        header: "Name",
      }),
      columnHelper.accessor("JobGroup", {
        id: "JobGroup",
        header: "Job Group",
      }),
      columnHelper.accessor("JobType", {
        id: "JobType",
        header: "Type",
      }),
      columnHelper.accessor("LastUpdateTime", {
        id: "LastUpdateTime",
        header: "Last Update Time",
        meta: { type: CategoryType.DATE, hideSuggestion: true },
      }),
      columnHelper.accessor("HeartBeatTime", {
        id: "HeartBeatTime",
        header: "Last Sign of Life",
        meta: { type: CategoryType.DATE, hideSuggestion: true },
      }),
      columnHelper.accessor("SubmissionTime", {
        id: "SubmissionTime",
        header: "Submission Time",
        meta: { type: CategoryType.DATE, hideSuggestion: true },
      }),
      columnHelper.accessor("Owner", {
        id: "Owner",
        header: "Owner",
      }),
      columnHelper.accessor("OwnerGroup", {
        id: "OwnerGroup",
        header: "Owner Group",
      }),
      columnHelper.accessor("VO", {
        id: "VO",
        header: "VO",
      }),
      columnHelper.accessor("StartExecTime", {
        id: "StartExecTime",
        header: "Start Execution Time",
        meta: { type: CategoryType.DATE, hideSuggestion: true },
      }),
      columnHelper.accessor("EndExecTime", {
        id: "EndExecTime",
        header: "End Execution Time",
        meta: { type: CategoryType.DATE, hideSuggestion: true },
      }),
      columnHelper.accessor("UserPriority", {
        id: "UserPriority",
        header: "User Priority",
        meta: { type: CategoryType.NUMBER },
      }),
      columnHelper.accessor("RescheduleCounter", {
        id: "RescheduleCounter",
        header: "Reschedule Counter",
        meta: { type: CategoryType.NUMBER },
      }),
    ],
    [columnHelper, renderStatusCell, statusColors],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        overflow: "hidden",
      }}
    >
      <JobSearchBar
        filters={filters}
        setFilters={setFilters}
        searchBody={searchBody}
        handleApplyFilters={handleApplyFilters}
        columns={columns}
      />
      <JobDataTable
        searchBody={searchBody}
        setSearchBody={setSearchBody}
        columns={columns}
        pagination={pagination}
        setPagination={setPagination}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        columnPinning={columnPinning}
        setColumnPinning={setColumnPinning}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        statusColors={statusColors}
      />
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
export function validateAndConvertState(state: string): [string, boolean] {
  // The previous structure did not have the filters field, so we add it if it is missing
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
      "pageSize" in parsed.pagination &&
      typeof parsed.filters === "object"; // New field

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
    filters: [], // Create an empty filters array
    columnVisibility: parsed.columnVisibility,
    columnPinning: parsed.columnPinning,
    rowSelection: parsed.rowSelection,
    pagination: parsed.pagination,
  };

  return [JSON.stringify(newState), true];
}

/**
 * Converts a human-readable job attribute name to its internal name.
 * @param name - The human-readable name of the job attribute
 * @param columns - The array of column definitions
 * @returns The corresponding internal name of the job attribute
 */
export function fromHumanReadableText(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<Job, any>[],
): string {
  const index = columns.findIndex((column) => column.header === name);
  if (index !== -1) {
    return columns[index].id || name; // Return the id if it exists, otherwise
  }
  return name;
}
