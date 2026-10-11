import React from 'react';
import {
  Car,
  CheckCircle2,
  AlertCircle,
  Accessibility,
  BookmarkCheck,
  TrendingUp,
  CloudSun,
  Camera,
  MapPin,
  Clock,
} from 'lucide-react';
import { LotSummary, LotOverview } from '../types/parking';

interface OccupancyDashboardProps {
  summary: LotSummary;
  overview: LotOverview;
  processingTimeMs?: number;
}

export const OccupancyDashboard: React.FC<OccupancyDashboardProps> = ({
  summary,
  overview,
  processingTimeMs,
}) => {
  const {
    totalSpaces,
    vacantSpaces,
    occupiedSpaces,
    accessibleSpaces,
    reservedSpaces,
    occupancyRate,
  } = summary;

  // Compute status description and color
  let statusColor = 'text-emerald-400';
  let statusBg = 'bg-emerald-500/10 border-emerald-500/20';
  let statusText = 'Optimal Availability';
  let recommendation = 'Plenty of vacant bays available for approaching vehicles.';

  if (occupancyRate >= 90) {
    statusColor = 'text-rose-400';
    statusBg = 'bg-rose-500/10 border-rose-500/20';
    statusText = 'Lot Full / High Congestion';
    recommendation = 'Near maximum capacity. Direct incoming drivers to alternate lots.';
  } else if (occupancyRate >= 70) {
    statusColor = 'text-amber-400';
    statusBg = 'bg-amber-500/10 border-amber-500/20';
    statusText = 'Heavy Occupancy';
    recommendation = 'Limited parking bays remaining in secondary sections.';
  } else if (occupancyRate >= 40) {
    statusColor = 'text-teal-400';
    statusBg = 'bg-teal-500/10 border-teal-500/20';
    statusText = 'Moderate Utilization';
    recommendation = 'Comfortable capacity with accessible spaces distributed.';
  }

  return (
    <div className="space-y-4">
      {/* Real-Time Occupancy Rate Banner */}
      <div className={`rounded-2xl border p-4 sm:p-5 ${statusBg} backdrop-blur-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-current animate-pulse text-inherit"></span>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${statusColor}`}>
                {statusText}
              </h3>
            </div>
            <p className="text-xs text-slate-300 max-w-lg">{recommendation}</p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                {occupancyRate}%
              </div>
              <div className="text-[11px] text-slate-400">Total Utilization</div>
            </div>

            {/* Circular Gauge */}
            <div className="relative h-14 w-14 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    occupancyRate >= 85
                      ? 'text-rose-500'
                      : occupancyRate >= 60
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }
                  strokeDasharray={`${occupancyRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Car className="absolute h-5 w-5 text-slate-300" />
            </div>
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              occupancyRate >= 85
                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                : 'bg-gradient-to-r from-teal-500 to-emerald-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
          />
        </div>
      </div>

      {/* Grid of Key Quantitative Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Spaces */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Spaces</span>
            <Car className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">{totalSpaces}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">Detected bays</div>
        </div>

        {/* Vacant Spaces (Highlighted) */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 shadow-sm shadow-emerald-950/50">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold">Vacant Bays</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-300">
            {vacantSpaces}
          </div>
          <div className="mt-0.5 text-[11px] text-emerald-400/80 font-medium">
            {totalSpaces > 0 ? Math.round((vacantSpaces / totalSpaces) * 100) : 0}% available
          </div>
        </div>

        {/* Occupied Spaces */}
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-semibold">Occupied Bays</span>
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-300">
            {occupiedSpaces}
          </div>
          <div className="mt-0.5 text-[11px] text-rose-400/80 font-medium">
            {totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0}% taken
          </div>
        </div>

        {/* Accessible / Reserved */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-xs font-medium">Accessible</span>
            <Accessibility className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-sky-300">
            {accessibleSpaces}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            {reservedSpaces > 0 ? `+ ${reservedSpaces} reserved` : 'Designated bays'}
          </div>
        </div>
      </div>

      {/* Lot Intelligence & Environmental Context Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-xs">
        <h4 className="font-semibold text-slate-300 mb-2">Parking Lot Environment</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-slate-400">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              <strong className="text-slate-300">Type:</strong> {overview.lotType || 'Surface Lot'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="h-3.5 w-3.5 text-teal-400 shrink-0" />
            <span className="truncate">
              <strong className="text-slate-300">Angle:</strong> {overview.cameraAngle || 'Oblique'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CloudSun className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              <strong className="text-slate-300">Lighting:</strong> {overview.lightingWeather || 'Daylight'}
            </span>
          </div>
        </div>

        {processingTimeMs && (
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-500">
            <span>Detection Latency: {(processingTimeMs / 1000).toFixed(2)}s</span>
            <span>Vision Engine: Gemini 3.8 Flash</span>
          </div>
        )}
      </div>
    </div>
  );
};
