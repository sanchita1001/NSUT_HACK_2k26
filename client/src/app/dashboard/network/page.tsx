"use client";

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AlertCircle, RefreshCw } from 'lucide-react';


import api from "@/lib/api";
import { Vendor } from "@fds/common";

import { Handle, Position } from 'reactflow';

import { useRouter } from 'next/navigation';

const CustomNode = ({ data }: { data: any }) => {
    const router = useRouter(); // Use within component if possible, but CustomNode is outside context usually? 
    // ReactFlow nodes are rendered inside ReactFlow provider. Let's pass click handler or simple linkage.
    // Actually, simple href link or onClick is easier.

    return (
        <div
            className="relative group cursor-pointer transition-transform hover:scale-105"
            onClick={() => window.location.href = `/dashboard/vendors/${data.id || 'VEN-001'}`}
        >
            <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
                <div className="flex items-center">
                    <div className="ml-2">
                        <div className="text-sm font-bold text-gray-900">{data.label}</div>
                        {data.riskScore !== undefined && (
                            <div className="text-xs text-gray-500">Risk: {data.riskScore}/100</div>
                        )}
                    </div>
                </div>
            </div>
            <Handle type="target" position={Position.Top} className="w-16 !bg-teal-500" />
            <Handle type="source" position={Position.Bottom} className="w-16 !bg-teal-500" />

            {/* Tooltip */}
            <div className="absolute hidden group-hover:block z-50 w-72 p-3 mt-2 text-sm text-left text-white bg-gray-900 rounded-lg shadow-xl -left-1/2 ml-16 ring-1 ring-white/20">
                <p className="font-semibold border-b border-gray-700 pb-1 mb-1">{data.label}</p>
                <div className="space-y-2 mt-2">
                    <p>Risk Score: <span className={data.riskScore > 70 ? "text-red-400 font-bold" : "text-green-400"}>{data.riskScore}</span></p>

                    {data.sharedBeneficiaries && data.sharedBeneficiaries.length > 0 && (
                        <div className="text-xs bg-red-900/30 p-2 rounded border border-red-900/50">
                            <p className="font-bold text-red-300 mb-1">⚠️ Shared Beneficiaries:</p>
                            <p className="text-gray-300 break-words">{data.sharedBeneficiaries}</p>
                        </div>
                    )}

                    {data.sharedSchemes && (
                        <div className="text-xs">
                            <p className="font-semibold text-gray-400 mb-1">Shared Schemes:</p>
                            <p className="text-gray-300">{data.sharedSchemes}</p>
                        </div>
                    )}
                    <p className="text-[10px] text-blue-300 mt-2 text-center italic">Click to view full vendor profile</p>
                </div>
            </div>
        </div>
    );
};



const nodeTypes = {
    custom: CustomNode,
};

export default function NetworkPage() {
    const searchParams = useSearchParams();
    const entityId = searchParams.get('entityId') || 'VEN-991';

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesState] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState<Vendor[]>([]);

    useEffect(() => {
        // Fetch vendors for dropdown
        api.get('/vendors').then(res => setVendors(res.data)).catch(console.error);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/network/${entityId}`);
            const data = res.data;

            // Map nodes to use custom type
            const enhancedNodes = data.nodes.map((n: any) => ({
                ...n,
                type: 'custom', // Force custom node type
                data: { ...n.data }
            }));

            setNodes(enhancedNodes);
            setEdges(data.edges);
        } catch (e) {
            console.error("Graph fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // 10s refresh for live updates
        return () => clearInterval(interval);
    }, [entityId]);

    const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const vendorId = e.target.value;
        // Update URL without full reload
        const url = new URL(window.location.href);
        url.searchParams.set('entityId', vendorId);
        window.history.pushState({}, '', url);
        // Force manual fetch since pushState doesn't trigger effect dependency on searchParams result directly if we used useSearchParams hook result which is static in some versions, 
        // but here we used entityId derived from searchParams. 
        // Actually, to make it clean, let's just use window location reload or navigation
        // But let's stick to the existing pattern or improve it.
        // The simplest way:
        window.location.href = `?entityId=${vendorId}`;
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Entity Link Analysis</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Visualize hidden connections between vendors.
                        <span className="font-semibold text-blue-600 ml-1">Nodes</span> = Vendors,
                        <span className="font-semibold text-gray-500 ml-1">Edges</span> = Shared Schemes.
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                        <select
                            className="text-sm px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={entityId}
                            onChange={handleVendorChange}
                        >
                            <option value="">Select Vendor to Analyze...</option>
                            {vendors.map(v => (
                                <option key={v.id} value={v.id}>{v.name} ({v.id})</option>
                            ))}
                        </select>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded border border-blue-200">
                            Selected: {entityId}
                        </span>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button onClick={fetchData} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="flex gap-4 h-full">
                {/* Main Graph Area */}
                <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesState}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background color="#f1f5f9" gap={16} />
                        <Controls />
                    </ReactFlow>
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-sm">
                            <div className="flex flex-col items-center">
                                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                                <p className="text-sm font-semibold text-blue-900">Tracing relationships...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Legend & Guide Sidebar */}
                <div className="w-80 bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-6 h-auto overflow-y-auto">

                    {/* Legend */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Graph Legend</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-white border-2 border-red-500 shadow-sm flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-gray-900">V1</span>
                                </div>
                                <div className="text-xs text-gray-600">
                                    <p className="font-semibold text-gray-900">High Risk Vendor</p>
                                    Risk Score &gt; 80
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-white border-2 border-green-500 shadow-sm flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-gray-900">V2</span>
                                </div>
                                <div className="text-xs text-gray-600">
                                    <p className="font-semibold text-gray-900">Safe Vendor</p>
                                    Risk Score &lt; 50
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-0.5 bg-red-600"></div>
                                <div className="text-xs text-gray-600">
                                    <p className="font-semibold text-gray-900">Suspicious Link</p>
                                    Shared Beneficiary (Collusion)
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-0.5 bg-gray-400"></div>
                                <div className="text-xs text-gray-600">
                                    <p className="font-semibold text-gray-900">Standard Link</p>
                                    Shared Scheme
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* How to use */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Understanding the Graph</h3>
                        <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
                            <p>
                                <span className="font-semibold text-blue-600">Collusion Detection:</span>
                                Clusters of vendors connected by many lines suggest they are bidding on the same schemes frequently.
                            </p>
                            <p>
                                <span className="font-semibold text-red-600">Risk Contagion:</span>
                                If a Safe Vendor (Green) is heavily connected to High Risk Vendors (Red), they should be investigated.
                            </p>
                            <p className="italic bg-gray-50 p-2 rounded border border-gray-100">
                                "Tip: Hover over any node to see specific shared schemes and risk details."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
