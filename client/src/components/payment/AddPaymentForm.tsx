'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useMapUpdate } from '@/contexts/MapUpdateContext';
import { Loader2, CheckCircle, AlertTriangle, XCircle, ShieldCheck, MapPin, Search } from 'lucide-react';

export default function AddPaymentForm() {
    const { triggerMapUpdate } = useMapUpdate();
    const [paymentMode, setPaymentMode] = useState<'EXISTING' | 'NEW'>('EXISTING');

    const [formData, setFormData] = useState({
        amount: '',
        scheme: '',
        vendor: '', // Stores Vendor Name for Existing
        description: ''
    });

    // New Vendor specific state
    const [newVendor, setNewVendor] = useState({
        name: '',
        id: `VEN-${Math.floor(1000 + Math.random() * 9000)}`, // Auto-gen ID
        gstin: '',
        address: '',
        latitude: '',
        longitude: ''
    });

    const [geocoding, setGeocoding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    // Data Sources
    const [vendors, setVendors] = useState<any[]>([]);
    const [schemes, setSchemes] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const refreshData = async () => {
        try {
            const [vRes, sRes] = await Promise.all([
                api.get('/vendors'),
                api.get('/schemes')
            ]);
            setVendors(vRes.data || []);
            setSchemes(sRes.data || []);
        } catch (e) {
            console.error("Failed to load form resources", e);
        }
    };

    useEffect(() => {
        const load = async () => {
            await refreshData();
            setLoadingData(false);
        };
        load();
    }, []);

    const fetchCoordinates = async () => {
        if (!newVendor.address) return;
        setGeocoding(true);
        try {
            // Using OpenStreetMap Nominatim (Free, No Key Required for demo)
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newVendor.address)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                setNewVendor(prev => ({
                    ...prev,
                    latitude: data[0].lat,
                    longitude: data[0].lon
                }));
            } else {
                alert("Could not find coordinates for this address.");
            }
        } catch (e) {
            alert("Geocoding failed. Please enter coordinates manually if known.");
        } finally {
            setGeocoding(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            let targetVendorName = formData.vendor;

            // Step 1: Request to Create Vendor if NEW mode
            if (paymentMode === 'NEW') {
                if (!newVendor.name) throw new Error("Vendor Name is required");

                // Register the new vendor with Location
                await api.post('/vendors', {
                    id: newVendor.id,
                    name: newVendor.name,
                    gstin: newVendor.gstin || 'Unregistered',
                    address: newVendor.address || 'Unknown',
                    latitude: newVendor.latitude ? parseFloat(newVendor.latitude) : undefined,
                    longitude: newVendor.longitude ? parseFloat(newVendor.longitude) : undefined,
                    riskScore: 0, // Default to 0 for new vendors as per requirement
                    status: 'ACTIVE'
                });

                targetVendorName = newVendor.name;
                refreshData();

                // Trigger map update for new vendor
                triggerMapUpdate();
            }

            // Step 2: Process Transaction
            const { data } = await api.post('/alerts', {
                amount: Number(formData.amount),
                scheme: formData.scheme,
                vendor: targetVendorName,
                description: formData.description
            });
            setResult(data);

            // Trigger map update for new payment
            triggerMapUpdate();

            // Reset if successful
            if (paymentMode === 'NEW') {
                setPaymentMode('EXISTING');
                setFormData(prev => ({ ...prev, vendor: targetVendorName }));
            }

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Transaction failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNewVendorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewVendor({ ...newVendor, [e.target.name]: e.target.value });
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="w-8 h-8 opacity-90" />
                        <h2 className="text-2xl font-bold tracking-tight">Secure Payment Gateway</h2>
                    </div>
                    <p className="text-blue-100 opacity-90">Process transaction with real-time AI fraud detection</p>
                </div>

                <div className="p-8">
                    {loadingData ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Amount (₹)</label>
                                        <input
                                            type="number"
                                            name="amount"
                                            required
                                            value={formData.amount}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-gray-900"
                                            placeholder="e.g. 50000"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Scheme / Agency</label>
                                        <select
                                            name="scheme"
                                            required
                                            value={formData.scheme}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white text-gray-900"
                                        >
                                            <option value="">Select Scheme</option>
                                            {schemes.map((s: any) => (
                                                <option key={s.id} value={s.name}>
                                                    {s.name} (Budget: {s.budgetAllocated}Cr)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Beneficiary Vendor</label>

                                        {/* Toggle */}
                                        <div className="flex bg-gray-100 p-1 rounded-lg mb-2">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMode('EXISTING')}
                                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${paymentMode === 'EXISTING' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                Select Existing
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMode('NEW')}
                                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${paymentMode === 'NEW' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                + Register New
                                            </button>
                                        </div>

                                        {paymentMode === 'EXISTING' ? (
                                            <select
                                                name="vendor"
                                                required // Only required if mode is EXISTING
                                                value={formData.vendor}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white text-gray-900"
                                            >
                                                {/* Logic to create a fake empty option if selected to force change? No, standard select */}
                                                <option value="">Search Registered Vendors...</option>
                                                {vendors.map((v: any) => (
                                                    <option key={v.id} value={v.name}>
                                                        {v.name} ({v.id})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                                <div>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        required
                                                        value={newVendor.name}
                                                        onChange={handleNewVendorChange}
                                                        className="w-full px-3 py-2 rounded border border-blue-200 focus:ring-2 focus:ring-blue-200 outline-none text-sm text-gray-900"
                                                        placeholder="New Vendor Name"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            name="address"
                                                            value={newVendor.address}
                                                            onChange={handleNewVendorChange}
                                                            className="w-full px-3 py-2 rounded border border-blue-200 focus:ring-2 focus:ring-blue-200 outline-none text-sm text-gray-900 pr-8"
                                                            placeholder="Address (City, State)"
                                                        />
                                                        <MapPin className="w-4 h-4 text-gray-400 absolute right-2 top-2.5" />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={fetchCoordinates}
                                                        disabled={!newVendor.address || geocoding}
                                                        className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        {geocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                                                        Geocode
                                                    </button>
                                                </div>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="text"
                                                        name="latitude"
                                                        value={newVendor.latitude}
                                                        readOnly
                                                        className="w-1/2 px-3 py-2 rounded border border-blue-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                                                        placeholder="Lat"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="longitude"
                                                        value={newVendor.longitude}
                                                        readOnly
                                                        className="w-1/2 px-3 py-2 rounded border border-blue-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                                                        placeholder="Lng"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Description (Optional)</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={2}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-gray-900"
                                            placeholder="Purpose of payment..."
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {paymentMode === 'NEW' ? 'Registering & Processing...' : 'Analyzing Transaction...'}
                                        </>
                                    ) : (
                                        'Process Payment'
                                    )}
                                </button>
                            </form>

                            {/* RESULTS SECTION */}
                            {result && (
                                <div className={`mt-8 p-6 rounded-xl border-l-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${result.isAnomaly ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
                                    <div className="flex items-start gap-4">
                                        {result.isAnomaly ? (
                                            <AlertTriangle className="w-8 h-8 text-red-600" />
                                        ) : (
                                            <CheckCircle className="w-8 h-8 text-green-600" />
                                        )}

                                        <div className="flex-1">
                                            <h3 className={`text-xl font-bold mb-1 ${result.isAnomaly ? 'text-red-800' : 'text-green-800'}`}>
                                                Risk Assessment: {result.isAnomaly ? 'Anomaly Detected' : 'Standard Transaction'}
                                            </h3>
                                            <div className="text-sm font-medium opacity-80 mb-4 text-gray-800">
                                                Fraud Score: <span className="text-lg font-bold">{result.riskScore}/100</span>
                                            </div>

                                            {result.mlReasons && result.mlReasons.length > 0 && (
                                                <div className="bg-white/60 p-4 rounded-lg">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-800 opacity-60 mb-2">Analysis Findings</p>
                                                    <ul className="space-y-1">
                                                        {result.mlReasons.map((r: string, i: number) => (
                                                            <li key={i} className="text-sm font-medium flex items-center gap-2 text-gray-800">
                                                                • {r}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="mt-4 text-xs text-gray-500">
                                                Alert ID: {result.id} | Timestamp: {new Date(result.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-3">
                                    <XCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="font-medium">{error}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
