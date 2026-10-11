import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Enforce port 3000 as required in AI Studio runtime environment
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const SAMPLE_PARKING_IMAGES = [
  {
    id: 'sample-outdoor-lot',
    name: 'Commercial Surface Lot',
    description: 'Outdoor commercial shopping plaza parking with clear bay markings and mixed occupancy',
    category: 'Outdoor Surface',
    url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
    tag: 'Aerial / High Angle',
  },
  {
    id: 'sample-garage',
    name: 'Multi-Level Parking Deck',
    description: 'Indoor / multi-level structured parking with overhead pillars and marked bays',
    category: 'Indoor Structure',
    url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80',
    tag: 'Indoor Garage',
  },
  {
    id: 'sample-street-diagonal',
    name: 'Downtown Angle Parking',
    description: 'Street-level diagonal parking stalls with urban backdrop and sedan/SUV mix',
    category: 'Street Angle',
    url: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80',
    tag: 'Angled Street',
  },
];

app.get('/api/samples', (_req, res) => {
  res.json({ samples: SAMPLE_PARKING_IMAGES });
});

// Proxy sample image to prevent any client-side CORS issues
app.get('/api/sample-proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch sample image' });
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    res.json({
      dataUri: `data:${contentType};base64,${base64}`,
      mimeType: contentType,
    });
  } catch (err: any) {
    console.error('Error proxying sample image:', err);
    res.status(500).json({ error: err.message || 'Failed to proxy sample image' });
  }
});

