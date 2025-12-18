export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile, subscription, and account preferences
        </p>
      </div>
      
      <div className="grid gap-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
          <p className="text-muted-foreground">
            Profile management, subscription details, and billing information will be available here.
            This page is under construction.
          </p>
        </div>
      </div>
    </div>
  );
}
