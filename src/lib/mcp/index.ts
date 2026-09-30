import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listClusters from "./tools/list-clusters";
import listRecommendations from "./tools/list-recommendations";
import listCitizenRequests from "./tools/list-citizen-requests";
import listProjects from "./tools/list-projects";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "pixel-perfect",
  title: "Pixel Perfect",
  version: "0.1.0",
  instructions:
    "Read-only access to JanNexus district planning data (Pune demo) for signed-in planners: demand clusters, citizen reports, investment recommendations, projects and impact metrics. Recommendations are advisory; humans make funding decisions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listClusters, listRecommendations, listCitizenRequests, listProjects],
});
