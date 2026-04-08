import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import phRegionsData from "../../assets/regions.json";

/**
 * ============================================================================
 * BACKEND INTEGRATION GUIDE FOR ROUTING / API TEAM:
 * ============================================================================
 * * This map component expects an array of objects matching the RegionRiskData
 * interface below. It is intentionally decoupled from API fetching logic.
 * * To populate this map:
 * 1. In the parent component (e.g., UnderservedAreas.tsx), fetch region metrics
 * from GET /api/maps/regions.
 * 2. Optionally fetch queue/ranking data from GET /api/admin/underserved-areas
 * for cards and lists in the same page.
 * 3. Transform the map response into RegionRiskData[] and pass it as:
 * <AdminMap data={backendData} />
 * * The map automatically re-renders and color-codes regions based on the
 * `flags` integer (0 = Safe/Green, 5 = Critical/Red).
 */

export interface RegionRiskData {
  /** The exact name of the region (e.g., "NCR", "CALABARZON", "Ilocos") */
  name: string;
  /** Integer from 0 to 5 indicating severity. Determines the map color. */
  flags: number;
  /** A short string detailing what the region needs (e.g., "Urgent Capacity Building") */
  needs: string;
}

// Internal mapping to standardize raw GeoJSON province names into official regional buckets
const provinceToRegion: Record<string, string> = {
  "Ilocos Norte": "Ilocos", "Ilocos Sur": "Ilocos", "La Union": "Ilocos", "Pangasinan": "Ilocos",
  "Batanes": "Cagayan Valley", "Cagayan": "Cagayan Valley", "Isabela": "Cagayan Valley", "Nueva Vizcaya": "Cagayan Valley", "Quirino": "Cagayan Valley",
  "Aurora": "Central Luzon", "Bataan": "Central Luzon", "Bulacan": "Central Luzon", "Nueva Ecija": "Central Luzon", "Pampanga": "Central Luzon", "Tarlac": "Central Luzon", "Zambales": "Central Luzon",
  "Batangas": "CALABARZON", "Cavite": "CALABARZON", "Laguna": "CALABARZON", "Quezon": "CALABARZON", "Rizal": "CALABARZON",
  "Marinduque": "MIMAROPA", "Occidental Mindoro": "MIMAROPA", "Oriental Mindoro": "MIMAROPA", "Palawan": "MIMAROPA", "Romblon": "MIMAROPA",
  "Albay": "Bicol", "Camarines Norte": "Bicol", "Camarines Sur": "Bicol", "Catanduanes": "Bicol", "Masbate": "Bicol", "Sorsogon": "Bicol",
  "Aklan": "Western Visayas", "Antique": "Western Visayas", "Capiz": "Western Visayas", "Guimaras": "Western Visayas", "Iloilo": "Western Visayas", "Negros Occidental": "Western Visayas",
  "Bohol": "Central Visayas", "Cebu": "Central Visayas", "Negros Oriental": "Central Visayas", "Siquijor": "Central Visayas",
  "Biliran": "Eastern Visayas", "Eastern Samar": "Eastern Visayas", "Leyte": "Eastern Visayas", "Northern Samar": "Eastern Visayas", "Samar": "Eastern Visayas", "Southern Leyte": "Eastern Visayas",
  "Zamboanga del Norte": "Zamboanga Peninsula", "Zamboanga del Sur": "Zamboanga Peninsula", "Zamboanga Sibugay": "Zamboanga Peninsula",
  "Bukidnon": "Northern Mindanao", "Camiguin": "Northern Mindanao", "Lanao del Norte": "Northern Mindanao", "Misamis Occidental": "Northern Mindanao", "Misamis Oriental": "Northern Mindanao",
  "Davao de Oro": "Davao", "Davao del Norte": "Davao", "Davao del Sur": "Davao", "Davao Oriental": "Davao", "Davao Occidental": "Davao",
  "Cotabato": "Soccsksargen", "Sarangani": "Soccsksargen", "South Cotabato": "Soccsksargen", "Sultan Kudarat": "Soccsksargen",
  "Agusan del Norte": "Caraga", "Agusan del Sur": "Caraga", "Dinagat Islands": "Caraga", "Surigao del Norte": "Caraga", "Surigao del Sur": "Caraga",
  "Basilan": "Autonomous Region in Muslim Mindanao", "Lanao del Sur": "Autonomous Region in Muslim Mindanao", "Maguindanao": "Autonomous Region in Muslim Mindanao", "Maguindanao del Norte": "Autonomous Region in Muslim Mindanao", "Maguindanao del Sur": "Autonomous Region in Muslim Mindanao", "Sulu": "Autonomous Region in Muslim Mindanao", "Tawi-Tawi": "Autonomous Region in Muslim Mindanao",
  "Abra": "Cordillera Administrative Region", "Apayao": "Cordillera Administrative Region", "Benguet": "Cordillera Administrative Region", "Ifugao": "Cordillera Administrative Region", "Kalinga": "Cordillera Administrative Region", "Mountain Province": "Cordillera Administrative Region",
  "City of Manila": "National Capital Region", "NCR": "National Capital Region", "Metropolitan Manila": "National Capital Region"
};

interface AdminMapProps {
  data?: RegionRiskData[];
}

