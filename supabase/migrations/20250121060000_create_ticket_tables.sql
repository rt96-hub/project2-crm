-- Create statuses table
CREATE TABLE public.statuses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create priorities table
CREATE TABLE public.priorities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tickets table
CREATE TABLE public.tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    creator_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT NOT NULL,
    organization_id uuid, -- Will be linked later
    status_id uuid REFERENCES public.statuses(id) ON DELETE RESTRICT NOT NULL,
    priority_id uuid REFERENCES public.priorities(id) ON DELETE RESTRICT NOT NULL,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    due_date timestamp with time zone,
    resolved_at timestamp with time zone
);

-- Create ticket_assignments table
CREATE TABLE public.ticket_assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    profile_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
    team_id uuid, -- Will be linked later
    assignment_type text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (profile_id IS NOT NULL OR team_id IS NOT NULL) -- At least one must be set
);

-- Create ticket_comments table
CREATE TABLE public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    author_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT NOT NULL,
    content text NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create ticket_history table
CREATE TABLE public.ticket_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    actor_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT NOT NULL,
    action text NOT NULL,
    changes jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at triggers
CREATE TRIGGER handle_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_ticket_assignments_updated_at
    BEFORE UPDATE ON public.ticket_assignments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_ticket_comments_updated_at
    BEFORE UPDATE ON public.ticket_comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priorities ENABLE ROW LEVEL SECURITY;

-- Create admin check helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ticket policies
CREATE POLICY "Admins can view all tickets"
    ON public.tickets FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users can view assigned tickets"
    ON public.tickets FOR SELECT
    USING (creator_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM ticket_assignments WHERE ticket_id = tickets.id AND profile_id = auth.uid()));

CREATE POLICY "Admins can create tickets"
    ON public.tickets FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can create tickets"
    ON public.tickets FOR INSERT
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Admins can update any ticket"
    ON public.tickets FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Users can update assigned tickets"
    ON public.tickets FOR UPDATE
    USING (creator_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM ticket_assignments WHERE ticket_id = tickets.id AND profile_id = auth.uid()));

-- Ticket assignment policies
CREATE POLICY "Admins can view all assignments"
    ON public.ticket_assignments FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users can view own assignments"
    ON public.ticket_assignments FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage assignments"
    ON public.ticket_assignments FOR ALL
    USING (public.is_admin());

-- Ticket comments policies
CREATE POLICY "Admins can view all comments"
    ON public.ticket_comments FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users can view ticket comments they have access to"
    ON public.ticket_comments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM tickets t
        LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id
        WHERE t.id = ticket_comments.ticket_id
        AND (t.creator_id = auth.uid() OR ta.profile_id = auth.uid())
    ));

CREATE POLICY "Admins can manage comments"
    ON public.ticket_comments FOR ALL
    USING (public.is_admin());

CREATE POLICY "Users can create comments on accessible tickets"
    ON public.ticket_comments FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM tickets t
        LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id
        WHERE t.id = ticket_comments.ticket_id
        AND (t.creator_id = auth.uid() OR ta.profile_id = auth.uid())
    ));

-- Ticket history policies
CREATE POLICY "Admins can view all history"
    ON public.ticket_history FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users can view history of accessible tickets"
    ON public.ticket_history FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM tickets t
        LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id
        WHERE t.id = ticket_history.ticket_id
        AND (t.creator_id = auth.uid() OR ta.profile_id = auth.uid())
    ));

-- Status and Priority policies (viewable by all authenticated users, manageable by admins)
CREATE POLICY "Anyone can view statuses"
    ON public.statuses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage statuses"
    ON public.statuses FOR ALL
    USING (public.is_admin());

CREATE POLICY "Anyone can view priorities"
    ON public.priorities FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage priorities"
    ON public.priorities FOR ALL
    USING (public.is_admin());

-- Update profile policies to allow admin access
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON public.tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ticket_comments TO authenticated;
GRANT SELECT ON public.ticket_history TO authenticated;
GRANT SELECT ON public.statuses TO authenticated;
GRANT SELECT ON public.priorities TO authenticated;

-- Allow admins to manage statuses and priorities
GRANT INSERT, UPDATE, DELETE ON public.statuses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.priorities TO authenticated;

-- Insert default statuses
INSERT INTO public.statuses (name) VALUES
    ('Open'),
    ('In Progress'),
    ('On Hold'),
    ('Resolved'),
    ('Closed');

-- Insert default priorities
INSERT INTO public.priorities (name) VALUES
    ('Low'),
    ('Medium'),
    ('High'),
    ('Urgent'); 