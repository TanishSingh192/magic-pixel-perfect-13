import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser, jsonText } from "../supabase";

export default defineTool({
  name: "list_clusters",
  title: "List demand clusters",
  description: "List geographic clusters of citizen development demand, ordered by priority score.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (, ctx) => {
    const { data, error } = await supabaseForUser(ctx)
      .from("development_clusters")
      .select("*")
      .order("priority_score", { ascending: false });
    if (error) throw new ToolError(error.message);
    return jsonText(data);
  },
});
