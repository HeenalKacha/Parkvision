import { ParkingSpaceStatus } from '../types/parking';

export interface StatusConfig {
  label: string;
  shortLabel: string;
  stroke: string;
  fill: string;
  text: string;
  bgLight: string;
  borderLight: string;
  badgeBg: string;
  badgeText: string;
}

export const STATUS_CONFIG: Record<ParkingSpaceStatus, StatusConfig> = {
  vacant: {
    label: 'Vacant (Available)',
    shortLabel: 'Vacant',
    stroke: '#10b981', // emerald-500
    fill: 'rgba(16, 185, 129, 0.22)',
    text: '#34d399',
    bgLight: 'bg-emerald-950/60',
    borderLight: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
  },
  occupied: {
    label: 'Occupied',
    shortLabel: 'Occupied',
    stroke: '#f43f5e', // rose-500
    fill: 'rgba(244, 63, 94, 0.22)',
    text: '#fb7185',
    bgLight: 'bg-rose-950/60',
    borderLight: 'border-rose-500/40',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
  },
  handicap_vacant: {
    label: 'Accessible (Vacant)',
    shortLabel: 'Accessible Empty',
    stroke: '#0284c7', // sky-600
    fill: 'rgba(2, 132, 199, 0.25)',
    text: '#38bdf8',
    bgLight: 'bg-sky-950/60',
    borderLight: 'border-sky-500/40',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-300',
  },
  handicap_occupied: {
    label: 'Accessible (Occupied)',
    shortLabel: 'Accessible Taken',
    stroke: '#6366f1', // indigo-500
    fill: 'rgba(99, 102, 241, 0.22)',
    text: '#a5b4fc',
    bgLight: 'bg-indigo-950/60',
    borderLight: 'border-indigo-500/40',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
  },
  reserved: {
    label: 'Reserved / Staff',
    shortLabel: 'Reserved',
    stroke: '#eab308', // amber-500
    fill: 'rgba(234, 179, 8, 0.22)',
    text: '#fde047',
    bgLight: 'bg-amber-950/60',
    borderLight: 'border-amber-500/40',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
  },
};

export function getStatusConfig(status: ParkingSpaceStatus): StatusConfig {
  return STATUS_CONFIG[status] || STATUS_CONFIG.occupied;
}
