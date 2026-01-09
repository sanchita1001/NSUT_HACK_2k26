"use client";

import { useState } from "react";
import { Zap, PlayCircle, Loader2, CheckCircle } from "lucide-react";

export default function SimulatorPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);

    const handleSimulate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        // Mock API call simulation
        setTimeout(() => {
            setLoading(false);
            setResult({
                riskScore: 88,
                status: "FLAGGED",
                reasons: ["Amount exceeds daily threshold (300%)", "New Beneficiary Account"],
                id: "SIM-2026-X99"
            });
        }, 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Fraud Scenario Simulator</h1>
                <p className="text-gray-500 mt-2">Inject synthetic transaction patterns to test the ML Engine.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <PlayCircle className="h-5 w-5 mr-2 text-blue-600" />
                        Transaction Parameters
                    </h2>
                    <form onSubmit={handleSimulate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Scheme</label>
                            <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm">
                                <option>PM-KISAN</option>
                                <option>MGNREGA</option>
                                <option>Direct Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                            <input type="number" defaultValue={50000} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Beneficiary ID</label>
                            <input type="text" defaultValue="BEN-NEW-001" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Geo Location</label>
                            <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm">
                                <option>Lucknow (High Risk Zone)</option>
                                <option>Mumbai (Normal)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Run Simulation"}
                        </button>
                    </form>
                </div>

                {/* Output Console */}
                <div className="bg-slate-950 p-6 rounded-lg shadow-inner font-mono text-sm text-green-400 overflow-hidden relative">
                    <div className="absolute top-4 right-4 animate-pulse">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    </div>
                    <h3 className="text-slate-400 font-bold mb-4 uppercase tracking-wider">Engine Output</h3>

                    <div className="space-y-2">
                        <p> Initializing Risk Engine v2.1...</p>
                        <p> Loading Geospatial Context...</p>
                        {loading && (
                            <>
                                <p className="opacity-80"> Analyzing relational graph...</p>
                                <p className="opacity-80"> Querying Scheme Limits...</p>
                            </>
                        )}
                        {result && (
                            <div className="mt-4 pt-4 border-t border-slate-800 animation-fade-in">
                                <p className="text-white font-bold bg-red-900/30 p-2 border border-red-900 inline-block mb-2">
                                    ⚠ ALERT GENERATED: ID {result.id}
                                </p>
                                <p>Risk Score: <span className="text-red-500 font-bold">{result.riskScore}/100</span></p>
                                <p>Status: {result.status}</p>
                                <p className="mt-2 text-slate-300">Detection Logic:</p>
                                <ul className="list-disc list-inside text-slate-400 pl-2">
                                    {result.reasons.map((r: string, i: number) => (
                                        <li key={i}>{r}</li>
                                    ))}
                                </ul>

                                <div className="mt-6">
                                    <button className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-2" />
                                        View in Dashboard
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
