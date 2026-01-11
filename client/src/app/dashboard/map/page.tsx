"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, MapPin, Building2 } from "lucide-react";
import dynamic from 'next/dynamic';
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useMapUpdate } from "@/contexts/MapUpdateContext";
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

// Heatmap layer component
const HeatmapLayer = dynamic(() => import('react-leaflet').then(async (mod) => {
    const L = (await import('leaflet')).default;
    // @ts-ignore
    await import('leaflet.heat');

    const { useMap } = mod;

    return function HeatmapLayerComponent({ points }: { points: any[] }) {
        const map = useMap();

        useEffect(() => {
            if (!map || !points || points.length === 0) return;

            // @ts-ignore - leaflet.heat adds this method
            const heatLayer = L.heatLayer(
                points.map(p => [p.lat, p.lng, p.intensity]),
                {
                    radius: 25,
                    blur: 35,
                    maxZoom: 10,
                    max: 1.0,
                    gradient: {
                        0.0: '#00ff00',  // Green for low
                        0.5: '#ffff00',  // Yellow for medium
                        0.7: '#ff9900',  // Orange
                        1.0: '#ff0000'   // Red for high
                    }
                }
            ).addTo(map);

            return () => {
                map.removeLayer(heatLayer);
            };
        }, [map, points]);

        return null;
    };
}), { ssr: false });

