export default function DataTable({ columns, paginated, setEditing, setEditForm, remove }) {
  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-green-100">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-6 py-4 text-left font-semibold text-gray-700 capitalize">
                  {col.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
              <th className="px-6 py-4 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr key={row._id || i} className="border-t hover:bg-green-50 transition">
                {columns.map(col => (
                  <td key={col} className="px-6 py-4 text-gray-800">
                    {row[col] != null ? String(row[col]) : '-'}
                  </td>
                ))}
                <td className="px-6 py-4 text-center space-x-3">
                  <button onClick={() => { setEditing(row); setEditForm({...row}); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-medium">
                    Edit
                  </button>
                  <button onClick={() => remove(row._id)} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded font-medium">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}