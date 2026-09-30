import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseAnon, jsonText } from "../supabase";

export default defineTool({
  name: "list_clusters",
  title: "List demand clusters",
  description: "List geographic clusters of citizen development demand, ordered by priority score.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const { data, error } = await supabaseAnon()
      .from("development_clusters")
      .select("*")
      .order("priority_score", { ascending: false });
    if (error) throw new ToolError(error.message);
    return jsonText(data);
  },
});
