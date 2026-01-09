"use client";

import { useState, useEffect } from "react";
import { Vendor } from "@fds/common";
import { ArrowLeft, Building2, TrendingUp, AlertOctagon, FileText } from "lucide-react";
import Link from "next/link";

// Using simple CSS for "Government Grade" reliability and speed.


// Basic mock chart components if recharts not installed, or I can install it.
// Given constraints, I will build simple CSS charts to avoid big installs unless needed. 
// "Boring reliability" means standard HTML/CSS is often better than complex JS libs for government.

export default function VendorProfilePage({ params }: { params: { id: string } }) {
    const [vendor, setVendor] = useState<Vendor | null>(null);

    useEffect(() => {
        fetch(`http://localhost:8000/vendors/${params.id}`)
            .then(res => res.json())
            .then(data => setVendor(data))
            .catch(err => console.error(err));
    }, [params.id]);

    if (!vendor) return <div className="p-10 text-center">Loading Vendor Profile...</div>;

    return (
        <div className="space-y-6">
            <Link href="/dashboard/vendors" className="flex items-center text-sm text-gray-500 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Vendors
            </Link>

            {/* Header */}
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 flex justify-between items-start">
                <div className="flex items-start">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                        <Building2 className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-500">GSTIN: {vendor.gstin}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${vendor.accountStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {vendor.accountStatus}
                            </span>
                        </div>
                    </div>
                </div>
                <a href={`/dashboard/network?entityId=${vendor.id}`} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 flex items-center">
                    View Link Graph
                </a>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Risk Score</p>
                    <div className={`text-3xl font-bold ${vendor.riskScore > 50 ? 'text-red-600' : 'text-green-600'
                        }`}>{vendor.riskScore}/100</div>
                </div>
            </div>

            {/* Direct vs Scheme Analysis (The "Crucial" Feature) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 uppercase mb-4">Payment Source Breakdown</h3>

                    {/* Visualizing Direct vs Scheme */}
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Scheme Linked (PM-KISAN, etc)</span>
                                <span className="font-semibold">35%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '35%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="flex items-center text-orange-700 font-medium">
                                    Direct Ad-hoc Payments
                                    <AlertOctagon className="h-3 w-3 ml-1" />
                                </span>
                                <span className="font-semibold text-orange-700">65%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                            <p className="text-xs text-orange-600 mt-1">
                                * High volume of unstructured direct payments detected.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 uppercase mb-4">Risk Factors</h3>
                    <ul className="space-y-3">
                        <li className="flex items-start bg-red-50 p-3 rounded-sm text-sm text-red-800 border border-red-100">
                            <TrendingUp className="h-4 w-4 mr-2 mt-0.5" />
                            Sudden spike in payment volume (400% vs last month).
                        </li>
                        <li className="flex items-start bg-yellow-50 p-3 rounded-sm text-sm text-yellow-800 border border-yellow-100">
                            <FileText className="h-4 w-4 mr-2 mt-0.5" />
                            3 invoices missing matching Purchase Orders.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
