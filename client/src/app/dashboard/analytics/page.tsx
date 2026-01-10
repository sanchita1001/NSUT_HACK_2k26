"use client";

import { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, MapPin, Users } from "lucide-react";

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [clusters, setClusters] = useState<any>(null);
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [analyticsRes, clustersRes, reportRes] = await Promise.all([
                fetch('http://localhost:8000/analytics/predictive'),
                fetch('http://localhost:8000/analytics/clusters'),
                fetch('http://localhost:8000/analytics/report')
            ]);

            if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
            if (clustersRes.ok) setClusters(await clustersRes.json());
            if (reportRes.ok) setReport(await reportRes.json());
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Predictive Analytics Dashboard</h1>
                <p className="text-sm text-gray-500">AI-powered insights and fraud trends</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Alerts</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics?.summary?.totalAlerts || 0}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-orange-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">High Risk</p>
                            <p className="text-2xl font-bold text-red-600">{analytics?.summary?.highRiskAlerts || 0}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-red-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Avg Risk Score</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics?.summary?.averageRiskScore || 0}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Suspicious Clusters</p>
                            <p className="text-2xl font-bold text-gray-900">{clusters?.totalClusters || 0}</p>
                        </div>
                        <Users className="h-8 w-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Top Risky Agencies */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Top Risky Agencies</h2>
                <div className="space-y-3">
                    {analytics?.topRiskyAgencies?.map((agency: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                                <p className="font-medium text-gray-900">{agency.agency}</p>
                                <p className="text-xs text-gray-500">{agency.transactionCount} transactions</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-red-600">{agency.avgRisk}</p>
                                <p className="text-xs text-gray-500">Avg Risk</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Geographic Hotspots */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-red-500" />
                    Geographic Hotspots
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analytics?.geographicHotspots?.map((hotspot: any, idx: number) => (
                        <div key={idx} className="p-4 border border-gray-200 rounded">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-900">{hotspot.district}</h3>
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                    {hotspot.riskPercentage}% High Risk
                                </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                                <p>Total Alerts: {hotspot.totalAlerts}</p>
                                <p>High Risk: {hotspot.highRiskAlerts}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Suspicious Clusters */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Suspicious Vendor Clusters</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alert Count</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Risk</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pattern</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {clusters?.suspiciousClusters?.map((cluster: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{cluster.vendor}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{cluster.alertCount}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">₹{(cluster.totalAmount / 100000).toFixed(2)}L</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${cluster.avgRiskScore > 70 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                            }`}>
                                            {cluster.avgRiskScore.toFixed(0)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{cluster.pattern}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Monthly Report */}
            {report && (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Report - {report.period}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-blue-50 rounded">
                            <p className="text-sm text-blue-600">Total Flagged</p>
                            <p className="text-2xl font-bold text-blue-900">{report.summary?.totalAmountFlagged}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded">
                            <p className="text-sm text-green-600">Amount Recovered</p>
                            <p className="text-2xl font-bold text-green-900">{report.summary?.amountRecovered}</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded">
                            <p className="text-sm text-purple-600">Detection Rate</p>
                            <p className="text-2xl font-bold text-purple-900">{report.summary?.detectionRate}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