// Helper function to call Gemini with multi-model fallback
async function callGeminiVision(base64Data: string, resolvedMime: string, apiKey: string) {
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Best models first — gemini-2.5-flash has strongest vision capability
  const modelsToTry = [
    { name: 'gemini-2.5-flash', thinkingLevel: ThinkingLevel.LOW },
    { name: 'gemini-3.8-flash', thinkingLevel: ThinkingLevel.LOW },
    { name: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
  ];

  const systemInstruction = `You are an expert computer vision system for parking lot occupancy analysis.

CRITICAL RULES FOR CLASSIFICATION:
- A space is OCCUPIED ONLY if you can CLEARLY see: vehicle body (hood, trunk, doors), tires/wheels, OR roof inside the bay boundaries
- A space is VACANT if: the bay area is empty OR contains only shadows, pavement markings, debris, or reflections — NO vehicle parts visible
- Be CONSERVATIVE: if uncertain whether a vehicle is present, classify as VACANT rather than occupied
- Do NOT classify as occupied based on: nearby cars outside the bay, shadows alone, reflections, or vague dark shapes
- If you can see painted lines forming a rectangular bay with NO clear vehicle parts inside → it is VACANT
- Count EVERY bay defined by painted lines, even if partially visible at edges — empty bays are often the hardest to see but MUST be counted

VEHICLE DETECTION CRITERIA:
- Look for: distinct vehicle silhouette, recognizable car/truck shape, visible wheels/tires, windshield, headlights/taillights
- Reject as NOT a vehicle: pavement cracks, oil stains, leaves, shadows, reflections, vague dark patches
- For motorcycles: look for the bike frame, wheels, and rider seat — must be clearly identifiable

DETECTION APPROACH:
1. First, identify ALL painted line markings to locate every individual parking bay rectangle
2. For EACH bay: examine the interior carefully for CLEAR vehicle features
3. If vehicle features are clearly visible inside bay lines → occupied; otherwise → vacant
4. Provide tight bounding boxes that wrap the full bay rectangle (not just the car)
5. Do NOT merge adjacent bays — each bay gets its own separate entry
6. For handicap spaces: look for the wheelchair symbol or blue markings on the ground
7. Reserved spaces: look for "Reserved" text or special markings`;

  const promptText = `Carefully analyze this parking lot image and detect EVERY parking space.

Step 1: Locate ALL parking bay rectangles by tracing the painted white/yellow lines. Look carefully for bay boundaries even if partially obscured.

Step 2: For EACH bay, determine occupancy using STRICT criteria:
  - OCCUPIED: You can CLEARLY see vehicle body parts (hood, trunk, roof, doors, windshield, wheels, headlights/taillights) INSIDE the bay boundaries
  - VACANT: The bay contains NO visible vehicle parts — may have shadows, pavement markings, or debris, but NO car/truck/SUV/van/motorcycle
  - If UNCERTAIN: Classify as VACANT (be conservative to avoid false positives)

Step 3: For occupied spaces, describe the vehicle (color + type, e.g. "White Sedan"). For vacant spaces, set vehicleInfo to empty string.

Step 4: Return bounding box [ymin, xmin, ymax, xmax] on 0-1000 scale for each bay. The box should wrap the FULL bay rectangle.

Step 5: Compute accurate totals. The sum of vacantSpaces + occupiedSpaces + reservedSpaces must equal totalSpaces.

CRITICAL: Empty bays are often harder to see than occupied ones. You MUST count every bay defined by painted lines, even if empty. Do not skip empty bays.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      overview: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          lotType: { type: Type.STRING },
          lightingWeather: { type: Type.STRING },
          cameraAngle: { type: Type.STRING },
          confidenceLevel: { type: Type.STRING },
        },
        required: ['description', 'lotType', 'lightingWeather', 'cameraAngle'],
      },
      summary: {
        type: Type.OBJECT,
        properties: {
          totalSpaces: { type: Type.INTEGER },
          vacantSpaces: { type: Type.INTEGER },
          occupiedSpaces: { type: Type.INTEGER },
          accessibleSpaces: { type: Type.INTEGER },
          reservedSpaces: { type: Type.INTEGER },
          occupancyRate: { type: Type.NUMBER },
        },
        required: [
          'totalSpaces',
          'vacantSpaces',
          'occupiedSpaces',
          'accessibleSpaces',
          'reservedSpaces',
          'occupancyRate',
        ],
      },
      spaces: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            slotNumber: { type: Type.STRING },
            status: {
              type: Type.STRING,
              enum: ['occupied', 'vacant', 'reserved', 'handicap_vacant', 'handicap_occupied'],
              description: 'MUST be one of: occupied, vacant, reserved, handicap_vacant, handicap_occupied',
            },
            box2d: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: '[ymin, xmin, ymax, xmax] scaled 0 to 1000 — wraps the full bay rectangle',
            },
            confidence: { type: Type.NUMBER, description: '0.0 to 1.0 detection confidence' },
            vehicleInfo: {
              type: Type.STRING,
              description: 'Describe vehicle if occupied (e.g. "White Sedan"). Set to empty string if vacant.',
            },
            notes: { type: Type.STRING },
          },
          required: ['id', 'slotNumber', 'status', 'box2d', 'confidence'],
        },
      },
    },
    required: ['overview', 'summary', 'spaces'],
  };

  let lastError: any = null;

  for (const modelConfig of modelsToTry) {
    try {
      console.log(`Attempting parking detection using ${modelConfig.name}...`);
      const response = await ai.models.generateContent({
        model: modelConfig.name,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: resolvedMime,
                data: base64Data,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          systemInstruction,
          temperature: 0.05,  // Very low temperature for consistent, deterministic results
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: modelConfig.thinkingLevel },
          responseSchema,
        },
      });

      const rawText = response.text || '{}';
      const parsedData = JSON.parse(rawText);
      console.log(`Success with model ${modelConfig.name}! Spaces found: ${parsedData.spaces?.length || 0}, Vacant: ${parsedData.summary?.vacantSpaces}, Occupied: ${parsedData.summary?.occupiedSpaces}`);
      return parsedData;
    } catch (err: any) {
      console.warn(`Model ${modelConfig.name} failed:`, err.message || err);
      lastError = err;
      // Continue to next model in fallback list
    }
  }

  throw lastError || new Error('All vision models failed to respond.');
}


app.post('/api/detect-parking', async (req, res) => {
  const startTime = Date.now();
  try {
    const { image, mimeType = 'image/jpeg' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    // Reload dotenv to pick up any recent changes to .env
    dotenv.config({ override: true });
    const apiKey = process.env.GEMINI_API_KEY || '';

    // Clean base64 string if it contains data URI header
    let base64Data = image;
    let resolvedMime = mimeType;
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        resolvedMime = match[1];
        base64Data = match[2];
      }
    }

    let parsedData: any;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      console.log('No valid API key found. Returning mock parking data.');
      parsedData = {
        overview: {
          description: "Mock analysis since no API key was provided.",
          lotType: "Surface Parking",
          lightingWeather: "Daylight",
          cameraAngle: "Oblique"
        },
        summary: {
          totalSpaces: 10,
          vacantSpaces: 5,
          occupiedSpaces: 5,
          accessibleSpaces: 0,
          reservedSpaces: 0,
          occupancyRate: 50
        },
        spaces: Array.from({ length: 10 }).map((_, i) => ({
          id: `mock-${i}`,
          slotNumber: `Slot ${i + 1}`,
          status: i % 2 === 0 ? "occupied" : "vacant",
          box2d: [100 + i * 10, 100 + i * 10, 200 + i * 10, 200 + i * 10],
          confidence: 0.99
        }))
      };
    } else {
      parsedData = await callGeminiVision(base64Data, resolvedMime, apiKey);
    }

    // Sanitize and ensure consistent fields
    const VALID_STATUSES = new Set(['occupied', 'vacant', 'reserved', 'handicap_vacant', 'handicap_occupied']);
    const MIN_CONFIDENCE_THRESHOLD = 0.3; // Reject detections with very low confidence
    
    const spaces = (parsedData.spaces || []).map((space: any, index: number) => {
      // Validate and clamp bounding box
      let box = Array.isArray(space.box2d) && space.box2d.length === 4
        ? space.box2d
        : [300, 300, 500, 500]; // small fallback box in centre

      box = [
        Math.max(0, Math.min(999, Math.round(Number(box[0]) || 0))),
        Math.max(0, Math.min(999, Math.round(Number(box[1]) || 0))),
        Math.max(1, Math.min(1000, Math.round(Number(box[2]) || 500))),
        Math.max(1, Math.min(1000, Math.round(Number(box[3]) || 500))),
      ];
      // Ensure ymax > ymin and xmax > xmin
      if (box[2] <= box[0]) box[2] = Math.min(1000, box[0] + 100);
      if (box[3] <= box[1]) box[3] = Math.min(1000, box[1] + 100);

      // Validate status — do NOT default unknown → 'occupied', use 'vacant'
      const rawStatus = (space.status || '').toLowerCase().trim();
      let status = VALID_STATUSES.has(rawStatus) ? rawStatus : 'vacant';

      // Validate confidence
      let confidence = typeof space.confidence === 'number'
        ? Math.min(1, Math.max(0, Math.round(space.confidence * 100) / 100))
        : 0.85;

      // If confidence is very low and status is occupied, downgrade to vacant to reduce false positives
      if (confidence < MIN_CONFIDENCE_THRESHOLD && (status === 'occupied' || status === 'handicap_occupied')) {
        console.log(`Downgrading low-confidence occupied space to vacant: confidence=${confidence}, slot=${space.slotNumber || index}`);
        status = status === 'handicap_occupied' ? 'handicap_vacant' : 'vacant';
      }

      // For vacant statuses, clear vehicleInfo
      const isOccupiedType = status === 'occupied' || status === 'handicap_occupied';
      const vehicleInfo = isOccupiedType && space.vehicleInfo ? space.vehicleInfo : null;

      // If occupied but no vehicle info provided, add a note about missing details
      const notes = space.notes || '';
      const enhancedNotes = isOccupiedType && !vehicleInfo 
        ? (notes ? notes + ' ' : '') + 'Vehicle details not detected'
        : notes;

      return {
        id: space.id || `slot-${index + 1}`,
        slotNumber: space.slotNumber || `Slot ${index + 1}`,
        status,
        box2d: box,
        confidence,
        vehicleInfo,
        notes: enhancedNotes,
      };
    });

    const totalCount = spaces.length;
    const occupiedCount = spaces.filter(
      (s: any) => s.status === 'occupied' || s.status === 'handicap_occupied'
    ).length;
    const vacantCount = spaces.filter(
      (s: any) => s.status === 'vacant' || s.status === 'handicap_vacant'
    ).length;
    const accessibleCount = spaces.filter(
      (s: any) => s.status === 'handicap_vacant' || s.status === 'handicap_occupied'
    ).length;
    const reservedCount = spaces.filter((s: any) => s.status === 'reserved').length;
    const computedOccupancyRate = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 1000) / 10 : 0;

    const summary = {
      totalSpaces: totalCount > 0 ? totalCount : parsedData.summary?.totalSpaces || 0,
      vacantSpaces: totalCount > 0 ? vacantCount : parsedData.summary?.vacantSpaces || 0,
      occupiedSpaces: totalCount > 0 ? occupiedCount : parsedData.summary?.occupiedSpaces || 0,
      accessibleSpaces: totalCount > 0 ? accessibleCount : parsedData.summary?.accessibleSpaces || 0,
      reservedSpaces: totalCount > 0 ? reservedCount : parsedData.summary?.reservedSpaces || 0,
      occupancyRate: totalCount > 0 ? computedOccupancyRate : parsedData.summary?.occupancyRate || 0,
    };

    const processingTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        id: `detection-${Date.now()}`,
        timestamp: new Date().toISOString(),
        processingTimeMs,
        overview: parsedData.overview || {
          description: 'Parking area analyzed.',
          lotType: 'Surface Parking',
          lightingWeather: 'Daylight',
          cameraAngle: 'Oblique',
        },
        summary,
        spaces,
      },
    });
  } catch (error: any) {
    console.error('Error analyzing parking image with Gemini:', error);
    let friendlyMessage = error.message || 'Failed to detect parking occupancy.';
    if (friendlyMessage.includes('503') || friendlyMessage.includes('UNAVAILABLE') || friendlyMessage.includes('high demand')) {
      friendlyMessage = 'The AI vision model is temporarily under high demand. Please click "Retry" in a few seconds.';
    } else if (friendlyMessage.includes('API key not valid') || friendlyMessage.includes('API_KEY_INVALID') || friendlyMessage.includes('API key')) {
      friendlyMessage = 'Invalid API Key. Please open the .env file and set a valid Gemini API key.';
    }
    res.status(500).json({
      error: friendlyMessage,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`ParkVision Server running at http://localhost:${PORT}`);
  });
}

startServer();