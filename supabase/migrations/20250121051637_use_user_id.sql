-- Disable RLS temporarily to avoid permission issues during migration
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop the existing primary key constraint
ALTER TABLE public.profiles DROP CONSTRAINT profiles_pkey;

-- Drop the id column since we'll use user_id as primary key
ALTER TABLE public.profiles DROP COLUMN id;

-- Make user_id the primary key
ALTER TABLE public.profiles ADD PRIMARY KEY (user_id);

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
