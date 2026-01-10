"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Clock, AlertTriangle, TrendingUp, MapPin, User,
    IndianRupee, Shield, Activity, FileText, ChevronRight, ExternalLink,
    Sparkles, Loader2, BarChart3, PieChart, TrendingDown
} from "lucide-react";
import { API_ENDPOINTS, apiCall } from "@/lib/config";
import Link from "next/link";
import api from "@/lib/api";

interface AlertDetail {
    alert: any;
    timeline: any[];
    relatedAlerts: any[];
    vendorStats: any;
    riskBreakdown: any;
    metadata: any;
}

interface AISummary {
    profile: string;
    vendorContext: {
        totalTransactions: number;
        averageAmount: number;
        totalVolume: number;
        highRiskCount: number;
        averageRiskScore: number;
        recentTransactions: any[];
    };
    fraudScore: number;
    riskScore: number;
    reasons: string[];
}

export default function AlertDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<AlertDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");

    // AI Summary state
    const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState("");

    useEffect(() => {
        fetchAlertDetail();
    }, [params.id]);

    const fetchAlertDetail = async () => {
        try {
            setLoading(true);
            const result = await apiCall<AlertDetail>(API_ENDPOINTS.ALERT_BY_ID(params.id as string));
            setData(result);
        } catch (err: any) {
            setError(err.message || "Failed to load alert details");
        } finally {
            setLoading(false);
        }
    };

    const generateAISummary = async () => {
        try {
            setGeneratingSummary(true);
            setSummaryError("");
            const { data: summary } = await api.post(`/summary/generate/${params.id}`);

            // Enforce that we got a real AI summary
            if (!summary || !summary.profile) {
                throw new Error("AI summary generation failed - no profile returned");
            }

            setAiSummary(summary);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || "Failed to generate AI summary";

            // Check if it's an Ollama service issue
            if (errorMsg.includes("Ollama") || errorMsg.includes("unavailable") || errorMsg.includes("offline")) {
                setSummaryError("⚠️ AI Summary Service Offline - Ollama service is currently unavailable. Please ensure Ollama is running or contact system administrator.");
            } else {
                setSummaryError(errorMsg);
            }
        } finally {
            setGeneratingSummary(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading alert details...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Alert Not Found</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/dashboard/alerts")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Alerts
                    </button>
                </div>
            </div>
        );
    }

    const { alert, timeline, relatedAlerts, vendorStats, riskBreakdown } = data;

    const getRiskColor = (score: number) => {
        if (score >= 80) return "text-red-600 bg-red-50 border-red-200";
        if (score >= 60) return "text-orange-600 bg-orange-50 border-orange-200";
        if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-green-600 bg-green-50 border-green-200";
    };

    const getStatusColor = (status: string) => {
        const colors: any = {
            "New": "bg-blue-100 text-blue-800",
            "Investigating": "bg-yellow-100 text-yellow-800",
            "Verified": "bg-red-100 text-red-800",
            "Dismissed": "bg-gray-100 text-gray-800",
            "Closed": "bg-green-100 text-green-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.push("/dashboard/alerts")}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Alerts
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{alert.id}</h1>
                        <p className="text-gray-600 mt-1">Investigation Dashboard</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(alert.status)}`}>
                            {alert.status}
                        </span>
                        <span className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 ${getRiskColor(alert.riskScore)}`}>
                            Risk: {alert.riskScore}/100
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-8">
                    {["overview", "ai-summary", "timeline", "related", "raw"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${activeTab === tab
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab === "ai-summary" ? "AI Summary" : tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Amount</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        ₹{alert.amount.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <IndianRupee className="h-8 w-8 text-green-600" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Risk Level</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{alert.riskLevel}</p>
                                </div>
                                <Shield className="h-8 w-8 text-red-600" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Location</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{alert.district}</p>
                                </div>
                                <MapPin className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Created</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">
                                        {new Date(alert.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                                <Clock className="h-8 w-8 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Risk Breakdown Chart */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                Risk Breakdown
                            </h2>
                            <div className="space-y-3">
                                {Object.entries(riskBreakdown).map(([key, value]: [string, any]) => (
                                    <div key={key} className="group">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            <span className="text-sm font-semibold text-gray-900">{value}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out group-hover:from-blue-600 group-hover:to-blue-700"
                                                style={{ width: `${Math.min((value / 100) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}</div>
                        </div>

                        {/* Vendor Stats Chart */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <PieChart className="h-5 w-5 text-green-600" />
                                Vendor Statistics
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                    <p className="text-3xl font-bold text-blue-600">{vendorStats.totalAlerts}</p>
                                    <p className="text-sm text-gray-600 mt-1">Total Alerts</p>
                                </div>
                                <div className="text-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                                    <p className="text-3xl font-bold text-orange-600">{vendorStats.averageRiskScore.toFixed(1)}</p>
                                    <p className="text-sm text-gray-600 mt-1">Avg Risk Score</p>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                                    <p className="text-3xl font-bold text-red-600">{vendorStats.highRiskCount}</p>
                                    <p className="text-sm text-gray-600 mt-1">High Risk</p>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                    <p className="text-3xl font-bold text-green-600">
                                        {(() => {
                                            const val = vendorStats.totalVolume;
                                            if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
                                            if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
                                            return `₹${val.toLocaleString('en-IN')}`;
                                        })()}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">Total Volume</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Transaction Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Scheme</p>
                                <p className="font-semibold text-gray-900">{alert.scheme}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Vendor</p>
                                <p className="font-semibold text-gray-900">{alert.vendor || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Beneficiary</p>
                                <p className="font-semibold text-gray-900">{alert.beneficiary}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Coordinates</p>
                                <p className="font-semibold text-gray-900">
                                    {alert.coordinates?.join(", ") || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Detection Reasons */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Detection Reasons
                        </h2>
                        <ul className="space-y-2">
                            {alert.mlReasons?.map((reason: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 group">
                                    <ChevronRight className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform" />
                                    <span className="text-gray-700">{reason}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* AI Summary Tab */}
            {activeTab === "ai-summary" && (
                <div className="space-y-6">
                    {!aiSummary ? (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-8 text-center">
                            <Sparkles className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Vendor Analysis</h2>
                            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                                Generate an intelligent summary using Ollama AI that analyzes vendor patterns,
                                transaction history, and risk indicators from actual MongoDB data.
                            </p>
                            <button
                                onClick={generateAISummary}
                                disabled={generatingSummary}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-800 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
                            >
                                {generatingSummary ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Generating AI Summary...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-5 w-5" />
                                        Generate AI Summary
                                    </>
                                )}
                            </button>
                            {summaryError && (
                                <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-600 rounded">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-red-900">AI Summary Generation Failed</p>
                                            <p className="text-red-700 text-sm mt-1">{summaryError}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            {/* AI Generated Profile */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="h-6 w-6 text-blue-600" />
                                    <h2 className="text-xl font-bold text-gray-900">AI-Generated Analysis</h2>
                                </div>
                                <div className="prose max-w-none">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{aiSummary.profile}</p>
                                </div>
                                <button
                                    onClick={generateAISummary}
                                    disabled={generatingSummary}
                                    className="mt-4 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Regenerate Summary
                                </button>
                            </div>

                            {/* Vendor Context Stats */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Vendor Historical Data</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-900">{aiSummary.vendorContext.totalTransactions}</p>
                                        <p className="text-sm text-gray-600">Total Transactions</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-900">₹{aiSummary.vendorContext.averageAmount.toLocaleString('en-IN')}</p>
                                        <p className="text-sm text-gray-600">Average Amount</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-900">₹{(aiSummary.vendorContext.totalVolume / 100000).toFixed(1)}L</p>
                                        <p className="text-sm text-gray-600">Total Volume</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-red-600">{aiSummary.vendorContext.highRiskCount}</p>
                                        <p className="text-sm text-gray-600">High Risk Count</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-900">{aiSummary.vendorContext.averageRiskScore.toFixed(1)}</p>
                                        <p className="text-sm text-gray-600">Avg Risk Score</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Vendor Transactions</h2>
                                <div className="space-y-3">
                                    {aiSummary.vendorContext.recentTransactions.map((tx, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div>
                                                <p className="font-semibold text-gray-900">₹{tx.amount.toLocaleString('en-IN')}</p>
                                                <p className="text-sm text-gray-600">{tx.scheme}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tx.riskScore >= 70 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    Risk: {tx.riskScore}
                                                </span>
                                                <p className="text-xs text-gray-500 mt-1">{new Date(tx.timestamp).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Activity Timeline</h2>
                    <div className="space-y-4">
                        {timeline.map((event, idx) => (
                            <div key={event.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                    {idx < timeline.length - 1 && <div className="w-0.5 h-full bg-gray-300 mt-1"></div>}
                                </div>
                                <div className="flex-1 pb-8">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-semibold text-gray-900">{event.eventType}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="text-gray-700">{event.action}</p>
                                    <p className="text-sm text-gray-500 mt-1">by {event.actor}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Related Alerts Tab */}
            {activeTab === "related" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Related Alerts</h2>
                    <div className="space-y-3">
                        {relatedAlerts.map((related) => (
                            <Link
                                key={related.id}
                                href={`/dashboard/alerts/${related.id}`}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${related.riskScore > 70 ? 'bg-red-600' : 'bg-yellow-600'}`}></div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{related.id}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(related.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-semibold text-gray-900">
                                        ₹{related.amount.toLocaleString('en-IN')}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(related.status)}`}>
                                        {related.status}
                                    </span>
                                    <ExternalLink className="h-4 w-4 text-gray-800" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Raw Data Tab */}
            {activeTab === "raw" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Raw Data</h2>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
