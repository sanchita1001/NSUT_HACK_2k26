"use client";

import { useState, useEffect } from "react";
import { Plus, Search, FileText, CheckCircle, Clock, AlertOctagon } from "lucide-react";
import { Scheme } from "@fds/common";

export default function SchemesPage() {
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8000/schemes')
            .then(res => res.json())
            .then(data => {
                setSchemes(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', ministry: '', budget: '', description: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('http://localhost:8000/schemes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: formData.name,
                ministry: formData.ministry,
                budgetAllocated: parseInt(formData.budget),
                description: formData.description
            })
        });
        setShowModal(false);
        // Reload list
        const res = await fetch('http://localhost:8000/schemes');
        setSchemes(await res.json());
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4">Register New Scheme</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Scheme Name</label>
                                <input required className="w-full border p-2 rounded" placeholder="e.g. PM-VISHWAKARMA" onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ministry</label>
                                <input required className="w-full border p-2 rounded" placeholder="e.g. MSME" onChange={e => setFormData({ ...formData, ministry: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Budget (₹)</label>
                                <input required type="number" className="w-full border p-2 rounded" placeholder="50000000" onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea className="w-full border p-2 rounded" placeholder="Brief summary..." onChange={e => setFormData({ ...formData, description: e.target.value })} />
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
                                <p className="text-xs text-gray-400 uppercase">Budget Allocated</p>
                                <p className="text-lg font-mono font-medium text-gray-900">₹{(scheme.budgetAllocated / 10000000).toFixed(1)} Cr</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs text-blue-600 font-medium">
                            <span>View Rules & Policy</span>
                            <Clock className="h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
