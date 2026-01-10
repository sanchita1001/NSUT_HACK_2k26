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

const CustomNode = ({ data }: { data: any }) => {
    return (
        <div className="relative group">
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
            <div className="absolute hidden group-hover:block z-50 w-64 p-3 mt-2 text-sm text-left text-white bg-gray-900 rounded-lg shadow-xl -left-1/2 ml-16">
                <p className="font-semibold border-b border-gray-700 pb-1 mb-1">{data.label}</p>
                <p>Risk Score: {data.riskScore}</p>
                {data.sharedSchemes && (
                    <div className="mt-2 text-xs text-gray-300">
                        <p className="font-semibold text-gray-100 mb-1">Shared Schemes:</p>
                        {data.sharedSchemes}
                    </div>
                )}
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
                    <div className="flex items-center gap-4 mt-2">
                        <select
                            className="text-sm px-3 py-1 border rounded text-gray-900 bg-white"
                            value={entityId}
                            onChange={handleVendorChange}
                        >
                            <option value="">Select Vendor...</option>
                            {vendors.map(v => (
                                <option key={v.id} value={v.id}>{v.name} ({v.id})</option>
                            ))}
                        </select>
                        <p className="text-sm text-gray-500">Visualizing: <span className="font-mono font-bold text-blue-600">{entityId}</span></p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button onClick={fetchData} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                        <AlertCircle className="h-4 w-4" />
                        <span> AI Engine: Real-time Collusion Detection</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative">
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
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                        <div className="flex flex-col items-center">
                            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                            <p className="text-sm font-semibold text-blue-900">Tracing funds...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
