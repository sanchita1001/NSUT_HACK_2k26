"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    LayoutDashboard,
    AlertTriangle,
    FileText,
    Building2,
    ShieldCheck,
    Settings,
    LogOut,
    Landmark,
    Share2,
    Map,
    Activity
} from "lucide-react";
import { UserRole } from "@fds/common";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Live Alerts", href: "/dashboard/alerts", icon: AlertTriangle },
    { name: "Schemes", href: "/dashboard/schemes", icon: FileText },
    { name: "Vendors", href: "/dashboard/vendors", icon: Building2 },
    { name: "Visual Network", href: "/dashboard/network", icon: Share2 },
    { name: "Geo Map", href: "/dashboard/map", icon: Map },
    { name: "Simulator", href: "/dashboard/simulator", icon: Activity },
    { name: "Audit Logs", href: "/dashboard/audit", icon: FileText },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <div className="flex bg-slate-900 text-white w-64 min-h-screen flex-col border-r border-slate-800">
            <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
                <Landmark className="h-6 w-6 text-orange-500 mr-3" />
                <div>
                    <h1 className="font-bold text-sm tracking-wide">PFMS INTEL</h1>
                    <p className="text-[10px] text-slate-400 uppercase">Govt. of India</p>
                </div>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-sm transition-colors ${isActive
                                ? "bg-blue-900 text-white border-l-4 border-orange-500"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <item.icon className={`h-5 w-5 mr-3 ${isActive ? "text-orange-500" : "text-slate-400"}`} />
                            {item.name}
                        </Link>
                    );
                })}

                {user?.role === UserRole.ADMIN && (
                    <Link
                        href="/dashboard/admin"
                        className="flex items-center px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-sm"
                    >
                        <Settings className="h-5 w-5 mr-3 text-slate-400" />
                        System Admin
                    </Link>
                )}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950">
                <div className="mb-4 px-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Logged in as</p>
                    <p className="text-sm font-medium text-white truncate">{user?.name || "Officer"}</p>
                    <p className="text-xs text-slate-500">{user?.role?.replace(/_/g, " ")}</p>
                </div>
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
