create table if not exists public.ticket_conversations (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid references public.tickets(id) on delete cascade not null,
    profile_id uuid references public.profiles(user_id) on delete cascade not null,
    text text not null,
    created_at timestamptz default now() not null
);

-- need to add rls later
