-- Function to search for similar article chunks using vector similarity
CREATE OR REPLACE FUNCTION search_article_chunks(
    query_embedding vector(1536),
    similarity_threshold float,
    max_results integer
)
RETURNS TABLE (
    article_id uuid,
    article_name text,
    article_body text,
    chunk_text text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (ka.id)
        ka.id as article_id,
        ka.name as article_name,
        ka.body as article_body,
        ac.chunk_text,
        1 - (ac.embedding <=> query_embedding) as similarity
    FROM
        article_chunks ac
        JOIN knowledge_base_articles ka ON ac.article_id = ka.id
    WHERE
        ka.is_active = true
        AND ka.is_public = true
        AND 1 - (ac.embedding <=> query_embedding) > similarity_threshold
    ORDER BY
        ka.id,
        1 - (ac.embedding <=> query_embedding) DESC
    LIMIT max_results;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_article_chunks TO authenticated; 