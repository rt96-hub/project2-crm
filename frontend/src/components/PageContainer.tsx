interface PageContainerProps {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  actionButton?: React.ReactNode;
}

export function PageContainer({ title, children, onBack, actionButton }: PageContainerProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-3 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Go back"
            >
              ←
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        {actionButton}
      </div>
      <div className="text-gray-900">
        {children}
      </div>
    </div>
  )
} 