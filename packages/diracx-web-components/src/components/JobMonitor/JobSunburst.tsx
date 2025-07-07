import { useState, useEffect } from "react";

import { scaleOrdinal, quantize, interpolateRainbow } from "d3";

import { Box } from "@mui/material";

import { useOidcAccessToken } from "@axa-fr/react-oidc";
import { ColumnDef } from "@tanstack/react-table";
import { useDiracxUrl } from "../../hooks/utils";

import type { JobSummary, SearchBody, Job } from "../../types";
import { Sunburst, Tree } from "../shared/Sunburst";
import { useOIDCContext } from "../../hooks/oidcConfiguration";
import { ColumnSelector } from "../shared/Sunburst/SunburstColumnSelector";
import { getJobSummary } from "./jobDataService";

import { fromHumanReadableText } from "./JobMonitor";

/**
 * Create the JobSunburst component.
 *
 * @param searchBody The search body to be used in the search
 * @param statusColors The colors to be used for the different job statuses
 * @param columns The columns to be used in the table
 * @returns
 */
export function JobSunburst({
  searchBody,
  statusColors,
  columns,
}: {
  searchBody: SearchBody;
  statusColors: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<Job, any>[];
}) {
  const { configuration } = useOIDCContext();
  const { accessToken } = useOidcAccessToken(configuration?.scope);
  const diracxUrl = useDiracxUrl();

  const [groupColumns, setGroupColumns] = useState<string[]>(["Status"]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  const [tree, setTree] = useState<Tree | undefined>(undefined);

  useEffect(() => {
    const newSearch = currentPath.map((elt, index) => {
      return {
        parameter: fromHumanReadableText(groupColumns[index], columns),
        operator: "eq",
        value: elt,
      };
    });
    const newSearchBody: SearchBody = {
      ...searchBody,
      search: searchBody.search
        ? searchBody.search.concat(newSearch)
        : newSearch,
    };
    async function load() {
      const res = await fetchAndBuildTree(
        groupColumns.slice(currentPath.length, currentPath.length + 2),
        newSearchBody,
        diracxUrl,
        accessToken,
        columns,
      );
      setTree({
        name: "",
        children: res,
      });
    }
    load();
  }, [
    groupColumns[currentPath.length],
    groupColumns[currentPath.length + 1],
    currentPath,
    searchBody,
    diracxUrl,
    accessToken,
  ]);

  const defaultColors = scaleOrdinal(
    quantize(interpolateRainbow, tree?.children?.length || 0 + 1),
  );

  function colorScales(name: string, _size: number, _depth: number): string {
    if (statusColors[name]) {
      return statusColors[name];
    }
    if (tree?.children) {
      return defaultColors(name);
    }
    return "#ccc";
  }

  const columList = [
    "Status",
    "Minor Status",
    "Application Status",
    "Site",
    "Type",
    "Job Group",
    "Owner",
    "Owner Group",
    "VO",
    "User Priority",
    "Reschedule Counter",
    "Name",
  ];

  const hasHiddenLevels = groupColumns.length > currentPath.length + 2;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        width: 1,
        paddingTop: 2,
        overflow: "auto",
        height: { xs: "auto", md: 1 },
      }}
    >
      {/* Left Section: Sunburst Chart */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          overflow: "auto",
        }}
      >
        <Sunburst
          tree={tree || { name: "", children: [] }}
          hasHiddenLevels={hasHiddenLevels}
          currentPath={currentPath}
          setCurrentPath={setCurrentPath}
          sizeToText={sizeToText}
          colorScales={colorScales}
          isLoading={!tree}
          error={tree ? null : Error()}
        />
      </Box>

      {/* Right Section: Column selection */}
      <Box
        sx={{
          width: { xs: 1, md: 0.3 },
          display: "flex",
          flexDirection: "column",
          overflowY: "auto", // Allows scrolling for filters
          alignItems: "center",
          gap: 2,
        }}
      >
        <ColumnSelector
          columnList={columList}
          groupColumns={groupColumns}
          setGroupColumns={setGroupColumns}
          setCurrentPath={setCurrentPath}
        />
      </Box>
    </Box>
  );
}

