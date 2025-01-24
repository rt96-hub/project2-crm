import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { RichTextEditor } from '../components/RichTextEditor'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import { useUser } from '../context/UserContext'
import type { Database } from '../types/database.types'

type KnowledgeBaseCategory = Database['public']['Tables']['knowledge_base_categories']['Row']

export function NewKnowledgeBaseArticle() {
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [categoryId, setCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<KnowledgeBaseCategory[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isPowerMode } = useTheme()
  const { profile } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('knowledge_base_categories')
          .select('*')
          .eq('is_active', true)
          .order('name')

        if (categoriesError) throw categoriesError

        setCategories(categoriesData)
        if (categoriesData.length > 0) {
          setCategoryId(categoriesData[0].id)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setError('Failed to load categories')
      }
    }

    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('knowledge_base_articles')
        .insert({
          name,
          body: content,
          is_public: isPublic,
          category_id: categoryId,
          creator_id: profile.user_id
        })

      if (insertError) throw insertError

      navigate('/knowledge-base')
    } catch (error) {
      console.error('Error creating article:', error)
      setError('Failed to create article')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer title="New Knowledge Base Article">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* Header Section */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Name Input */}
            <div className="flex-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Article Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                required
              />
            </div>

            {/* Category Dropdown */}
            <div className="w-64">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Public Checkbox */}
            <div className="flex items-end mb-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Make Public</span>
              </label>
            </div>
          </div>

          {/* Rich Text Editor */}
          <div className="border rounded-lg p-4 bg-white h-[calc(100vh-300px)]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Article Content
            </label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/knowledge-base')}
              className={`px-4 py-2 rounded-lg font-medium ${
                isPowerMode
                  ? 'bg-hot-pink text-toxic-yellow hover:bg-electric-purple'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium ${
                isPowerMode
                  ? 'bg-neon-green text-electric-purple hover:bg-hot-pink hover:text-toxic-yellow'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {loading ? 'Creating...' : 'Create Article'}
            </button>
          </div>
        </div>
      </form>
    </PageContainer>
  )
} 