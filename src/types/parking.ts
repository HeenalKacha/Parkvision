export type ParkingSpaceStatus =
  | 'vacant'
  | 'occupied'
  | 'reserved'
  | 'handicap_vacant'
  | 'handicap_occupied';

export interface ParkingSpace {
  id: string;
  slotNumber: string;
  status: ParkingSpaceStatus;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 scale
  confidence: number;
  vehicleInfo?: string | null;
  notes?: string;
}

export interface LotSummary {
  totalSpaces: number;
  vacantSpaces: number;
  occupiedSpaces: number;
  accessibleSpaces: number;
  reservedSpaces: number;
  occupancyRate: number; // 0-100
}

export interface LotOverview {
  description: string;
  lotType: string;
  lightingWeather: string;
  cameraAngle: string;
  confidenceLevel?: string;
}

export interface DetectionResult {
  id: string;
  timestamp: string;
  imageUrl: string;
  imageDimensions?: { width: number; height: number };
  processingTimeMs: number;
  overview: LotOverview;
  summary: LotSummary;
  spaces: ParkingSpace[];
}

export interface SampleImage {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  tag: string;
}

export type ViewFilter = 'all' | 'vacant' | 'occupied' | 'accessible';
