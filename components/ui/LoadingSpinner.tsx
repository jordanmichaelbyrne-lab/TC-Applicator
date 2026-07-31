export default function LoadingSpinner({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}