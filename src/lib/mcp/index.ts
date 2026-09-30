import { defineMcp } from "@lovable.dev/mcp-js";
import listClusters from "./tools/list-clusters";
import listRecommendations from "./tools/list-recommendations";
import listCitizenRequests from "./tools/list-citizen-requests";
import listProjects from "./tools/list-projects";

export default defineMcp({
  name: "pixel-perfect",
  title: "Pixel Perfect",
  version: "0.1.0",
  instructions:
    "Read-only access to JanNexus district planning data (Pune demo): demand clusters, citizen reports, investment recommendations, projects and impact metrics. Recommendations are advisory; humans make funding decisions.",
  tools: [listClusters, listRecommendations, listCitizenRequests, listProjects],
});