/**
 * Builds the tree from a given path
 *
 * @param data The raw data to be converted into a tree
 * @param groupColumns Array of columns to be used in the group by
 * @param categoryFilter Filter on disabled categories
 * @param currentPath The starting point of the tree
 * @returns
 */
export async function fetchAndBuildTree(
  groupColumns: string[],
  searchBody: SearchBody,
  diracxUrl: string | null,
  accessToken: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<Job, any>[],
): Promise<Tree[]> {
  if (groupColumns.length === 0) {
    return [];
  }

  let data: JobSummary[] = [];

  const formatedGroupColumns = groupColumns.map((columnName) =>
    fromHumanReadableText(columnName, columns),
  );

  if (diracxUrl && accessToken) {
    data = await getJobSummary(
      diracxUrl,
      formatedGroupColumns,
      accessToken,
      searchBody,
    ).then((res) => res.data || []);
    return buildTree(data, formatedGroupColumns);
  }
  return [];
}

/**
 * Builds a tree for the charts
 *
 * @param data Data to be transformed into a tree
 * @param groupColumns Array of columns to be used in the group by
 * @param parentPath The path to this Data
 * @returns The tree corresponding or the sum if it's a leaf
 */
function buildTree(
  data: JobSummary[],
  groupColumns: string[],
  parentPath: string[] = [],
): Tree[] {
  if (groupColumns.length === 0) return [];

  const current = groupColumns[0];

  const groupedData = data.reduce<Record<string, JobSummary[]>>((acc, item) => {
    const key: string = String(item[current]);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const total = data.reduce((sum, item) => sum + Number(item["count"]), 0);
  const threshold = total * 0.05;

  const nodes: Tree[] = [];
  let othersValue: Tree | null = null;

  for (const key in groupedData) {
    const group = groupedData[key];
    const groupTotal = group.reduce(
      (sum, item) => sum + Number(item["count"]),
      0,
    );

    if (groupTotal < threshold) {
      // Too small group, add to "Others"
      if (othersValue === null) {
        othersValue = { name: key, value: groupTotal };
      } else if (othersValue) {
        othersValue = {
          name: "Others",
          value: (othersValue.value || 0) + groupTotal,
        };
      }
    } else {
      if (groupColumns.length === 1) {
        nodes.push({
          name: key,
          value: groupTotal,
        });
      } else {
        nodes.push({
          name: key,
          children: buildTree(group, groupColumns.slice(1), [
            ...parentPath,
            key,
          ]),
        });
      }
    }
  }

  if (othersValue) {
    nodes.push(othersValue);
  }

  return nodes;
}

/**
 *
 * @param size The number of jobs
 * @param total The total number of jobs (optional)
 * @returns A string with the number of jobs
 */
function sizeToText(size: number, total?: number): string {
  if (size > 1e9)
    return (
      `${(size / 1e9).toFixed(1)} billion jobs` +
      (total ? ` (${((size / total) * 100).toFixed(2)}%)` : "")
    );
  if (size > 1e6)
    return (
      `${(size / 1e6).toFixed(1)} million jobs` +
      (total ? ` (${((size / total) * 100).toFixed(2)}%)` : "")
    );
  if (size > 1e3)
    return (
      `${(size / 1e3).toFixed(1)} thousand\njobs` +
      (total ? ` (${((size / total) * 100).toFixed(2)}%)` : "")
    );
  if (size > 1)
    return (
      `${size} jobs` + (total ? ` (${((size / total) * 100).toFixed(2)}%)` : "")
    );
  if (size === 1)
    return `1 job` + (total ? ` (${((size / total) * 100).toFixed(2)}%)` : "");
  return "";
}
