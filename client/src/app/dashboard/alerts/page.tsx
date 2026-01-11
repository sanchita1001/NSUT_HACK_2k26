"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Filter, ChevronRight, AlertTriangle, Download, FileJson, FileSpreadsheet, Trash2 } from "lucide-react";
import { exportToCSV, exportToJSON } from "@/lib/export";
import { API_ENDPOINTS } from "@/lib/config";

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
    const [filterRiskLevel, setFilterRiskLevel] = useState("All");
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    const fetchAlerts = async (initialLoad = false) => {
        try {
            const res = await fetch(API_ENDPOINTS.ALERTS);
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

    const handleAction = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(API_ENDPOINTS.ALERT_STATUS(id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) {
                throw new Error("Failed to update");
            }

            // Update local state after successful server response
            const data = await res.json();
            setAlerts(prev => prev.map(a =>
                a.id === id ? { ...a, status: data.alert.status } : a
            ));

        } catch (err) {
            console.error("Update failed", err);
            alert('Failed to update alert status. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`Are you sure you want to delete alert ${id}? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`${API_ENDPOINTS.ALERTS}/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Remove from local state
                setAlerts(prev => prev.filter(a => a.id !== id));
            } else {
                alert('Failed to delete alert');
            }
        } catch (err) {
            console.error("Delete failed", err);
            alert('Failed to delete alert');
        }
    };

    const handleExportCSV = () => {
        exportToCSV(filteredAlerts, 'sahayak_alerts');
        setShowExportMenu(false);
    };

    const handleExportJSON = () => {
        exportToJSON(filteredAlerts, 'sahayak_alerts');
        setShowExportMenu(false);
    };

    useEffect(() => {
        fetchAlerts(true);
        const interval = setInterval(() => fetchAlerts(false), 3000);
        return () => clearInterval(interval);
    }, []);

    // Apply both status and risk level filters
    const filteredAlerts = alerts.filter(alert => {
        const statusMatch = filterStatus === "All" || alert.status === filterStatus;
        const riskMatch = filterRiskLevel === "All" || alert.riskLevel === filterRiskLevel;
        return statusMatch && riskMatch;
    });

    if (loading) {
        return <div className="p-10 text-center text-gray-500">Loading Secure Alert Stream...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Live Alerts</h1>
                    <p className="text-sm text-gray-500">Monitor and investigate transaction anomalies.</p>
                </div>
                <div className="flex space-x-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filter {filterRiskLevel !== "All" && `(${filterRiskLevel})`}
                        </button>
                        {showFilterMenu && (
                            <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <div className="p-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">Risk Level</p>
                                    {["All", "Critical", "High", "Medium", "Low"].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => {
                                                setFilterRiskLevel(level);
                                                setShowFilterMenu(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${filterRiskLevel === level ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center px-4 py-2 border border-transparent rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <button
                                    onClick={handleExportCSV}
                                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                                >
                                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                                    Export as CSV
                                </button>
                                <button
                                    onClick={handleExportJSON}
                                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg"
                                >
                                    <FileJson className="h-4 w-4 mr-2 text-blue-600" />
                                    Export as JSON
                                </button>
                            </div>
                        )}
                    </div>
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
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    {alert.status === 'New' && (
                                        <>
                                            <button
                                                onClick={() => handleAction(alert.id, 'Investigating')}
                                                className="text-blue-600 hover:text-blue-900 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"
                                            >
                                                Investigate
                                            </button>
                                            <button
                                                onClick={() => handleAction(alert.id, 'Closed')}
                                                className="text-red-600 hover:text-red-900 border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                                            >
                                                Dismiss
                                            </button>
                                        </>
                                    )}
                                    {alert.status === 'Investigating' && (
                                        <>
                                            <button
                                                onClick={() => handleAction(alert.id, 'Review')}
                                                className="text-orange-600 hover:text-orange-900 border border-orange-200 px-2 py-1 rounded hover:bg-orange-50"
                                            >
                                                Send to Review
                                            </button>
                                            <button
                                                onClick={() => handleAction(alert.id, 'Closed')}
                                                className="text-gray-600 hover:text-gray-900 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
                                            >
                                                Close
                                            </button>
                                        </>
                                    )}
                                    {alert.status === 'Review' && (
                                        <>
                                            <button
                                                onClick={() => handleAction(alert.id, 'Closed')}
                                                className="text-green-600 hover:text-green-900 border border-green-200 px-2 py-1 rounded hover:bg-green-50"
                                            >
                                                Approve & Close
                                            </button>
                                            <button
                                                onClick={() => handleAction(alert.id, 'Investigating')}
                                                className="text-yellow-600 hover:text-yellow-900 border border-yellow-200 px-2 py-1 rounded hover:bg-yellow-50"
                                            >
                                                Re-investigate
                                            </button>
                                        </>
                                    )}
                                    <Link href={`/dashboard/alerts/${alert.id}`} className="text-blue-600 hover:text-blue-900 inline-flex items-center ml-2">
                                        View
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(alert.id)}
                                        className="text-red-600 hover:text-red-900 inline-flex items-center ml-2"
                                        title="Delete alert"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
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
