// app/page.js → FINAL: WITH DELETE ALL + PERFECT UI
'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadResult, setUploadResult] = useState({ added: 0, skipped: 0 });
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState({});
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef(null);

  async function load() {
    const params = new URLSearchParams();
    params.set('page', page);
    if (search.trim()) params.set('search', search.trim());
    if (minAge) params.set('minAge', minAge);
    if (maxAge) params.set('maxAge', maxAge);

    const res = await fetch(`/api/people/page?${params}`);
    const result = await res.json();

    setData(result.data || []);
    setTotal(result.total || 0);
    setTotalPages(result.totalPages || 1);
    setSelectedRows(new Set());
  }

  useEffect(() => {
    load();
  }, [page, search, minAge, maxAge]);

  async function uploadFile() {
    if (!file) return alert('Please select a file');
    setUploadStatus('uploading');
    setUploadResult({ added: 0, skipped: 0 });

    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });

    if (res.ok) {
      const json = await res.json();
      setUploadResult({ added: json.added || 0, skipped: json.skipped || 0 });
      setUploadStatus(json.message === 'Duplicate data found' ? 'duplicate' : 'success');
      setFile(null);
      load();
    } else {
      setUploadStatus('error');
    }
    setTimeout(() => setUploadStatus(''), 10000);
  }

  const downloadTemplate = async () => {
    const res = await fetch('/api/template');
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template.xlsx';
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

  async function deleteSelected() {
    if (selectedRows.size === 0) return alert('No rows selected');
    if (!confirm(`Delete ${selectedRows.size} rows permanently?`)) return;

    await fetch('/api/people/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedRows) })
    });

    setSelectedRows(new Set());
    load();
  }

  // DELETE ALL FUNCTION
  async function deleteAll() {
    if (!confirm(`Delete ALL ${total} records permanently? This cannot be undone!`)) return;

    await fetch('/api/people/clear-all', { method: 'POST' });
    load();
  }

  const toggleRow = (id) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  const toggleAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(r => r._id)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Only Title */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Excel Data Manager</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div
              className="flex-1 flex items-center gap-4 border-2 border-dashed border-green-300 rounded-lg px-6 py-3 cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
            >
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-8-8m0 0l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                {file ? file.name : 'Click or drop file'}
              </span>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex gap-3">
              <button onClick={downloadTemplate} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium text-sm">
                Template
              </button>
              <button onClick={uploadFile} disabled={!file || uploadStatus === 'uploading'}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium text-sm">
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>

          {/* Messages */}
          {uploadStatus === 'success' && (
            <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
              <p className="text-green-800 font-bold text-lg">
                Upload Successful! Added: <span className="text-2xl">{uploadResult.added}</span> | 
                Skipped: <span className="text-2xl">{uploadResult.skipped}</span>
              </p>
            </div>
          )}
          {uploadStatus === 'duplicate' && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-center">
              <p className="text-yellow-800 font-bold text-lg">
                Duplicate data found! Added: <span className="text-2xl">{uploadResult.added}</span> | 
                Skipped: <span className="text-2xl">{uploadResult.skipped}</span>
              </p>
            </div>
          )}
          {uploadStatus === 'error' && (
            <p className="mt-4 text-red-600 text-center font-bold">Upload Failed!</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-6 mb-8 items-end">
          <button onClick={() => setShowAdd(true)} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold">
            + Add Row
          </button>

          <button onClick={deleteSelected} disabled={selectedRows.size === 0}
            className="bg-red-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold">
            Delete ({selectedRows.size})
          </button>

          {/* DELETE ALL BUTTON */}
          <button
            onClick={deleteAll}
            className="bg-red-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold"
            title="Delete all records permanently"
          >
            Delete All ({total})
          </button>

          <button
            onClick={async () => {
              setExporting(true);
              const params = new URLSearchParams();
              if (search) params.set('search', search);
              if (minAge) params.set('minAge', minAge);
              if (maxAge) params.set('maxAge', maxAge);
              params.set('export', 'true');

              const res = await fetch(`/api/people/page?${params}`);
              const result = await res.json();

              if (!result.data?.length) {
                alert('No data to export');
                setExporting(false);
                return;
              }

              const { Workbook } = await import('exceljs');
              const wb = new Workbook();
              const ws = wb.addWorksheet('Data');

              const headers = Object.keys(result.data[0]).filter(k =>
                !['__v', 'createdAt', 'updatedAt', '_id'].includes(k)
              );
              ws.addRow(headers.map(h => h.replace(/([A-Z])/g, ' $1').trim()));

              result.data.forEach(row => {
                ws.addRow(headers.map(h => row[h] ?? ''));
              });

              ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
              ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };

              const buffer = await wb.xlsx.writeBuffer();
              const blob = new Blob([buffer]);
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `export-${new Date().toISOString().slice(0, 10)}.xlsx`;
              a.click();
              URL.revokeObjectURL(url);
              setExporting(false);
            }}
            disabled={exporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>

          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-64 px-6 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
          />
        </div>

        {/* Records Info */}
        <div className="mb-6 text-gray-700 font-medium">
          Total: <span className="text-green-700 font-bold">{total}</span> | 
          Showing {(page-1)*10 + 1}–{Math.min(page*10, total)} of {total}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input type="checkbox" checked={selectedRows.size === data.length && data.length > 0} onChange={toggleAll} className="w-5 h-5 rounded border-gray-400 focus:ring-blue-500" />
                  </th>
                  {data[0] && Object.keys(data[0]).filter(k => !['__v','createdAt','updatedAt','_id'].includes(k)).map(col => (
                    <th key={col} className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      {col.replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map(row => (
                  <tr key={row._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-center">
                      <input type="checkbox" checked={selectedRows.has(row._id)} onChange={() => toggleRow(row._id)} className="w-5 h-5 rounded border-gray-400 focus:ring-blue-500" />
                    </td>
                    {Object.keys(row).filter(k => !['__v','createdAt','updatedAt','_id'].includes(k)).map(col => (
                      <td key={col} className="px-6 py-4 text-sm text-gray-900">
                        {row[col] != null ? String(row[col]) : '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => { setEditing(row); setEditForm({ ...row }); }} className="text-blue-600 hover:text-blue-800">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => remove(row._id)} className="text-red-600 hover:text-red-800">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-gray-600">
            Showing {(page-1)*10 + 1}–{Math.min(page*10, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <span className="px-4 py-2 bg-blue-600 text-white rounded font-medium">
              {page}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">
              Next
            </button>
          </div>
        </div>

        {/* Modal */}
        {(showAdd || editing) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-4xl w-full max-h-screen overflow-y-auto">
              <h2 className="text-3xl font-bold mb-8 text-center text-green-700">
                {showAdd ? 'Add New Row' : 'Edit Row'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data[0] && Object.keys(data[0]).filter(k => !['__v','createdAt','updatedAt','_id'].includes(k)).map(col => (
                  <div key={col}>
                    <label className="block font-medium text-gray-700 capitalize mb-2">
                      {col.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      value={(showAdd ? newRow : editForm)[col] || ''}
                      onChange={e => showAdd ? setNewRow({ ...newRow, [col]: e.target.value }) : setEditForm({ ...editForm, [col]: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && (showAdd ? addRow() : saveEdit())}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-6 mt-10">
                <button onClick={showAdd ? addRow : saveEdit} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg">
                  {showAdd ? 'Add Row' : 'Save'}
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