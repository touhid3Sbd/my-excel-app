// components/UploadButton.jsx
'use client';

export default function UploadButton() {
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Success! ${data.message}`);
      } else {
        alert(`Error: ${data.error || data.details}`);
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <input
      type="file"
      accept=".xlsx,.xls,.csv"
      onChange={handleUpload}
      className="file-input file-input-bordered"
    />
  );
}