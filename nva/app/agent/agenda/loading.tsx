export default function Loading() {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
        <p className="ml-4 text-lg text-gray-600">Chargement de l agenda...</p>
      </div>
    )
  }
  
  