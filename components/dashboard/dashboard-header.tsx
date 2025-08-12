export function DashboardHeader() {
  return (
    <div className="border-b">
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-3xl font-bold">Your Websites</h2>
        <p className="text-muted-foreground mt-2">
          Select a website to continue editing or create a new one
        </p>
      </div>
    </div>
  );
}