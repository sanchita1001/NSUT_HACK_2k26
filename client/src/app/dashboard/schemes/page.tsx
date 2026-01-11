"use client";

import { useState, useEffect } from "react";
import { Plus, Search, FileText, CheckCircle, Clock, AlertOctagon, Trash2, AlertTriangle } from "lucide-react";
import { Scheme } from "@fds/common";
import { apiCall } from "@/lib/config";

export default function SchemesPage() {
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteError, setDeleteError] = useState<{ schemeId: string, message: string, dependencies: any } | null>(null);

    useEffect(() => {
        apiCall<Scheme[]>('/schemes')
            .then(res => {
                setSchemes(res);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', ministry: '', budget: '', description: '', status: 'ACTIVE' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Generate a temporary ID (in production this should be handled by backend or UUID)
            const generatedId = `SCH-${Math.floor(Math.random() * 10000).toString().padStart(3, '0')}`;

            await apiCall('/schemes', {
                method: 'POST',
                body: JSON.stringify({
                    id: generatedId,
                    name: formData.name,
                    ministry: formData.ministry,
                    budgetAllocated: parseInt(formData.budget),
                    description: formData.description,
                    status: formData.status
                })
            });
            setShowModal(false);
            // Reload list
            const res = await apiCall<Scheme[]>('/schemes');
            setSchemes(res);
            setFormData({ name: '', ministry: '', budget: '', description: '', status: 'ACTIVE' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (schemeId: string) => {
        try {
            setDeleteError(null);
            await apiCall(`/schemes/${schemeId}`, { method: 'DELETE' });
            // Reload list
            const res = await apiCall<Scheme[]>('/schemes');
            setSchemes(res);
        } catch (error: any) {
            // apiCall throws error object, need to check structure
            if (error.message && error.message.includes('409')) {
                // Re-fetch to get dependencies if the error object contained them?
                // apiCall doesn't currently return the error body in the thrown error easily unless we parse it.
                // The error from apiCall is a generic Error with message.
                // For now, let's just show a generic alert or try to parse if possible.
                // To properly handle 409 body, apiCall needs to be improved or we catch differently.
                // Assuming the message contains the info or we rely on a simpler check.
                alert("Cannot delete scheme due to existing dependencies.");
            } else {
                console.error('Delete error:', error);
            }
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Scheme Registry</h1>
                    <p className="text-sm text-gray-500">Manage government schemes, budget allocations, and active phases.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 border border-transparent rounded-sm bg-blue-900 text-sm font-medium text-white hover:bg-blue-800 shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Register New Scheme
                </button>
            </div>

            {/* Delete Error Modal */}
            {deleteError && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                            <h2 className="text-lg font-bold text-red-900">Cannot Delete Scheme</h2>
                        </div>
                        <p className="text-gray-700 mb-4">{deleteError.message}</p>
                        <div className="bg-red-50 p-3 rounded mb-4">
                            <p className="text-sm font-semibold text-red-900">Dependencies:</p>
                            <p className="text-sm text-red-700">• {deleteError.dependencies.alerts} alert(s)</p>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setDeleteError(null)}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4 text-gray-900">Register New Scheme</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Scheme Name</label>
                                <input required className="w-full border p-2 rounded text-gray-900" placeholder="e.g. PM-VISHWAKARMA" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ministry</label>
                                <input required className="w-full border p-2 rounded text-gray-900" placeholder="e.g. MSME" value={formData.ministry} onChange={e => setFormData({ ...formData, ministry: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Budget (₹)</label>
                                <input required type="number" className="w-full border p-2 rounded text-gray-900" placeholder="50000000" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    className="w-full border p-2 rounded bg-white text-gray-900"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="PILOT">PILOT</option>
                                    <option value="PAUSED">PAUSED</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea className="w-full border p-2 rounded text-gray-900" placeholder="Brief summary..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800">Create Scheme</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? <p>Loading Registry...</p> : schemes.map((scheme) => (
                    <div key={scheme.id} className="bg-white rounded-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className={`h-1.5 w-full ${scheme.status === 'ACTIVE' ? 'bg-green-500' :
                            scheme.status === 'PILOT' ? 'bg-blue-500' : 'bg-gray-300'
                            }`}></div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-50 rounded-sm">
                                    <FileText className="h-6 w-6 text-blue-700" />
                                </div>
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${scheme.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                    scheme.status === 'PILOT' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {scheme.status}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{scheme.name}</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">{scheme.ministry}</p>

                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{scheme.description}</p>

                            <div className="border-t border-gray-100 pt-4 mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs text-gray-800 uppercase">Budget Allocated</p>
                                    <p className="text-xs text-gray-500">{(scheme as any).usageCount || 0} alerts</p>
                                </div>
                                <p className="text-lg font-mono font-medium text-gray-900">₹{(scheme.budgetAllocated / 10000000).toFixed(1)} Cr</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-xs text-blue-600 font-medium">View Rules & Policy</span>
                            <button
                                onClick={() => handleDelete(scheme.id)}
                                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
                            >
                                <Trash2 className="h-3 w-3" />
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
