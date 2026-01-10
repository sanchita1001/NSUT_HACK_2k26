"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, MapPin } from "lucide-react";
import dynamic from 'next/dynamic';

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });

export default function MapPage() {
    const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [mapReady, setMapReady] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/alerts');
            if (res.ok) {
                const data = await res.json();
                // Filter alerts that have coordinates
                const alertsWithCoords = data.filter((a: any) => a.latitude && a.longitude);
                setAlerts(alertsWithCoords);
            }
        } catch (e) {
            console.error("Map fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMapReady(true);
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const highRiskAlerts = alerts.filter(a => a.riskScore > 70);
    const centerLat = alerts.length > 0 ? alerts.reduce((sum, a) => sum + a.latitude, 0) / alerts.length : 20.5937;
    const centerLng = alerts.length > 0 ? alerts.reduce((sum, a) => sum + a.longitude, 0) / alerts.length : 78.9629;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Real-Time Geospatial Risk Map</h1>
                    <p className="text-sm text-gray-500">Live alert locations across India with risk heatmap.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={fetchData} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="flex items-center"><span className="block w-3 h-3 bg-red-500 rounded-full mr-1"></span> High Risk</span>
                        <span className="flex items-center"><span className="block w-3 h-3 bg-orange-500 rounded-full mr-1"></span> Medium</span>
                        <span className="flex items-center"><span className="block w-3 h-3 bg-yellow-500 rounded-full mr-1"></span> Low</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Viewer */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-lg relative h-[600px] overflow-hidden border border-gray-200">
                    {mapReady && typeof window !== 'undefined' && (
                        <MapContainer
                            center={[centerLat, centerLng]}
                            zoom={5}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {alerts.map((alert) => {
                                const color = alert.riskScore > 80 ? '#ef4444' : alert.riskScore > 50 ? '#f97316' : '#eab308';
                                return (
                                    <CircleMarker
                                        key={alert.id}
                                        center={[alert.latitude, alert.longitude]}
                                        radius={8 + (alert.riskScore / 10)}
                                        fillColor={color}
                                        color="white"
                                        weight={2}
                                        opacity={1}
                                        fillOpacity={0.7}
                                        eventHandlers={{
                                            click: () => setSelectedAlert(alert)
                                        }}
                                    >
                                        <Popup>
                                            <div className="text-sm">
                                                <p className="font-bold">{alert.id}</p>
                                                <p>Risk: {alert.riskScore}/100</p>
                                                <p>Amount: ₹{alert.amount.toLocaleString()}</p>
                                                <p>Location: {alert.district}</p>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                );
                            })}
                        </MapContainer>
                    )}

                    <div className="absolute top-4 right-4 bg-white p-3 rounded text-xs shadow-lg border border-gray-200 z-[1000]">
                        <p className="font-bold text-gray-900 mb-1">Live Feed</p>
                        <p className="text-gray-600">Total Alerts: {alerts.length}</p>
                        <p className="text-red-600">High Risk: {highRiskAlerts.length}</p>
                    </div>
                </div>

                {/* Alert Details Panel */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    {selectedAlert ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">{selectedAlert.district}</h2>
                                <span className={`text-white text-xs px-2 py-1 rounded-full font-bold ${selectedAlert.riskScore > 80 ? 'bg-red-600' : 'bg-orange-500'}`}>
                                    {selectedAlert.riskScore > 80 ? 'Critical' : 'High Risk'}
                                </span>
                            </div>

                            <div className="p-4 bg-red-50 border border-red-100 rounded-sm">
                                <p className="text-sm text-red-800 font-medium flex items-center">
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Alert ID: {selectedAlert.id}
                                </p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Risk Score:</span>
                                    <span className="font-bold text-red-600">{selectedAlert.riskScore}/100</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Amount:</span>
                                    <span className="font-bold">₹{selectedAlert.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Scheme:</span>
                                    <span className="font-medium">{selectedAlert.scheme}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Vendor:</span>
                                    <span className="font-medium">{selectedAlert.vendor}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Coordinates:</span>
                                    <span className="font-mono text-xs">{selectedAlert.latitude.toFixed(4)}, {selectedAlert.longitude.toFixed(4)}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-gray-700 uppercase">Detection Reasons</h3>
                                <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                    {selectedAlert.mlReasons?.map((reason: string, idx: number) => (
                                        <li key={idx}>{reason}</li>
                                    ))}
                                </ul>
                            </div>

                            <button className="w-full mt-4 bg-blue-900 text-white py-2 rounded-sm text-sm font-medium hover:bg-blue-800">
                                View Full Details
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <MapPin className="h-12 w-12 text-gray-300 mb-2" />
                            <p>Click on a marker to view alert details.</p>
                            <p className="text-xs mt-2">Real-time data updates every 10 seconds</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
