"use client";

import { useState, useEffect, useRef } from "react";

import { useOidcAccessToken } from "@axa-fr/react-oidc";
import { useOIDCContext } from "../../hooks/oidcConfiguration";
import { useDiracxUrl } from "../../hooks/utils";

import { SearchBar } from "../shared/SearchBar/SearchBar";

import { InternalFilter, JobSummary } from "../../types";
import { Loading } from "../shared";

import { getJobSummary } from "./JobDataService";
interface JobSearchBarProps {
  /** The filters */
  filters: InternalFilter[];
  /** The function to set the filters */
  setFilters: React.Dispatch<React.SetStateAction<InternalFilter[]>>;
  /** The function to apply the filters */
  handleApplyFilters: () => void;
}

export function JobSearchBar({
  filters,
  setFilters,
  handleApplyFilters,
}: JobSearchBarProps) {
  const additionalCategories = {
    items: [
      "JobID",
      "SubmissionTime",
      "LastUpdateTime",
      "StartExecTime",
      "HeartBeatTime",
      "EndExecTime",
    ],
    type: [
      "category_number",
      "category_date",
      "category_date",
      "category_date",
      "category_date",
      "category_date",
    ],
  };

  const exceptCategories = ["count"];

  const { configuration } = useOIDCContext();
  const { accessToken } = useOidcAccessToken(configuration?.scope);
  const [data, setData] = useState<JobSummary[] | undefined>(undefined);
  const oldFilters = useRef<string>("");

  const diracxUrl = useDiracxUrl();

  useEffect(() => {
    const fetchJobSummary = async () => {
      if (diracxUrl && accessToken) {
        try {
          const result = await getJobSummary(
            diracxUrl,
            [
              "Status",
              "MinorStatus",
              "ApplicationStatus",
              "Site",
              "JobName",
              "JobType",
              "JobGroup",
              "Owner",
              "OwnerGroup",
              "VO",
              "UserPriority",
              "RescheduleCounter",
            ],
            accessToken,
          );
          setData(result.data || []);
        } catch {
          console.error("Failed to fetch job summary");
        }
      }
    };

    fetchJobSummary();
  }, [diracxUrl, accessToken]);

  useEffect(() => {
    const currentFilters = JSON.stringify(filters);
    if (oldFilters.current !== currentFilters) {
      oldFilters.current = currentFilters;
      handleApplyFilters();
    }
  }, [filters, handleApplyFilters]);

  if (data === undefined) return <Loading />;

  return (
    <SearchBar
      filters={filters}
      setFilters={setFilters}
      data={data}
      allowKeyWordSearch={false} // Disable keyword search for job monitor
      exceptCategories={exceptCategories}
      additionalCategories={additionalCategories}
    />
  );
}
