import { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup } from 'react-leaflet';
import phRegionsData from "../../assets/regions.json"; 

export interface MapEventData {
  eventId?: string;
  region: string;
  title: string;
  topic: string;
  date: string;
  description?: string;
  location?: string;
  status: "active" | "drought" | "historical";
}

// EMPTY by default. Waiting for the parent (TeacherDashboard) to pass backend data via props.
const DEFAULT_EVENT_DATA: MapEventData[] = [];

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

interface TeacherMapProps {
  data?: MapEventData[];
  onEventAction?: (actionType: 'register' | 'request', eventData: any) => void;
}

const normalizeRegionName = (value: string) => {
  const original = String(value ?? '').trim();
  const mappedFromProvince = provinceToRegion[original] || original;
  const text = String(mappedFromProvince ?? '').toUpperCase();

  if (text.includes('NCR') || text.includes('NATIONAL CAPITAL')) return 'NCR';
  if (text === 'CAR' || text.includes('CORDILLERA')) return 'CAR';
  if (text === 'R1' || text === 'REGION 1') return 'ILOCOS';
  if (text === 'R2' || text === 'REGION 2') return 'CAGAYAN VALLEY';
  if (text === 'R3' || text === 'REGION 3') return 'CENTRAL LUZON';
  if (text === 'R4A' || text === 'REGION 4A' || text === 'REGION IVA') return 'CALABARZON';
  if (text === 'R4B' || text === 'REGION 4B' || text === 'REGION IVB') return 'MIMAROPA';
  if (text === 'R5' || text === 'REGION 5') return 'BICOL';
  if (text === 'R6' || text === 'REGION 6') return 'WESTERN VISAYAS';
  if (text === 'R7' || text === 'REGION 7') return 'CENTRAL VISAYAS';
  if (text === 'R8' || text === 'REGION 8') return 'EASTERN VISAYAS';
  if (text === 'R9' || text === 'REGION 9') return 'ZAMBOANGA PENINSULA';
  if (text === 'R10' || text === 'REGION 10') return 'NORTHERN MINDANAO';
  if (text === 'R11' || text === 'REGION 11') return 'DAVAO';
  if (text === 'R12' || text === 'REGION 12') return 'SOCCSKSARGEN';
  if (text === 'R13' || text === 'REGION 13') return 'CARAGA';
  if (text === 'ARMM') return 'BARMM';
  if (text === 'NIR' || text.includes('NEGROS ISLAND')) return 'WESTERN VISAYAS';
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

export default function TeacherMap({ data = DEFAULT_EVENT_DATA, onEventAction }: TeacherMapProps) {
  const [activeRegion, setActiveRegion] = useState<any>(null);
  
  const getStatusColor = (status: string) => {
    if (status === "active") return '#3b82f6'; 
    if (status === "drought") return '#ef4444'; 
    if (status === "historical") return '#eab308'; 
    return '#64748b'; 
  };

  const resolveEventData = (properties: any) => {
    if (!properties) return { regionName: "Unknown", title: "General Assembly", topic: "General", date: "TBA", status: "historical", rawName: "" };

    const rawJsonString = properties.adm1_en || properties.NAME_1 || properties.REGION || properties.adm2_en || properties.name || "";
    const mappedRegion = provinceToRegion[rawJsonString] || rawJsonString || "";
    const normalizedMapRegion = normalizeRegionName(mappedRegion);
    
    // Region normalization prevents misses like "Region IV-A" vs "CALABARZON".
    const matched = data?.find(d => {
      if (!d || !d.region) return false;
      const normalizedDataRegion = normalizeRegionName(d.region);
      return normalizedMapRegion === normalizedDataRegion;
    });

    if (matched) {
      return { eventId: matched.eventId, regionName: mappedRegion, title: matched.title, topic: matched.topic, date: matched.date, description: matched.description, location: matched.location, status: matched.status, rawName: rawJsonString };
    } else {
      return { regionName: mappedRegion || "Unknown", title: "General Assembly", topic: "General", date: "TBA", status: "historical", rawName: rawJsonString };
    }
  };

  const styleRegion = (feature: any) => {
    const { status } = resolveEventData(feature.properties);
    return {
      fillColor: getStatusColor(status),
      weight: 1.5,
      opacity: 0.9,
      color: '#1e293b',
      fillOpacity: 0.65, 
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      click: (e: any) => {
        const eventData = resolveEventData(feature.properties);
        setActiveRegion({ ...eventData, latlng: e.latlng });
      }
    });
  };

  const handleActionClick = (actionType: 'register' | 'decline' | 'request') => {
    if (actionType !== 'decline' && onEventAction) {
      onEventAction(actionType, activeRegion);
    }
    setActiveRegion(null); 
  };

  return (
    <div className="h-full w-full bg-slate-950 relative z-0">
      <div className="absolute bottom-6 right-6 z-[1000] bg-[#0f172a]/95 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm pointer-events-auto">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Event Status</h3>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span><span className="text-sm font-medium text-slate-200">Active Event</span></div>
          <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span><span className="text-sm font-medium text-slate-200">Historical Baseline</span></div>
          <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span><span className="text-sm font-medium text-slate-200">Training Drought</span></div>
        </div>
      </div>

      <MapContainer center={[12.8797, 121.7740]} zoom={6} style={{ height: '100%', width: '100%', background: '#09090b' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <GeoJSON 
          key={JSON.stringify(data)} 
          data={phRegionsData as any} 
          style={styleRegion} 
          onEachFeature={onEachFeature} 
        />
        
        {activeRegion && (
          <Popup position={activeRegion.latlng} eventHandlers={{ remove: () => setActiveRegion(null) }} className="dark-popup">
            <div className="font-body min-w-[240px]">
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">
                Region Status
              </div>
              <div className="text-base font-extrabold text-slate-50 border-b border-slate-700 pb-2 mb-2.5">
                {activeRegion.rawName !== activeRegion.regionName && activeRegion.rawName !== "" ? (
                  <>
                    {activeRegion.rawName} <span className="text-[11px] font-normal text-slate-400">({activeRegion.regionName})</span>
                  </>
                ) : (
                  activeRegion.regionName
                )}
              </div>
              <div className="mb-4">
                <strong className="text-slate-50 text-sm block mb-1">{activeRegion.title}</strong>
                {activeRegion.status === 'active' && (
                  <span className="text-blue-400 text-xs font-medium block mb-1">Topic: {activeRegion.topic}</span>
                )}
                {activeRegion.location && (
                  <span className="text-slate-300 text-xs block mb-1">Location: {activeRegion.location}</span>
                )}
                {activeRegion.description && (
                  <p className="text-slate-400 text-xs leading-relaxed mb-1">{activeRegion.description}</p>
                )}
                <span className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  {activeRegion.date}
                </span>
              </div>
              
              <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
                {activeRegion.status === "active" ? (
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => handleActionClick('register')} className="bg-emerald-500 text-white border-none py-1.5 px-4 rounded-md cursor-pointer font-bold text-xs hover:bg-emerald-600 transition-colors">
                      Register
                    </button>
                    <button onClick={() => handleActionClick('decline')} className="bg-red-500 text-white border-none py-1.5 px-4 rounded-md cursor-pointer font-bold text-xs hover:bg-red-600 transition-colors">
                      Decline
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleActionClick('request')} className="bg-blue-500 text-white border-none py-1.5 px-4 rounded-md cursor-pointer font-bold text-xs w-full hover:bg-blue-600 transition-colors">
                    Request Training
                  </button>
                )}
              </div>
            </div>
          </Popup>
        )}
      </MapContainer>
    </div>
  );
}