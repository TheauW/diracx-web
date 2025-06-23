import React from "react";

import {
  Box,
  Card,
  Typography,
  Button,
  InputLabel,
  MenuItem,
  FormControl,
  Tooltip,
} from "@mui/material";

import Select, { SelectChangeEvent } from "@mui/material/Select";
import RestoreIcon from "@mui/icons-material/Restore";

interface SelectColumnsProps {
  /** The row data*/
  columnList: string[];
  /** The columns used in the group by */
  groupColumns: string[];
  /** Setter for groupColumns */
  setGroupColumns: React.Dispatch<React.SetStateAction<string[]>>;
  /** Setter for the current path in the tree */
  setCurrentPath: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * This component is used to select the columns to be used in the group by
 *
 * @param props See SelectColumnProps for more detials
 * @see {@link SelectColumnProps}
 * @returns A table which managed the group by on the columns
 */
export function ColumnSelector({
  columnList,
  groupColumns,
  setGroupColumns,
  setCurrentPath,
}: SelectColumnsProps) {
  // Default group columns
  const defaultGroupColumns = ["Status"];

  /**
   * Change the columns used for the group by
   *
   * @param event The event which triggers the change
   * @param depth The depth in the tree
   */
  const handleChange = (event: SelectChangeEvent<string>, depth: number) => {
    let newTab = [...groupColumns];
    if (event.target.value === "None") {
      // Delete a column
      newTab = newTab.filter((_elt, index) => index !== depth);
      setCurrentPath((currentPath) => currentPath.slice(0, depth - 1));
    } else {
      // Add or change a column
      if (newTab[depth]) {
        // Change the column
        newTab[depth] = event.target.value;
        setCurrentPath((currentPath) => currentPath.slice(0, depth));
      } else {
        // Add a column
        newTab.push(event.target.value);
      }
    }
    setGroupColumns(newTab);
  };

  const resetColumnsToPlot = () => {
    // Check if the default group columns are already selected
    setGroupColumns(defaultGroupColumns);
    setCurrentPath([]);
  };

  /** A arrray with one cell per column in the group by */
  const additionalChoice = [];

  for (let i = 0; i < groupColumns.length + 1; i++) {
    const availableColumns = columnList.filter(
      (column) => column === groupColumns[i] || !groupColumns.includes(column),
    );

    additionalChoice.push(
      <FormControl sx={{ m: 1, minWidth: 120 }} key={`cat-${i}`}>
        <InputLabel id={`cat${i + 1}-label`}>Level {i + 1}</InputLabel>
        <Select
          value={groupColumns[i] || "None"}
          onChange={(event) => handleChange(event, i)}
          autoWidth={true}
          variant="standard"
        >
          <MenuItem key="None" value={"None"}>
            None
          </MenuItem>
          {availableColumns.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </Select>
      </FormControl>,
    );
  }

  return (
    <Box
      sx={{
        gap: 1,
        width: 1,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      <Card
        variant="outlined"
        sx={{ padding: 2, minHeight: "200px", width: 1 }}
      >
        <Tooltip title="Select the columns to be used in the group by">
          <Typography variant="h5" textAlign={"center"}>
            Columns to plot
          </Typography>
        </Tooltip>
        {additionalChoice}
        <div>
          <Button
            color="primary"
            startIcon={<RestoreIcon />}
            onClick={resetColumnsToPlot}
          >
            Reset columns
          </Button>
        </div>
      </Card>
    </Box>
  );
}
