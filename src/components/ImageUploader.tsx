import React, { useRef, useState, useEffect } from 'react';
import {
  Upload,
  Camera,
  CheckCircle2,
  Car,
  Sparkles,
} from 'lucide-react';
interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string, filename?: string) => void;
  onOpenCamera: () => void;
  isLoading: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  onOpenCamera,
  isLoading,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for paste event anywhere in window
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      // Optimize large photos to max 1600px for speed and reliability
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.88);
            onImageSelected(optimizedBase64, 'image/jpeg', file.name);
            return;
          }
        }
        onImageSelected(result, file.type, file.name);
      };
      img.onerror = () => {
        onImageSelected(result, file.type, file.name);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6">
      {/* Hero Intro */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Real-Time Computer Vision Space Analyzer</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Detect Parking Spaces & Vehicle Occupancy
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-slate-400">
          Upload any parking lot photo, aerial view, or surveillance still. Our AI automatically maps every parking bay, classifies cars, and calculates real-time occupancy.
        </p>
      </div>

      {uploadError && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 text-center">
          {uploadError}
        </div>
      )}

      {/* Main Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 ${
          isDragging
            ? 'border-emerald-400 bg-emerald-950/20 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
        } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700/80 text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
          <Upload className="h-8 w-8" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-white">
          Drop parking lot photo here, or <span className="text-emerald-400 underline underline-offset-4">browse</span>
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Supports JPEG, PNG, WEBP, HEIC up to 25MB
        </p>

        {/* Quick actions inside upload card */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCamera();
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Camera className="h-4 w-4 text-emerald-400" />
            <span>Capture with Camera</span>
          </button>
        </div>
      </div>

      {/* Feature guidance badges */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800/80 pt-8 text-slate-400">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">Per-Slot Coordinates</h4>
            <p className="mt-0.5 text-xs text-slate-500">
              Precise 2D bounding boxes enclose every vacant bay and parked vehicle.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Car className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">Vehicle Classification</h4>
            <p className="mt-0.5 text-xs text-slate-500">
              Identifies car types, colors, and separates accessible / reserved zones.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">Interactive Editing & Export</h4>
            <p className="mt-0.5 text-xs text-slate-500">
              Toggle spots, adjust counts, and download full CSV, JSON, or annotated photos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
