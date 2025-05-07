'use client';

import { useState, useEffect } from 'react';
import { uploadToS3 } from '@/utils/uploadToS3';

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'queued' | 'pending' | 'done'>('idle');
  const [summary, setSummary] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    try {
      const uploadedUrl = await uploadToS3(file);
      setFileUrl(uploadedUrl);
      setStatus('queued');

      await fetch('/api/queue-job', {
        method: 'POST',
        body: JSON.stringify({ fileUrl: uploadedUrl }),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  };

  useEffect(() => {
    if (status !== 'queued' || !fileUrl) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/summary-status?fileUrl=${encodeURIComponent(fileUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'done') {
          setSummary(data.summary);
          setStatus('done');
          clearInterval(interval);
        } else {
          setStatus('pending');
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [status, fileUrl]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 space-y-6">
      <h1 className="text-3xl font-bold">PDF Summarizer</h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="file-input"
      />
      <button
        onClick={handleUpload}
        disabled={!file || status === 'uploading'}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'uploading' ? 'Uploading...' : 'Upload & Summarize'}
      </button>

      {status === 'pending' && <p>⏳ Summarizing your PDF...</p>}
      {status === 'done' && summary && (
        <div className="max-w-2xl p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold mb-2">Summary:</h2>
          <p className="whitespace-pre-wrap">{summary}</p>
        </div>
      )}
    </main>
  );
}
