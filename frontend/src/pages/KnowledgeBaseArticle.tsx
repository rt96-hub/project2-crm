import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { RichTextViewer } from '../components/RichTextViewer'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import { useUser } from '../context/UserContext'
import type { Database } from '../types/database.types'

type KnowledgeBaseArticle = Database['public']['Tables']['knowledge_base_articles']['Row']
type KnowledgeBaseCategory = Database['public']['Tables']['knowledge_base_categories']['Row']

interface ArticleWithCategory extends KnowledgeBaseArticle {
  category: KnowledgeBaseCategory
}

export function KnowledgeBaseArticle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isPowerMode } = useTheme()
  const { profile } = useUser()
  const [article, setArticle] = useState<ArticleWithCategory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return

      try {
        const { data: articleData, error: articleError } = await supabase
          .from('knowledge_base_articles')
          .select(`
            *,
            category:knowledge_base_categories(id, name)
          `)
          .eq('id', id)
          .single()

        if (articleError) throw articleError

        setArticle(articleData as ArticleWithCategory)
      } catch (error) {
        console.error('Error fetching article:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [id])

  if (loading) {
    return (
      <PageContainer title="Loading...">
        <div className={`text-2xl ${isPowerMode ? 'animate-spin text-hot-pink' : 'text-gray-600'}`}>
          {isPowerMode ? '🌀' : 'Loading article...'}
        </div>
      </PageContainer>
    )
  }

  if (!article) {
    return (
      <PageContainer title="Article Not Found">
        <div className="text-red-600">
          Article not found
        </div>
      </PageContainer>
    )
  }
  return (
    <PageContainer title={article.name}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <span className={`px-2 py-1 text-sm rounded-full ${
            isPowerMode ? 'bg-neon-green text-electric-purple' : 'bg-blue-100 text-blue-800'
          }`}>
            {article.category.name}
          </span>
          {profile && !profile.is_customer && (
            <span className={`px-2 py-1 text-sm rounded-full ${
              article.is_public
                ? isPowerMode
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-800'
                : isPowerMode
                  ? 'bg-red-500 text-white'
                  : 'bg-red-100 text-red-800'
            }`}>
              {article.is_public ? 'Public' : 'Private'}
            </span>
          )}
        </div>
        {profile && !profile.is_customer && (
          <button
            onClick={() => navigate(`/knowledge-base/edit/${article.id}`)}
            className={`px-4 py-2 rounded-lg font-medium ${
              isPowerMode
                ? 'bg-neon-green text-electric-purple hover:bg-hot-pink hover:text-toxic-yellow'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Edit Article
          </button>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <RichTextViewer content={article.body} />
      </div>
    </PageContainer>
  )
} 