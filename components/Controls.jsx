export default function Controls({ setShowAdd, search, setSearch, minAge, setMinAge, maxAge, setMaxAge }) {
  return (
    <div className="flex flex-wrap gap-6 mb-8 items-end">
      <button onClick={() => setShowAdd(true)} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold">
        + Add New Row
      </button>

      <input
        placeholder="Search all columns..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="flex-1 min-w-64 px-6 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
      />

      <div className="flex gap-3 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
          <input type="number" value={minAge} onChange={e => setMinAge(e.target.value)} placeholder="18" className="w-24 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
          <input type="number" value={maxAge} onChange={e => setMaxAge(e.target.value)} placeholder="60" className="w-24 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" />
        </div>
        <button onClick={() => { setMinAge(''); setMaxAge(''); }} className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium">
          Clear
        </button>
      </div>
    </div>
  );
}