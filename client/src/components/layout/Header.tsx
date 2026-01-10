"use client";

import { Bell, Search, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
    const { user } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center">
                <h2 className="text-lg font-semibold text-gray-800">
                    Operational Dashboard
                </h2>
                <span className="mx-4 h-6 w-px bg-gray-300"></span>
                <div className="flex items-center text-sm text-gray-500">
                    <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search Case ID / Vendor..."
                        className="w-64 pl-4 pr-10 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-800"
                    />
                    <Search className="h-4 w-4 text-gray-800 absolute right-3 top-2" />
                </div>

                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                    <HelpCircle className="h-5 w-5" />
                </button>
            </div>
        </header>
    );
}
