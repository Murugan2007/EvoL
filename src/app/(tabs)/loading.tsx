// Shown instantly while a tab's data loads (the bottom bar stays visible).
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 px-5 pt-6" aria-busy="true">
      <div className="h-8 w-40 rounded-lg bg-line" />
      <div className="h-11 rounded-2xl bg-line" />
      <div className="h-40 rounded-3xl bg-line" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-36 rounded-2xl bg-line" />
        <div className="h-36 rounded-2xl bg-line" />
      </div>
    </div>
  );
}
