"use client";

import { useState, useEffect } from "react";
import { Search, Shield, Eye, Download, User } from "lucide-react";

interface AuditLog {
    id: string;
    action: string;
    actor: string;
    target: string;
    timestamp: string;
    details: string;
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8000/audit-logs')
            .then(res => res.json())
            .then(data => {
                setLogs(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Shield className="h-6 w-6 mr-2 text-blue-900" />
                        Audit & Governance
                    </h1>
                    <p className="text-sm text-gray-500">Immutable record of all system actions (CAG Compliant).</p>
                </div>
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Log
                </button>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 rounded-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-700 uppercase">System Events</h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200">
                        Secure Logging Active
                    </span>
                </div>

                <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute top-0 bottom-0 left-8 w-px bg-gray-200"></div>

                    <ul className="divide-y divide-gray-100">
                        {logs.map((log) => (
                            <li key={log.id} className="p-6 hover:bg-gray-50 transition-colors relative">
                                <div className="flex items-start">
                                    {/* Icon Bubble */}
                                    <div className="relative z-10 flex-shrink-0 h-4 w-4 rounded-full bg-blue-500 border-2 border-white mt-1.5 mr-6 ml-1"></div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between">
                                            <p className="text-sm font-medium text-gray-900">
                                                {log.action} <span className="text-gray-800 font-normal">on</span> <span className="font-mono text-gray-700">{log.target}</span>
                                            </p>
                                            <span className="text-xs text-gray-800 font-mono">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">{log.details}</p>
                                        <div className="mt-2 flex items-center text-xs text-gray-500">
                                            <User className="h-3 w-3 mr-1" />
                                            {log.actor}
                                            <span className="mx-2 text-gray-300">|</span>
                                            <span className="font-mono text-gray-800">ID: {log.id}</span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {loading && <div className="p-10 text-center text-gray-800">Verifying signatures...</div>}
                </div>
            </div>
        </div>
    );
}
