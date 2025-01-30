import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// LangGraph and LangChain imports
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  BaseMessageLike,
  ToolMessage,
} from "@langchain/core/messages";
import { ToolCall } from "@langchain/core/messages/tool";
import {
  entrypoint,
  addMessages,
  task,
} from "@langchain/langgraph";

/**
 * 1) Define your chat model
 * Here, "gpt-4o" is a placeholder. Replace if you prefer another model.
 * Using ChatOpenAI from LangChain for convenience. ([1](https://js.langchain.com/docs/modules/agents/agent_types/react))
 */
const model = new ChatOpenAI({
  model: "gpt-4o",
});

/**
 * 2) Define a sample tool for weather retrieval.
 * The second parameter describes how to use the tool, referencing zod for schema.
 */
const getWeather = tool(
  ({ location }: { location: string }) => {
    const lc = location.toLowerCase();
    if (lc.includes("san francisco")) {
      return "It's sunny in San Francisco!";
    } else if (lc.includes("boston")) {
      return "It's rainy in Boston!";
    } else {
      return `I don't have weather data for ${location}.`;
    }
  },
  {
    name: "getWeather",
    description: "Retrieve the weather for a specified location.",
    schema: z.object({
      location: z.string().describe("Location to get the weather for"),
    }),
  }
);

// Collect tools in an array
const tools = [getWeather];

/**
 * 3) Define tasks to call the model or tools. ([2](https://js.langchain.com/docs/modules/agents/agent_types/react))
 */

// callModel: sends messages to the model and can generate tool calls
const callModel = task("callModel", async (messages: BaseMessageLike[]) => {
  const response = await model.bindTools(tools).invoke(messages);
  return response;
});

// callTool: executes the requested tool and returns a ToolMessage
const callTool = task("callTool", async (toolCall: ToolCall) => {
  const requestedTool = tools.find((t) => t.name === toolCall.name);
  if (!requestedTool) {
    return new ToolMessage({ 
      content: "Tool not found.", 
      tool_call_id: toolCall.id ?? "unknown"
    });
  }
  const observation = await requestedTool.invoke(toolCall.args as { location: string });
  return new ToolMessage({ 
    content: observation, 
    tool_call_id: toolCall.id ?? "unknown"
  });
});

/**
 * 4) Define the ReAct agent entrypoint.
 * This uses a simple loop to catch tool calls, invoke them, and gather responses.
 */
const agent = entrypoint("agent", async (messages: BaseMessageLike[]) => {
  let currentMessages = messages;
  let llmResponse = await callModel(currentMessages);

  while (true) {
    // If the model calls any tools, process them
    if (!llmResponse.tool_calls || llmResponse.tool_calls.length === 0) {
      break;
    }
    const toolResults = [];
    for (const tCall of llmResponse.tool_calls) {
      const resultMsg = await callTool(tCall);
      toolResults.push(resultMsg);
    }
    // Append the tool call + results to the conversation
    currentMessages = addMessages(currentMessages, [llmResponse, ...toolResults]);
    llmResponse = await callModel(currentMessages);
  }
  // Return the final AI response after no more tool calls
  return llmResponse;
});

/**
 * 5) Serve an HTTP request using Deno on Supabase Edge Functions.
 * We'll parse a "location" query param, feed it to the agent, and respond with the final answer. ([3](https://js.langchain.com/docs/modules/agents/agent_types/react))
 */
serve(async (req: Request) => {
  try {
    const { location } = await req.json();
    // Start the agent with a question about the weather in that location
    const userMessage = `Question: what's the weather in ${location}?`;
    // We pass the user message as an AI conversation with a "User" message
    const response = await agent.invoke([{ type: "human", content: userMessage }]);
    return new Response(JSON.stringify({
      answer: response.content,
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 400 }
    );
  }
});


/**
 * To test locally:
 * 1. Start the Supabase function:
 *    supabase functions serve reactAgent --env-file .env.local
 * 
  2. Call the endpoint using curl:
     curl -X POST http://localhost:54321/functions/v1/reactAgent -H 'Content-Type: application/json' -d '{"location": "London"}'
 * 
 * Make sure your .env.local file contains:
 * - OPENAI_API_KEY
 * - WEATHER_API_KEY 
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

