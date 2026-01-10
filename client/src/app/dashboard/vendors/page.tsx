"use client";

import { useState, useEffect } from "react";
import { Search, Building2, AlertTriangle, ArrowUpRight, Trash2, XCircle } from "lucide-react";
import { Vendor } from "@fds/common";
import Link from "next/link";

import api from "@/lib/api";

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [deleteImpact, setDeleteImpact] = useState<{ vendorId: string, message: string, impact: any } | null>(null);

    useEffect(() => {
        api.get('/vendors')
            .then(res => setVendors(res.data))
            .catch(err => console.error(err));
    }, []);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', gstin: '', riskScore: 10 });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/vendors', {
                name: formData.name,
                gstin: formData.gstin,
                riskScore: formData.riskScore,
                totalVolume: 0,
                flaggedTransactions: 0,
                accountStatus: 'ACTIVE'
            });
            setShowModal(false);
            const res = await api.get('/vendors');
            setVendors(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (vendorId: string, confirm: boolean = false) => {
        try {
            setDeleteImpact(null);
            await api.delete(`/vendors/${vendorId}${confirm ? '?confirm=true' : ''}`);
            // Reload list
            const res = await api.get('/vendors');
            setVendors(res.data);
        } catch (error: any) {
            if (error.response?.status === 409) {
                // Impact analysis - requires confirmation
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
                        <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4">Register New Vendor</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
                                <input required className="w-full border p-2 rounded" placeholder="Agro Tech Pvt Ltd" onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">GSTIN / ID</label>
                                <input required className="w-full border p-2 rounded" placeholder="09AAAAA0000A1Z5" onChange={e => setFormData({ ...formData, gstin: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Initial Risk Score (0-100)</label>
                                <input required type="number" min="0" max="100" className="w-full border p-2 rounded" defaultValue={10} onChange={e => setFormData({ ...formData, riskScore: parseInt(e.target.value) })} />
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Entity</th>
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
                                        <Building2 className="h-4 w-4 text-gray-400 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">{v.name}</span>
                                    </div>
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
