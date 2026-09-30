import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser, jsonText } from "../supabase";

export default defineTool({
  name: "list_projects_and_impact",
  title: "List projects and impact",
  description: "List existing and planned infrastructure projects plus measured impact metrics.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const sb = supabaseForUser(ctx);
    const [p, m] = await Promise.all([
      sb.from("projects").select("*").order("id"),
      sb.from("impact_metrics").select("*").order("recommendation_id"),
    ]);
    if (p.error) throw new ToolError(p.error.message);
    if (m.error) throw new ToolError(m.error.message);
    return jsonText({ projects: p.data, impact_metrics: m.data });
  },
});
