-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing article chunks with vector embeddings
CREATE TABLE article_chunks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id uuid NOT NULL,
    chunk_text text NOT NULL,
    embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
    created_at timestamptz DEFAULT now(),
    FOREIGN KEY (article_id) REFERENCES knowledge_base_articles (id) ON DELETE CASCADE,
    CONSTRAINT chunk_text_not_empty CHECK (char_length(chunk_text) > 0)
);

-- Add RLS policies for article chunks
ALTER TABLE article_chunks ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (same as knowledge base articles)
CREATE POLICY "Article chunks viewable by all authenticated users - public" ON article_chunks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM knowledge_base_articles
            WHERE knowledge_base_articles.id = article_chunks.article_id
            AND knowledge_base_articles.is_active = true 
            AND knowledge_base_articles.is_public = true
        )
    );

CREATE POLICY "Article chunks viewable by non-customer users - all" ON article_chunks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM knowledge_base_articles
            WHERE knowledge_base_articles.id = article_chunks.article_id
            AND knowledge_base_articles.is_active = true
            AND EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.user_id = auth.uid()
                AND is_customer = false
            )
        )
    );

-- Allow insert/update/delete for service role only (edge functions will handle this)
CREATE POLICY "Article chunks manageable by service role only" ON article_chunks
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create index for faster similarity searches
CREATE INDEX article_chunks_embedding_idx ON article_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- Number of lists can be tuned based on data size 