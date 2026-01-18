import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // Your standard server client helper
import { AzureChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { createSuperstoreTool } from "./tools";
import { SystemMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
  try {
    // 1. Get the user's session to retrieve the JWT
    // NOTE: This assumes you are using @supabase/ssr or similar for auth
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();

    const SYSTEM_PROMPT = `
    You are an AI assistant that helps users query their superstore sales database. 
    You have access to the 'superstore' database.

    CRITICAL INSTRUCTIONS:
    1. DATA PRESENTATION: When the search_superstore tool returns data, do NOT show the raw JSON. 
    2. TABLES: Use Markdown tables to display 3 or more records. Include columns like Product Name, Category, Sales, and Region.
    3. CURRENCY: Always format numbers as currency (e.g., $1,234.56).
    4. INSIGHTS: After showing the data, provide a 1-sentence summary of the key takeaway (e.g., "The highest selling category in this set is Furniture").
    5. NO DATA: If no results are found, politely suggest alternative search terms.
    6. SECURITY: Never mention technical details like RLS or JWT to the user.

    Your tone should be professional, helpful, and data-driven.
    `;


    // 2. Initialize the Model
    const model = new AzureChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY, // In Node.js defaults to process.env.AZURE_OPENAI_API_KEY
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME, // In Node.js defaults to process.env.AZURE_OPENAI_API_INSTANCE_NAME
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME, // In Node.js defaults to process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION, // In Node.js defaults to process.env.AZURE_OPENAI_API_VERSION
    });

    // 3. Create the tools using the User's Token
    const superstoreTool = createSuperstoreTool(session.access_token);
    const tools = [superstoreTool];

    // 4. Create the Agent
    const agent = createReactAgent({
      llm: model,
      tools: tools,
      stateModifier: new SystemMessage(SYSTEM_PROMPT),
    });

    // 5. Run the Agent
    // We pass the incoming messages directly to the agent
    const result = await agent.invoke({
      messages: messages,
    });

    // 6. Return the last message (the answer)
    // The result.messages is an array; the last one is the AI's final response.
    const lastMessage = result.messages[result.messages.length - 1];
    
    return NextResponse.json({ 
      role: "assistant", 
      content: lastMessage.content 
    });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}