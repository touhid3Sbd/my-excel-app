// app/page.js → FINAL: FULL UPDATED CODE WITH ALL FIXES
'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState(page);
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
  const [loading, setLoading] = useState(false); // Added for loading spinner
  const fileInputRef = useRef(null);


  // DYNAMIC FIELDS — for Add/Edit modal
  const [dynamicFields, setDynamicFields] = useState([]);

  useEffect(() => {
    if (data.length > 0) {
      const fields = Object.keys(data[0]).filter(k => !['__v', 'createdAt', 'updatedAt', '_id'].includes(k));
      setDynamicFields(fields);
    } else {
      setDynamicFields([]); // empty if no data
    }
  }, [data]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page);
    if (search.trim()) params.set('search', search.trim());

    try {
      const res = await fetch(`/api/people?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();

      setData(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
      setSelectedRows(new Set());
    } catch (error) {
      console.error('Load error:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, search, minAge, maxAge]);

  useEffect(() => {
    setPageInput(page);
  }, [page]);

  const handlePageJump = (e) => {
    if (e.key === 'Enter') {
      const newPage = parseInt(pageInput, 10);
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      } else {
        setPageInput(page);
      }
    }
  };

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

      if (json.message === 'Duplicate data found') {
        setUploadStatus('duplicate');
      } else {
        setUploadStatus('success');
      }

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
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow)
      });

      if (res.ok) {
        setShowAdd(false);
        setNewRow({});
        load(); // This forces table refresh
      } else {
        const error = await res.text();
        alert('Failed: ' + error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
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
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Excel Data Manager</h1>
        </div>

        
        {/* Upload Section — BUTTONS SAME SIZE AS CONTROLS */}
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
            <div className="flex gap-4">
              <button
                onClick={downloadTemplate}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
              >
                Template
              </button>
              <button
                onClick={uploadFile}
                disabled={!file || uploadStatus === 'uploading'}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
              >
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>

          {/* MESSAGES */}
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

        {/* Controls — ALL BUTTONS SAME SIZE */}
        <div className="flex flex-wrap gap-4 mb-8 items-center">
          {/* Add New Row */}
          <button
            onClick={() => {
              setShowAdd(true);
              const emptyRow = {};
              dynamicFields.forEach(field => {
                emptyRow[field] = '';
              });
              setNewRow(emptyRow);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
          >
            + Add New Row
          </button>

          {/* Delete Selected */}
          <button
            onClick={deleteSelected}
            disabled={selectedRows.size === 0}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
            title={`Delete ${selectedRows.size} selected rows`}
          >
            Delete ({selectedRows.size})
          </button>

          {/* Delete All */}
          <button
            onClick={async () => {
              if (!confirm(`Delete ALL ${total} records permanently?`)) return;
              await fetch('/api/people/clear-all', { method: 'POST' });
              load();
            }}
            className="bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
            title="Delete every record"
          >
            All ({total})
          </button>

          {/* Export */}
          <button
            onClick={async () => {
              setExporting(true);
              const params = new URLSearchParams();
              if (search) params.set('search', search);
              if (minAge) params.set('minAge', minAge);
              if (maxAge) params.set('maxAge', maxAge);
              params.set('export', 'true');

              const res = await fetch(`/api/people?${params}`);
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
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
          >
            {exporting ? 'Exporting...' : 'Export'}
          </button>

          {/* Search */}
          <input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-64 px-5 py-2.5 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-sm"
          />
        </div>

        {/* Records Info */}
        <div className="mb-6 text-gray-700 font-medium">
          Total: <span className="text-green-700 font-bold">{total}</span> |
          Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-100">
                <tr>
                  <th className="px-6 py-4 text-center">
                    <input type="checkbox" checked={selectedRows.size === data.length && data.length > 0} onChange={toggleAll} className="w-5 h-5 rounded" />
                  </th>
                  {data[0] && Object.keys(data[0]).filter(k => !['__v', 'createdAt', 'updatedAt', '_id'].includes(k)).map(col => (
                    <th key={col} className="px-6 py-4 text-left font-semibold text-gray-700 capitalize">
                      {col.replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={row._id} className="border-t hover:bg-green-50 transition">
                    <td className="px-6 py-4 text-center">
                      <input type="checkbox" checked={selectedRows.has(row._id)} onChange={() => toggleRow(row._id)} className="w-5 h-5 rounded" />
                    </td>
                    {Object.keys(row).filter(k => !['__v', 'createdAt', 'updatedAt', '_id'].includes(k)).map(col => (
                      <td key={col} className="px-6 py-4 text-gray-800">
                        {row[col] != null ? String(row[col]) : '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center space-x-3">
                      <button onClick={() => { setEditing(row); setEditForm({ ...row }); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-medium">
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

        {/* Pagination */}
        <div className="flex justify-center gap-3 mt-10">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50">
            Previous
          </button>
          <span className="px-6 py-3 bg-green-600 text-white rounded font-bold">
            Page {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50">
            Next
          </button>
        </div>

        {/* Modal */}
        {(showAdd || editing) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-4xl w-full max-h-screen overflow-y-auto">
              <h2 className="text-3xl font-bold mb-8 text-center text-green-700">
                {showAdd ? 'Add New Row' : 'Edit Row'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dynamicFields.map(col => (
                  <div key={col}>
                    <label className="block font-medium text-gray-700 capitalize mb-2">
                      {col.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      value={(showAdd ? newRow : editForm)[col] || ''}
                      onChange={e => {
                        const value = e.target.value;
                        if (showAdd) {
                          setNewRow(prev => ({ ...prev, [col]: value }));
                        } else {
                          setEditForm(prev => ({ ...prev, [col]: value }));
                        }
                      }}
                      onKeyDown={e => e.key === 'Enter' && (showAdd ? addRow() : saveEdit())}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      placeholder={col.replace(/_/g, ' ')}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-6 mt-10">
                <button
                  onClick={showAdd ? addRow : saveEdit}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg"
                >
                  {showAdd ? 'Add Row' : 'Save Changes'}
                </button>
                <button
                  onClick={() => { setShowAdd(false); setEditing(null); }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-lg font-bold text-lg"
                >
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