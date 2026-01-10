"use client";

import { useState } from "react";
import { Play, AlertCircle, CheckCircle, TrendingUp, DollarSign } from "lucide-react";
import { API_ENDPOINTS, apiCall } from "@/lib/config";

export default function SimulatorPage() {
    const [amount, setAmount] = useState("500000");
    const [scheme, setScheme] = useState("PM-KISAN");
    const [vendor, setVendor] = useState("");
    const [beneficiary, setBeneficiary] = useState("");
    const [district, setDistrict] = useState("North Delhi");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const schemes = [
        "PM-KISAN",
        "MGNREGA",
        "Ayushman Bharat",
        "PM Awas Yojana",
        "Swachh Bharat Mission",
        "National Health Mission",
        "Pradhan Mantri Gram Sadak Yojana",
        "Mid-Day Meal Scheme"
    ];

    const districts = [
        "North Delhi",
        "South Delhi",
        "East Delhi",
        "West Delhi",
        "Central Delhi"
    ];

    const generateRandomVendor = () => {
        const vendors = [
            "ABC Enterprises",
            "XYZ Solutions",
            "Tech Innovations Ltd",
            "Global Services Inc",
            "Prime Contractors",
            "Elite Suppliers",
            "Metro Distributors",
            "Urban Logistics"
        ];
        return vendors[Math.floor(Math.random() * vendors.length)];
    };

    const handleSimulate = async () => {
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const vendorName = vendor || generateRandomVendor();
            const beneficiaryName = beneficiary || `Beneficiary-${Math.floor(Math.random() * 10000)}`;

            // Create real transaction through alert endpoint
            // This will trigger ML detection, create alert, write audit logs
            const response = await apiCall<any>(API_ENDPOINTS.ALERTS, {
                method: 'POST',
                body: JSON.stringify({
                    amount: Number(amount),
                    scheme,
                    vendor: vendorName,
                    beneficiary: beneficiaryName,
                    district,
                    description: `Simulated transaction for ${scheme}`
                })
            });

            setResult({
                success: true,
                alert: response,
                message: "Transaction processed successfully through fraud detection pipeline"
            });

        } catch (err: any) {
            setError(err.message || "Simulation failed");
        } finally {
            setLoading(false);
        }
    };

    const runBatchSimulation = async () => {
        setLoading(true);
        setError("");

        try {
            const transactions = [];
            const count = 5;

            for (let i = 0; i < count; i++) {
                const randomAmount = Math.floor(Math.random() * 2000000) + 100000;
                const randomScheme = schemes[Math.floor(Math.random() * schemes.length)];
                const randomDistrict = districts[Math.floor(Math.random() * districts.length)];

                const response = await apiCall<any>(API_ENDPOINTS.ALERTS, {
                    method: 'POST',
                    body: JSON.stringify({
                        amount: randomAmount,
                        scheme: randomScheme,
                        vendor: generateRandomVendor(),
                        beneficiary: `Beneficiary-${Math.floor(Math.random() * 10000)}`,
                        district: randomDistrict,
                        description: `Batch simulation ${i + 1}/${count}`
                    })
                });

                transactions.push(response);

                // Small delay between transactions
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            setResult({
                success: true,
                batch: true,
                transactions,
                message: `Successfully created ${count} transactions`
            });

        } catch (err: any) {
            setError(err.message || "Batch simulation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transaction Simulator</h1>
                <p className="text-gray-600 mt-1">Generate test transactions through the fraud detection pipeline</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-blue-900 text-sm">Integrated Simulator</p>
                        <p className="text-sm text-blue-800 mt-1">
                            This simulator creates real transactions that:
                        </p>
                        <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                            <li>Trigger ML fraud detection</li>
                            <li>Generate alerts if risky</li>
                            <li>Update dashboard statistics</li>
                            <li>Write to audit logs</li>
                            <li>Appear in recent activity</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Single Transaction Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Play className="h-5 w-5" />
                        Single Transaction
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="500000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Scheme
                            </label>
                            <select
                                value={scheme}
                                onChange={(e) => setScheme(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {schemes.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vendor (optional)
                            </label>
                            <input
                                type="text"
                                value={vendor}
                                onChange={(e) => setVendor(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Auto-generated if empty"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Beneficiary (optional)
                            </label>
                            <input
                                type="text"
                                value={beneficiary}
                                onChange={(e) => setBeneficiary(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Auto-generated if empty"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                District
                            </label>
                            <select
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {districts.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleSimulate}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Play className="h-5 w-5" />
                                    Simulate Transaction
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Batch Simulation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Batch Simulation
                    </h2>

                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-700 mb-3">
                                Generate 5 random transactions with varying:
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                                <li>Amounts (₹100K - ₹2M)</li>
                                <li>Schemes (random selection)</li>
                                <li>Vendors (auto-generated)</li>
                                <li>Districts (random)</li>
                            </ul>
                        </div>

                        <button
                            onClick={runBatchSimulation}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="h-5 w-5" />
                                    Run Batch Simulation
                                </>
                            )}
                        </button>
                    </div>

                    {/* Result Display */}
                    {result && (
                        <div className="mt-6">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-green-900 text-sm">Success</p>
                                        <p className="text-sm text-green-800 mt-1">{result.message}</p>

                                        {result.batch ? (
                                            <div className="mt-3 space-y-2">
                                                {result.transactions?.map((tx: any, idx: number) => (
                                                    <div key={idx} className="bg-white p-3 rounded border border-green-200">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-gray-900">{tx.id}</span>
                                                            <span className={`text-xs px-2 py-1 rounded-full ${tx.riskScore > 70 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                Risk: {tx.riskScore}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            ₹{tx.amount.toLocaleString()} • {tx.scheme}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : result.alert && (
                                            <div className="mt-3 bg-white p-3 rounded border border-green-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-900">{result.alert.id}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${result.alert.riskScore > 70 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        Risk: {result.alert.riskScore}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <span className="text-gray-500">Amount:</span>
                                                        <span className="ml-1 font-medium">₹{result.alert.amount.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Status:</span>
                                                        <span className="ml-1 font-medium">{result.alert.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-red-900 text-sm">Error</p>
                                    <p className="text-sm text-red-800 mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
