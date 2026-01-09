"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

// Mock India Map Inteaction (Simplified SVG)
// "Government Grade" often uses static SVG maps for district highlighting.
export default function MapPage() {
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

    // Mock Districts Risk Data
    const highRiskDistricts = [
        { id: "UP-LKO", name: "Lucknow", risk: 85, cx: 300, cy: 200 },
        { id: "BH-PAT", name: "Patna", risk: 92, cx: 450, cy: 220 },
        { id: "MH-MUM", name: "Mumbai", risk: 45, cx: 150, cy: 400 },
        { id: "DL-DEL", name: "New Delhi", risk: 60, cx: 280, cy: 150 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Geospatial Risk Heatmap</h1>
                    <p className="text-sm text-gray-500">District-wise anomaly concentration.</p>
                </div>
                <div className="flex items-center capitalize space-x-2 text-sm text-gray-500">
                    <span className="flex items-center"><span className="block w-3 h-3 bg-red-500 rounded-full mr-1"></span> Critical</span>
                    <span className="flex items-center"><span className="block w-3 h-3 bg-orange-500 rounded-full mr-1"></span> High</span>
                    <span className="flex items-center"><span className="block w-3 h-3 bg-yellow-500 rounded-full mr-1"></span> Medium</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Viewer */}
                <div className="lg:col-span-2 bg-slate-900 rounded-lg shadow-lg relative h-[500px] flex items-center justify-center overflow-hidden border border-slate-700">
                    {/* Abstract India Map Outline (SVG) */}
                    <svg viewBox="0 0 600 600" className="w-[80%] h-[80%] opacity-80">
                        {/* Simplified path for illustration */}
                        <path d="M 280 50 L 350 100 L 450 200 L 400 400 L 300 550 L 150 450 L 100 300 L 280 50" fill="none" stroke="#475569" strokeWidth="2" />

                        {/* Render Hotspots */}
                        {highRiskDistricts.map(d => (
                            <g key={d.id}
                                className="cursor-pointer transition-transform hover:scale-110"
                                onClick={() => setSelectedDistrict(d.name)}
                            >
                                {/* Pulse Effect */}
                                <circle cx={d.cx} cy={d.cy} r="20" className="animate-ping opacity-20" fill={d.risk > 80 ? "#ef4444" : "#f97316"} />
                                <circle cx={d.cx} cy={d.cy} r="8" fill={d.risk > 80 ? "#ef4444" : "#f97316"} stroke="white" strokeWidth="2" />
                                <text x={d.cx} y={d.cy + 25} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{d.name}</text>
                            </g>
                        ))}
                    </svg>

                    <div className="absolute top-4 right-4 bg-slate-800 p-3 rounded text-xs text-slate-300 border border-slate-600">
                        <p className="font-bold text-white mb-1">Live Feed</p>
                        <p>Signals Received: 1,024</p>
                        <p>Anomalies: 12</p>
                    </div>
                </div>

                {/* Drilldown Panel */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    {selectedDistrict ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">{selectedDistrict} Region</h2>
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">Critical Risk</span>
                            </div>

                            <div className="p-4 bg-red-50 border border-red-100 rounded-sm">
                                <p className="text-sm text-red-800 font-medium flex items-center">
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    24 Active Alerts Detected
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-700 uppercase">Top Flags</h3>
                                <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                                    <span>Ghost Beneficiaries</span>
                                    <span className="font-mono font-bold">42%</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                                    <span>Vendor Cycle</span>
                                    <span className="font-mono font-bold">28%</span>
                                </div>
                            </div>

                            <button className="w-full mt-4 bg-blue-900 text-white py-2 rounded-sm text-sm font-medium hover:bg-blue-800">
                                View District Report
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <Map className="h-12 w-12 text-gray-300 mb-2" />
                            <p>Select a region on the map to analyze risk factors.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Map(props: any) {
    return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 21 15 18 9 21 3 18 3 6" /><line x1="9" x2="9" y1="3" y2="21" /><line x1="15" x2="15" y1="6" y2="24" /></svg>
}
