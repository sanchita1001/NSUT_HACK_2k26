'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    Building2, MapPin, AlertTriangle, TrendingUp,
    IndianRupee, Activity, FileText, ArrowLeft, ShieldCheck, ShieldAlert
} from 'lucide-react';

export default function VendorProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/vendors/${id}/risk-profile`);
                setProfile(res.data);
            } catch (error) {
                console.error("Failed to fetch vendor profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!profile) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <h2 className="text-xl font-bold text-gray-700">Vendor Not Found</h2>
            <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">Go Back</button>
        </div>
    );

    const isHighRisk = parseFloat(profile.averageRiskScore) > 70;

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vendor Profile</h1>
                    <p className="text-gray-500 text-sm">Detailed intelligence and risk analysis</p>
                </div>
            </div>

            {/* Main Vendor Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ${isHighRisk ? 'bg-red-500' : 'bg-blue-600'}`}>
                            {profile.vendorName.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">{profile.vendorName}</h2>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                                    <Building2 className="w-3 h-3" /> ID: {profile.vendorId}
                                </span>
                                {/* You could add real address here if available in risk profile payload */}
                                <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                                    <MapPin className="w-3 h-3" /> Registered Entity
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Risk Status</p>
                            <div className={`mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${isHighRisk ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                {isHighRisk ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                <span className="font-bold">{isHighRisk ? 'High Risk' : 'Healthy'}</span>
                            </div>
                        </div>
                        <div className="text-right pl-6 border-l border-gray-100">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Trust Score</p>
                            <p className="text-3xl font-black text-gray-900">{Math.max(0, 100 - parseFloat(profile.averageRiskScore)).toFixed(0)}<span className="text-lg text-gray-400 font-medium">/100</span></p>
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100 bg-gray-50/30">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <IndianRupee className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Total Volume</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{profile.totalVolume}</p>
                        <p className="text-xs text-gray-500 mt-1">Lifetime processed amount</p>
                    </div>

                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Activity className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Transactions</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{profile.totalTransactions}</p>
                        <p className="text-xs text-gray-500 mt-1">Total payments received</p>
                    </div>

                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Avg Risk</span>
                        </div>
                        <p className={`text-2xl font-bold ${parseFloat(profile.averageRiskScore) > 50 ? 'text-orange-600' : 'text-green-600'}`}>
                            {profile.averageRiskScore}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">AI calculated average</p>
                    </div>

                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Risk Trend</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 capitalize">{profile.riskTrend}</p>
                        <p className="text-xs text-gray-500 mt-1">Based on last 10 txns</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Risk Analysis Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            AI Risk Analysis
                        </h3>

                        {profile.suspiciousPatterns && profile.suspiciousPatterns.length > 0 ? (
                            <div className="space-y-3">
                                {profile.suspiciousPatterns.map((pattern: string, i: number) => (
                                    <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800 flex gap-3 items-start">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>{pattern}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-center">
                                <ShieldCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                <p className="text-green-800 font-medium">No Suspicious Patterns</p>
                                <p className="text-xs text-green-600 mt-1">This vendor appears clean based on current transaction history.</p>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Associated Schemes</h4>
                            <div className="flex flex-wrap gap-2">
                                {/* Should ideally come from API, fallback for UI demo */}
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">PM-KISAN</span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">MGNREGA</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-400" />
                                Recent Transactions
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3">Alert ID</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Risk Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {profile.recentAlerts && profile.recentAlerts.map((alert: any) => (
                                        <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-gray-600">{alert.id}</td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {new Date(alert.date || Date.now()).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">₹{alert.amount?.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${alert.riskScore > 70 ? 'bg-red-100 text-red-800' :
                                                        alert.riskScore > 40 ? 'bg-orange-100 text-orange-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {alert.riskScore}/100
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!profile.recentAlerts || profile.recentAlerts.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                                No recent transactions found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
