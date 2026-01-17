# RLS_AI_Chat
Row Level Security (RLS) implementation for an AI Agent with SQL RAG.

## Traditional CRUD App Data Filtering

In a Traditional CRUD App, the backend application code is responsible for user authorization and filtering data. 

```
┌────────────┐
│   Browser  │
│ (Frontend) │
└─────┬──────┘
      │
      │ 1. User logs in
      │    JWT stored in browser
      ▼
┌────────────┐
│   Browser  │
│ JWT Token  │
└─────┬──────┘
      │
      │ 2. User performs action
      │    (API request + JWT)
      ▼
┌────────────────────┐
│ Backend (Node/Py)  │
│────────────────────│
│ - Validate JWT     │
│ - Authorize user   │
│ - Extract user_id  │
│ - Build SQL query  │
│   WHERE user_id=?  │
└─────┬──────────────┘
      │
      │ 3. Filtered query
      ▼
┌────────────────────┐
│     Database       │
│────────────────────│
│ Returns ONLY rows  │
│ requested by query │
│ (No native RLS)    │
└─────┬──────────────┘
      │
      │ 4. Filtered data
      ▼
┌────────────┐
│   Browser  │
│   UI View  │
└────────────┘

```

## LLM Chatbot with SQL RAG

For AI Agents that perform tool calling to obtain SQL data, we cannot trust the AI Agent to enforce user authorization and data filtering. A malicious user could use prompt injection to impersonate another user, resulting in unauthorized data access. 

LLMs should never be trusted for user access control. As such, Row Level Security should be enforced on the database level. 

```
┌────────────┐
│   Browser  │
│ (Chat UI)  │
└─────┬──────┘
      │
      │ 1. User logs in
      │    JWT stored in browser
      ▼
┌────────────┐
│   Browser  │
│ JWT Token  │
└─────┬──────┘
      │
      │ 2. User sends message
      │    "Show my orders"
      ▼
┌────────────────────┐
│  AI Agent (LLM)    │
│────────────────────│
│ - Receives message │
│ - Chooses SQL tool │
│ - Generates query  │
│   (NO user filter) │
└─────┬──────────────┘
      │
      │ 3. SQL execution
      │    (JWT → DB session)
      ▼
┌────────────────────┐
│   Database (RLS)   │
│────────────────────│
│ - RLS enabled      │
│ - Reads user_id    │
│   from session     │
│ - Filters rows     │
│   automatically    │
└─────┬──────────────┘
      │
      │ 4. Safe result set
      ▼
┌────────────────────┐
│  AI Agent (LLM)    │
│────────────────────│
│ - Interprets rows  │
│ - Generates answer │
└─────┬──────────────┘
      │
      ▼
┌────────────┐
│   Browser  │
│ Chat Reply │
└────────────┘
```

## Supabase Implementation

Supabase has built in identity and automates JWT handling.  


## Postgres Implementation

In a normal Postgres database, we need to implement the following ourselves:
- Authentication (who is the user?)
- Passing the JWT when making the database call

### Example database set up
Create a database table with a uuid column and enable row level security

```SQL
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

Then, we create RLS policies
```SQL
CREATE POLICY user_orders
ON orders
FOR SELECT
USING (user_id = current_setting('app.user_id')::uuid);

CREATE POLICY insert_own_orders
ON orders
FOR INSERT
WITH CHECK (user_id = current_setting('app.user_id')::uuid);
```

### Obtain JWT
In our chat app, we need to implement an authentication system that returns a JWT when the user signs in. 

Auth systems:
- Auth.js / NextAuth
- Clerk
- Auth0

Example JWT
```
{
  "sub": "7c8c4f1a-5c25-4c21-9f6e-9e7c7fcb9f11",
  "email": "user@example.com"
}
```

### Pass JWT to Postgres Query
```TS
import { Pool } from "pg";
import jwt from "jsonwebtoken";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function getOrders(authToken: string) {
  const payload = jwt.verify(authToken, process.env.JWT_SECRET);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "set local app.user_id = $1",
      [payload.sub]
    );

    const result = await client.query("select * from orders");
    return result.rows;
  } finally {
    await client.query("COMMIT");
    client.release();
  }
}
```


