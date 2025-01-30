# Help Agent Tools Documentation

This document outlines all the tools available to the Help Agent, their functionality, expected inputs, and database interactions.

## Message Interpretation Guidelines

The agent should intelligently parse user messages to extract relevant search terms and intents:

### Employee Names/References
- Extract full names: "assign to John Smith" → search_term: "John Smith"
- Handle first names: "give this to Sarah" → search_term: "Sarah"
- Handle informal references: "let Bob handle this" → search_term: "Bob"
- Handle possessives: "make it Robert's ticket" → search_term: "Robert"

### Status/Priority Terms
- Map common terms to status searches:
  - "urgent", "emergency", "asap" → search for high priority options
  - "can wait", "when possible" → search for low priority options
  - "in progress", "started" → search for corresponding status
  - "done", "completed", "resolved" → search for completion status

### Knowledge Base Queries
- Extract core concepts: "customer can't log in" → search_query: "login authentication"
- Include error messages: "getting error XYZ" → search_query: "error XYZ"
- Handle feature references: "how to use the dashboard" → search_query: "dashboard guide"

### Examples
1. User: "Can you assign this to Bob from support?"
   - Action: Use findEmployee with search_term: "Bob"
   - If multiple Bobs found, look for one in support role

2. User: "Sarah Johnson should handle this ticket"
   - Action: Use findEmployee with search_term: "Sarah Johnson"
   - More specific full name search

3. User: "This is urgent and needs immediate attention"
   - Action: Use getPriorityOptions to find highest priority level
   - Update ticket accordingly

## Tool Overview

The Help Agent has two types of tools:

### Query Tools
1. Find Employee
2. Find Least Loaded Employee
3. Get Ticket Details
4. Get Status Options
5. Get Priority Options
6. Search Knowledge Base Articles

### Action Tools
1. Update Ticket Title
2. Update Ticket Description
3. Assign Employee
4. Update Ticket Status/Priority
5. Add Internal Comment
6. Respond to Customer

## Query Tool Documentation

### 1. Find Employee (`findEmployee`)

**Purpose:**  
Searches for an employee by name or other identifiers to get their profile ID. Returns structured response about match status.

**Input Parameters:**
- `search_term` (string): Name or identifier to search for (e.g., "Robert", "Bob Smith")

**Database Interactions:**
```sql
SELECT user_id, first_name, last_name, email
FROM profiles
WHERE 
    is_customer = false 
    AND is_active = true
    AND is_admin = false
    AND (
        first_name ILIKE '%' || {search_term} || '%'
        OR last_name ILIKE '%' || {search_term} || '%'
        OR email ILIKE '%' || {search_term} || '%'
    )
```

**Return Value:**  
JSON string containing:
- If exact match found: `{ found: true, employee: { user_id, first_name, last_name, email } }`
- If no match: `{ found: false, message: "No employee found matching '...' Will assign to least loaded employee." }`
- If multiple matches: `{ found: false, message: "Multiple employees found matching '...' Please be more specific..." }`

### 2. Find Least Loaded Employee (`findLeastLoadedEmployee`)

**Purpose:**  
Finds the employee with the fewest open tickets for automatic assignment when specific assignment isn't possible.

**Input Parameters:**
None

**Database Interactions:**
1. Get ticket counts:
```sql
SELECT * FROM get_employee_open_ticket_counts()
```

2. Get available employees:
```sql
SELECT user_id, first_name, last_name
FROM profiles
WHERE 
    is_active = true 
    AND is_customer = false
    AND is_admin = false
```

**Return Value:**  
JSON string containing:
- If successful: `{ found: true, employee: { user_id, first_name, last_name }, ticketCount: number }`
- If error: `{ found: false, message: "Error message" }`

**Assignment Flow:**
When assigning tickets, the agent follows this process:
1. If a specific employee is requested:
   - Uses `findEmployee` to search for them
   - If found, assigns directly
   - If not found or ambiguous, falls back to least loaded employee
2. If no employee is specified or specific assignment fails:
   - Uses `findLeastLoadedEmployee` to find best candidate
   - Assigns to employee with lowest current ticket count
3. In all cases, provides clear explanation of assignment decision

