export function RichTextViewer({ content }: { content: string }) {
  // Assume content is already HTML
  const output = content
  
  return (
    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: output }} />
  )
}