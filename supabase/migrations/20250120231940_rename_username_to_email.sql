-- Rename username column to email
ALTER TABLE public.profiles RENAME COLUMN username TO email;

-- Drop the existing unique constraint
ALTER TABLE public.profiles DROP CONSTRAINT profiles_username_key;

-- Add new unique constraint for email
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Update the trigger function to be more explicit about using email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