export default function MapPage() {
    const router = useRouter();
    const { mapUpdateTrigger } = useMapUpdate();
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [heatmapPoints, setHeatmapPoints] = useState<any[]>([]);
    const [mapReady, setMapReady] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/map/data');
            if (res.data) {
                setVendors(res.data.vendors || []);
                setAlerts(res.data.alerts || []);

                // Create heatmap points from alerts with risk-based intensity
                const heatPoints = (res.data.alerts || []).map((alert: any) => ({
                    lat: alert.latitude,
                    lng: alert.longitude,
                    intensity: Math.min(alert.riskScore / 100, 1.0), // Normalize to 0-1
                    amount: alert.amount,
                    riskScore: alert.riskScore
                }));

                setHeatmapPoints(heatPoints);
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

    // Listen for map update triggers from other components
    useEffect(() => {
        if (mapUpdateTrigger > 0) {
            console.log('Map update triggered, refreshing data...');
            fetchData();
        }
    }, [mapUpdateTrigger]);

    const highRiskAlerts = alerts.filter(a => a.riskScore > 70);
    const centerLat = 20.5937;
    const centerLng = 78.9629;

    // Create custom vendor icon
    const createVendorIcon = (riskScore: number) => {
        if (typeof window === 'undefined') return undefined;
        const L = require('leaflet');

        const color = riskScore > 70 ? '#ef4444' : riskScore > 40 ? '#f97316' : '#22c55e';

        return L.divIcon({
            className: 'custom-vendor-icon',
            html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 4px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Real-Time Geospatial Risk Map</h1>
                    <p className="text-sm text-gray-500">Live vendor locations and payment heatmap across India.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={fetchData} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="flex items-center"><span className="block w-3 h-3 bg-red-500 rounded-full mr-1"></span> High Risk</span>
                        <span className="flex items-center"><span className="block w-3 h-3 bg-yellow-500 rounded-full mr-1"></span> Medium</span>
                        <span className="flex items-center"><span className="block w-3 h-3 bg-green-500 rounded-full mr-1"></span> Low Risk</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Viewer */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-lg relative h-[600px] overflow-hidden border border-gray-200 z-0">
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

                            {/* Heatmap Layer for Payment Zones */}
                            {heatmapPoints.length > 0 && (
                                <HeatmapLayer points={heatmapPoints} />
                            )}

                            {/* Vendor Markers */}
                            {vendors.map((vendor) => (
                                <Marker
                                    key={`vendor-${vendor.id}`}
                                    position={[vendor.latitude, vendor.longitude]}
                                    icon={createVendorIcon(vendor.riskScore)}
                                    eventHandlers={{
                                        click: () => setSelectedItem({ type: 'vendor', data: vendor })
                                    }}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <p className="font-bold flex items-center">
                                                <Building2 className="h-3 w-3 mr-1" />
                                                {vendor.name}
                                            </p>
                                            <p className="text-xs text-gray-600">GSTIN: {vendor.gstin}</p>
                                            <p>Risk: {vendor.riskScore}/100</p>
                                            <p>Status: {vendor.accountStatus}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {/* Alert Circle Markers */}
                            {alerts.map((alert) => {
                                const color = alert.riskScore > 80 ? '#ef4444' : alert.riskScore > 50 ? '#f97316' : '#eab308';
                                return (
                                    <CircleMarker
                                        key={alert.id}
                                        center={[alert.latitude, alert.longitude]}
                                        radius={6 + (alert.riskScore / 25)}
                                        pathOptions={{
                                            fillColor: color,
                                            color: 'white',
                                            weight: 1,
                                            opacity: 0.8,
                                            fillOpacity: 0.4
                                        }}
                                        eventHandlers={{
                                            click: () => setSelectedItem({ type: 'alert', data: alert })
                                        }}
                                    >
                                        <Popup>
                                            <div className="text-sm">
                                                <p className="font-bold">{alert.id}</p>
                                                <p>Risk: {alert.riskScore}/100</p>
                                                <p>Amount: ₹{alert.amount.toLocaleString('en-IN')}</p>
                                                <p>Vendor: {alert.vendor}</p>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                );
                            })}
                        </MapContainer>
                    )}

                    <div className="absolute top-4 right-4 bg-white/90 p-3 rounded text-xs shadow-lg border border-gray-200 z-[400] backdrop-blur-sm">
                        <p className="font-bold text-gray-900 mb-1">Live Feed</p>
                        <p className="text-gray-600">Vendors: {vendors.length}</p>
                        <p className="text-gray-600">Payments: {alerts.length}</p>
                        <p className="text-red-600">High Risk: {highRiskAlerts.length}</p>
                    </div>
                </div>

                {/* Details Panel */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-[600px] overflow-y-auto">
                    {selectedItem ? (
                        selectedItem.type === 'vendor' ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                        <Building2 className="h-5 w-5 mr-2" />
                                        Vendor Details
                                    </h2>
                                    <span className={`text-white text-xs px-2 py-1 rounded-full font-bold ${selectedItem.data.riskScore > 70 ? 'bg-red-600' : selectedItem.data.riskScore > 40 ? 'bg-orange-500' : 'bg-green-600'}`}>
                                        {selectedItem.data.riskScore > 70 ? 'High Risk' : selectedItem.data.riskScore > 40 ? 'Medium' : 'Low Risk'}
                                    </span>
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-sm">
                                    <p className="text-sm text-blue-800 font-medium">
                                        {selectedItem.data.name}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">GSTIN: {selectedItem.data.gstin}</p>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Risk Score:</span>
                                        <span className="font-bold">{selectedItem.data.riskScore}/100</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Address:</span>
                                        <span className="font-medium text-right">{selectedItem.data.address || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status:</span>
                                        <span className="font-medium">{selectedItem.data.accountStatus}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Coordinates:</span>
                                        <span className="font-mono text-xs">{selectedItem.data.latitude.toFixed(4)}, {selectedItem.data.longitude.toFixed(4)}</span>
                                    </div>
                                    {selectedItem.data.operatingSchemes && selectedItem.data.operatingSchemes.length > 0 && (
                                        <div className="pt-2 border-t">
                                            <p className="text-gray-600 text-xs mb-1">Operating Schemes:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedItem.data.operatingSchemes.map((scheme: string, idx: number) => (
                                                    <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{scheme}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => router.push(`/dashboard/vendors/${selectedItem.data.id}`)}
                                    className="w-full mt-4 bg-blue-900 text-white py-2 rounded-sm text-sm font-medium hover:bg-blue-800 transition-colors"
                                >
                                    View Full Profile
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">Alert Details</h2>
                                    <span className={`text-white text-xs px-2 py-1 rounded-full font-bold ${selectedItem.data.riskScore > 80 ? 'bg-red-600' : 'bg-orange-500'}`}>
                                        {selectedItem.data.riskScore > 80 ? 'Critical' : 'High Risk'}
                                    </span>
                                </div>

                                <div className="p-4 bg-red-50 border border-red-100 rounded-sm">
                                    <p className="text-sm text-red-800 font-medium flex items-center">
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                        Alert ID: {selectedItem.data.id}
                                    </p>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Risk Score:</span>
                                        <span className="font-bold text-red-600">{selectedItem.data.riskScore}/100</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Amount:</span>
                                        <span className="font-bold">₹{selectedItem.data.amount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Scheme:</span>
                                        <span className="font-medium">{selectedItem.data.scheme}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Vendor:</span>
                                        <span className="font-medium">{selectedItem.data.vendor}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Location:</span>
                                        <span className="font-medium">{selectedItem.data.district}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase">Detection Reasons</h3>
                                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                        {selectedItem.data.mlReasons?.map((reason: string, idx: number) => (
                                            <li key={idx}>{reason}</li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => router.push(`/dashboard/alerts/${selectedItem.data.id}`)}
                                    className="w-full mt-4 bg-blue-900 text-white py-2 rounded-sm text-sm font-medium hover:bg-blue-800 transition-colors"
                                >
                                    View Full Details
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <MapPin className="h-12 w-12 text-gray-300 mb-2" />
                            <p>Click on a vendor or payment marker to view details.</p>
                            <p className="text-xs mt-2">Real-time data updates every 10 seconds</p>
                            <div className="mt-6 space-y-2 text-left w-full">
                                <div className="flex items-center text-sm">
                                    <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                                    <span>Square markers = Vendors</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                                    <span>Circle markers = Payments</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <div className="w-4 h-4 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded mr-2"></div>
                                    <span>Heatmap = Payment density</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
