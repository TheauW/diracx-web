"use client";

import { Dashboard, FolderCopy, Monitor } from "@mui/icons-material";
import ApplicationMetadata from "../types/ApplicationMetadata";
import JobMonitor, {
  validateAndConvertState as validateAndConvertState_JobMonitor,
} from "./JobMonitor/JobMonitor";
import BaseApp from "./BaseApp/BaseApp";

export const applicationList: ApplicationMetadata[] = [
  { name: "Base Application", component: BaseApp, icon: Dashboard },
  {
    name: "Job Monitor",
    component: JobMonitor,
    icon: Monitor,
    validateAndConvertState: validateAndConvertState_JobMonitor,
  },
  {
    name: "File Catalog",
    component: JobMonitor,
    icon: FolderCopy,
  },
];
