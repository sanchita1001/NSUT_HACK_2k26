"use client";

import { useState, useEffect } from "react";
import { Search, Building2, AlertTriangle, ArrowUpRight, Trash2, XCircle, MapPin, Loader2 } from "lucide-react";
import { Vendor } from "@fds/common";
import Link from "next/link";
import api from "@/lib/api";

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [schemes, setSchemes] = useState<any[]>([]);
    const [deleteImpact, setDeleteImpact] = useState<{ vendorId: string, message: string, impact: any } | null>(null);

    useEffect(() => {
        // Fetch Vendors
        api.get('/vendors')
            .then(res => setVendors(res.data))
            .catch(err => console.error(err));

        // Fetch Schemes for Dropdown
        api.get('/schemes')
            .then(res => setSchemes(res.data))
            .catch(err => console.error(err));
    }, []);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        gstin: '',
        riskScore: 0,
        address: '',
        selectedScheme: '',
        latitude: '',
        longitude: '',
        paymentBehavior: 'REGULAR',
        expectedMinAmount: '',
        expectedMaxAmount: '',
        timingToleranceDays: '0'
    });
    const [geocoding, setGeocoding] = useState(false);

    const fetchCoordinates = async () => {
        if (!formData.address) return;
        setGeocoding(true);
        try {
            // Using OpenStreetMap Nominatim (Free, No Key Required for demo)
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                setFormData(prev => ({
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
        try {
            await api.post('/vendors', {
                id: `VEN-${Math.floor(1000 + Math.random() * 9000)}`,
                name: formData.name,
                gstin: formData.gstin,
                address: formData.address || 'Unknown',
                riskScore: formData.riskScore,
                selectedScheme: formData.selectedScheme,
                latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
                longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
                paymentBehavior: formData.paymentBehavior,
                expectedMinAmount: formData.expectedMinAmount ? parseFloat(formData.expectedMinAmount) : 0,
                expectedMaxAmount: formData.expectedMaxAmount ? parseFloat(formData.expectedMaxAmount) : 0,
                timingToleranceDays: formData.timingToleranceDays ? parseInt(formData.timingToleranceDays) : 0,
                totalVolume: 0,
                flaggedTransactions: 0,
                accountStatus: 'ACTIVE'
            });
            setShowModal(false);
            const res = await api.get('/vendors');
            setVendors(res.data);
            setFormData({ name: '', gstin: '', riskScore: 0, address: '', selectedScheme: '', latitude: '', longitude: '', paymentBehavior: 'REGULAR', expectedMinAmount: '', expectedMaxAmount: '', timingToleranceDays: '0' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (vendorId: string, confirm: boolean = false) => {
        try {
            setDeleteImpact(null);
            await api.delete(`/vendors/${vendorId}${confirm ? '?confirm=true' : ''}`);
            const res = await api.get('/vendors');
            setVendors(res.data);
        } catch (error: any) {
            if (error.response?.status === 409) {
                setDeleteImpact({
                    vendorId,
                    message: error.response.data.message,
                    impact: error.response.data.impact
                });
            } else {
                console.error('Delete error:', error);
            }
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vendor Intelligence</h1>
                    <p className="text-sm text-gray-500">Monitor contractors, suppliers, and direct beneficiaries.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-4 py-2 border border-transparent rounded-sm bg-blue-900 text-sm font-medium text-white hover:bg-blue-800 shadow-sm"
                    >
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Register Vendor
                    </button>
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-800" />
                        <input type="text" placeholder="Search Vendor Name / GSTIN" className="pl-10 pr-4 py-2 border border-gray-300 rounded-sm w-64 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                </div>
            </div>

            {/* Delete Impact Modal */}
            {deleteImpact && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="h-6 w-6 text-orange-600" />
                            <h2 className="text-lg font-bold text-orange-900">Confirm Vendor Deletion</h2>
                        </div>
                        <p className="text-gray-700 mb-4">{deleteImpact.message}</p>
                        <div className="bg-orange-50 p-3 rounded mb-4">
                            <p className="text-sm font-semibold text-orange-900">Impact:</p>
                            <p className="text-sm text-orange-700">• {deleteImpact.impact.alerts} alert(s) reference this vendor</p>
                            <p className="text-sm text-gray-600 mt-2">Historical alert data will be preserved.</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteImpact(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete(deleteImpact.vendorId, true);
                                    setDeleteImpact(null);
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-gray-800">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4">Register New Vendor</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
                                <input required className="w-full border p-2 rounded" placeholder="Agro Tech Pvt Ltd" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">GSTIN / ID</label>
                                <input required className="w-full border p-2 rounded" placeholder="09AAAAA0000A1Z5" value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Address / City</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            required
                                            className="w-full border p-2 rounded pr-8"
                                            placeholder="New Delhi"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                        <MapPin className="w-4 h-4 text-gray-400 absolute right-2 top-3" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={fetchCoordinates}
                                        disabled={!formData.address || geocoding}
                                        className="px-3 py-2 bg-blue-100 text-blue-700 text-xs font-bold rounded hover:bg-blue-200 disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {geocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                                        Geocode
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={formData.latitude}
                                    readOnly
                                    className="w-1/2 border p-2 rounded bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                                    placeholder="Lat"
                                />
                                <input
                                    type="text"
                                    value={formData.longitude}
                                    readOnly
                                    className="w-1/2 border p-2 rounded bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                                    placeholder="Lng"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Associated Scheme</label>
                                <select
                                    className="w-full border p-2 rounded bg-white"
                                    value={formData.selectedScheme}
                                    onChange={e => setFormData({ ...formData, selectedScheme: e.target.value })}
                                >
                                    <option value="">Select Primary Scheme</option>
                                    {schemes.map((s: any) => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Payment Behavior</label>
                                    <select
                                        className="w-full border p-2 rounded bg-white"
                                        value={formData.paymentBehavior}
                                        onChange={e => setFormData({ ...formData, paymentBehavior: e.target.value })}
                                    >
                                        <option value="REGULAR">Regular (Monthly)</option>
                                        <option value="QUARTERLY">Quarterly</option>
                                        <option value="MILESTONE">Milestone-based</option>
                                        <option value="IRREGULAR">Irregular / Ad-hoc</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tolerance (Days)</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded"
                                        placeholder="0"
                                        value={formData.timingToleranceDays}
                                        onChange={e => setFormData({ ...formData, timingToleranceDays: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Min Amount (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded"
                                        placeholder="10000"
                                        value={formData.expectedMinAmount}
                                        onChange={e => setFormData({ ...formData, expectedMinAmount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max Amount (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded"
                                        placeholder="500000"
                                        value={formData.expectedMaxAmount}
                                        onChange={e => setFormData({ ...formData, expectedMaxAmount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Initial Risk Score (0-100)</label>
                                <input required type="number" min="0" max="100" className="w-full border p-2 rounded" value={formData.riskScore} onChange={e => setFormData({ ...formData, riskScore: parseInt(e.target.value) })} />
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800">Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Vendor Entity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GSTIN / ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Volume</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {vendors.map((v) => (
                            <tr key={v.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Building2 className="h-4 w-4 text-gray-800 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">{v.name}</span>
                                    </div>
                                    {/* Show enrolled schemes if any */}
                                    {v.operatingSchemes && v.operatingSchemes.length > 0 && (
                                        <div className="ml-7 mt-1 text-xs text-blue-600">
                                            {v.operatingSchemes.join(", ")}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{v.gstin}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-1 h-2 w-24 bg-gray-200 rounded-full overflow-hidden mr-2">
                                            <div className={`h-full ${v.riskScore > 80 ? 'bg-red-500' :
                                                v.riskScore > 50 ? 'bg-orange-500' : 'bg-green-500'
                                                }`} style={{ width: `${v.riskScore}%` }}></div>
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">{v.riskScore}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{(v.totalVolume / 100000).toFixed(2)} L</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${v.accountStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                        }`}>{v.accountStatus}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex justify-end items-center gap-3">
                                        <Link href={`/dashboard/vendors/${v.id}`} className="text-blue-600 hover:text-blue-900 text-xs font-medium flex items-center">
                                            Analysis <ArrowUpRight className="h-3 w-3 ml-1" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(v.id)}
                                            className="text-red-600 hover:text-red-900 text-xs font-medium flex items-center gap-1"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
