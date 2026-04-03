import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import phRegionsData from "../../assets/regions.json"; 

// 1. DATA UPDATE: Added 'status' to each region
const mockEventData = [
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

export default function TeacherMap() {
  
  // 2. COLOR LOGIC UPDATE: Map status to legend colors
  const getStatusColor = (status: string) => {
    if (status === "active") return '#3b82f6'; // Blue (Active Event)
    if (status === "drought") return '#ef4444'; // Red (Training Drought)
    if (status === "historical") return '#eab308'; // Yellow (Historical Baseline)
    return '#64748b'; // Slate (Default)
  };

  const resolveEventData = (properties: any) => {
    const rawJsonString = properties.adm1_en || properties.NAME_1 || properties.REGION || properties.adm2_en || properties.name || "";
    const mappedRegion = provinceToRegion[rawJsonString] || rawJsonString;
    const matched = mockEventData.find(d => {
      const safeJson = mappedRegion.toUpperCase();
      const safeMock = d.name.toUpperCase();
      return safeJson.includes(safeMock) || safeMock.includes(safeJson) || (safeJson.includes("NCR") && safeMock.includes("CAPITAL"));
    });

    if (matched) {
      return { regionName: mappedRegion, event: matched.event, date: matched.date, status: matched.status, rawName: rawJsonString };
    } else {
      const defaultEvent = mockEventData.find(d => d.name === "Default");
      return { regionName: mappedRegion || "Unknown", event: defaultEvent?.event, date: defaultEvent?.date, status: defaultEvent?.status || "historical", rawName: rawJsonString };
    }
  };

  // 3. STYLE LOGIC UPDATE: Apply the dynamic status color
  const styleRegion = (feature: any) => {
    const { status } = resolveEventData(feature.properties);
    return {
      fillColor: getStatusColor(status),
      weight: 1.5,
      opacity: 0.9,
      color: '#1e293b', // <--- FIX THIS LINE
      fillOpacity: 0.65, 
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const { regionName, event, date, rawName, status } = resolveEventData(feature.properties);
    const displayTitle = rawName !== regionName && rawName !== "" ? `${rawName} <span style="font-size: 11px; font-weight: normal; color: #94a3b8;">(${regionName})</span>` : regionName;

    // Show different buttons based on status
    const buttonsHtml = status === "active" 
      ? `<div style="display: flex; gap: 10px; justify-content: center;">
            <button onclick="alert('Awesome! You registered for the ${regionName} event.')" style="background: #10b981; color: white; border: none; padding: 6px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Register</button>
            <button onclick="alert('Maybe next time!')" style="background: #ef4444; color: white; border: none; padding: 6px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Decline</button>
         </div>`
      : `<button onclick="alert('You have requested training for ${regionName}.')" style="background: #3b82f6; color: white; border: none; padding: 6px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; width: 100%;">Request Training</button>`;

    const popupContent = `
      <div style="font-family: 'Inter', sans-serif; min-width: 240px;">
        <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.05em;">
          Region Status
        </div>
        <div style="font-size: 16px; font-weight: 800; color: #f8fafc; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 10px;">
          ${displayTitle}
        </div>
        <div style="margin-bottom: 16px;">
          <strong style="color: #f8fafc; font-size: 14px; display: block; margin-bottom: 4px;">${event}</strong>
          <span style="color: #94a3b8; font-size: 12px; display: flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${date}
          </span>
        </div>
        
        <div style="background: #1e293b; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #334155;">
          ${buttonsHtml}
        </div>
      </div>
    `;

    layer.bindPopup(popupContent, { className: 'dark-popup' });
  };

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg relative z-0">
      
      {/* NEW: Floating Legend for Teacher Map */}
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
        <GeoJSON data={phRegionsData as any} style={styleRegion} onEachFeature={onEachFeature} />
      </MapContainer>
    </div>
  );
}