// app/page.js  ← Replace EVERYTHING with this code
'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [people, setPeople] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', age: '', email: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Edit Modal State
  const [editing, setEditing] = useState(null); // holds the person being edited
  const [editForm, setEditForm] = useState({ name: '', age: '', email: '' });

  // Fetch all data
  async function fetchData() {
    setLoading(true);
    const res = await fetch('/api/people');
    const data = await res.json();
    setPeople(data);
    setFiltered(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Search filter (live)
  useEffect(() => {
    const term = search.toLowerCase();
    const result = people.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      String(p.age).includes(term)
    );
    setFiltered(result);
  }, [search, people]);

  // Upload Excel
  async function handleUpload() {
    if (!file) return alert('Please select an Excel file');
    const fd = new FormData();
    fd.append('file', file);
    await fetch('/api/upload', { method: 'POST', body: fd });
    fetchData();
    setFile(null);
  }

  // Add new person
  async function handleAdd() {
    if (!formData.name || !formData.age || !formData.email) return alert('Fill all fields');
    await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, age: Number(formData.age) }),
    });
    fetchData();
    setFormData({ name: '', age: '', email: '' });
  }

  // Start editing
  function startEdit(person) {
    setEditing(person);
    setEditForm({
      name: person.name,
      age: person.age,
      email: person.email,
    });
  }

  // Save edit (FIXED: age is now converted to Number)
  async function saveEdit() {
    const dataToSend = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      age: Number(editForm.age) || 0,
    };

    const res = await fetch(`/api/people/${editing._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend),
    });

    if (res.ok) {
      setEditing(null);
      fetchData();
    } else {
      alert('Failed to update. Try again.');
    }
  }

  // Delete
  async function handleDelete(id) {
    if (!confirm('Delete this person permanently?')) return;
    await fetch(`/api/people/${id}`, { method: 'DELETE' });
    fetchData();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-10 text-indigo-700">
        Excel Data Manager
      </h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by name, email, or age..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-4 text-lg border-2 border-indigo-300 rounded-xl mb-8 focus:outline-none focus:border-indigo-600 shadow-lg"
      />
      <p className="text-right text-gray-600 mb-4">Total: {filtered.length} records</p>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Upload Excel File</h2>
        <div className="flex gap-4">
          <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])} className="flex-1" />
          <button onClick={handleUpload} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold">
            Upload Excel
          </button>
        </div>
      </div>

      {/* Add New Person */}
      <div className="bg-green-50 p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-4 text-green-700">Add New Person</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="p-3 border rounded-lg" />
          <input placeholder="Age" type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} className="p-3 border rounded-lg" />
          <input placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="p-3 border rounded-lg" />
        </div>
        <button onClick={handleAdd} className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold">
          Add Person
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-gray-500">Loading data...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-gray-500">No data yet. Upload an Excel file!</p>
        ) : (
          <table className="w-full">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Age</th>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((person) => (
                <tr key={person._id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium">{person.name}</td>
                  <td className="px-6 py-4">{person.age}</td>
                  <td className="px-6 py-4 text-blue-600">{person.email}</td>
                  <td className="px-6 py-4 text-center space-x-3">
                    <button
                      onClick={() => startEdit(person)}
                      className="bg-amber-500 text-white px-5 py-2 rounded-lg hover:bg-amber-600 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(person._id)}
                      className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-indigo-700">Edit Person</h2>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 focus:border-indigo-500 outline-none"
              placeholder="Name"
            />
            <input
              type="number"
              value={editForm.age}
              onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 focus:border-indigo-500 outline-none"
              placeholder="Age"
            />
            <input
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg mb-6 focus:border-indigo-500 outline-none"
              placeholder="Email"
            />
            <div className="flex gap-4">
              <button
                onClick={saveEdit}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditing(null)}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}