import { tool } from "@langchain/core/tools";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Factory function to create tools with the user's context
export const createSuperstoreTool = (authToken: string) => {
  return tool(
    async ({ query }) => {
      console.log("🛠️ Tool executing query:", query);

      // 1. Create a Supabase client scoped to THIS user
      // We use the anon key + the user's JWT. 
      // This ensures RLS policies apply.
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        }
      );

      // --- DEBUG START ---
      const { data: authDebug, error: authError } = await supabase.auth.getUser(authToken);
      console.log("🔍 JWT User ID:", authDebug?.user?.id);
      console.log("🔍 JWT Email:", authDebug?.user?.email);
      
      // Test what the DB sees inside the SQL context
      const { data: dbDebug } = await supabase.rpc('get_my_auth_context'); 
      console.log("🔍 Database RLS Context:", dbDebug);
      // --- DEBUG END ---

      // 2. Execute the query
      // For safety, we use a fixed query on the 'superstore' table.
      // You can also use .rpc() if you want to execute raw SQL safely.
      const { data, error } = await supabase
        .from("superstore")
        .select("*")
        // Simple search example using 'ilike' (case-insensitive match)
        // You might want to use .or() or full text search depending on complexity
        // .or(`product_name.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(40);

      console.log("🛠️ Tool query result:", { data, error });

      if (error) {
        return `Error fetching data: ${error.message}`;
      }

      if (!data || data.length === 0) {
        return "No matching records found in the superstore.";
      }

      // Return JSON string for the LLM to parse
      return JSON.stringify(data);
    },
    {
      name: "search_superstore",
      description: "Search the superstore database for sales information.",
      schema: z.object({
        query: z.string().describe("The search term (e.g., 'furniture', 'Sony TV', 'California')."),
      }),
    }
  );
};