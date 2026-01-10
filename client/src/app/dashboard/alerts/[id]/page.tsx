"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Clock, AlertTriangle, TrendingUp, MapPin, User,
    DollarSign, Shield, Activity, FileText, ChevronRight, ExternalLink
} from "lucide-react";
import { API_ENDPOINTS, apiCall } from "@/lib/config";
import Link from "next/link";

interface AlertDetail {
    alert: any;
    timeline: any[];
    relatedAlerts: any[];
    vendorStats: any;
    riskBreakdown: any;
    metadata: any;
}

export default function AlertDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<AlertDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");

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
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
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
                    {["overview", "timeline", "related", "raw"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Amount</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        ₹{alert.amount.toLocaleString()}
                                    </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-600" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Risk Level</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{alert.riskLevel}</p>
                                </div>
                                <Shield className="h-8 w-8 text-red-600" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Location</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{alert.district}</p>
                                </div>
                                <MapPin className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
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
                                <p className="font-semibold text-gray-900">{alert.vendor}</p>
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

                    {/* Risk Analysis */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Risk Breakdown
                        </h2>
                        <div className="space-y-3">
                            {Object.entries(riskBreakdown).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-48 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${Math.min((value / 100) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                        <span className="font-semibold text-gray-900 w-12 text-right">{value}</span>
                                    </div>
                                </div>
                            ))}
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
                                <li key={idx} className="flex items-start gap-2">
                                    <ChevronRight className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">{reason}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Vendor Statistics */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Vendor Statistics
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Total Alerts</p>
                                <p className="text-2xl font-bold text-gray-900">{vendorStats.totalAlerts}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Avg Risk Score</p>
                                <p className="text-2xl font-bold text-gray-900">{vendorStats.averageRiskScore.toFixed(1)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">High Risk Count</p>
                                <p className="text-2xl font-bold text-red-600">{vendorStats.highRiskCount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Volume</p>
                                <p className="text-2xl font-bold text-gray-900">₹{(vendorStats.totalVolume / 100000).toFixed(1)}L</p>
                            </div>
                        </div>
                    </div>
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
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                                        ₹{related.amount.toLocaleString()}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(related.status)}`}>
                                        {related.status}
                                    </span>
                                    <ExternalLink className="h-4 w-4 text-gray-400" />
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
