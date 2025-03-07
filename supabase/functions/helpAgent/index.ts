import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// LangGraph and LangChain imports
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
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
import { createClient } from "@supabase/supabase-js";
import { awaitAllCallbacks } from "@langchain/core/callbacks/promises";

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

// Initialize OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: Deno.env.get('OPENAI_API_KEY')!,
  modelName: "text-embedding-ada-002"
});

// Function to get embeddings for a text query
async function getQueryEmbedding(text: string): Promise<string> {
  const embeddingArray = await embeddings.embedQuery(text);
  // Convert to pgvector format
  return '[' + embeddingArray.join(',') + ']';
}

/**
 * 1) Define your chat model
 * Here, "gpt-4o" is a placeholder. Replace if you prefer another model.
 * Using ChatOpenAI from LangChain for convenience. ([1](https://js.langchain.com/docs/modules/agents/agent_types/react))
 */
const model = new ChatOpenAI({
  model: "gpt-4o-mini",
});

/**
 * 2) Define a sample tool for weather retrieval.
 * The second parameter describes how to use the tool, referencing zod for schema.
 */
// const getWeather = tool(
//   ({ location }: { location: string }) => {
//     const lc = location.toLowerCase();
//     if (lc.includes("san francisco")) {
//       return "It's sunny in San Francisco!";
//     } else if (lc.includes("boston")) {
//       return "It's rainy in Boston!";
//     } else {
//       return `I don't have weather data for ${location}.`;
//     }
//   },
//   {
//     name: "getWeather",
//     description: "Retrieve the weather for a specified location.",
//     schema: z.object({
//       location: z.string().describe("Location to get the weather for"),
//     }),
//   }
// );

// Query Tools

const findEmployee = tool(
  async ({ search_term }: { search_term: string }) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email')
      .eq('is_customer', false)
      .eq('is_active', true)
      .is('is_admin', false)
      .or(`first_name.ilike.%${search_term}%,last_name.ilike.%${search_term}%,email.ilike.%${search_term}%`)
      .limit(5);

    if (error) throw error;
    if (!data || data.length === 0) {
      return JSON.stringify({ 
        found: false, 
        message: `No employee found matching "${search_term}". Will assign to least loaded employee.`
      });
    }
    if (data.length > 1) {
      return JSON.stringify({ 
        found: false,
        message: `Multiple employees found matching "${search_term}". Please be more specific or I will assign to least loaded employee.`
      });
    }

    return JSON.stringify({ 
      found: true,
      employee: data[0]
    });
  },
  {
    name: "findEmployee",
    description: "Find an employee by name or email to get their profile ID",
    schema: z.object({
      search_term: z.string().describe("Name or identifier to search for (e.g., 'Robert', 'Bob Smith')")
    })
  }
);

