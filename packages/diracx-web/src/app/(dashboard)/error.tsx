"use client";

import { ErrorComponent } from "@dirac-grid/diracx-web-components/components";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ErrorComponent msg={error.message} reset={reset} />;
}
