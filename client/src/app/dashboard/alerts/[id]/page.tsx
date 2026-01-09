"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    AlertTriangle,
    CheckCircle,
    Info,
    Shield,
    User,
    Clock,
    FileText,
    MapPin
} from "lucide-react";

// Types
interface AlertDetail {
    id: string;
    scheme: string;
    riskScore: number;
    riskLevel: string;
    amount: number;
    beneficiary: string;
    account: string;
    district: string;
    timestamp: string;
    state: string;
    mlReasons: string[];
    hierarchy: { role: string; name: string; status: string; time: string }[];
}

const timelineSteps = [
    { label: "Initiated", status: "completed", date: "Jan 9, 10:15 AM" },
    { label: "Partially Released", status: "current", date: "Jan 9, 10:42 AM" },
    { label: "Corrected", status: "upcoming", date: "-" },
    { label: "Finalized", status: "upcoming", date: "-" }
];

export default function AlertDetailPage({ params }: { params: { id: string } }) {
    const [alertDetail, setAlertDetail] = useState<AlertDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionNote, setActionNote] = useState("");

    useEffect(() => {
        async function fetchDetail() {
            try {
                const res = await fetch(`http://localhost:8000/alerts/${params.id}`);
                if (!res.ok) throw new Error("Alert not found");
                const data = await res.json();
                setAlertDetail(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDetail();
    }, [params.id]);

    if (loading) return <div className="p-10 text-center">Loading Investigation Context...</div>;
    if (error || !alertDetail) return <div className="p-10 text-center text-red-600">Error: {error || "Alert not found"}</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link href="/dashboard/alerts" className="flex items-center text-sm text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Alerts
                </Link>
                <div className="bg-red-50 text-red-800 text-xs px-3 py-1 rounded-full font-medium border border-red-200 flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    System Generated Alert - Verify Manually
                </div>
            </div>

            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center space-x-3">
                        <h1 className="text-2xl font-bold text-gray-900">{alertDetail.id}</h1>
                        <span className="bg-red-100 text-red-800 text-sm font-bold px-2 py-0.5 rounded-sm border border-red-200">
                            RISK SCORE: {alertDetail.riskScore}/100
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Detected during <span className="font-semibold text-gray-900">{alertDetail.state}</span> phase
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Transaction Amount</p>
                    <p className="text-2xl font-mono font-bold text-gray-900">₹{alertDetail.amount.toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col: Context */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Transaction State */}
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6">Transaction Lifecycle</h3>
                        <div className="relative flex items-center justify-between">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 mt-[-10px]"></div>
                            {timelineSteps.map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white ${step.status === 'completed' ? 'border-green-500 text-green-500' :
                                        step.status === 'current' ? 'border-blue-600 text-blue-600 ring-4 ring-blue-50' :
                                            'border-gray-300 text-gray-300'
                                        }`}>
                                        {step.status === 'completed' ? <CheckCircle className="h-4 w-4" /> :
                                            step.status === 'current' ? <div className="h-2.5 w-2.5 bg-blue-600 rounded-full" /> :
                                                <div className="h-2.5 w-2.5 bg-gray-300 rounded-full" />}
                                    </div>
                                    <p className={`text-xs mt-2 font-medium ${step.status === 'current' ? 'text-blue-900' : 'text-gray-500'}`}>{step.label}</p>
                                    <p className="text-[10px] text-gray-400">{step.date}</p>
                                </div>
                            ))}
                        </div>

                        {/* XAI: Explainable AI Section */}
                        <div className="mt-8 border-t border-gray-100 pt-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
                                <div className="h-2 w-2 bg-purple-500 rounded-full mr-2"></div>
                                AI Model Explanation (SHAP Values)
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center text-xs">
                                    <span className="w-32 text-gray-500">Transaction Amount</span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full mx-2 overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: '85%' }}></div>
                                    </div>
                                    <span className="w-12 text-right font-mono text-red-600">+85%</span>
                                </div>
                                <div className="flex items-center text-xs">
                                    <span className="w-32 text-gray-500">Agency Deviance</span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full mx-2 overflow-hidden">
                                        <div className="h-full bg-orange-500" style={{ width: '45%' }}></div>
                                    </div>
                                    <span className="w-12 text-right font-mono text-orange-600">+45%</span>
                                </div>
                                <div className="flex items-center text-xs">
                                    <span className="w-32 text-gray-500">Benford's Law</span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full mx-2 overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: '15%' }}></div>
                                    </div>
                                    <span className="w-12 text-right font-mono text-blue-600">+15%</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 italic">*Positive values indicate contribution towards "Fraud" classification.</p>
                            </div>
                        </div>
                    </div>

                    {/* ML Insights */}
                    <div className="bg-white p-6 rounded-sm shadow-sm border-l-4 border-l-red-500 border-y border-r border-gray-200">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                            Risk Factors & Anomaly Detection
                        </h3>
                        <ul className="space-y-3">
                            {alertDetail.mlReasons.map((reason, idx) => (
                                <li key={idx} className="flex items-start text-sm text-gray-800 bg-red-50 p-3 rounded-sm border border-red-100">
                                    <Info className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                    {reason}
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-gray-500 mt-4 italic border-t pt-2">
                            * Confidence scores are derived from Ensemble Models (Isolation Forest + LSTM).
                        </p>
                    </div>

                    {/* Entity Details */}
                    <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                            <h3 className="text-sm font-bold text-gray-700">Entity & Scheme Context</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Beneficiary</p>
                                <div className="flex items-center mt-1">
                                    <User className="h-4 w-4 text-gray-400 mr-2" />
                                    <p className="text-sm font-medium text-gray-900">{alertDetail.beneficiary}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Scheme</p>
                                <div className="flex items-center mt-1">
                                    <FileText className="h-4 w-4 text-gray-400 mr-2" />
                                    <p className="text-sm font-medium text-gray-900">{alertDetail.scheme}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Region</p>
                                <div className="flex items-center mt-1">
                                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                    <p className="text-sm font-medium text-gray-900">{alertDetail.district}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Account</p>
                                <p className="text-sm font-medium text-gray-900 mt-1">{alertDetail.account}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Action & History */}
                <div className="space-y-6">
                    {/* Action Panel */}
                    <div className="bg-blue-50 p-6 rounded-sm shadow-sm border border-blue-100">
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-4">Officer Actions</h3>
                        <div className="space-y-4">
                            <button className="w-full py-2 bg-white border border-blue-200 text-blue-800 text-sm font-medium rounded-sm shadow-sm hover:bg-blue-50 flex items-center justify-center">
                                <FileText className="h-4 w-4 mr-2" /> View Detailed Audit Log
                            </button>
                            <div className="border-t border-blue-200 pt-4">
                                <label className="text-xs font-medium text-blue-800 mb-2 block">Add Case Note (Mandatory for Override)</label>
                                <textarea
                                    className="w-full text-sm p-2 border border-blue-200 rounded-sm focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Enter justification..."
                                    value={actionNote}
                                    onChange={(e) => setActionNote(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="flex space-x-2">
                                <button className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-sm hover:bg-red-700 shadow-sm">
                                    Escalate
                                </button>
                                <button className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-sm hover:bg-green-700 shadow-sm">
                                    Validate
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Hierarchy */}
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Approval Hierarchy</h3>
                        <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                            {alertDetail.hierarchy.map((h, idx) => (
                                <div key={idx} className="ml-6 relative">
                                    <div className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-white ${h.status === 'Approved' ? 'bg-green-500' : 'bg-gray-300'
                                        }`}></div>
                                    <p className="text-xs font-medium text-gray-500">{h.role}</p>
                                    <p className="text-sm font-medium text-gray-900">{h.name}</p>
                                    <div className="flex items-center text-xs text-gray-400 mt-1">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {h.time}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 p-4 text-center text-xs text-gray-500">
                DISCLAIMER: This system provides decision support only. Final responsibility remains with the officer.
            </div>
        </div>
    );
}
