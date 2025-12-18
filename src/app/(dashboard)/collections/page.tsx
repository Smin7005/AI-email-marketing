export default function CollectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
        <p className="text-muted-foreground mt-2">
          Organize your leads into named collections for targeted campaigns
        </p>
      </div>
      
      <div className="grid gap-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
          <p className="text-muted-foreground">
            Collections feature will allow you to save and organize leads into named groups 
            (e.g., "Sydney Cafes", "Melbourne Startups"). This page is under construction.
          </p>
        </div>
      </div>
    </div>
  );
}
