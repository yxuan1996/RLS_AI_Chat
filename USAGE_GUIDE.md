# Usage Guide

## Setup
### Loading data into database

We begin by downloading the Superstore dataset from huggingface: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final

This is a sample e-commerce dataset from a fictional company. 

We create a new table in our supabase postgres database, and upload the csv file of the dataset into the table. 

### Create new users
In our supabase auth dashboard, create a few dummy users for testing. Take note of the UUID of the users. 

### Replace customer ID with UUID

For each of the customers in our superstore dataset, replace the Customer ID with a unique UUID. Use the UUID of the newly created testing users. 

```SQL
UPDATE superstore
SET "Customer ID" = '<Your_UUID_Here>'
WHERE "Customer Name" = 'William Brown';
```

### Link UUID to supabase auth

We create a new column called user_id of type UUID, and replicate the Customer ID column with the correct column datatype. 

Then, we create a foreign key constraint that links the user_id table to the users in supabase auth. 

```SQL
ALTER TABLE superstore
ADD COLUMN user_id uuid;

UPDATE superstore
SET user_id = "Customer ID"::uuid
WHERE "Customer ID" IS NOT NULL;

ALTER TABLE superstore
ADD CONSTRAINT orders_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
```

### Set up RLS (Row Level Security) Policies

This ensures that authenticated users can view their own data only. 

```SQL
CREATE POLICY "Users can view their own orders"
ON superstore
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
ON superstore
FOR INSERT
WITH CHECK (auth.uid() = user_id);

create policy "Users can update their own orders"
on superstore
for update
using (auth.uid() = user_id);
```

### Create function for debugging purposes

We create an SQL function. This will help us determine whether the correct JWT is being passed when database queries are made. 

```SQL
create or replace function get_my_auth_context() 
returns json as $$
  select json_build_object(
    'role', current_role,
    'user_id', auth.uid(),
    'jwt', auth.jwt()
  );
$$ language sql stable;
```

## Running the application

Clone the Github repo into your local directory

cd to the app directory
```
cd chat_app
```

Install all dependencies
```
npm install
```

Configure environment variables by referencing `.env.example`. You will need to have the following:
- a Supabase account
- an Azure Open AI (Azure Foundry) subscription

Run the app
```
npm run dev
```





