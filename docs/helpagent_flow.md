# Help Agent Flow Documentation

## Overview
The help agent is an AI-powered support system that processes customer messages and manages tickets through a series of tools and actions. This document outlines the complete flow from frontend to backend, including data processing and available tools.

## Frontend to Backend Flow

### 1. Frontend Initiation (HelpChatPopout.tsx)
- **Location**: `frontend/src/components/HelpChatPopout.tsx`
- **Trigger**: User sends a message in the chat interface
- **Function**: `handleSendMessage()`

#### Data Flow:
1. User types message and clicks send
2. Frontend checks if this is a new ticket or existing conversation
3. For new tickets:
   - Creates ticket record with placeholder title
   - Sends initial message to conversations table
   - Calls help agent with new ticket ID
4. For existing tickets:
   - Adds message to conversations table
   - Calls help agent with existing ticket ID

#### Edge Function Call:
```typescript
const { data: aiResponse, error: aiError } = await supabase.functions.invoke('helpAgent', {
  body: {
    ticketId: ticket.id,
    userMessage: newMessage
  }
});
```

### 2. Edge Function Processing (helpAgent/index.ts)

#### Request Handling:
1. Receives POST request with:
   - `ticketId`: string
   - `userMessage`: string
2. Validates required parameters
3. Initializes LangGraph agent with tools

#### Initial Prompt to Agent:
```text
For ticket ${ticketId}, here is the customer message: ${userMessage}

Please help with this ticket by:
1. Getting the ticket details
2. Understanding the context
3. Taking appropriate actions (updating title/description if needed, setting priority/status, etc.)
4. Responding helpfully to the customer
```

## Available Tools

### Query Tools
These tools gather information without modifying the database:

1. **findEmployee**
   - **Purpose**: Search for employee by name/email
   - **Input**: `search_term: string`
   - **Output**: JSON with employee details or search status
   - **Database**: Queries `profiles` table
   ```json
   {
     "found": boolean,
     "employee"?: { user_id, first_name, last_name, email },
     "message"?: string
   }
   ```

2. **findLeastLoadedEmployee**
   - **Purpose**: Find employee with fewest open tickets
   - **Input**: None
   - **Output**: JSON with employee details and ticket count
   - **Database**: Uses `get_employee_open_ticket_counts` RPC
   ```json
   {
     "found": boolean,
     "employee"?: { user_id, first_name, last_name },
     "ticketCount"?: number,
     "message"?: string
   }
   ```

3. **getTicketDetails**
   - **Purpose**: Retrieve complete ticket information
   - **Input**: `ticket_id: string`
   - **Output**: JSON with full ticket details including assignments, status, priority
   - **Database**: Queries `tickets` table with related joins

4. **getStatusOptions**
   - **Purpose**: List available ticket statuses
   - **Input**: None
   - **Output**: JSON array of active statuses
   - **Database**: Queries `statuses` table

5. **getPriorityOptions**
   - **Purpose**: List available priority levels
   - **Input**: None
   - **Output**: JSON array of active priorities
   - **Database**: Queries `priorities` table

6. **searchKnowledgeBase**
   - **Purpose**: Find relevant help articles
   - **Input**: `search_query: string`
   - **Output**: JSON array of matching articles
   - **Database**: Queries `knowledge_base_articles` table

### Action Tools
These tools modify the database:

1. **updateTicketTitle**
   - **Purpose**: Update ticket title
   - **Input**: `ticket_id: string, title: string`
   - **Output**: Confirmation message
   - **Database Changes**: 
     - Updates `tickets` table
     - Adds entry to `ticket_history`

2. **updateTicketDescription**
   - **Purpose**: Update ticket description
   - **Input**: `ticket_id: string, description: string`
   - **Output**: Confirmation message
   - **Database Changes**:
     - Updates `tickets` table
     - Adds entry to `ticket_history`

3. **assignEmployee**
   - **Purpose**: Assign/reassign ticket to employee
   - **Input**: `ticket_id: string, profile_id: string`
   - **Output**: Confirmation message
   - **Database Changes**:
     - Updates/inserts `ticket_assignments` table
     - Adds entry to `ticket_history`

4. **updateTicketStatus**
   - **Purpose**: Update status and/or priority
   - **Input**: `ticket_id: string, status_id?: string, priority_id?: string`
   - **Output**: Confirmation message
   - **Database Changes**:
     - Updates `tickets` table
     - Adds entry to `ticket_history`

5. **addInternalComment**
   - **Purpose**: Add internal note visible only to employees
   - **Input**: `ticket_id: string, content: string`
   - **Output**: Confirmation message
   - **Database Changes**:
     - Inserts into `ticket_comments` table
     - Adds entry to `ticket_history`

6. **respondToCustomer**
   - **Purpose**: Send response to customer
   - **Input**: `ticket_id: string, message: string, suggested_article_id?: string`
   - **Output**: Confirmation message
   - **Database Changes**:
     - Inserts into `ticket_conversations` table

## Agent Processing Flow

1. **Initial Assessment**
   - Agent receives ticket ID and user message
   - Calls `getTicketDetails` to understand context

2. **Information Gathering**
   - May search knowledge base for relevant articles
   - May check current status and priority options
   - May look up employee information if needed

3. **Action Taking**
   - Updates ticket details if needed (title, description)
   - Sets appropriate status/priority
   - Assigns to employee if unassigned
   - Adds internal notes if needed

4. **Response Generation**
   - Formulates helpful response to customer
   - May include knowledge base article references
   - Sends response through `respondToCustomer` tool

## Return Format

The edge function returns a JSON response:
```typescript
{
  output: string  // The final message from the agent
}
```

Or in case of error:
```typescript
{
  error: {
    message: string,
    name: string,
    stack: string
  }
}
```

The frontend then:
1. Processes the response
2. Displays the AI message in the chat
3. Updates the ticket details if needed
4. Handles any errors appropriately

## Error Handling
- Frontend displays errors in the chat interface
- Edge function returns 400 status for invalid requests
- Database errors are caught and returned with details
- Tool errors are handled gracefully and reported back to the agent 