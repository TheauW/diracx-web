"use client";

import { useEffect, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useOidcAccessToken } from "@axa-fr/react-oidc";
import { useOIDCContext } from "../../hooks/oidcConfiguration";
import { useDiracxUrl } from "../../hooks/utils";
import { SearchBar } from "../shared/SearchBar/SearchBar";
import {
  InternalFilter,
  JobSummary,
  SearchBarSuggestions,
  SearchBarToken,
  SearchBarTokenEquation,
  SearchBody,
  Job,
  Operators,
} from "../../types";
import { getJobSummary } from "./jobDataService";
import { fromHumanReadableText } from "./JobMonitor";

interface JobSearchBarProps {
  /** The filters */
  filters: InternalFilter[];
  /** The function to set the filters */
  setFilters: React.Dispatch<React.SetStateAction<InternalFilter[]>>;
  /** The search body to send along with the request */
  searchBody: SearchBody;
  /** The function to apply the filters */
  handleApplyFilters: () => void;
  /** The columns to display in the job monitor */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<Job, any>[];
}

export function JobSearchBar({
  filters,
  searchBody,
  setFilters,
  handleApplyFilters,
  columns,
}: JobSearchBarProps) {
  const { configuration } = useOIDCContext();
  const { accessToken } = useOidcAccessToken(configuration?.scope);
  const oldFilters = useRef<string>("");

  const diracxUrl = useDiracxUrl();

  useEffect(() => {
    const currentFilters = JSON.stringify(filters);
    if (oldFilters.current !== currentFilters) {
      oldFilters.current = currentFilters;
      handleApplyFilters();
    }
  }, [filters, handleApplyFilters]);

  return (
    <SearchBar
      filters={filters}
      setFilters={setFilters}
      createSuggestions={(
        previousToken: SearchBarToken | undefined,
        previousEquation: SearchBarTokenEquation | undefined,
        equationIndex?: number,
      ) =>
        createSuggestions(
          diracxUrl,
          accessToken,
          previousToken,
          previousEquation,
          columns,
          searchBody,
          equationIndex,
        )
      }
      allowKeyWordSearch={false} // Disable keyword search for job monitor
    />
  );
}

/**
 * Creates suggestions for the search bar based on the current tokens
 * If necessary, it fetches job summaries from the server to get personalized suggestions
 *
 * @param diracxUrl The URL of the DiracX server.
 * @param accessToken The access token for authentication, which can be undefined if not authenticated.
 * @param previousToken The previous token, which can be undefined if no token is focused.
 * @param previousEquation The previous equation, which can be undefined if no equation is focused.
 * @param columns The columns to be used for suggestions, which are used to determine the categories and types.
 * @param searchBody The search body to be sent along with the request (optional).
 * @param searchBodyIndex The index of the search body, which is used to determine the current search context (optional).
 * @returns A list of suggestions based on the current tokens and data.
 */
async function createSuggestions(
  diracxUrl: string | null,
  accessToken: string | undefined,
  previousToken: SearchBarToken | undefined,
  previousEquation: SearchBarTokenEquation | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<Job, any>[],
  searchBody: SearchBody,
  searchBodyIndex?: number,
): Promise<SearchBarSuggestions> {
  let data: JobSummary[] = [];

  const search = [...(searchBody?.search || [])];

  const newSearchBody = {
    ...searchBody,
    search: search.slice(0, searchBodyIndex),
  };

  const fetchJobSummary = async (category: string) => {
    if (diracxUrl && accessToken) {
      try {
        const result = await getJobSummary(
          diracxUrl,
          [category],
          accessToken,
          newSearchBody,
        );
        data = result.data || [];
      } catch {
        throw new Error("Failed to fetch job summary");
      }
    }
  };

  if (
    !previousToken ||
    !previousEquation ||
    previousEquation.items.length === 0 ||
    previousToken.type.startsWith("custom") ||
    previousToken.type === "value"
  ) {
    const items = columns.map((column) => column.header as string);
    const types = columns.map(
      (column) => `category_${column.meta?.type || "string"}`,
    );

    return {
      items: items,
      type: types,
    };
  }

  // Here, we need personalized suggestions based on the previous token
  if (previousToken.type === "operator_string") {
    // Load the suggestions for the selected category
    const category = fromHumanReadableText(
      previousEquation.items[0].label as string,
      columns,
    );
    await fetchJobSummary(category);
    const items = data.map(
      (item) => item[category as keyof JobSummary] as string,
    );

    return {
      items: items,
      type: Array(items.length).fill("value"),
    };
  }

  // If the previous token is a date operator, we need to provide time units
  if (
    previousToken.type === "operator_date" &&
    previousToken.label === "in the last"
  ) {
    return {
      items: ["minute", "hour", "day", "week", "month", "year"],
      type: Array(6).fill("value"),
    };
  }

  // else
  let items: string[] = [];
  switch (previousToken.type) {
    case "category_string":
      items = Operators.getStringOperators().map((op) => op.getDisplay());
      return {
        items: items,
        type: Array(items.length).fill("operator_string"),
      };
    case "category_number":
      items = Operators.getNumberOperators().map((op) => op.getDisplay());
      return {
        items: items,
        type: Array(items.length).fill("operator_number"),
      };
    case "category_boolean":
      items = Operators.getBooleanOperators().map((op) => op.getDisplay());
      return {
        items: items,
        type: Array(items.length).fill("operator_bool"),
      };
    case "category_date":
      items = Operators.getDateOperators().map((op) => op.getDisplay());
      return {
        items: items,
        type: Array(items.length).fill("operator_date"),
      };
    case "category":
      items = Operators.getDefaultOperators().map((op) => op.getDisplay());
      return {
        items: items,
        type: Array(items.length).fill("operator"),
      };

    // We don't want suggestions for the number and in case of a custom token
    default:
      return {
        items: [],
        type: [],
      };
  }
}
