import React, { useState } from 'react';
import {
  Search,
  Filter,
  Check,
  X,
  Trash2,
  Car,
  CheckCircle2,
  AlertCircle,
  Accessibility,
  ArrowUpDown,
} from 'lucide-react';
import { ParkingSpace, ParkingSpaceStatus } from '../types/parking';
import { getStatusConfig } from '../utils/colors';

interface SpacesListProps {
  spaces: ParkingSpace[];
  selectedSpaceId: string | null;
  onSelectSpace: (id: string | null) => void;
  onUpdateSpace: (updated: ParkingSpace) => void;
  onDeleteSpace: (id: string) => void;
}

export const SpacesList: React.FC<SpacesListProps> = ({
  spaces,
  selectedSpaceId,
  onSelectSpace,
  onUpdateSpace,
  onDeleteSpace,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ParkingSpaceStatus>('all');
  const [sortBy, setSortBy] = useState<'number' | 'status' | 'confidence'>('number');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSlotNumber, setEditSlotNumber] = useState('');
  const [editVehicleInfo, setEditVehicleInfo] = useState('');

  // Filtering
  const filtered = spaces.filter((space) => {
    const matchesSearch =
      space.slotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (space.vehicleInfo && space.vehicleInfo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      space.status.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      space.status === statusFilter ||
      (statusFilter === 'handicap_vacant' &&
        (space.status === 'handicap_vacant' || space.status === 'handicap_occupied'));

    return matchesSearch && matchesStatus;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'confidence') {
      return b.confidence - a.confidence;
    }
    if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    // Natural number sort
    const numA = parseInt(a.slotNumber.replace(/\D/g, '') || '0', 10);
    const numB = parseInt(b.slotNumber.replace(/\D/g, '') || '0', 10);
    return numA - numB;
  });

  const handleStartEdit = (space: ParkingSpace) => {
    setEditingId(space.id);
    setEditSlotNumber(space.slotNumber);
    setEditVehicleInfo(space.vehicleInfo || '');
  };

  const handleSaveEdit = (space: ParkingSpace) => {
    onUpdateSpace({
      ...space,
      slotNumber: editSlotNumber || space.slotNumber,
      vehicleInfo: editVehicleInfo.trim() || null,
    });
    setEditingId(null);
  };

  const handleToggleStatus = (space: ParkingSpace) => {
    const newStatus: ParkingSpaceStatus =
      space.status === 'vacant'
        ? 'occupied'
        : space.status === 'occupied'
        ? 'vacant'
        : space.status === 'handicap_vacant'
        ? 'handicap_occupied'
        : 'vacant';

    onUpdateSpace({
      ...space,
      status: newStatus,
      vehicleInfo: newStatus === 'vacant' ? null : space.vehicleInfo || 'Vehicle',
    });
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl">
      {/* Header and Search */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white">Parking Spaces Directory</h3>
          <p className="text-xs text-slate-400">
            Showing {sorted.length} of {spaces.length} detected stalls
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search slot or vehicle..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Sort bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-md px-2 py-1 ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('vacant')}
            className={`rounded-md px-2 py-1 ${
              statusFilter === 'vacant'
                ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                : 'text-emerald-400/70 hover:text-emerald-300'
            }`}
          >
            Vacant
          </button>
          <button
            onClick={() => setStatusFilter('occupied')}
            className={`rounded-md px-2 py-1 ${
              statusFilter === 'occupied'
                ? 'bg-rose-500/20 text-rose-300 font-medium'
                : 'text-rose-400/70 hover:text-rose-300'
            }`}
          >
            Occupied
          </button>
          <button
            onClick={() => setStatusFilter('handicap_vacant')}
            className={`rounded-md px-2 py-1 ${
              statusFilter === 'handicap_vacant'
                ? 'bg-sky-500/20 text-sky-300 font-medium'
                : 'text-sky-400/70 hover:text-sky-300'
            }`}
          >
            Accessible
          </button>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1 text-slate-400">
          <ArrowUpDown className="h-3 w-3" />
          <span className="text-[11px]">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded bg-slate-950 border border-slate-800 px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none"
          >
            <option value="number">Slot #</option>
            <option value="status">Status</option>
            <option value="confidence">Confidence</option>
          </select>
        </div>
      </div>

      {/* List Container with Scroll */}
      <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {sorted.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No parking spaces match the selected filter.
          </div>
        ) : (
          sorted.map((space) => {
            const isSelected = space.id === selectedSpaceId;
            const config = getStatusConfig(space.status);
            const isEditing = editingId === space.id;

            return (
              <div
                key={space.id}
                onClick={() => onSelectSpace(space.id)}
                className={`group relative rounded-xl border p-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/80 bg-slate-800/90 shadow-md ring-1 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                {isEditing ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="space-y-2 text-xs"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editSlotNumber}
                        onChange={(e) => setEditSlotNumber(e.target.value)}
                        placeholder="Slot Number (e.g. A-1)"
                        className="w-1/2 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                      />
                      <input
                        type="text"
                        value={editVehicleInfo}
                        onChange={(e) => setEditVehicleInfo(e.target.value)}
                        placeholder="Vehicle info (or empty)"
                        className="w-1/2 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded px-2 py-1 text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(space)}
                        className="rounded bg-emerald-500 px-2.5 py-1 font-semibold text-slate-950 hover:bg-emerald-400"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Slot & Status */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold"
                        style={{
                          borderColor: config.stroke,
                          backgroundColor: config.fill,
                          color: config.text,
                        }}
                      >
                        {space.slotNumber.replace(/[^0-9]/g, '') || '#'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs truncate">
                            {space.slotNumber}
                          </span>
                          <span
                            className="rounded px-1.5 py-0.2 text-[10px] font-semibold uppercase shrink-0"
                            style={{
                              backgroundColor: config.fill,
                              color: config.text,
                            }}
                          >
                            {config.shortLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {space.vehicleInfo ? (
                            <span className="text-slate-300">{space.vehicleInfo}</span>
                          ) : (
                            <span className="text-emerald-400/80">Available Spot</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Right: Quick Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(space);
                        }}
                        className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                          space.status === 'vacant'
                            ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                        }`}
                        title="Click to quickly toggle between vacant and occupied"
                      >
                        {space.status === 'vacant' ? 'Occupy' : 'Free'}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(space);
                        }}
                        className="rounded p-1 text-slate-500 hover:text-slate-300 opacity-60 group-hover:opacity-100 transition-opacity"
                        title="Edit slot details"
                      >
                        <span className="text-[11px]">Edit</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSpace(space.id);
                        }}
                        className="rounded p-1 text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                        title="Delete space"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
