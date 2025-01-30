import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ChatOpenAI } from '@langchain/openai'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { AgentExecutor } from 'langchain/agents'
import { createOpenAIFunctionsAgent } from 'langchain/agents'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'
import { SystemMessage } from '@langchain/core/messages'
import { awaitAllCallbacks } from "@langchain/core/callbacks/promises"

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Define core tools for the Help Agent
const tools = [
  new DynamicStructuredTool({
    name: "create_ticket_title",
    description: "Creates or updates a support ticket title based on user message",
    schema: z.object({
      ticketId: z.string().describe("ID of the support ticket"),
      userMessage: z.string().describe("User's original message")
    }),
    func: async ({ ticketId, userMessage }) => {
      try {
        const model = new ChatOpenAI({ temperature: 0.5 })
        const title = await model.invoke(`Create a concise 5-7 word title for this support request: ${userMessage}`)
        
        const { error } = await supabase
          .from('tickets')
          .update({ title: title.content })
          .eq('id', ticketId)

        return error ? "Failed to update title" : "Title updated successfully"
      } catch (_error) {
        return "Error creating ticket title"
      }
    }
  }),

  new DynamicStructuredTool({
    name: "update_ticket_description",
    description: "Updates the ticket description with relevant details from the conversation",
    schema: z.object({
      ticketId: z.string().describe("ID of the support ticket"),
      conversationHistory: z.string().describe("Recent conversation messages")
    }),
    func: async ({ ticketId, conversationHistory }) => {
      try {
        const { error } = await supabase
          .from('tickets')
          .update({ description: conversationHistory })
          .eq('id', ticketId)

        return error ? "Failed to update description" : "Description updated"
      } catch (_error) {
        return "Error updating ticket description"
      }
    }
  }),

  new DynamicStructuredTool({
    name: "assign_ticket",
    description: "Assigns ticket to an appropriate support agent based on workload or preference",
    schema: z.object({
      ticketId: z.string().describe("ID of the support ticket"),
      preferredAgentId: z.string().optional().describe("Optional ID of the preferred agent to assign to")
    }),
    func: async ({ ticketId, preferredAgentId }) => {
      try {
        let assignedAgentId: string | null = null;

        if (preferredAgentId) {
          // Check if preferred agent exists and is a valid employee
          const { data: agentData } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', preferredAgentId)
            .eq('is_active', true)
            .is('is_customer', false)
            .is('is_admin', false)
            .single();

          if (agentData) {
            assignedAgentId = agentData.user_id;
          }
        }

        if (!assignedAgentId) {
          // Get all employees and their current ticket counts
          const { data: ticketCounts } = await supabase
            .rpc('get_employee_open_ticket_counts');

          // Get all active non-customer, non-admin employees
          const { data: employees } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('is_active', true)
            .is('is_customer', false)
            .is('is_admin', false);

          if (!employees?.length) {
            return "No available agents found";
          }

          // Create a map of employee IDs to their ticket counts
          const ticketCountMap = new Map(
            ticketCounts?.map((tc: { profile_id: string; count: number }) => [tc.profile_id, tc.count]) || []
          );

          // Find the employee with the lowest ticket count
          assignedAgentId = employees.reduce((minAgent, employee) => {
            const currentCount = ticketCountMap.get(employee.user_id) || 0;
            const minCount = ticketCountMap.get(minAgent?.user_id) || 0;
            
            return (!minAgent || currentCount < minCount) ? employee : minAgent;
          }, employees[0]).user_id;
        }

        // Create the ticket assignment
        const { error: assignmentError } = await supabase
          .from('ticket_assignments')
          .insert({
            ticket_id: ticketId,
            profile_id: assignedAgentId,
            assignment_type: 'standard'
          });

        if (assignmentError) {
          return "Failed to assign ticket";
        }

        // Log the assignment in ticket history
        await supabase.from('ticket_history').insert({
          ticket_id: ticketId,
          actor_id: 'system',
          action: 'assign_ticket',
          changes: {
            assigned_to: assignedAgentId,
            assignment_type: 'standard'
          }
        });

        return `Ticket assigned to agent ${assignedAgentId}`;
      } catch (_error) {
        return "Error assigning ticket";
      }
    }
  }),

  new DynamicStructuredTool({
    name: "update_ticket_status_priority",
    description: "Updates the status and/or priority of a ticket",
    schema: z.object({
      ticketId: z.string().describe("ID of the support ticket"),
      statusId: z.string().optional().describe("ID of the new status"),
      priorityId: z.string().optional().describe("ID of the new priority"),
      reason: z.string().describe("Reason for the status/priority update")
    }),
    func: async ({ ticketId, statusId, priorityId, reason }) => {
      try {
        const updates: Record<string, string> = {}
        if (statusId) updates.status_id = statusId
        if (priorityId) updates.priority_id = priorityId

        if (Object.keys(updates).length === 0) {
          return "No updates provided"
        }

        const { error } = await supabase
          .from('tickets')
          .update(updates)
          .eq('id', ticketId)

        if (!error) {
          // Log the activity
          await supabase.from('ticket_history').insert({
            ticket_id: ticketId,
            actor_id: 'system',
            action: 'update_status_priority',
            changes: {
              status_id: statusId,
              priority_id: priorityId,
              reason: reason
            }
          })
          return "Status/Priority updated successfully"
        }
        return "Failed to update status/priority"
      } catch (_error) {
        return "Error updating ticket status/priority"
      }
    }
  }),

  new DynamicStructuredTool({
    name: "add_internal_comment",
    description: "Adds an internal comment to the ticket visible only to employees",
    schema: z.object({
      ticketId: z.string().describe("ID of the support ticket"),
      content: z.string().describe("Content of the internal comment"),
      fromAi: z.boolean().default(true).describe("Whether the comment is from the AI")
    }),
    func: async ({ ticketId, content, fromAi }) => {
      try {
        const { error } = await supabase
          .from('ticket_comments')
          .insert({
            ticket_id: ticketId,
            content: content,
            is_internal: true,
            from_ai: fromAi
          })

        if (!error) {
          await supabase.from('ticket_history').insert({
            ticket_id: ticketId,
            actor_id: 'system',
            action: 'add_internal_comment',
            changes: { content }
          })
          return "Internal comment added successfully"
        }
        return "Failed to add internal comment"
      } catch (_error) {
        return "Error adding internal comment"
      }
    }
  }),

  new DynamicStructuredTool({
    name: "send_customer_response",
    description: "Sends a response to the customer and optionally suggests knowledge base articles",
    schema: z.object({
      ticketId: z.string().describe("ID of the support ticket"),
      message: z.string().describe("Message to send to the customer"),
      suggestedArticleIds: z.array(z.string()).optional().describe("IDs of suggested knowledge base articles")
    }),
    func: async ({ ticketId, message, suggestedArticleIds }) => {
      try {
        // Add the message to ticket conversations
        const { error: convError } = await supabase
          .from('ticket_conversations')
          .insert({
            ticket_id: ticketId,
            text: message,
            from_ai: true
          })

        if (convError) {
          return "Failed to send customer response"
        }

        // If there are suggested articles, fetch their details
        interface KnowledgeBaseArticle {
          id: string;
          name: string;
        }

        let articleDetails: KnowledgeBaseArticle[] = []
        if (suggestedArticleIds && suggestedArticleIds.length > 0) {
          const { data: articles } = await supabase
            .from('knowledge_base_articles')
            .select('id, name')
            .in('id', suggestedArticleIds)
            .eq('is_active', true)
            .eq('is_public', true)

          articleDetails = articles || []
        }

        // Log the activity
        await supabase.from('ticket_history').insert({
          ticket_id: ticketId,
          actor_id: null,
          from_ai: true,
          action: 'send_customer_response',
          changes: {
            message,
            suggested_articles: articleDetails
          }
        })

        return "Response sent successfully" + (articleDetails.length > 0 ? ` with ${articleDetails.length} suggested articles` : "")
      } catch (_error) {
        return "Error sending customer response"
      }
    }
  }),

  new DynamicStructuredTool({
    name: "log_ticket_activity",
    description: "Logs an activity in the ticket history",
    schema: z.object({
      ticketId: z.string().describe("ID of the support ticket"),
      action: z.string().describe("Type of action performed"),
      changes: z.record(z.any()).describe("Changes made in this action")
    }),
    func: async ({ ticketId, action, changes }) => {
      try {
        const { error } = await supabase
          .from('ticket_history')
          .insert({
            ticket_id: ticketId,
            actor_id: null,
            from_ai: true,
            action,
            changes
          })

        return error ? "Failed to log activity" : "Activity logged successfully"
      } catch (_error) {
        return "Error logging activity"
      }
    }
  })
]

// Agent initialization
const createHelpAgent = () => {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.3
  })

  return createOpenAIFunctionsAgent({
    llm: model,
    tools,
    systemMessage: new SystemMessage("You are a helpful support agent. Use the provided tools to manage tickets. Always check if ticket needs updating before taking action. Log all activities.")
  })
}

// Edge function handler
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { ticketId, userMessage } = await req.json()
    const agent = createHelpAgent()
    const executor = new AgentExecutor({ agent, tools })

    const result = await executor.invoke({
      input: `Ticket ID: ${ticketId} - User Message: ${userMessage}`
    })

    await awaitAllCallbacks()

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (_error) {
    return new Response(JSON.stringify({ error: (_error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
}) 