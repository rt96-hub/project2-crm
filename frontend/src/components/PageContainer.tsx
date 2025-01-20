interface PageContainerProps {
  title: string;
  children: React.ReactNode;
}

export function PageContainer({ title, children }: PageContainerProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">{title}</h1>
      <div className="text-gray-900">
        {children}
      </div>
    </div>
  )
} 