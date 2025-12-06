import FileDropZone from './FileDropZone';

export default function UploadSection({ file, setFile, uploadFile, downloadTemplate, uploadStatus }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-10 mb-10 border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Upload Excel File</h2>
      <FileDropZone file={file} setFile={setFile} />

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
  );
}