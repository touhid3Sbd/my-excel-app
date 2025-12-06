// app/page.js → FINAL VERSION: 10 ROWS PER PAGE + EVERYTHING WORKING
'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [search, setSearch] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState({});
  const [page, setPage] = useState(1);
  const perPage = 10; // ← 10 ROWS PER PAGE
  const fileInputRef = useRef(null);

  const totalPages = Math.ceil(data.length / perPage);
  const paginated = data.slice((page - 1) * perPage, page * perPage);

  async function load() {
    const res = await fetch('/api/people');
    const result = await res.json();
    setData(result);
    setOriginalData(result);
    setPage(1); // Always start from page 1 after load

    if (result.length > 0) {
      const ignored = ['__v', 'createdAt', 'updatedAt', '_id', 'id'];
      const keys = Object.keys(result[0]).filter(k => !ignored.includes(k));
      setColumns(keys);

      const empty = {};
      keys.forEach(k => empty[k] = '');
      setNewRow(empty);
    }
  }

  useEffect(() => { load(); }, []);

  // SEARCH + AGE FILTER
  useEffect(() => {
    let filtered = originalData;

    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(row =>
        columns.some(col => {
          const value = row[col];
          return value != null && String(value).toLowerCase().includes(term);
        })
      );
    }

    if (minAge || maxAge) {
      filtered = filtered.filter(row => {
        const age = parseInt(row.age);
        if (isNaN(age)) return false;
        if (minAge && age < parseInt(minAge)) return false;
        if (maxAge && age > parseInt(maxAge)) return false;
        return true;
      });
    }

    setData(filtered);
    setPage(1);
  }, [search, originalData, columns, minAge, maxAge]);

  async function uploadFile() {
    if (!file) return alert('Please select a file');
    setUploadStatus('uploading');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const json = await res.json();
      setUploadStatus('success');
      alert(`Success! Added: ${json.added || json.message}, Skipped: ${json.skipped || 0}`);
      setFile(null);
      load();
    } else {
      setUploadStatus('error');
      alert('Upload failed');
    }
    setTimeout(() => setUploadStatus(''), 5000);
  }

  const downloadTemplate = async () => {
    const res = await fetch('/api/template');
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'excel-template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  async function addRow() {
    await fetch('/api/people', { method: 'POST', body: JSON.stringify(newRow), headers: { 'Content-Type': 'application/json' } });
    setShowAdd(false);
    load();
  }

  async function saveEdit() {
    await fetch(`/api/people/${editing._id}`, { method: 'PUT', body: JSON.stringify(editForm), headers: { 'Content-Type': 'application/json' } });
    setEditing(null);
    load();
  }

  async function remove(id) {
    if (confirm('Delete this row?')) {
      await fetch(`/api/people/${id}`, { method: 'DELETE' });
      load();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Excel Data Manager</h1>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-xl p-10 mb-10 border border-gray-200">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Upload Excel File</h2>

          <div
            className="border-4 border-dashed border-green-300 rounded-2xl p-12 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
          >
            <svg className="mx-auto h-20 w-20 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-8-8m0 0l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="mt-4 text-xl font-semibold text-gray-700">Drop file here or click</p>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>

          {file && (
            <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-xl px-6 py-5 flex items-center gap-4">
              <span className="text-lg font-bold text-blue-700">{file.name}</span>
              <button onClick={() => setFile(null)} className="ml-auto text-green-700 hover:text-green-900 font-semibold">Remove</button>
            </div>
          )}

          <div className="mt-10 flex justify-center gap-8">
            <button onClick={downloadTemplate} className="bg-green-600 hover:bg-green-700 text-white px-10 py-5 rounded-xl font-bold text-xl shadow-lg transition transform hover:scale-105">
              Download Template
            </button>
            <button
              onClick={uploadFile}
              disabled={!file || uploadStatus === 'uploading'}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-white px-12 py-5 rounded-xl font-bold text-xl shadow-lg transition transform hover:scale-105"
            >
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Excel'}
            </button>
          </div>

          {uploadStatus === 'success' && <p className="mt-6 text-green-600 text-center text-2xl font-bold">Upload Successful!</p>}
          {uploadStatus === 'error' && <p className="mt-6 text-red-600 text-center text-2xl font-bold">Upload Failed!</p>}
        </div>

        {/* Controls + Age Filter */}
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
              <input
                type="number"
                value={minAge}
                onChange={e => setMinAge(e.target.value)}
                placeholder="18"
                className="w-24 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
              <input
                type="number"
                value={maxAge}
                onChange={e => setMaxAge(e.target.value)}
                placeholder="60"
                className="w-24 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => { setMinAge(''); setMaxAge(''); }}
              className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Records Info */}
        <div className="mb-6 text-gray-700 font-medium">
          Total Records: <span className="text-green-700 font-bold">{data.length}</span> | 
          Showing {data.length === 0 ? '0' : (page - 1) * perPage + 1}–{data.length === 0 ? '0' : Math.min(page * perPage, data.length)} of {data.length}
        </div>

        {/* Table */}
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

        {/* Pagination - 10 per page */}
        {totalPages > 1 && (
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
        )}

        {/* Modal */}
        {(showAdd || editing) && (
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
                      value={(showAdd ? newRow : editForm)[col] || ''}
                      onChange={e => showAdd ? setNewRow({...newRow, [col]: e.target.value}) : setEditForm({...editForm, [col]: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-6 mt-10">
                <button onClick={showAdd ? addRow : saveEdit} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg">
                  {showAdd ? 'Add Row' : 'Save Changes'}
                </button>
                <button onClick={() => { setShowAdd(false); setEditing(null); }} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-lg font-bold text-lg">
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