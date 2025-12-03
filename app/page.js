// app/page.js → YOUR DESIGN + SEARCH 100% FIXED
'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);   // ← ADDED: Keeps original data for search
  const [columns, setColumns] = useState([]);
  const [search, setSearch] = useState('');
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState({});

  // CHANGE THIS NUMBER TO CONTROL ROWS PER PAGE
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.ceil(data.length / perPage);
  const paginated = data.slice((page - 1) * perPage, page * perPage);

  // ← FIXED: load() now saves data to both states
  async function load() {
    const res = await fetch('/api/people');
    const result = await res.json();
    setData(result);
    setOriginalData(result);        // ← This line was missing
    setPage(1);

    if (result.length > 0) {
      const keys = Object.keys(result[0]).filter(k => !['__v', 'createdAt', 'updatedAt', '_id'].includes(k));
      setColumns(keys);
      const empty = {};
      keys.forEach(k => empty[k] = '');
      setNewRow(empty);
    }
  }

  // ← FIXED: First useEffect (on mount)
  useEffect(() => {
    load();
  }, []);

  // ← FULLY FIXED SEARCH (uses originalData)
  useEffect(() => {
    if (!search.trim()) {
      setData(originalData);
      setPage(1);
      return;
    }

    const term = search.toLowerCase();
    const filtered = originalData.filter(row =>
      columns.some(col => 
        row[col] != null && String(row[col]).toLowerCase().includes(term)
      )
    );
    setData(filtered);
    setPage(1);
  }, [search, originalData, columns]);

  async function uploadFile() {
    if (!file) return alert('Please select a file');
    setUploadStatus('uploading');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      setUploadStatus('success');
      setFile(null);
      load();
    } else setUploadStatus('error');
    setTimeout(() => setUploadStatus(''), 4000);
  }

  async function addRow() { 
    await fetch('/api/people', { 
      method: 'POST', 
      body: JSON.stringify(newRow), 
      headers: { 'Content-Type': 'application/json' } 
    }); 
    setShowAdd(false); 
    load(); 
  }

  async function saveEdit() { 
    await fetch(`/api/people/${editing._id}`, { 
      method: 'PUT', 
      body: JSON.stringify(editForm), 
      headers: { 'Content-Type': 'application/json' } 
    }); 
    setEditing(null); 
    load(); 
  }

  async function remove(id) { 
    if (confirm('Delete this row?')) 
      await fetch(`/api/people/${id}`, { method: 'DELETE' }); 
    load(); 
  }

  return (
    <div className="min-h-screen bg-pink-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Excel Data Manager</h1>
          
        </div>

        {/* Upload Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 mb-10 border border-white/50">
          <div className="flex flex-wrap items-center gap-6">
            <input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files?.[0] || null)}
              className="text-lg border rounded-lg px-4 py-2" />
            <button onClick={uploadFile} disabled={uploadStatus === 'uploading'}
              className="bg-sky-500/75 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold">
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Excel'}
            </button>
          </div>
          {uploadStatus === 'success' && <p className="mt-4 text-green-600 font-medium">Uploaded successfully!</p>}
          {uploadStatus === 'error' && <p className="mt-4 text-red-600 font-medium">Upload failed. Try again.</p>}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-6 mb-8">
          <button onClick={() => setShowAdd(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold">
            + Add New Row
          </button>
          <input 
            placeholder="Search in all columns..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-64 px-6 py-3 border rounded-lg text-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Records Info */}
        <div className="mb-6 text-gray-700">
          Showing {(page-1)*perPage + 1}–{Math.min(page*perPage, data.length)} of {data.length} records
        </div>

        {/* Table */}
        <div className="bg-gray-100 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-white/60">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-6 py-4 text-left font-semibold text-gray-700 capitalize">
                      {col}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(row => (
                  <tr key={row._id} className="border-b hover:bg-gray-50 transition">
                    {columns.map(col => (
                      <td key={col} className="px-6 py-4 text-gray-800">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center space-x-3">
                      <button onClick={() => { setEditing(row); setEditForm({...row}); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-medium">
                        Edit
                      </button>
                      <button onClick={() => remove(row._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p-1))}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded font-medium disabled:opacity-50"
              disabled={page === 1}>
              Previous
            </button>
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i+1} onClick={() => setPage(i+1)}
                  className={`w-10 h-10 rounded font-medium ${page === i+1 ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                  {i+1}
                </button>
              ))}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded font-medium disabled:opacity-50"
              disabled={page === totalPages}>
              Next
            </button>
          </div>
        )}

        {/* Add / Edit Modal */}
        {(showAdd || editing) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-lg shadow-xl p-10 max-w-4xl w-full max-h-screen overflow-y-auto">
              <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">
                {showAdd ? 'Add New Row' : 'Edit Row'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {columns.map(col => (
                  <div key={col}>
                    <label className="block font-medium text-gray-700 capitalize mb-2">{col}</label>
                    <input
                      value={(showAdd ? newRow : editForm)[col] || ''}
                      onChange={e => showAdd 
                        ? setNewRow({...newRow, [col]: e.target.value})
                        : setEditForm({...editForm, [col]: e.target.value})
                      }
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder={`Enter ${col}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-6 mt-10">
                <button onClick={showAdd ? addRow : saveEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg">
                  {showAdd ? 'Add Row' : 'Save Changes'}
                </button>
                <button onClick={() => { setShowAdd(false); setEditing(null); }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-lg font-bold text-lg">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}