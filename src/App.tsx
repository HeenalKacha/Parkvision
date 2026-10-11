import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { ImageUploader } from './components/ImageUploader';
import { ParkingCanvas } from './components/ParkingCanvas';
import { OccupancyDashboard } from './components/OccupancyDashboard';
import { SpacesList } from './components/SpacesList';
import { AnalyzingOverlay } from './components/AnalyzingOverlay';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { ExportModal } from './components/ExportModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import {
  DetectionResult,
  ParkingSpace,
  ViewFilter,
} from './types/parking';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'parkvision_recent_scans';

export default function App() {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPreviewUrl, setLoadingPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [history, setHistory] = useState<DetectionResult[]>([]);

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Strip any old entries that have huge imageUrl stored
        const sanitized = parsed.map((item: DetectionResult) => ({
          ...item,
          imageUrl: item.imageUrl?.startsWith('data:') ? '' : (item.imageUrl || ''),
        }));
        setHistory(sanitized);
      }
    } catch (e) {
      console.warn('Failed to read history from localStorage, clearing.', e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const saveToHistory = (newResult: DetectionResult) => {
    try {
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.id !== newResult.id);
        // Strip imageUrl (base64) before persisting — it can be multiple MB
        const toStore = [newResult, ...filtered].slice(0, 5).map((item) => ({
          ...item,
          imageUrl: '', // do NOT store large base64 in localStorage
        }));
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toStore));
        } catch (storageErr) {
          // If still too big, clear and try with just the newest entry
          console.warn('localStorage full, clearing history.', storageErr);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([toStore[0]]));
          } catch (_) {
            // Give up silently — history just won't persist this session
          }
        }
        // Keep the full result (with imageUrl) in React state for the current session
        return [newResult, ...filtered].slice(0, 5);
      });
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear localStorage', e);
    }
  };

  const [lastSelectedImage, setLastSelectedImage] = useState<{
    base64: string;
    mimeType: string;
    filename?: string;
  } | null>(null);

  const handleImageSelected = async (
    base64Data: string,
    mimeType: string,
    filename?: string
  ) => {
    setErrorMessage(null);
    setLastSelectedImage({ base64: base64Data, mimeType, filename });
    setLoadingPreviewUrl(base64Data);
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/detect-parking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
          mimeType,
        }),
        signal: controller.signal,
      });

      let responseData: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        responseData = await res.json();
      } else {
        const errorText = await res.text();
        throw new Error(errorText || `Server responded with status ${res.status}`);
      }

      if (!res.ok || !responseData.success) {
        throw new Error(
          responseData.error || 'Server failed to analyze parking occupancy.'
        );
      }

      const detectedResult: DetectionResult = {
        ...responseData.data,
        imageUrl: base64Data,
      };

      setResult(detectedResult);
      setSelectedSpaceId(null);
      saveToHistory(detectedResult);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Detection request was aborted by user.');
        return;
      }
      console.error('Detection request failed:', err);
      setErrorMessage(
        err.message || 'An error occurred while analyzing the parking photo.'
      );
    } finally {
      setIsLoading(false);
      setLoadingPreviewUrl(null);
    }
  };

  // Recompute summary when spaces are updated / added / deleted
  const recalculateSummary = (spaces: ParkingSpace[]) => {
    const total = spaces.length;
    const occupied = spaces.filter(
      (s) => s.status === 'occupied' || s.status === 'handicap_occupied'
    ).length;
    const vacant = spaces.filter(
      (s) => s.status === 'vacant' || s.status === 'handicap_vacant'
    ).length;
    const accessible = spaces.filter(
      (s) => s.status === 'handicap_vacant' || s.status === 'handicap_occupied'
    ).length;
    const reserved = spaces.filter((s) => s.status === 'reserved').length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 1000) / 10 : 0;

    return {
      totalSpaces: total,
      vacantSpaces: vacant,
      occupiedSpaces: occupied,
      accessibleSpaces: accessible,
      reservedSpaces: reserved,
      occupancyRate,
    };
  };

  const handleUpdateSpace = (updatedSpace: ParkingSpace) => {
    if (!result) return;
    const nextSpaces = result.spaces.map((s) =>
      s.id === updatedSpace.id ? updatedSpace : s
    );
    const updatedResult: DetectionResult = {
      ...result,
      spaces: nextSpaces,
      summary: recalculateSummary(nextSpaces),
    };
    setResult(updatedResult);
    saveToHistory(updatedResult);
  };

  const handleDeleteSpace = (idToDelete: string) => {
    if (!result) return;
    const nextSpaces = result.spaces.filter((s) => s.id !== idToDelete);
    const updatedResult: DetectionResult = {
      ...result,
      spaces: nextSpaces,
      summary: recalculateSummary(nextSpaces),
    };
    setResult(updatedResult);
    if (selectedSpaceId === idToDelete) {
      setSelectedSpaceId(null);
    }
    saveToHistory(updatedResult);
  };

  const handleAddSpace = (newSpace: ParkingSpace) => {
    if (!result) return;
    const nextSpaces = [...result.spaces, newSpace];
    const updatedResult: DetectionResult = {
      ...result,
      spaces: nextSpaces,
      summary: recalculateSummary(nextSpaces),
    };
    setResult(updatedResult);
    setSelectedSpaceId(newSpace.id);
    saveToHistory(updatedResult);
  };

  const handleReset = () => {
    setResult(null);
    setSelectedSpaceId(null);
    setErrorMessage(null);
  };

  const handleCancelScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setLoadingPreviewUrl(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 text-gray-900 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-700">
      {/* Top Navigation */}
      <Navbar
        onNewUpload={handleReset}
        onOpenCamera={() => setIsCameraOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onReset={handleReset}
        hasResult={!!result}
        result={result}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                <p className="text-xs sm:text-sm font-medium">{errorMessage}</p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {lastSelectedImage && (
                  <button
                    onClick={() =>
                      handleImageSelected(
                        lastSelectedImage.base64,
                        lastSelectedImage.mimeType,
                        lastSelectedImage.filename
                      )
                    }
                    className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry Analysis</span>
                  </button>
                )}
                <button
                  onClick={() => setErrorMessage(null)}
                  className="rounded px-2 py-1 text-xs text-rose-300/80 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Scanning State */}
        {isLoading ? (
          <AnalyzingOverlay
            imagePreviewUrl={loadingPreviewUrl || ''}
            onCancel={handleCancelScan}
          />
        ) : !result ? (
          /* Empty / Upload State */
          <ImageUploader
            onImageSelected={handleImageSelected}
            onOpenCamera={() => setIsCameraOpen(true)}
            isLoading={isLoading}
          />
        ) : (
          /* Analysis Results Workspace */
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
            {/* High-Level Occupancy Status Banner */}
            <OccupancyDashboard
              summary={result.summary}
              overview={result.overview}
              processingTimeMs={result.processingTimeMs}
            />

            {/* Split Screen Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive Image Canvas (7 or 8 columns on large screens) */}
              <div className="lg:col-span-7 xl:col-span-8">
                <ParkingCanvas
                  imageUrl={result.imageUrl}
                  spaces={result.spaces}
                  selectedSpaceId={selectedSpaceId}
                  onSelectSpace={setSelectedSpaceId}
                  onUpdateSpace={handleUpdateSpace}
                  onDeleteSpace={handleDeleteSpace}
                  onAddSpace={handleAddSpace}
                  viewFilter={viewFilter}
                  setViewFilter={setViewFilter}
                />
              </div>

              {/* Right Column: Spaces Directory & Inspector (5 or 4 columns) */}
              <div className="lg:col-span-5 xl:col-span-4">
                <SpacesList
                  spaces={result.spaces}
                  selectedSpaceId={selectedSpaceId}
                  onSelectSpace={setSelectedSpaceId}
                  onUpdateSpace={handleUpdateSpace}
                  onDeleteSpace={handleDeleteSpace}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80 py-4 text-center text-xs text-gray-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 ParkVision · AI Computer Vision Parking Guidance System</p>
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span>Normalized Bounding Box 2D</span>
            <span>·</span>
            <span>Gemini Vision</span>
            <span>·</span>
            <span>Zero Server State</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleImageSelected}
      />

      {result && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          result={result}
        />
      )}

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectResult={(selected) => {
          setResult(selected);
          setSelectedSpaceId(null);
        }}
        onClearHistory={clearHistory}
      />
    </div>
  );
}
