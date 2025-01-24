-- Create knowledge base categories table first
CREATE TABLE knowledge_base_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

insert into knowledge_base_categories (name) values ('General');
insert into knowledge_base_categories (name) values ('Common Issues');
insert into knowledge_base_categories (name) values ('Product Information');
insert into knowledge_base_categories (name) values ('Client Resources');
insert into knowledge_base_categories (name) values ('Employee Resources');

-- Create knowledge base articles table with foreign key relationships
CREATE TABLE knowledge_base_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    body TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    creator_id UUID NOT NULL REFERENCES profiles(user_id),
    category_id UUID NOT NULL REFERENCES knowledge_base_categories(id)
);

-- Add RLS policies
ALTER TABLE knowledge_base_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Categories viewable by all authenticated users" ON knowledge_base_categories
    FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Categories editable by admin users only" ON knowledge_base_categories
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND is_admin = true
        )
    );

-- Articles policies
CREATE POLICY "Articles viewable by all authenticated users - public" ON knowledge_base_articles
    FOR SELECT
    TO authenticated
    USING (
        is_active = true 
        AND is_public = true
    );

CREATE POLICY "Articles viewable by non-customer users - all" ON knowledge_base_articles
    FOR SELECT
    TO authenticated
    USING (
        is_active = true 
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND is_customer = false
        )
    );

CREATE POLICY "Articles editable by non-customer users" ON knowledge_base_articles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND is_customer = false
        )
    );