const normalizeRegionName = (value: string) => {
  const text = value.toUpperCase();

  if (text.includes('NCR') || text.includes('NATIONAL CAPITAL')) return 'NCR';
  if (text === 'CAR' || text.includes('CORDILLERA')) return 'CAR';
  if (text.includes('REGION I') || text.includes('ILOCOS')) return 'ILOCOS';
  if (text.includes('REGION II') || text.includes('CAGAYAN VALLEY')) return 'CAGAYAN VALLEY';
  if (text.includes('REGION III') || text.includes('CENTRAL LUZON')) return 'CENTRAL LUZON';
  if (text.includes('REGION IV-A') || text.includes('CALABARZON')) return 'CALABARZON';
  if (text.includes('MIMAROPA')) return 'MIMAROPA';
  if (text.includes('REGION V') || text.includes('BICOL')) return 'BICOL';
  if (text.includes('REGION VI') || text.includes('WESTERN VISAYAS')) return 'WESTERN VISAYAS';
  if (text.includes('REGION VII') || text.includes('CENTRAL VISAYAS')) return 'CENTRAL VISAYAS';
  if (text.includes('REGION VIII') || text.includes('EASTERN VISAYAS')) return 'EASTERN VISAYAS';
  if (text.includes('REGION IX') || text.includes('ZAMBOANGA PENINSULA')) return 'ZAMBOANGA PENINSULA';
  if (text.includes('REGION X') || text.includes('NORTHERN MINDANAO')) return 'NORTHERN MINDANAO';
  if (text.includes('REGION XI') || text.includes('DAVAO')) return 'DAVAO';
  if (text.includes('REGION XII') || text.includes('SOCCSKSARGEN')) return 'SOCCSKSARGEN';
  if (text.includes('REGION XIII') || text.includes('CARAGA')) return 'CARAGA';
  if (text.includes('BARMM') || text.includes('AUTONOMOUS REGION IN MUSLIM MINDANAO')) return 'BARMM';

  return text.replace(/[^A-Z0-9]+/g, ' ').trim();
};

// Defaults to an empty array. If the backend sends nothing, the map defaults to 0 flags (Safe/Green).
export default function AdminMap({ data = [] }: AdminMapProps) {
  
  const getRegionColor = (flags: number) => {
    if (flags >= 5) return '#ef4444'; // Critical (Red)
    if (flags === 4) return '#f97316'; // High Risk (Orange)
    if (flags === 3) return '#eab308'; // Warning (Yellow)
    if (flags === 2) return '#3b82f6'; // Minimal Action (Blue)
    return '#22c55e';                  // Safe (Green) - Default state
  };

  const resolveRegionData = (properties: any) => {
    const rawJsonString = properties.adm1_en || properties.NAME_1 || properties.REGION || properties.adm2_en || properties.name || "";
    const mappedRegion = provinceToRegion[rawJsonString] || rawJsonString;
    const normalizedMapRegion = normalizeRegionName(mappedRegion);
    
    // Look up the matching data from the injected 'data' prop from the backend
    const matched = data.find(d => {
      const normalizedDataRegion = normalizeRegionName(d.name);
      return normalizedMapRegion === normalizedDataRegion;
    });

    return {
      regionName: matched ? matched.name : mappedRegion,
      flags: matched ? matched.flags : 0, // Defaults to 0 flags if backend hasn't flagged it
      needs: matched ? matched.needs : "No immediate action required.",
      rawName: rawJsonString 
    };
  };

  const styleRegion = (feature: any) => {
    const { flags } = resolveRegionData(feature.properties);
    return {
      fillColor: getRegionColor(flags),
      weight: 1.5,
      opacity: 0.9,
      color: '#1e293b', 
      fillOpacity: 0.75,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const { regionName, flags, needs, rawName } = resolveRegionData(feature.properties);
    const flagColorClass = flags >= 4 ? 'color: #f87171;' : flags >= 3 ? 'color: #fbbf24;' : 'color: #cbd5e1;';
    const displayTitle = rawName !== regionName && rawName !== "" ? `${rawName} <span style="font-size: 11px; font-weight: normal; color: #94a3b8;">(${regionName})</span>` : regionName;

    const tooltipContent = `
      <div style="font-family: 'Inter', sans-serif; min-width: 220px;">
        <div style="font-size: 10px; color: #818cf8; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.05em;">
          Region Insights
        </div>
        <div style="font-size: 16px; font-weight: 800; color: #f8fafc; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 10px;">
          ${displayTitle}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px;">
          <span style="color: #94a3b8; font-weight: 500;">Risk Level:</span>
          <span style="font-weight: bold; font-size: 16px; ${flagColorClass}">${flags} Flags</span>
        </div>
        <div style="background: #1e293b; padding: 10px; border-radius: 8px; border: 1px solid #334155;">
          <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">Primary Need</div>
          <div style="font-size: 12px; color: #cbd5e1; font-weight: 600;">${needs}</div>
        </div>
      </div>
    `;

    layer.bindTooltip(tooltipContent, { 
      sticky: true, 
      direction: 'top', 
      className: 'dark-tooltip' 
    });
  };

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg relative z-0">
      <div className="absolute bottom-6 right-6 z-[1000] bg-[#0f172a]/95 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm pointer-events-auto">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Risk Level</h3>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span><span className="text-sm font-medium text-slate-200">Critical (5 Flags)</span></div>
          <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span><span className="text-sm font-medium text-slate-200">High Risk (4 Flags)</span></div>
          <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span><span className="text-sm font-medium text-slate-200">Warning (3 Flags)</span></div>
          <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span><span className="text-sm font-medium text-slate-200">Minimal Action (2 Flags)</span></div>
          <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span><span className="text-sm font-medium text-slate-200">Safe (0-1 Flags)</span></div>
        </div>
      </div>

      <MapContainer center={[12.8797, 121.7740]} zoom={6} style={{ height: '100%', width: '100%', background: '#09090b' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <GeoJSON 
          key={JSON.stringify(data)} // THE MAGIC FIX: Re-renders when backend data changes
          data={phRegionsData as any} 
          style={styleRegion} 
          onEachFeature={onEachFeature} 
        />
      </MapContainer>
    </div>
  );
}