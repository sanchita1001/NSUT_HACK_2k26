"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Filter, ChevronRight, AlertTriangle } from "lucide-react";

interface AlertData {
    id: string;
    scheme: string;
    riskScore: number;
    amount: number;
    status: string;
    riskLevel: string;
    date: string;
}

export default function AlertsPage() {
    const [filterStatus, setFilterStatus] = useState("All");
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async (initialLoad = false) => {
        try {
            const res = await fetch('http://localhost:8000/alerts');
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            } else {
                console.error("Failed to fetch alerts: ", res.status, res.statusText);
            }
        } catch (error) {
            console.error("Failed to fetch alerts", error);
        } finally {
            if (initialLoad) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchAlerts(true);
        const interval = setInterval(() => fetchAlerts(false), 3000);
        return () => clearInterval(interval);
    }, []);

    const filteredAlerts = filterStatus === "All"
        ? alerts
        : alerts.filter(a => a.status === filterStatus);

    if (loading) {
        return <div className="p-10 text-center text-gray-500">Loading Secure Alert Stream...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Live Alerts</h1>
                    <p className="text-sm text-gray-500">Monitor and investigate transaction anomalies.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="flex items-center px-4 py-2 border border-gray-300 rounded-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </button>
                    <button className="flex items-center px-4 py-2 border border-transparent rounded-sm bg-blue-900 text-sm font-medium text-white hover:bg-blue-800 shadow-sm">
                        Export Report
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex space-x-4">
                    {["All", "New", "Investigating", "Review", "Closed"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`text-sm font-medium px-3 py-1 rounded-full ${filterStatus === status
                                ? "bg-blue-100 text-blue-800"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheme</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAlerts.map((alert) => (
                            <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <AlertTriangle className={`h-4 w-4 mr-2 ${alert.riskScore > 90 ? "text-red-600" :
                                            alert.riskScore > 75 ? "text-orange-500" : "text-yellow-500"
                                            }`} />
                                        <span className="text-sm font-medium text-blue-600">{alert.id}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alert.scheme}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${alert.riskLevel === "Critical" ? "bg-red-100 text-red-800" :
                                        alert.riskLevel === "High" ? "bg-orange-100 text-orange-800" :
                                            alert.riskLevel === "Medium" ? "bg-yellow-100 text-yellow-800" :
                                                "bg-green-100 text-green-800"
                                        }`}>
                                        {alert.riskLevel} ({alert.riskScore})
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    ₹{alert.amount.toLocaleString('en-IN')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {alert.status}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link href={`/dashboard/alerts/${alert.id}`} className="text-blue-600 hover:text-blue-900 flex items-center justify-end">
                                        View
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredAlerts.length === 0 && (
                    <div className="text-center py-10 text-gray-500 text-sm">No alerts found with this status.</div>
                )}

                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-500">Showing {filteredAlerts.length} results</div>
                    <div className="flex space-x-2">
                        <button className="px-3 py-1 border border-gray-300 rounded-sm bg-white text-sm text-gray-700 disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 border border-gray-300 rounded-sm bg-white text-sm text-gray-700 disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
