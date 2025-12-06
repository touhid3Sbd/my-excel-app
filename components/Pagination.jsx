export default function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center gap-3 mt-10">
      <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded font-medium disabled:opacity-50">
        Previous
      </button>
      {[...Array(totalPages)].map((_, i) => (
        <button key={i+1} onClick={() => setPage(i+1)} className={`w-10 h-10 rounded font-medium ${page === i+1 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
          {i+1}
        </button>
      ))}
      <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded font-medium disabled:opacity-50">
        Next
      </button>
    </div>
  );
}