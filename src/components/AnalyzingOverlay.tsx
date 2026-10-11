import React, { useEffect, useState } from 'react';
import { Sparkles, Car, Scan, X, AlertCircle } from 'lucide-react';

interface AnalyzingOverlayProps {
  imagePreviewUrl: string;
  onCancel?: () => void;
}

const SCAN_STEPS = [
  'Ingesting parking lot image...',
  'Mapping road markings, parking bay lines & boundaries...',
  'Executing computer vision object detection for vehicles...',
  'Classifying vehicles (Sedans, SUVs, Pickups, Vans)...',
  'Evaluating vacant bays and accessible/reserved stalls...',
  'Computing lot utilization rates & summary statistics...',
];

export const AnalyzingOverlay: React.FC<AnalyzingOverlayProps> = ({
  imagePreviewUrl,
  onCancel,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % SCAN_STEPS.length);
    }, 1600);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 92 ? prev + 3 : prev));
    }, 300);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl py-6 px-4">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-8">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Scan className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Analyzing Parking Lot Occupancy
              </h3>
              <p className="text-xs text-slate-400">
                AI Vision model scanning stalls and classifying vehicles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Scanning {progress}%</span>
            </div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title="Cancel scan"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Image Preview with Cyber Scan Line */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
          {imagePreviewUrl && !imgError ? (
            <img
              src={imagePreviewUrl}
              alt="Scanning Lot"
              onError={() => setImgError(true)}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 space-y-3 p-8">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-pulse">
                <Car className="h-6 w-6" />
              </div>
              <p className="text-xs font-mono text-slate-400">Processing input parking image frame...</p>
            </div>
          )}

          {/* Animated scan beam */}
          <div
            className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981]"
            style={{
              top: `${(stepIndex * 18 + 10) % 90}%`,
              transition: 'top 1.2s ease-in-out',
            }}
          />

          {/* HUD Target reticle */}
          <div className="pointer-events-none absolute inset-6 border border-emerald-500/20 rounded-lg flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 px-5 py-3 shadow-2xl max-w-sm text-center">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Car className="h-4 w-4 animate-bounce" />
                <span>AI Computer Vision Engine</span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                {SCAN_STEPS[stepIndex]}
              </p>
            </div>
          </div>
        </div>

        {/* Pipeline Step Indicators */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SCAN_STEPS.slice(0, 3).map((step, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-2.5 text-xs border transition-all ${
                idx <= stepIndex
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                  : 'border-slate-800 bg-slate-950/40 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium">
                <span className="font-mono text-[10px] text-slate-400">
                  0{idx + 1}.
                </span>
                <span className="truncate">{step.split(' ')[0]} {step.split(' ')[1]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

