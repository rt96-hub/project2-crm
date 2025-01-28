import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export function RichTextEditor({
  content,
  onChange
}: {
  content: string
  onChange: (content: string) => void
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    }
  })

  if (!editor) {
    return <div>Loading editor...</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4 flex-shrink-0">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-black text-white' : 'bg-gray-200 text-black'} hover:bg-gray-300`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-black text-white' : 'bg-gray-200 text-black'} hover:bg-gray-300`}
        >
          I
        </button>
        {/* Add more format buttons as needed */}
      </div>
      <div className="flex-grow overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  )
} 