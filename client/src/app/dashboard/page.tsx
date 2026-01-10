"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

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
        // Poll every 10 seconds for live dashboard updates
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-900 p-4 rounded-sm shadow-sm">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-900" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-800">
                            <span className="font-bold">System Notice:</span> Quarterly audit preparation mode is active. Please ensure all high-priority alerts are annotated by Friday.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KPI Cards */}
                <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Alerts</p>
                    <div className="mt-2 flex items-baseline">
                        <p className="text-3xl font-semibold text-gray-900">{stats?.totalAlerts || 0}</p>
                        <p className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                            +{stats?.recentAlerts || 0} <span className="text-gray-500 font-normal ml-1">last 24h</span>
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Volume Flagged</p>
                    <div className="mt-2 flex items-baseline">
                        <p className="text-3xl font-semibold text-gray-900">{stats?.totalVolume || '₹0'}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Recent Network Activity</h3>
                <div className="bg-white shadow-sm rounded-sm border border-gray-200 overflow-hidden">
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
                                    <tr key={alert.id}>
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
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No recent transactions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
