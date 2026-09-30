import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, jsonText } from "../supabase";

export default defineTool({
  name: "list_recommendations",
  title: "List investment recommendations",
  description: "List infrastructure investment recommendations with evidence, why/why-not reasoning and decision status.",
  inputSchema: {
    status: z
      .enum(["pending", "accepted", "modified", "rejected", "investigating"])
      .optional()
      .describe("Only return recommendations with this decision status."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status }, ctx) => {
    let q = supabaseForUser(ctx).from("recommendations").select("*").order("priority_score", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    return jsonText(data);
  },
});
