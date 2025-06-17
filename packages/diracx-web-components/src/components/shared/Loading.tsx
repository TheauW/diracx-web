import React from "react";

import { Box, CircularProgress } from "@mui/material";

/**
 * Loading component displays a loading spinner centered on the screen.
 * @returns The loading component
 */
export function Loading() {
  return (
    <Box
      sx={{
        display: "flex",
        width: 1,
        height: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <React.Fragment>
        <svg width={0} height={0}>
          <defs>
            <linearGradient id="my_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e01cd5" />
              <stop offset="100%" stopColor="#1CB5E0" />
            </linearGradient>
          </defs>
        </svg>
        <CircularProgress
          sx={{ "svg circle": { stroke: "url(#my_gradient)" } }}
          data-testid="loading-spinner"
        />
      </React.Fragment>
    </Box>
  );
}