### 3. Get Ticket Details (`getTicketDetails`)

**Purpose:**  
Retrieves all relevant information about a ticket including current status, priority, and assignments.

**Input Parameters:**
- `ticket_id` (string): The ID of the ticket

**Database Interactions:**
```sql
SELECT 
    t.*,
    ta.profile_id as assigned_to,
    p.first_name as assignee_first_name,
    p.last_name as assignee_last_name,
    s.name as status_name,
    pr.name as priority_name
FROM tickets t
LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id
LEFT JOIN profiles p ON ta.profile_id = p.user_id
LEFT JOIN statuses s ON t.status_id = s.id
LEFT JOIN priorities pr ON t.priority_id = pr.id
WHERE t.id = {ticket_id}
```

**Return Value:**  
Complete ticket details including current assignments and status names.

### 4. Get Status Options (`getStatusOptions`)

**Purpose:**  
Retrieves available status options for tickets.

**Input Parameters:**
None

**Database Interactions:**
```sql
SELECT id, name, is_counted_open
FROM statuses
WHERE is_active = true
ORDER BY name
```

**Return Value:**  
List of available status options with their IDs and names.

### 5. Get Priority Options (`getPriorityOptions`)

**Purpose:**  
Retrieves available priority levels for tickets.

**Input Parameters:**
None

**Database Interactions:**
```sql
SELECT id, name
FROM priorities
WHERE is_active = true
ORDER BY name
```

**Return Value:**  
List of available priority options with their IDs and names.

### 6. Search Knowledge Base Articles (`searchKnowledgeBase`)

**Purpose:**  
Searches knowledge base articles for relevant content to suggest to customers.

**Input Parameters:**
- `search_query` (string): The search term or topic to find articles about
- `organization_id` (string, optional): To filter articles by organization access

**Database Interactions:**
```sql
SELECT 
    id, 
    name, 
    body,
    is_public
FROM knowledge_base_articles
WHERE 
    is_active = true
    AND (is_public = true OR organization_id = {organization_id})
    AND (
        name ILIKE '%' || {search_query} || '%'
        OR body ILIKE '%' || {search_query} || '%'
    )
ORDER BY 
    CASE WHEN name ILIKE '%' || {search_query} || '%' THEN 0 ELSE 1 END,
    created_at DESC
LIMIT 5
```

**Return Value:**  
List of relevant articles with their IDs and content.

## Detailed Tool Documentation

### 1. Update Ticket Title (`updateTicketTitle`)

**Purpose:**  
Updates the title of a ticket when it has a placeholder or needs improvement.

**Input Parameters:**
- `ticket_id` (string): The ID of the ticket to update
- `title` (string): The new title for the ticket

**Database Interactions:**
1. Updates the `tickets` table:
   ```sql
   UPDATE tickets SET title = {title} WHERE id = {ticket_id}
   ```
2. Logs activity in `ticket_history`:
   ```sql
   INSERT INTO ticket_history (ticket_id, action, changes, from_ai)
   VALUES ({ticket_id}, 'update_title', {title}, true)
   ```

**Return Value:**  
String confirmation: `"Updated ticket title to: {title}"`

### 2. Update Ticket Description (`updateTicketDescription`)

**Purpose:**  
Updates the description of a ticket to better reflect the issue.

**Input Parameters:**
- `ticket_id` (string): The ID of the ticket to update
- `description` (string): The new description for the ticket

**Database Interactions:**
1. Updates the `tickets` table:
   ```sql
   UPDATE tickets SET description = {description} WHERE id = {ticket_id}
   ```
2. Logs activity in `ticket_history`:
   ```sql
   INSERT INTO ticket_history (ticket_id, action, changes, from_ai)
   VALUES ({ticket_id}, 'update_description', {description}, true)
   ```

**Return Value:**  
String confirmation: `"Updated ticket description"`

### 3. Assign Employee (`assignEmployee`)

**Purpose:**  
Assigns or reassigns an employee to a ticket.

**Input Parameters:**
- `ticket_id` (string): The ID of the ticket
- `profile_id` (string): The ID of the employee to assign

