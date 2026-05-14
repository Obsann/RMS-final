import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';

const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export default function DocumentUpload({ value = [], onChange, maxSize, acceptedTypes, maxFiles, categoryTag }) {
  const MAX_FILES = maxFiles || DEFAULT_MAX_FILES;
  const MAX_SIZE = maxSize || DEFAULT_MAX_SIZE;
  const ACCEPTED_TYPES = acceptedTypes || DEFAULT_ACCEPTED_TYPES;
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const uploadFile = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('rms_token');
    const headers = { Authorization: `Bearer ${token}` };
    if (categoryTag) {
      headers['x-category-tag'] = categoryTag;
    }

    const res = await fetch('/api/uploads', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Upload failed');
    }

    return res.json();
  }, [categoryTag]);

  const handleFiles = useCallback(async (fileList) => {
    setError('');
    const files = Array.from(fileList);

    // Validate count
    if (value.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    // Validate each file
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Only JPEG, PNG, and PDF files are accepted');
        return;
      }
      if (file.size > MAX_SIZE) {
        setError('Each file must be under 5MB');
        return;
      }
    }

    setUploading(true);
    try {
      const results = await Promise.all(files.map(async (file) => {
        const result = await uploadFile(file);
        return {
          filename: result.file?.filename || result.filename,
          originalName: file.name,
          size: file.size,
          type: file.type,
          url: result.file?.url || null,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        };
      }));
      onChange([...value, ...results]);
    } catch (err) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [value, onChange, uploadFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleRemove = useCallback((index) => {
    const updated = [...value];
    // Revoke object URL if exists
    if (updated[index]?.preview) {
      URL.revokeObjectURL(updated[index].preview);
    }
    updated.splice(index, 1);
    onChange(updated);
  }, [value, onChange]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${uploading ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700">
          {uploading ? 'Uploading...' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {ACCEPTED_TYPES.map(t => t.split('/')[1]?.toUpperCase()).join(', ')} — Max {Math.round(MAX_SIZE / (1024 * 1024))}MB each — Up to {MAX_FILES} files
        </p>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* File Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {value.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 group"
            >
              {/* Thumbnail / Icon */}
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.originalName}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
              )}
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
              </div>
              {/* Remove */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
