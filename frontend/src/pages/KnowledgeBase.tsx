import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import { useUser } from '../context/UserContext'
import type { Database } from '../types/database.types'

type KnowledgeBaseArticle = Database['public']['Tables']['knowledge_base_articles']['Row']
type KnowledgeBaseCategory = Database['public']['Tables']['knowledge_base_categories']['Row']

interface ArticleWithCategory extends KnowledgeBaseArticle {
  category: KnowledgeBaseCategory
}

export function KnowledgeBase() {
  const [articles, setArticles] = useState<ArticleWithCategory[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const { isPowerMode } = useTheme()
  const { profile } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data: articlesData, error: articlesError } = await supabase
          .from('knowledge_base_articles')
          .select(`
            *,
            category:knowledge_base_categories(id, name, is_active)
          `)
          .order('created_at', { ascending: false })

        if (articlesError) throw articlesError

        setArticles(articlesData as ArticleWithCategory[])
      } catch (error) {
        console.error('Error fetching articles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [])

  const filteredArticles = articles.filter(article =>
    article.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (profile && profile.is_admin ? true : article.is_active)
  )

  return (
    <PageContainer title="Knowledge Base">
      {/* Add Article Button */}
      {profile && !profile.is_customer && (
        <div className="mb-6">
          <button
            onClick={() => navigate('/knowledge-base/new')}
            className={`px-4 py-2 rounded-lg font-medium ${
              isPowerMode
                ? 'bg-neon-green text-electric-purple hover:bg-hot-pink hover:text-toxic-yellow'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Add Article
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
        />
      </div>

      {/* Articles Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className={`text-2xl ${isPowerMode ? 'animate-spin text-hot-pink' : 'text-gray-600'}`}>
            {isPowerMode ? '🌀' : 'Loading...'}
          </div>
        </div>
      ) : (
        <div className={`bg-white shadow-md rounded-lg overflow-hidden ${
          isPowerMode ? 'border-4 border-hot-pink' : ''
        }`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={`${isPowerMode ? 'bg-electric-purple' : 'bg-gray-50'}`}>
              <tr>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isPowerMode ? 'text-toxic-yellow' : 'text-gray-500'
                }`}>
                  Name
                </th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isPowerMode ? 'text-toxic-yellow' : 'text-gray-500'
                }`}>
                  Category
                </th>
                {profile && !profile.is_customer && profile.is_admin && (
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isPowerMode ? 'text-toxic-yellow' : 'text-gray-500'
                  }`}>
                    Active
                  </th>
                )}
                {profile && !profile.is_customer && (
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isPowerMode ? 'text-toxic-yellow' : 'text-gray-500'
                  }`}>
                    Public
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredArticles.map((article) => (
                <tr 
                  key={article.id}
                  onClick={() => navigate(`/knowledge-base/${article.id}`)}
                  className={`cursor-pointer ${
                    isPowerMode 
                      ? 'hover:bg-neon-green/10' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {article.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {article.category.name}
                    </div>
                  </td>
                  {profile && !profile.is_customer && profile.is_admin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${article.is_active
                          ? isPowerMode
                            ? 'bg-neon-green text-electric-purple'
                            : 'bg-green-100 text-green-800'
                          : isPowerMode
                            ? 'bg-hot-pink text-toxic-yellow'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {article.is_active ? 'Yes' : 'No'}
                      </div>
                    </td>
                  )}
                  {profile && !profile.is_customer && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${article.is_public
                          ? isPowerMode
                            ? 'bg-neon-green text-electric-purple'
                            : 'bg-green-100 text-green-800'
                          : isPowerMode
                            ? 'bg-hot-pink text-toxic-yellow'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {article.is_public ? 'Yes' : 'No'}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  )
} 