**Database Interactions:**
1. Checks existing assignment in `ticket_assignments`:
   ```sql
   SELECT * FROM ticket_assignments WHERE ticket_id = {ticket_id}
   ```
2. Either updates or inserts into `ticket_assignments`:
   ```sql
   -- If existing assignment:
   UPDATE ticket_assignments 
   SET profile_id = {profile_id}, assignment_type = 'individual'
   WHERE ticket_id = {ticket_id}
   
   -- If new assignment:
   INSERT INTO ticket_assignments (ticket_id, profile_id, assignment_type)
   VALUES ({ticket_id}, {profile_id}, 'individual')
   ```
3. Logs activity in `ticket_history`:
   ```sql
   INSERT INTO ticket_history (ticket_id, action, changes, from_ai)
   VALUES ({ticket_id}, 'assign_employee', {profile_id}, true)
   ```

**Return Value:**  
String confirmation: `"Assigned employee {profile_id} to ticket"`

### 4. Update Ticket Status (`updateTicketStatus`)

**Purpose:**  
Updates the status and/or priority of a ticket.

**Input Parameters:**
- `ticket_id` (string): The ID of the ticket
- `status_id` (string, optional): The new status ID
- `priority_id` (string, optional): The new priority ID

**Database Interactions:**
1. Updates the `tickets` table:
   ```sql
   UPDATE tickets 
   SET status_id = COALESCE({status_id}, status_id),
       priority_id = COALESCE({priority_id}, priority_id)
   WHERE id = {ticket_id}
   ```
2. Logs activity in `ticket_history`:
   ```sql
   INSERT INTO ticket_history (ticket_id, action, changes, from_ai)
   VALUES ({ticket_id}, 'update_status', {updates}, true)
   ```

**Return Value:**  
String confirmation: `"Updated ticket status/priority"`

### 5. Add Internal Comment (`addInternalComment`)

**Purpose:**  
Adds an internal comment to a ticket that only employees can see.

**Input Parameters:**
- `ticket_id` (string): The ID of the ticket
- `content` (string): The content of the internal comment

**Database Interactions:**
1. Inserts into `ticket_comments`:
   ```sql
   INSERT INTO ticket_comments (ticket_id, content, is_internal, from_ai)
   VALUES ({ticket_id}, {content}, true, true)
   ```
2. Logs activity in `ticket_history`:
   ```sql
   INSERT INTO ticket_history (ticket_id, action, changes, from_ai)
   VALUES ({ticket_id}, 'add_internal_comment', {content}, true)
   ```

**Return Value:**  
String confirmation: `"Added internal comment to ticket"`

### 6. Respond to Customer (`respondToCustomer`)

**Purpose:**  
Sends a response to the customer and optionally suggests a knowledge base article.

**Input Parameters:**
- `ticket_id` (string): The ID of the ticket
- `message` (string): The message to send to the customer
- `suggested_article_id` (string, optional): ID of a knowledge base article to suggest

**Database Interactions:**
1. Inserts into `ticket_conversations`:
   ```sql
   INSERT INTO ticket_conversations (ticket_id, text, from_ai)
   VALUES ({ticket_id}, {message}, true)
   ```
2. Inserts into `ticket_comments`:
   ```sql
   INSERT INTO ticket_comments (ticket_id, content, is_internal, from_ai)
   VALUES ({ticket_id}, {message}, false, true)
   ```
3. Logs activity in `ticket_history`:
   ```sql
   INSERT INTO ticket_history (ticket_id, action, changes, from_ai)
   VALUES ({ticket_id}, 'customer_response', {message, suggested_article_id}, true)
   ```

**Return Value:**  
String confirmation: `"Sent response to customer"` or `"Sent response to customer with article suggestion"`

## Error Handling

All tools include error handling:
- Database errors are caught and thrown
- Each operation is atomic - if any part fails, the entire operation is rolled back
- All actions are logged in the `ticket_history` table for audit purposes

## Activity Logging

Every tool action is logged in the `ticket_history` table with:
- `ticket_id`: The affected ticket
- `action`: The type of action performed
- `changes`: JSON object containing the changes made
- `from_ai`: Set to `true` to indicate the action was performed by the AI agent 