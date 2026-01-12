"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
// import { useAuth } from "@/contexts/AuthContext";
import ChatbotAssistant from "@/components/ChatbotAssistant";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MapUpdateProvider } from "@/contexts/MapUpdateContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // const { user, isLoading } = useAuth();
    const router = useRouter();

    // Bypass auth check for demo
    /*
    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/");
        }
    }, [user, isLoading, router]);
    */

    // if (isLoading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
    // if (!user) return null;

    return (
        <ErrorBoundary>
            <MapUpdateProvider>
                <div className="flex h-screen bg-slate-50">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <Header />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6">
                            {children}
                        </main>
                        <ChatbotAssistant />
                    </div>
                </div>
            </MapUpdateProvider>
        </ErrorBoundary>
    );
}
