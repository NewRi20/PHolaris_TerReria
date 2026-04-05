import { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup } from 'react-leaflet';
import phRegionsData from "../../assets/regions.json"; 

// Define shape of backend data
export interface RegionalEventData {
  name: string;
  event: string;
  date: string;
  status: "active" | "drought" | "historical";
}

// Default fallback data
const DEFAULT_EVENT_DATA: RegionalEventData[] = [
  { name: "National Capital Region", event: "EdTech Innovation Summit", date: "April 15, 2026", status: "active" },
  { name: "Ilocos", event: "No recent training", date: "N/A", status: "drought" },
  { name: "Cagayan Valley", event: "Agriculture & STEM Seminar", date: "May 5, 2026", status: "active" },
  { name: "Central Luzon", event: "Past Digital Bootcamp", date: "March 2025", status: "historical" },
  { name: "CALABARZON", event: "Math Teachers Symposium", date: "May 10, 2026", status: "active" },
  { name: "Eastern Visayas", event: "Severely underserved", date: "N/A", status: "drought" },
  { name: "Default", event: "General Assembly", date: "TBA", status: "historical" } 
];

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

// Map accepts data prop
interface TeacherMapProps {
  data?: RegionalEventData[];
}

export default function TeacherMap({ data = DEFAULT_EVENT_DATA }: TeacherMapProps) {
  const [activeRegion, setActiveRegion] = useState<any>(null);
  
  const getStatusColor = (status: string) => {
    if (status === "active") return '#3b82f6'; 
    if (status === "drought") return '#ef4444'; 
    if (status === "historical") return '#eab308'; 
    return '#64748b'; 
  };

  const resolveEventData = (properties: any) => {
    const rawJsonString = properties.adm1_en || properties.NAME_1 || properties.REGION || properties.adm2_en || properties.name || "";
    const mappedRegion = provinceToRegion[rawJsonString] || rawJsonString;
    
    const matched = data.find(d => {
      const safeJson = mappedRegion.toUpperCase();
      const safeMock = d.name.toUpperCase();
      return safeJson.includes(safeMock) || safeMock.includes(safeJson) || (safeJson.includes("NCR") && safeMock.includes("CAPITAL"));
    });

    if (matched) {
      return { regionName: mappedRegion, event: matched.event, date: matched.date, status: matched.status, rawName: rawJsonString };
    } else {
      const defaultEvent = data.find(d => d.name === "Default");
      return { regionName: mappedRegion || "Unknown", event: defaultEvent?.event, date: defaultEvent?.date, status: defaultEvent?.status || "historical", rawName: rawJsonString };
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

  const handleAction = (actionType: string) => {
    if (actionType === 'register') {
      alert(`Awesome! You registered for the ${activeRegion.regionName} event.`);
    } else if (actionType === 'decline') {
      alert('Maybe next time!');
    } else if (actionType === 'request') {
      alert(`You have requested training for ${activeRegion.regionName}.`);
    }
    setActiveRegion(null); 
  };

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg relative z-0">
      
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
          key={JSON.stringify(data)} // THE MAGIC FIX
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
                <strong className="text-slate-50 text-sm block mb-1">{activeRegion.event}</strong>
                <span className="text-slate-400 text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  {activeRegion.date}
                </span>
              </div>
              
              <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
                {activeRegion.status === "active" ? (
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => handleAction('register')} className="bg-emerald-500 text-white border-none py-1.5 px-4 rounded-md cursor-pointer font-bold text-xs hover:bg-emerald-600 transition-colors">
                      Register
                    </button>
                    <button onClick={() => handleAction('decline')} className="bg-red-500 text-white border-none py-1.5 px-4 rounded-md cursor-pointer font-bold text-xs hover:bg-red-600 transition-colors">
                      Decline
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleAction('request')} className="bg-blue-500 text-white border-none py-1.5 px-4 rounded-md cursor-pointer font-bold text-xs w-full hover:bg-blue-600 transition-colors">
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