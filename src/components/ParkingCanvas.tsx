import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Sliders,
  PlusCircle,
  Check,
  X,
  Trash2,
  Edit2,
  Layers,
  Car,
  Compass,
} from 'lucide-react';
import { ParkingSpace, ParkingSpaceStatus, ViewFilter } from '../types/parking';
import { getStatusConfig } from '../utils/colors';

interface ParkingCanvasProps {
  imageUrl: string;
  spaces: ParkingSpace[];
  selectedSpaceId: string | null;
  onSelectSpace: (id: string | null) => void;
  onUpdateSpace: (updated: ParkingSpace) => void;
  onDeleteSpace: (id: string) => void;
  onAddSpace: (newSpace: ParkingSpace) => void;
  viewFilter: ViewFilter;
  setViewFilter: (filter: ViewFilter) => void;
}

export const ParkingCanvas: React.FC<ParkingCanvasProps> = ({
  imageUrl,
  spaces,
  selectedSpaceId,
  onSelectSpace,
  onUpdateSpace,
  onDeleteSpace,
  onAddSpace,
  viewFilter,
  setViewFilter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [boxFillOpacity, setBoxFillOpacity] = useState(0.25);
  const [isAddingMode, setIsAddingMode] = useState(false);

  // Drag-to-add new spot state
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // Handle image load to capture exact aspect ratio
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.3, 0.8));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Filter spaces based on active viewFilter
  const filteredSpaces = spaces.filter((space) => {
    if (viewFilter === 'all') return true;
    if (viewFilter === 'vacant') {
      return space.status === 'vacant' || space.status === 'handicap_vacant';
    }
    if (viewFilter === 'occupied') {
      return space.status === 'occupied' || space.status === 'handicap_occupied';
    }
    if (viewFilter === 'accessible') {
      return space.status === 'handicap_vacant' || space.status === 'handicap_occupied';
    }
    return true;
  });

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId);

  // SVG coordinate conversions for drag-to-add
  const getSvgCoordinates = (e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = Math.max(0, Math.min(1000, ((e.clientX - rect.left) / rect.width) * 1000));
    const y = Math.max(0, Math.min(1000, ((e.clientY - rect.top) / rect.height) * 1000));
    return { x: Math.round(x), y: Math.round(y) };
  };

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isAddingMode) {
      const coords = getSvgCoordinates(e);
      setDragStart(coords);
      setDragCurrent(coords);
    } else if (zoom > 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isAddingMode && dragStart) {
      const coords = getSvgCoordinates(e);
      setDragCurrent(coords);
    } else if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleSvgMouseUp = () => {
    if (isAddingMode && dragStart && dragCurrent) {
      const ymin = Math.min(dragStart.y, dragCurrent.y);
      const ymax = Math.max(dragStart.y, dragCurrent.y);
      const xmin = Math.min(dragStart.x, dragCurrent.x);
      const xmax = Math.max(dragStart.x, dragCurrent.x);

      // Only add if user dragged an actual rectangle (>15px on each side)
      if (xmax - xmin > 15 && ymax - ymin > 15) {
        const nextNumber = spaces.length + 1;
        const newSpace: ParkingSpace = {
          id: `spot-custom-${Date.now()}`,
          slotNumber: `Slot ${nextNumber}`,
          status: 'vacant',
          box2d: [ymin, xmin, ymax, xmax],
          confidence: 1.0,
          vehicleInfo: null,
          notes: 'User defined space',
        };
        onAddSpace(newSpace);
        onSelectSpace(newSpace.id);
      }
      setDragStart(null);
      setDragCurrent(null);
      setIsAddingMode(false);
    }
    if (isPanning) {
      setIsPanning(false);
    }
  };

  const toggleSelectedStatus = () => {
    if (!selectedSpace) return;
    const nextStatus: ParkingSpaceStatus =
      selectedSpace.status === 'vacant'
        ? 'occupied'
        : selectedSpace.status === 'occupied'
        ? 'vacant'
        : selectedSpace.status === 'handicap_vacant'
        ? 'handicap_occupied'
        : 'vacant';

    onUpdateSpace({
      ...selectedSpace,
      status: nextStatus,
      vehicleInfo: nextStatus === 'vacant' ? null : selectedSpace.vehicleInfo || 'Vehicle',
    });
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl">
      {/* Visualizer Header Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        {/* Filter controls */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-950/80 p-1 border border-slate-800">
          <button
            onClick={() => setViewFilter('all')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              viewFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({spaces.length})
          </button>
          <button
            onClick={() => setViewFilter('vacant')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              viewFilter === 'vacant'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Vacant Only
          </button>
          <button
            onClick={() => setViewFilter('occupied')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              viewFilter === 'occupied'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-rose-400/80 hover:text-rose-300'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
            Occupied Only
          </button>
          <button
            onClick={() => setViewFilter('accessible')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              viewFilter === 'accessible'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-sky-400/80 hover:text-sky-300'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
            Accessible
          </button>
        </div>

        {/* Display Toggles & Tools */}
        <div className="flex items-center gap-2">
          {/* Add custom space button */}
          <button
            onClick={() => setIsAddingMode(!isAddingMode)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              isAddingMode
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
            title="Click and drag on the photo to map a missed parking space"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{isAddingMode ? 'Cancel Drawing' : 'Draw Space'}</span>
          </button>

          {/* Toggle Labels */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              showLabels
                ? 'border-slate-700 bg-slate-800 text-slate-200'
                : 'border-slate-800 bg-slate-900 text-slate-500'
            }`}
            title="Toggle parking space numbers and occupancy labels"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Labels</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950/80 p-0.5">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.8}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-1 text-[11px] font-mono text-slate-400 w-9 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            {zoom !== 1 && (
              <button
                onClick={handleResetZoom}
                className="p-1 text-slate-400 hover:text-emerald-400 border-l border-slate-800"
                title="Reset Zoom"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Adding Mode Banner */}
      {isAddingMode && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-300">
          <span>Click and drag across the parking bay to create a custom slot.</span>
          <button
            onClick={() => setIsAddingMode(false)}
            className="text-emerald-400 hover:text-emerald-200 underline font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Interactive Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center min-h-[350px] max-h-[700px] select-none"
        style={{
          cursor: isAddingMode ? 'crosshair' : zoom > 1 ? 'grab' : 'default',
        }}
      >
        <div
          className="relative transition-transform duration-75 origin-center max-w-full max-h-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
          }}
        >
          {/* Base Image */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Parking Lot Analysis"
            onLoad={handleImageLoad}
            className="block max-h-[680px] w-auto max-w-full object-contain pointer-events-none"
          />

          {/* SVG Overlay */}
          <svg
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            onMouseDown={handleSvgMouseDown}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onMouseLeave={() => {
              if (isPanning) setIsPanning(false);
              setHoveredSpaceId(null);
            }}
          >
            {/* Draw active parking spots */}
            {filteredSpaces.map((space) => {
              const [ymin, xmin, ymax, xmax] = space.box2d;
              const x = xmin;
              const y = ymin;
              const width = Math.max(1, xmax - xmin);
              const height = Math.max(1, ymax - ymin);

              const isSelected = space.id === selectedSpaceId;
              const isHovered = space.id === hoveredSpaceId;
              const config = getStatusConfig(space.status);
              const isVacant = space.status === 'vacant' || space.status === 'handicap_vacant';

              return (
                <g
                  key={space.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAddingMode) {
                      onSelectSpace(space.id);
                    }
                  }}
                  onMouseEnter={() => setHoveredSpaceId(space.id)}
                  onMouseLeave={() => setHoveredSpaceId(null)}
                >
                  {/* Subtle pulsing background for vacant spots if vacant-focused */}
                  {isVacant && viewFilter === 'vacant' && (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill="rgba(16, 185, 129, 0.35)"
                      className="animate-pulse"
                    />
                  )}

                  {/* Bounding box fill */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={config.stroke}
                    fillOpacity={
                      isSelected
                        ? Math.min(0.55, boxFillOpacity + 0.25)
                        : isHovered
                        ? Math.min(0.45, boxFillOpacity + 0.15)
                        : boxFillOpacity
                    }
                    stroke={isSelected ? '#ffffff' : config.stroke}
                    strokeWidth={isSelected ? 4 : isHovered ? 3 : 2}
                    strokeDasharray={space.status === 'reserved' ? '6,3' : undefined}
                    rx={4}
                  />

                  {/* Slot Label Badge */}
                  {showLabels && (
                    <g transform={`translate(${x + 4}, ${y + 4})`}>
                      <rect
                        x={0}
                        y={0}
                        width={Math.min(width - 8, 140)}
                        height={24}
                        rx={3}
                        fill="rgba(15, 23, 42, 0.88)"
                        stroke={config.stroke}
                        strokeWidth={1}
                      />
                      <text
                        x={6}
                        y={16}
                        fill="#ffffff"
                        fontSize={13}
                        fontWeight="600"
                        fontFamily="sans-serif"
                      >
                        {space.slotNumber}
                      </text>
                      {/* Status indicator dot */}
                      <circle
                        cx={Math.min(width - 8, 140) - 10}
                        cy={12}
                        r={4}
                        fill={config.stroke}
                      />
                    </g>
                  )}
                </g>
              );
            })}

            {/* In-progress drawing preview when in add mode */}
            {isAddingMode && dragStart && dragCurrent && (
              <rect
                x={Math.min(dragStart.x, dragCurrent.x)}
                y={Math.min(dragStart.y, dragCurrent.y)}
                width={Math.abs(dragCurrent.x - dragStart.x)}
                height={Math.abs(dragCurrent.y - dragStart.y)}
                fill="rgba(16, 185, 129, 0.3)"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="4,4"
              />
            )}
          </svg>
        </div>

        {/* Hover info tooltip floating */}
        {hoveredSpaceId && (
          (() => {
            const hovered = spaces.find((s) => s.id === hoveredSpaceId);
            if (!hovered) return null;
            const config = getStatusConfig(hovered.status);
            return (
              <div className="absolute top-4 left-4 z-20 pointer-events-none rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-md px-3 py-2 text-xs shadow-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: config.stroke }}
                  ></span>
                  <span className="font-bold text-white">{hovered.slotNumber}</span>
                  <span className="text-slate-400">·</span>
                  <span style={{ color: config.text }} className="font-medium">
                    {config.label}
                  </span>
                </div>
                {hovered.vehicleInfo && (
                  <p className="mt-1 text-slate-300 font-mono text-[11px]">
                    Vehicle: {hovered.vehicleInfo}
                  </p>
                )}
                <p className="text-[10px] text-slate-400">
                  Confidence: {Math.round(hovered.confidence * 100)}%
                </p>
              </div>
            );
          })()
        )}
      </div>

      {/* Selected Space Quick Inspector Tray */}
      {selectedSpace && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/80 bg-slate-950/90 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg border font-bold text-xs"
              style={{
                borderColor: getStatusConfig(selectedSpace.status).stroke,
                color: getStatusConfig(selectedSpace.status).text,
                backgroundColor: getStatusConfig(selectedSpace.status).fill,
              }}
            >
              {selectedSpace.slotNumber.replace(/[^0-9]/g, '') || '#'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">{selectedSpace.slotNumber}</h4>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                  style={{
                    backgroundColor: getStatusConfig(selectedSpace.status).fill,
                    color: getStatusConfig(selectedSpace.status).text,
                  }}
                >
                  {getStatusConfig(selectedSpace.status).shortLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {selectedSpace.vehicleInfo
                  ? `Vehicle: ${selectedSpace.vehicleInfo}`
                  : 'Empty parking space ready for arrival'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectedStatus}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <span>Toggle:</span>
              <span className="font-semibold text-emerald-400">
                {selectedSpace.status === 'vacant' ? 'Mark Occupied' : 'Mark Vacant'}
              </span>
            </button>

            <button
              onClick={() => onDeleteSpace(selectedSpace.id)}
              className="flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20 transition-colors"
              title="Remove this slot detection"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              onClick={() => onSelectSpace(null)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
