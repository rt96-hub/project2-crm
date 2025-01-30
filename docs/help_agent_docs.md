# Help Agent Documentation

## Overview

The Help Agent is an AI-powered support system that manages customer support tickets using a set of specialized tools. It operates as an edge function and uses OpenAI's GPT model to process customer inquiries and manage ticket workflows.

## System Components

### Core Components
- **ChatOpenAI Model**: GPT-3.5-turbo with temperature 0.3 for consistent, reliable responses
- **AgentExecutor**: Manages the execution of the agent's actions
- **Supabase Client**: Handles all database operations

### Database Tables Used
- `tickets`: Main ticket information (status, priority, title, description)
- `profiles`: Employee and customer profiles
- `ticket_history`: Audit log of all ticket actions
- `ticket_comments`: Internal and external ticket communications
- `ticket_conversations`: Customer-agent message history
- `ticket_assignments`: Tracks ticket assignments to agents
- `knowledge_base_articles`: Support documentation

## Available Tools

### 1. create_ticket_title
**Purpose**: Generates a concise ticket title from user messages
- Input: `ticketId`, `userMessage`
- Output: Success/failure message
- Action: Uses AI to create a 5-7 word title and updates the ticket

### 2. update_ticket_description
**Purpose**: Maintains the ticket description with conversation context
- Input: `ticketId`, `conversationHistory`
- Output: Success/failure message
- Action: Updates the ticket's description field

### 3. assign_ticket
**Purpose**: Assigns tickets to appropriate support agents
- Input: `ticketId`, `preferredAgentId` (optional)
- Output: Assignment confirmation or failure message
- Action: 
  - If preferred agent specified: Validates and assigns if agent is available
  - Otherwise: Assigns to agent with lowest current ticket count
  - Creates ticket_assignment record and logs history

### 4. update_ticket_status_priority
**Purpose**: Manages ticket status and priority levels
- Input: `ticketId`, `statusId`, `priorityId`, `reason`
- Output: Update confirmation
- Action: Updates ticket status/priority and logs the change

### 5. add_internal_comment
**Purpose**: Creates private notes visible only to support staff
- Input: `ticketId`, `content`, `fromAi`
- Output: Comment addition confirmation
- Action: Adds internal comment and logs the activity

### 6. send_customer_response
**Purpose**: Manages customer communication and knowledge base suggestions
- Input: `ticketId`, `message`, `suggestedArticleIds`
- Output: Response confirmation with article suggestion status
- Action: Creates ticket conversation entry and optionally links relevant articles

### 7. log_ticket_activity
**Purpose**: Maintains audit trail of all ticket actions
- Input: `ticketId`, `action`, `changes`
- Output: Logging confirmation
- Action: Records all activities in ticket history

## Example Workflow

Here's a typical flow of how the agent processes a customer inquiry:

1. **Initial Request**
   - Customer sends: "I can't access my billing dashboard"
   - State: New incoming message

2. **Title Creation**
   ```json
   {
     "tool": "create_ticket_title",
     "input": {
       "ticketId": "123",
       "userMessage": "I can't access my billing dashboard"
     }
   }
   ```
   - State: Ticket created with title "Billing Dashboard Access Issue"

3. **Agent Assignment**
   ```json
   {
     "tool": "assign_ticket",
     "input": {
       "ticketId": "123"
     }
   }
   ```
   - State: Ticket assigned to agent with lowest workload

4. **Priority Setting**
   ```json
   {
     "tool": "update_ticket_status_priority",
     "input": {
       "ticketId": "123",
       "priorityId": "medium",
       "reason": "Access issue affecting core functionality"
     }
   }
   ```
   - State: Priority set to medium

5. **Internal Notes**
   ```json
   {
     "tool": "add_internal_comment",
     "input": {
       "ticketId": "123",
       "content": "Customer reporting billing dashboard access issue. Checking authentication logs.",
       "fromAi": true
     }
   }
   ```
   - State: Internal context added

6. **Customer Response**
   ```json
   {
     "tool": "send_customer_response",
     "input": {
       "ticketId": "123",
       "message": "I understand you're having trouble accessing the billing dashboard. I'll help you resolve this. Could you please confirm if you're getting any specific error message?",
       "suggestedArticleIds": ["kb-001", "kb-002"]
     }
   }
   ```
   - State: Response sent with relevant KB articles

## State Management

The agent maintains state through several mechanisms:

1. **Database State**
   - Persistent state stored in Supabase tables
   - Ticket details in `tickets` table
   - Assignment information in `ticket_assignments`
   - Communication history in `ticket_conversations` and `ticket_comments`
   - Audit trail in `ticket_history`

2. **Conversation Context**
   - Maintained by the ChatOpenAI model during the session
   - Includes recent message history and context
   - Helps maintain conversation coherence

3. **Edge Function State**
   - Stateless execution model
   - Each request is independent
   - State must be explicitly passed or retrieved from database

## Tool Availability

Tools are made available to the agent through:

1. **Tool Registration**
   - Tools defined as `DynamicStructuredTool` instances
   - Each tool has schema defined using Zod
   - Tools array passed to agent during initialization

2. **Agent Configuration**
   - Created using `createOpenAIFunctionsAgent`
   - System message defines agent's role and capabilities
   - Tools array determines available actions

3. **Runtime Access**
   - AgentExecutor manages tool access
   - Tools validated against schema before execution
   - Error handling for invalid tool usage

## Error Handling

The system implements error handling at multiple levels:
1. Tool-level try-catch blocks
2. Database operation validation
3. Response status checking
4. Activity logging for debugging

## Best Practices

1. Always log activities using `log_ticket_activity`
2. Update ticket status after significant changes
3. Include internal comments for context
4. Suggest relevant knowledge base articles when possible
5. Maintain professional tone in customer communications

## Security Considerations

1. Internal comments are strictly separated from customer-facing messages
2. Service role key used for database operations
3. CORS headers implemented for API security
4. Environment variables for sensitive credentials
5. Agent validation of profile types (customer vs employee) 