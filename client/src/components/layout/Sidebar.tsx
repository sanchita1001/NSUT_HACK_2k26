"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    LayoutDashboard,
    AlertTriangle,
    FileText,
    Users,
    Network,
    Map,
    Activity,
    ShieldAlert,
    Landmark,
    LogOut
} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    // const { logout } = useAuth();
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };
    const { t } = useLanguage();

    const navItems = [
        { name: t('Dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { name: t('Scheme Registry'), href: '/dashboard/schemes', icon: FileText },
        { name: t('Vendor Intelligence'), href: '/dashboard/vendors', icon: Users },
        { name: t('Alerts & Anomalies'), href: '/dashboard/alerts', icon: AlertTriangle },
        { name: t('Geospatial Map'), href: '/dashboard/map', icon: Map },
        { name: t('New Transaction'), href: '/dashboard/add-payment', icon: Landmark },
        { name: t('Audit Log'), href: '/dashboard/audit', icon: ShieldAlert },
    ];

    return (
        <div className="w-64 bg-[#1a2332] text-white flex flex-col h-full shadow-xl z-10 hidden md:flex">
            <div className="p-5 border-b border-gray-700/50 flex flex-col">
                <h1 className="text-xl font-bold text-white tracking-wide">
                    VITT <span className="text-blue-400">PRAHARI</span>
                </h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">PFMS Intelligence Unit</p>
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
                    className="flex w-full items-center px-4 py-3 text-sm font-medium text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <LogOut className="h-4 w-4 mr-3" />
                    {t('Sign Out')}
                </button>
            </div>
        </div>
    );
}
