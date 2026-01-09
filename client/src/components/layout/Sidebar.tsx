"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
    LayoutDashboard,
    AlertTriangle,
    FileText,
    Users,
    Network,
    Map,
    Activity,
    ShieldAlert,
    Languages,
    Settings,
    LogOut,
    Landmark
} from "lucide-react";
import { UserRole } from "@fds/common";

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [lang, setLang] = useState<'en' | 'hi'>('en');

    const toggleLang = () => setLang(l => l === 'en' ? 'hi' : 'en');

    // Dictionary for Demo
    const t = {
        'Dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
        'Scheme Registry': { en: 'Scheme Registry', hi: 'योजना पंजीकरण' },
        'Vendor Intelligence': { en: 'Vendor Intelligence', hi: 'विक्रेता बुद्धिमत्ता' },
        'Alerts & Anomalies': { en: 'Alerts & Anomalies', hi: 'चेतावनी और विसंगतियां' },
        'Network Graph': { en: 'Network Graph', hi: 'नेटवर्क ग्राफ' },
        'Geospatial Map': { en: 'Geospatial Map', hi: 'भौगोलिक मानचित्र' },
        'Fraud Simulator': { en: 'Fraud Simulator', hi: 'धोखाधड़ी सिम्युलेटर' },
        'Audit Log': { en: 'Audit Log', hi: 'ऑडिट लॉग' },
    };

    const navItems = [
        { name: t['Dashboard'][lang], href: '/dashboard', icon: LayoutDashboard },
        { name: t['Scheme Registry'][lang], href: '/dashboard/schemes', icon: FileText },
        { name: t['Vendor Intelligence'][lang], href: '/dashboard/vendors', icon: Users },
        { name: t['Alerts & Anomalies'][lang], href: '/dashboard/alerts', icon: AlertTriangle },
        { name: t['Network Graph'][lang], href: '/dashboard/network', icon: Network },
        { name: t['Geospatial Map'][lang], href: '/dashboard/map', icon: Map },
        { name: t['Fraud Simulator'][lang], href: '/dashboard/simulator', icon: Activity },
        { name: t['Audit Log'][lang], href: '/dashboard/audit', icon: ShieldAlert },
    ];

    return (
        <div className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
                        PFMS<span className="text-white font-light">Guard</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Fraud Detection Unit</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={logout}
                    className="flex w-full items-center px-2 py-2 text-sm font-medium text-red-400 hover:bg-slate-900 rounded-sm transition-colors"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
