export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-64 h-64 mb-8">
        {/* Placeholder illustration */}
        <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
          <svg 
            className="w-32 h-32 text-muted-foreground" 
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </div>
      <h2 className="text-2xl font-semibold mb-2">No websites yet</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Get started by creating your first website. Use the AI prompt above to describe
        what you want to build.
      </p>
      {/* Button will be added in Story 3.4 */}
    </div>
  );
}