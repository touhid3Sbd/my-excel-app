export default function AddEditModal({ showAdd, editing, columns, newRow, setNewRow, editForm, setEditForm, addRow, saveEdit, onClose }) {
  if (!showAdd && !editing) return null;

  const form = showAdd ? newRow : editForm;
  const setForm = showAdd ? setNewRow : setEditForm;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-4xl w-full max-h-screen overflow-y-auto">
        <h2 className="text-3xl font-bold mb-8 text-center text-green-700">
          {showAdd ? 'Add New Row' : 'Edit Row'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {columns.map(col => (
            <div key={col}>
              <label className="block font-medium text-gray-700 capitalize mb-2">
                {col.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <input
                value={form[col] || ''}
                onChange={e => setForm({...form, [col]: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-10">
          <button onClick={showAdd ? addRow : saveEdit} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg">
            {showAdd ? 'Add Row' : 'Save Changes'}
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-lg font-bold text-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}