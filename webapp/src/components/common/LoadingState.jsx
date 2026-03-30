export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}