"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, TrendingUp, AlertTriangle, Activity, RefreshCw, IndianRupee } from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/alerts/stats');
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Real-time fraud detection overview</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {/* System Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-4 rounded-lg shadow-sm">
                <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-blue-900">System Notice</p>
                        <p className="text-sm text-blue-800 mt-1">
                            Quarterly audit preparation mode active. Ensure all high-priority alerts are annotated by Friday.
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Total Alerts */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Alerts</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <p className="text-3xl sm:text-4xl font-bold text-gray-900">{stats?.totalAlerts || 0}</p>
                                <span className="text-sm font-semibold text-red-600">
                                    +{stats?.recentAlerts || 0} <span className="text-gray-500 font-normal">today</span>
                                </span>
                            </div>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>

                {/* Total Volume */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Volume Flagged</p>
                            <div className="mt-2">
                                <p className="text-3xl sm:text-4xl font-bold text-gray-900">{stats?.totalVolume || '₹0'}</p>
                            </div>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <IndianRupee className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                </div>

                {/* Detection Rate */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Detection Rate</p>
                            <div className="mt-2">
                                <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                                    {stats?.detectionRate ? `${stats.detectionRate}%` : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Network Activity</h3>
                </div>

                {/* Mobile View - Cards */}
                <div className="block lg:hidden divide-y divide-gray-200">
                    {stats?.recentTransactions?.length > 0 ? (
                        stats.recentTransactions.map((alert: any) => (
                            <div key={alert.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between mb-2">
                                    <span className="text-sm font-semibold text-blue-600">{alert.id}</span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${alert.riskScore > 70 ? 'bg-red-100 text-red-800' :
                                        alert.riskScore > 30 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {alert.riskScore}/100
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{alert.scheme}</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-900">₹{alert.amount.toLocaleString()}</span>
                                    <span className="text-gray-500">{alert.status}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No recent transactions found</p>
                        </div>
                    )}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheme</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stats?.recentTransactions?.length > 0 ? (
                                stats.recentTransactions.map((alert: any) => (
                                    <tr key={alert.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{alert.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.scheme}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${alert.riskScore > 70 ? 'bg-red-100 text-red-800' :
                                                alert.riskScore > 30 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {alert.riskScore}/100
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{alert.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.status}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p>No recent transactions found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
