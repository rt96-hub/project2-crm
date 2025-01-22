import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'

type ConfigItem = {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

type ConfigItemManagerProps = {
  title: string
  tableName: string
  onClose?: () => void
}

export function ConfigItemManager({ title, tableName, onClose }: ConfigItemManagerProps) {
  const [items, setItems] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItemName, setNewItemName] = useState('')
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null)
  const { isPowerMode } = useTheme()

  useEffect(() => {
    fetchItems()
  }, [tableName])

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data)
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error)
    } finally {
      setLoading(false)
    }
  }

  const toggleItemActive = async (item: ConfigItem) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ is_active: !item.is_active })
        .eq('id', item.id)

      if (error) throw error
      
      setItems(items.map(i => 
        i.id === item.id 
          ? { ...i, is_active: !item.is_active }
          : i
      ))
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error)
    }
  }

  const updateItemName = async (item: ConfigItem, newName: string) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ name: newName })
        .eq('id', item.id)

      if (error) throw error
      
      setItems(items.map(i => 
        i.id === item.id 
          ? { ...i, name: newName }
          : i
      ))
      setEditingItem(null)
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error)
    }
  }

  const createNewItem = async () => {
    if (!newItemName.trim()) return

    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert([{ name: newItemName.trim(), is_active: true }])
        .select()

      if (error) throw error
      if (data) {
        setItems([data[0], ...items])
        setNewItemName('')
      }
    } catch (error) {
      console.error(`Error creating ${tableName}:`, error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-2xl ${isPowerMode ? 'animate-spin text-hot-pink' : 'text-gray-600'}`}>
          {isPowerMode ? '🌀' : 'Loading...'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${
          isPowerMode ? 'text-hot-pink animate-pulse' : 'text-gray-900'
        }`}>
          {isPowerMode ? `✨ ${title} 🎮` : title}
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium ${
              isPowerMode
                ? 'bg-electric-purple text-toxic-yellow hover:bg-hot-pink'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Back to Admin
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && newItemName.trim() && createNewItem()}
              placeholder="Enter new item name"
              className={`flex-1 p-2 border rounded text-gray-900 bg-white ${
                isPowerMode
                  ? 'border-electric-purple focus:border-hot-pink'
                  : 'border-gray-300 focus:border-blue-500'
              } focus:outline-none`}
            />
            <button
              onClick={createNewItem}
              disabled={!newItemName.trim()}
              className={`px-4 py-2 rounded font-medium ${
                isPowerMode
                  ? 'bg-electric-purple text-toxic-yellow hover:bg-hot-pink disabled:opacity-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              Add New
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded ${
                isPowerMode
                  ? 'bg-electric-purple/10 hover:bg-electric-purple/20'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={item.is_active}
                  onChange={() => toggleItemActive(item)}
                  className={`w-4 h-4 ${
                    isPowerMode
                      ? 'text-hot-pink focus:ring-electric-purple'
                      : 'text-blue-600 focus:ring-blue-500'
                  }`}
                />
                {editingItem?.id === item.id ? (
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    onBlur={() => updateItemName(item, editingItem.name)}
                    onKeyDown={(e) => e.key === 'Enter' && updateItemName(item, editingItem.name)}
                    className="flex-1 p-1 border rounded text-gray-900 bg-white"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => setEditingItem(item)}
                    className="flex-1 cursor-pointer text-gray-900"
                  >
                    {item.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => setEditingItem(item)}
                className={`ml-2 p-1 rounded ${
                  isPowerMode
                    ? 'text-hot-pink hover:bg-electric-purple/30'
                    : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                ✎
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 