const findLeastLoadedEmployee = tool(
  async () => {
    try {
      // Get all employees and their current ticket counts
      const { data: ticketCounts, error: countError } = await supabase
        .rpc('get_employee_open_ticket_counts');
      
      if (countError) throw countError;

      // Get all active non-customer, non-admin employees
      const { data: employees, error: empError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('is_active', true)
        .is('is_customer', false)
        .is('is_admin', false);

      if (empError) throw empError;
      if (!employees?.length) {
        return JSON.stringify({
          found: false,
          message: "No available employees found"
        });
      }

      // Create a map of employee IDs to their ticket counts
      const ticketCountMap = new Map(
        ticketCounts?.map((tc: { profile_id: string; count: number }) => [tc.profile_id, tc.count]) || []
      );

      // Find the employee with the lowest ticket count
      const leastLoadedEmployee = employees.reduce((minAgent, employee) => {
        const currentCount = ticketCountMap.get(employee.user_id) || 0;
        const minCount = ticketCountMap.get(minAgent?.user_id) || 0;
        
        return (!minAgent || currentCount < minCount) ? employee : minAgent;
      }, employees[0]);

      return JSON.stringify({
        found: true,
        employee: leastLoadedEmployee,
        ticketCount: ticketCountMap.get(leastLoadedEmployee.user_id) || 0
      });
    } catch (_error) {
      return JSON.stringify({
        found: false,
        message: "Error finding least loaded employee"
      });
    }
  },
  {
    name: "findLeastLoadedEmployee",
    description: "Find the employee with the fewest open tickets for automatic assignment",
    schema: z.object({})
  }
);

const getTicketDetails = tool(
  async ({ ticket_id }: { ticket_id: string }) => {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_assignments (
          profile_id,
          profiles (
            first_name,
            last_name
          )
        ),
        statuses (
          name
        ),
        priorities (
          name
        )
      `)
      .eq('id', ticket_id)
      .single();

    if (error) throw error;
    if (!data) return "Ticket not found";

    return JSON.stringify(data);
  },
  {
    name: "getTicketDetails",
    description: "Get complete details about a ticket including assignments, status, and priority",
    schema: z.object({
      ticket_id: z.string().describe("The ID of the ticket to get details for")
    })
  }
);

const getStatusOptions = tool(
  async () => {
    const { data, error } = await supabase
      .from('statuses')
      .select('id, name, is_counted_open')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return JSON.stringify(data);
  },
  {
    name: "getStatusOptions",
    description: "Get list of available ticket status options",
    schema: z.object({})
  }
);

const getPriorityOptions = tool(
  async () => {
    const { data, error } = await supabase
      .from('priorities')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return JSON.stringify(data);
  },
  {
    name: "getPriorityOptions",
    description: "Get list of available ticket priority options",
    schema: z.object({})
  }
);

// Add this interface before the searchKnowledgeBase tool
interface ArticleSearchResult {
  article_id: string;
  article_name: string;
  chunk_text: string;
  similarity: number;
}

const searchKnowledgeBase = tool(
  async ({ 
    search_query
  }: { 
    search_query: string;
  }) => {
    try {
      // Get embeddings for the search query
      const queryEmbedding = await getQueryEmbedding(search_query);

      // Search for similar articles using vector similarity
      const { data, error } = await supabase
        .rpc('search_article_chunks', {
          query_embedding: queryEmbedding,
          similarity_threshold: 0.7, // Base threshold for possible relevance
          max_results: 3
        });

      if (error) throw error;
      if (!data || data.length === 0) return "No relevant knowledge base articles found for this query.";

      // Format and categorize results by relevance
      const formattedResults = (data as ArticleSearchResult[]).map(result => ({
        id: result.article_id,
        name: result.article_name,
        relevant_chunk: result.chunk_text,
        similarity_score: result.similarity,
        relevance: result.similarity >= 0.85 ? 'highly_relevant' : 'possibly_relevant'
      }));

      // Sort by similarity score to show most relevant first
      formattedResults.sort((a, b) => b.similarity_score - a.similarity_score);

      // Group results by relevance for clearer presentation
      const groupedResults = {
        highly_relevant: formattedResults.filter(r => r.relevance === 'highly_relevant'),
        possibly_relevant: formattedResults.filter(r => r.relevance === 'possibly_relevant')
      };

      return JSON.stringify(groupedResults);
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return "Error searching knowledge base articles";
    }
  },
  {
    name: "searchKnowledgeBase",
    description: "Search for relevant public knowledge base articles using semantic similarity. Returns both highly relevant (similarity > 0.85) and possibly relevant (similarity > 0.7) articles, clearly marked.",
    schema: z.object({
      search_query: z.string().describe("The search term or topic to find articles about")
    })
  }
);

// Add these interfaces before the getTicketHistory tool
interface ProfileData {
  first_name: string | null;
  last_name: string | null;
}

interface HistoryEntry {
  id: string;
  created_at: string;
  action: string;
  changes: {
    title?: string;
    description?: string;
    content?: string;
    profile_id?: string;
    status_id?: string;
    priority_id?: string;
  };
  from_ai: boolean;
  actor_id: string | null;
  profiles: ProfileData | null;
}

interface CommentEntry {
  id: string;
  created_at: string;
  content: string;
  from_ai: boolean;
  author_id: string | null;
  profiles: ProfileData | null;
}

interface ConversationEntry {
  id: string;
  created_at: string;
  text: string;
  from_ai: boolean;
  profile_id: string | null;
  profiles: ProfileData | null;
}

// Add before the interfaces
type PostgrestError = {
  message: string;
  details: string;
  hint: string;
  code: string;
};

const getTicketHistory = tool(
  async ({ ticket_id }: { ticket_id: string }) => {
    // Get ticket history entries
    const { data: historyData, error: historyError } = await supabase
      .from('ticket_history')
      .select(`
        id,
        created_at,
        action,
        changes,
        from_ai,
        actor_id,
        profiles:actor_id (
          first_name,
          last_name
        )
      `)
      .eq('ticket_id', ticket_id)
      .order('created_at') as { data: HistoryEntry[] | null, error: PostgrestError | null };

    if (historyError) throw historyError;

    // Get ticket comments
    const { data: commentsData, error: commentsError } = await supabase
      .from('ticket_comments')
      .select(`
        id,
        created_at,
        content,
        from_ai,
        author_id,
        profiles:author_id (
          first_name,
          last_name
        )
      `)
      .eq('ticket_id', ticket_id)
      .order('created_at') as { data: CommentEntry[] | null, error: PostgrestError | null };

    if (commentsError) throw commentsError;

    // Get ticket conversations
    const { data: conversationsData, error: conversationsError } = await supabase
      .from('ticket_conversations')
      .select(`
        id,
        created_at,
        text,
        from_ai,
        profile_id,
        profiles:profile_id (
          first_name,
          last_name
        )
      `)
      .eq('ticket_id', ticket_id)
      .order('created_at') as { data: ConversationEntry[] | null, error: PostgrestError | null };

    if (conversationsError) throw conversationsError;

    // Combine and format all entries
    const combinedHistory = [
      ...(historyData?.map(entry => ({
        type: 'history',
        date: entry.created_at,
        content: JSON.stringify(entry.changes),
        actor: entry.from_ai ? 'AI Agent' : 
          entry.profiles ? `${entry.profiles.first_name} ${entry.profiles.last_name}`.trim() : 'Unknown User',
        action: entry.action
      })) || []),
      ...(commentsData?.map(entry => ({
        type: 'comment',
        date: entry.created_at,
        content: entry.content,
        actor: entry.from_ai ? 'AI Agent' : 
          entry.profiles ? `${entry.profiles.first_name} ${entry.profiles.last_name}`.trim() : 'Unknown User'
      })) || []),
      ...(conversationsData?.map(entry => ({
        type: 'conversation',
        date: entry.created_at,
        content: entry.text,
        actor: entry.from_ai ? 'AI Agent' : 
          entry.profiles ? `${entry.profiles.first_name} ${entry.profiles.last_name}`.trim() : 'Unknown User'
      })) || [])
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return JSON.stringify(combinedHistory);
  },
  {
    name: "getTicketHistory",
    description: "Get the complete history of a ticket including comments, conversations, and changes",
    schema: z.object({
      ticket_id: z.string().describe("The ID of the ticket to get history for")
    })
  }
);

// Help Agent Tools

const updateTicketTitle = tool(
  async ({ ticket_id, title }: { ticket_id: string; title: string }) => {
    // Get current title first
    const { data: currentTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('title')
      .eq('id', ticket_id)
      .single();

    if (fetchError) throw fetchError;

    const { data: _data, error } = await supabase
      .from('tickets')
      .update({ title })
      .eq('id', ticket_id)
      .select();

    if (error) throw error;

    // Log the activity with proper from/to format
    await supabase.from('ticket_history').insert({
      ticket_id,
      action: 'update',
      changes: {
        title: {
          from: currentTicket.title,
          to: title
        }
      },
      from_ai: true
    });

    return `Updated ticket title to: ${title}`;
  },
  {
    name: "updateTicketTitle",
    description: "Update the title of a ticket when it has a placeholder or needs improvement",
    schema: z.object({
      ticket_id: z.string().describe("The ID of the ticket to update"),
      title: z.string().describe("The new title for the ticket")
    })
  }
);

const updateTicketDescription = tool(
  async ({ ticket_id, description }: { ticket_id: string; description: string }) => {
    // Get current description first
    const { data: currentTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('description')
      .eq('id', ticket_id)
      .single();

    if (fetchError) throw fetchError;

    const { data: _data, error } = await supabase
      .from('tickets')
      .update({ description })
      .eq('id', ticket_id)
      .select();

    if (error) throw error;

    await supabase.from('ticket_history').insert({
      ticket_id,
      action: 'update',
      changes: {
        description: {
          from: currentTicket.description,
          to: description
        }
      },
      from_ai: true
    });

    return `Updated ticket description`;
  },
  {
    name: "updateTicketDescription",
    description: "Update the description of a ticket to better reflect the issue",
    schema: z.object({
      ticket_id: z.string().describe("The ID of the ticket to update"),
      description: z.string().describe("The new description for the ticket")
    })
  }
);

const assignEmployee = tool(
  async ({ ticket_id, profile_id }: { ticket_id: string; profile_id: string }) => {
    // First check if there's an existing assignment
    const { data: existingAssignment } = await supabase
      .from('ticket_assignments')
      .select('profile_id')
      .eq('ticket_id', ticket_id)
      .single();

    let result;
    if (existingAssignment) {
      result = await supabase
        .from('ticket_assignments')
        .update({ profile_id, assignment_type: 'individual' })
        .eq('ticket_id', ticket_id);
    } else {
      result = await supabase
        .from('ticket_assignments')
        .insert({ ticket_id, profile_id, assignment_type: 'individual' });
    }

    if (result.error) throw result.error;

    await supabase.from('ticket_history').insert({
      ticket_id,
      action: 'update',
      changes: {
        assignees: {
          removed: existingAssignment ? [existingAssignment.profile_id] : [],
          added: [profile_id]
        }
      },
      from_ai: true
    });

    return `Assigned employee ${profile_id} to ticket`;
  },
  {
    name: "assignEmployee",
    description: "Assign or reassign an employee to a ticket",
    schema: z.object({
      ticket_id: z.string().describe("The ID of the ticket"),
      profile_id: z.string().describe("The ID of the employee to assign")
    })
  }
);

interface TicketChange {
  from: string | null;
  to: string | null;
}

interface TicketChanges {
  status_id?: TicketChange;
  priority_id?: TicketChange;
}

const updateTicketStatus = tool(
  async ({ ticket_id, status_id, priority_id }: { ticket_id: string; status_id?: string; priority_id?: string }) => {
    try {
      // Get current status and priority first
      const { data: currentTicket, error: fetchError } = await supabase
        .from('tickets')
        .select('status_id, priority_id')
        .eq('id', ticket_id)
        .single();

      if (fetchError) throw fetchError;

      // Validate status_id if provided
      if (status_id) {
        const { data: statusData } = await supabase
          .from('statuses')
          .select('id')
          .eq('id', status_id)
          .eq('is_active', true)
          .single();

        if (!statusData) {
          return `Invalid or inactive status ID provided: ${status_id}. Status not updated.`;
        }
      }

      // Validate priority_id if provided
      if (priority_id) {
        const { data: priorityData } = await supabase
          .from('priorities')
          .select('id')
          .eq('id', priority_id)
          .eq('is_active', true)
          .single();

        if (!priorityData) {
          return `Invalid or inactive priority ID provided: ${priority_id}. Priority not updated.`;
        }
      }

      const updates: { status_id?: string; priority_id?: string } = {};
      let updatesApplied = false;

      if (status_id && status_id !== currentTicket.status_id) {
        updates.status_id = status_id;
        updatesApplied = true;
      }
      if (priority_id && priority_id !== currentTicket.priority_id) {
        updates.priority_id = priority_id;
        updatesApplied = true;
      }

      // Only proceed with update if there are actual changes
      if (!updatesApplied) {
        return "No changes needed - provided values match current values or were invalid";
      }

      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticket_id);

      if (error) throw error;

      const changes: TicketChanges = {};
      if (updates.status_id) {
        changes.status_id = {
          from: currentTicket.status_id,
          to: updates.status_id
        };
      }
      if (updates.priority_id) {
        changes.priority_id = {
          from: currentTicket.priority_id,
          to: updates.priority_id
        };
      }

      await supabase.from('ticket_history').insert({
        ticket_id,
        action: 'update',
        changes,
        from_ai: true
      });

      const updatedFields = [];
      if (updates.status_id) updatedFields.push('status');
      if (updates.priority_id) updatedFields.push('priority');
      
      return `Successfully updated ticket ${updatedFields.join(' and ')}`;
    } catch (error: unknown) {
      console.error('Error updating ticket status/priority:', error);
      if (error instanceof Error) {
        return `Error updating ticket: ${error.message}. Please try again or check the values provided.`;
      }
      return 'An unknown error occurred while updating the ticket.';
    }
  },
  {
    name: "updateTicketStatus",
    description: "Update the status and/or priority of a ticket",
    schema: z.object({
      ticket_id: z.string().describe("The ID of the ticket"),
      status_id: z.string().optional().describe("The new status ID"),
      priority_id: z.string().optional().describe("The new priority ID")
    })
  }
);

const addInternalComment = tool(
  async ({ ticket_id, content }: { ticket_id: string; content: string }) => {
    const { data: _data, error } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id,
        content,
        is_internal: true,
        from_ai: true
      })
      .select();

    if (error) throw error;


    return `Added internal comment to ticket`;
  },
  {
    name: "addInternalComment",
    description: "Add an internal comment to a ticket that only employees can see",
    schema: z.object({
      ticket_id: z.string().describe("The ID of the ticket"),
      content: z.string().describe("The content of the internal comment")
    })
  }
);

// const respondToCustomer = tool(
//   async ({ 
//     ticket_id, 
//     message, 
//     suggested_article_id 
//   }: { 
//     ticket_id: string; 
//     message: string; 
//     suggested_article_id?: string 
//   }) => {
//     // Add the response to ticket conversations
//     const { error: convError } = await supabase
//       .from('ticket_conversations')
//       .insert({
//         ticket_id,
//         text: message,
//         from_ai: true
//       });

//     if (convError) throw convError;


//     return `Sent response to customer${suggested_article_id ? ' with article suggestion' : ''}`;
//   },
//   {
//     name: "respondToCustomer",
//     description: "Send a response to the customer and optionally suggest a knowledge base article",
//     schema: z.object({
//       ticket_id: z.string().describe("The ID of the ticket"),
//       message: z.string().describe("The message to send to the customer"),
//       suggested_article_id: z.string().optional().describe("ID of a knowledge base article to suggest")
//     })
//   }
// );

// Collect tools in an array
const tools = [
  // Query tools
  findEmployee,
  findLeastLoadedEmployee,
  getTicketDetails,
  getStatusOptions,
  getPriorityOptions,
  searchKnowledgeBase,
  getTicketHistory,
  // Action tools
  updateTicketTitle,
  updateTicketDescription,
  assignEmployee,
  updateTicketStatus,
  addInternalComment,
  // respondToCustomer
];

/**
 * 3) Define tasks to call the model or tools. ([2](https://js.langchain.com/docs/modules/agents/agent_types/react))
 */

// callModel: sends messages to the model and can generate tool calls
const callModel = task("callModel", async (messages: BaseMessageLike[]) => {
  const response = await model.bindTools(tools).invoke(messages);
  return response;
});

// callTool: executes the requested tool and returns a ToolMessage
type ToolArgs = 
  | { ticket_id: string; title: string }
  | { ticket_id: string; description: string }
  | { ticket_id: string; profile_id: string }
  | { ticket_id: string; status_id?: string; priority_id?: string }
  | { ticket_id: string; content: string }
  | { ticket_id: string; message: string; suggested_article_id?: string };

const callTool = task("callTool", async (toolCall: ToolCall) => {
  const requestedTool = tools.find((t) => t.name === toolCall.name);
  if (!requestedTool) {
    return new ToolMessage({ 
      content: "Tool not found.", 
      tool_call_id: toolCall.id ?? "unknown"
    });
  }
  
  const observation = await (requestedTool.invoke as (args: unknown) => Promise<string>)(toolCall.args);
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
      // When there are no more tool calls, mark this as the final response
      return {
        messages: [llmResponse],
        type: "end"
      };
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
});

// Configure callbacks for serverless environment
// NOTE: Set LANGCHAIN_CALLBACKS_BACKGROUND=false in your Supabase Edge Function environment variables
// Do not try to set it programmatically as Deno.env.set is not supported in Edge Functions

/**
 * 5) Serve an HTTP request using Deno on Supabase Edge Functions.
 * We'll parse a "location" query param, feed it to the agent, and respond with the final answer. ([3](https://js.langchain.com/docs/modules/agents/agent_types/react))
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Received request");
    const { ticketId, userMessage } = await req.json();
    
    if (!ticketId || !userMessage) {
      throw new Error("Missing required parameters: ticketId and userMessage");
    }

    console.log("Initializing agent with ticketId:", ticketId);
    // Start the agent with the user's message and context
    const response = await agent.invoke([
      { 
        type: "human", 
        content: `You are MadAI, a helpful customer support agent. You are an expert at managing tickets and helping customers, while responding in natural, silly, friendly language.
        
For ticket ${ticketId}, here is the customer message: ${userMessage}

Please help with this ticket by:
1. Getting the ticket details/history, relevant employee details, and status/priority options, ind relevant KB articles
2. Make necessary updates (title, description, status, priority, assignment) then add internal notes about important information
3. Your final response is going directly to the customer, and it will:
   - Acknowledges their issue
   - Mentions any relevant KB articles
   - Does NOT list technical changes ("I updated X")
   - Uses emojis and friendly tone
   - Ends with next steps
4. THE ONLY THING YOU SHOULD RETURN IS THE RESPONSE YOU ARE GOING TO SEND TO THE CUSTOMER

Example good response:
"Hey there! 👋 I've got your back on the widget issue! Robert will be reaching out shortly to help. In the meantime, check out our guide on widget maintenance: [link]. Let me know if you need anything else! 🛠️✨"
`
      }
    ]);

    // Make sure all callbacks finish before returning
    await awaitAllCallbacks();

    // Extract the final message content from the response
    const finalMessage = response.messages[response.messages.length - 1];
    const output = finalMessage.content;

    return new Response(JSON.stringify({
      output,
      status: "completed"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    // Make sure callbacks finish even on error
    await awaitAllCallbacks();
    
    const error = err as Error;
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 }
    );
  }
});


