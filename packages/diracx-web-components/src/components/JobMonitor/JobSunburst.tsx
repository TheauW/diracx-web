import { useState, useEffect } from "react";

import { scaleOrdinal, quantize, interpolateRainbow } from "d3";

import { Box } from "@mui/material";

import { useOidcAccessToken } from "@axa-fr/react-oidc";
import { useDiracxUrl } from "../../hooks/utils";

import type { JobSummary, SearchBody } from "../../types";
import { Sunburst, Tree } from "../shared/Sunburst";
import { useOIDCContext } from "../../hooks/oidcConfiguration";
import { ColumnSelector } from "./SunburstColumnSelector";
import { getJobSummary } from "./JobDataService";

import { fromHumanReadableText } from "./JobMonitor";

/**
 * Create the JobSunburst component.
 *
 * @param searchBody The search body to be used in the search
 * @param statusColors The colors to be used for the different job statuses
 * @returns
 */
export function JobSunburst({
  searchBody,
  statusColors,
}: {
  searchBody: SearchBody;
  statusColors: Record<string, string>;
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
        parameter: fromHumanReadableText(groupColumns[index]),
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
        {tree ? (
          <Sunburst
            tree={tree}
            hasHiddenLevels={hasHiddenLevels}
            currentPath={currentPath}
            setCurrentPath={setCurrentPath}
            sizeToText={sizeToText}
            colorScales={colorScales}
          />
        ) : (
          <p>Waiting</p>
        )}
      </Box>

      {/* Right Section: Column selection */}
      <Box
        sx={{
          width: { xs: 1, md: 0.4 },
          display: "flex",
          flexDirection: "column",
          overflowY: "auto", // Allows scrolling for filters
          alignItems: "center",
          gap: 2,
          paddingTop: 2,
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
): Promise<Tree[]> {
  if (groupColumns.length === 0) {
    return [];
  }

  let data: JobSummary[] = [];

  const formatedGroupColumns = groupColumns.map((col) =>
    fromHumanReadableText(col),
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
 * @param categoryFilter Filter on disabled categories
 * @param parentPath The path to this Data
 * @returns The tree corresponding or the sum if it's a leaf
 */
function buildTree(
  data: JobSummary[],
  groupColumns: string[],
  parentPath: string[] = [],
): Tree[] {
  const current = groupColumns[0]; // Current category grouped

  const groupedData = data.reduce<Record<string, JobSummary[]>>((acc, item) => {
    const key: string = String(item[current]); // Name of the category
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const nodes: Tree[] = [];

  for (const searchKey in groupedData) {
    const fullPath: string[] = [...parentPath];
    fullPath.push(searchKey);

    const group = groupedData[searchKey];
    if (groupColumns.length === 1) {
      nodes.push({
        name: searchKey,
        value: group.reduce((sum, item) => sum + Number(item["count"]), 0),
      });
    } else {
      nodes.push({
        name: searchKey,
        children: buildTree(group, groupColumns.slice(1), fullPath),
      });
    }
  }

  return nodes;
}

/**
 *
 * @param size The number of jobs
 * @returns A string with the number of jobs
 */
function sizeToText(size: number): string {
  if (size > 1e9) return `${(size / 1e9).toFixed(1)} billion jobs`;
  if (size > 1e6) return `${(size / 1e6).toFixed(1)} million jobs`;
  if (size > 1e3) return `${(size / 1e3).toFixed(1)} thousand\njobs`;
  if (size > 1) return `${size} jobs`;
  if (size === 1) return `1 job`;
  return "";
}
