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
  let statusColor = 'text-emerald-600';
  let statusBg = 'bg-emerald-50 border-emerald-200';
  let statusText = 'Optimal Availability';
  let recommendation = 'Plenty of vacant bays available for approaching vehicles.';

  if (occupancyRate >= 90) {
    statusColor = 'text-rose-600';
    statusBg = 'bg-rose-50 border-rose-200';
    statusText = 'Lot Full / High Congestion';
    recommendation = 'Near maximum capacity. Direct incoming drivers to alternate lots.';
  } else if (occupancyRate >= 70) {
    statusColor = 'text-amber-600';
    statusBg = 'bg-amber-50 border-amber-200';
    statusText = 'Heavy Occupancy';
    recommendation = 'Limited parking bays remaining in secondary sections.';
  } else if (occupancyRate >= 40) {
    statusColor = 'text-teal-600';
    statusBg = 'bg-teal-50 border-teal-200';
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
            <p className="text-xs text-gray-600 max-w-lg">{recommendation}</p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-gray-900">
                {occupancyRate}%
              </div>
              <div className="text-[11px] text-gray-500">Total Utilization</div>
            </div>

            {/* Circular Gauge */}
            <div className="relative h-14 w-14 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
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
              <Car className="absolute h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 border border-gray-300">
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
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-600">
            <span className="text-xs font-medium">Total Spaces</span>
            <Car className="h-4 w-4 text-gray-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-gray-900">{totalSpaces}</div>
          <div className="mt-0.5 text-[11px] text-gray-500">Detected bays</div>
        </div>

        {/* Vacant Spaces (Highlighted) */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-semibold">Vacant Bays</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600">
            {vacantSpaces}
          </div>
          <div className="mt-0.5 text-[11px] text-emerald-600/80 font-medium">
            {totalSpaces > 0 ? Math.round((vacantSpaces / totalSpaces) * 100) : 0}% available
          </div>
        </div>

        {/* Occupied Spaces */}
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-semibold">Occupied Bays</span>
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600">
            {occupiedSpaces}
          </div>
          <div className="mt-0.5 text-[11px] text-rose-600/80 font-medium">
            {totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0}% taken
          </div>
        </div>

        {/* Accessible / Reserved */}
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-xs font-medium">Accessible</span>
            <Accessibility className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-sky-600">
            {accessibleSpaces}
          </div>
          <div className="mt-0.5 text-[11px] text-gray-500">
            {reservedSpaces > 0 ? `+ ${reservedSpaces} reserved` : 'Designated bays'}
          </div>
        </div>
      </div>

      {/* Lot Intelligence & Environmental Context Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 text-xs shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-2">Parking Lot Environment</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              <strong className="text-gray-900">Type:</strong> {overview.lotType || 'Surface Lot'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span className="truncate">
              <strong className="text-gray-900">Angle:</strong> {overview.cameraAngle || 'Oblique'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CloudSun className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="truncate">
              <strong className="text-gray-900">Lighting:</strong> {overview.lightingWeather || 'Daylight'}
            </span>
          </div>
        </div>

        {processingTimeMs && (
          <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-[11px] text-gray-500">
            <span>Detection Latency: {(processingTimeMs / 1000).toFixed(2)}s</span>
            <span>Vision Engine: Gemini 3.8 Flash</span>
          </div>
        )}
      </div>
    </div>
  );
};
