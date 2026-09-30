import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon, jsonText } from "../supabase";

export default defineTool({
  name: "list_citizen_requests",
  title: "List recent citizen reports",
  description: "List the most recent citizen development requests with their AI-extracted civic need.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("How many reports to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const { data, error } = await supabaseAnon()
      .from("citizen_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (error) throw new ToolError(error.message);
    return jsonText(data);
  },
});
