import { useRef } from 'react';

export default function FileDropZone({ file, setFile }) {
  const fileInputRef = useRef(null);

  return (
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
  );
}