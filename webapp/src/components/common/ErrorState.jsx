export default function ErrorState({ message = "Something went wrong", onRetry }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
      <p className="font-medium">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 rounded-md border border-rose-300 px-3 py-1.5 text-sm font-semibold hover:bg-rose-100"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}