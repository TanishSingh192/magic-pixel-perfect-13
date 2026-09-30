import { queryOptions } from "@tanstack/react-query";

import { getPlatformData } from "./jannexus.functions";

export const platformQuery = queryOptions({
  queryKey: ["platform-data"],
  queryFn: () => getPlatformData(),
});
