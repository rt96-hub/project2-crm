# Ticket History Update Format

## Overview
The ticket history system tracks changes made to tickets in a structured JSON format. Each history record contains information about what changed, who made the change, and when it occurred.

## Record Structure
Each history record contains:
- `ticket_id`: The ID of the ticket being modified
- `actor_id`: The ID of the user making the changes
- `action`: The type of action (e.g., "update")
- `changes`: A JSON object containing the changes made

## Changes Format
The `changes` object tracks modifications to various ticket fields. Each changed field is represented as a key in the object with a value containing both the previous and new values.

### Basic Field Changes
For simple fields, the change is recorded with `from` and `to` values:

```json
{
  "title": {
    "from": "Old Title",
    "to": "New Title"
  },
  "status_id": {
    "from": "old_status_id",
    "to": "new_status_id"
  }
}
```

### Tracked Fields
The following fields are tracked for changes:
- `title`
- `status_id`
- `priority_id`
- `description`
- `due_date`

### Special Cases

#### Assignee Changes
Assignee changes are tracked in a special format that records both added and removed assignees:

```json
{
  "assignees": {
    "removed": ["user_id_1", "user_id_2"],
    "added": ["user_id_3", "user_id_4"]
  }
}
```

## Example Full Record
Here's an example of a complete ticket history record:

```json
{
  "ticket_id": "123",
  "actor_id": "user_456",
  "action": "update",
  "changes": {
    "title": {
      "from": "Original Bug",
      "to": "Updated Bug Description"
    },
    "status_id": {
      "from": "open",
      "to": "in_progress"
    },
    "assignees": {
      "removed": ["user_789"],
      "added": ["user_101"]
    }
  }
}
```

## Implementation Notes
1. Changes are only recorded when there is an actual difference between the old and new values
2. Empty or null values are allowed and tracked
3. The system only creates a history record if at least one field has changed
4. Assignee changes are tracked separately from other field changes
5. All changes within a single update operation are grouped into one history record 