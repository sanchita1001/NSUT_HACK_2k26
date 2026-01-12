"use client";

import { useState, useEffect } from "react";
import { Bell, Search, Globe, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import api from "@/lib/api";

export function Header() {
    // const { user } = useAuth();
    const user = { name: 'Admin User' }; // Static for now
    const { language, toggleLanguage, t } = useLanguage();

    const [showNotifications, setShowNotifications] = useState(false);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Fetch Alerts for Notifications
        api.get('/alerts')
            .then(res => {
                // Filter for High Risk or Recent
                const highRisk = res.data.filter((a: any) => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL');
                setAlerts(highRisk.slice(0, 5)); // Top 5
                setUnreadCount(highRisk.length);
            })
            .catch(err => console.error(err));
    }, []);

    // Font Size Handlers
    const setFontSize = (size: string) => {
        const root = document.documentElement;
        if (size === 'small') root.style.fontSize = '14px';
        if (size === 'default') root.style.fontSize = '16px';
        if (size === 'large') root.style.fontSize = '18px';
    };

    return (
        <div className="flex flex-col w-full shadow-md z-20 relative">
            {/* Top Accessibility Bar */}
            <div className="bg-[#2a2a2a] text-[#ddd] text-xs py-1.5 px-4 md:px-6 flex justify-between items-center">
                <div className="hidden md:flex gap-4">
                    <a href="#" className="hover:text-white border-r border-gray-600 pr-4">{t('Government of India')}</a>
                    <a href="#" className="hover:text-white">{t('Ministry of Finance')}</a>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setFontSize('small')} className="hover:text-white font-bold" title="Decrease Font Size">A-</button>
                    <button onClick={() => setFontSize('default')} className="hover:text-white font-bold" title="Default Font Size">A</button>
                    <button onClick={() => setFontSize('large')} className="hover:text-white font-bold" title="Increase Font Size">A+</button>
                    <span className="h-3 w-px bg-gray-600 mx-1"></span>
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1 hover:text-white font-semibold text-yellow-500 transition-colors"
                    >
                        <Globe className="w-3 h-3" />
                        {language === 'en' ? 'Hindi' : 'English'}
                    </button>
                </div>
            </div>

            {/* Main Government Banner */}
            <header className="bg-white border-b border-gray-300 py-3 px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
                    {/* Emblem Placeholders */}
                    <div className="flex flex-col items-center">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                            alt="Emblem"
                            className="h-10 md:h-12 w-auto opacity-90"
                        />
                    </div>
                    <div>
                        <h1 className="text-sm md:text-base font-bold text-[#1b1b1b] uppercase leading-tight">
                            {t('Ministry of Finance')}
                        </h1>
                        <h2 className="text-xs md:text-sm font-semibold text-[#444]">
                            {language === 'en' ? 'Department of Expenditure' : 'व्यय विभाग'}
                        </h2>
                    </div>
                </div>

                {/* Dashboard Title & Search */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-sm font-bold text-blue-900 border-b border-blue-900 mb-0.5">Vitt-Prahari <span className="text-xs font-normal text-gray-600">(PFMS Intel)</span></span>
                        <span className="text-xs text-gray-500">
                            {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>

                    <div className="relative flex-1 md:flex-none">
                        <input
                            type="text"
                            placeholder={t('Search')}
                            className="w-full md:w-64 pl-4 pr-10 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800 bg-gray-50"
                        />
                        <Search className="h-4 w-4 text-gray-500 absolute right-3 top-2.5" />
                    </div>

                    <div className="flex items-center gap-2 relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative"
                            title="Notifications"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-600 rounded-full border border-white animate-pulse"></span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <div className="absolute top-12 right-0 w-80 bg-white shadow-lg border border-gray-200 rounded-sm z-50 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
                                    <span className="text-xs text-red-600 font-medium">{unreadCount} Critical</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {alerts.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">No new alerts</div>
                                    ) : (
                                        alerts.map(alert => (
                                            <div key={alert.id} className="p-3 border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-bold text-red-700 bg-red-100 px-1.5 rounded">{alert.riskLevel}</span>
                                                    <span className="text-[10px] text-gray-400">{new Date(alert.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-800 mt-1 line-clamp-1">{alert.vendor}</p>
                                                <p className="text-xs text-gray-600 line-clamp-2">{alert.mlReasons.join(', ')}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="bg-gray-50 p-2 text-center border-t border-gray-200">
                                    <Link href="/dashboard/alerts" className="text-xs font-bold text-blue-800 hover:underline">
                                        View All Alerts
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Saffron/White/Green Strip (Decoration) */}
            <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] opacity-80"></div>
        </div>
    );
}
