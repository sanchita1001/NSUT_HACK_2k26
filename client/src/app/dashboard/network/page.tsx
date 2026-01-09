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


export default function NetworkPage() {
    const searchParams = useSearchParams();
    const entityId = searchParams.get('entityId') || 'VEN-991'; // Default to Agrotech

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesState] = useEdgesState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/network/${entityId}`);
            const data = await res.json();
            setNodes(data.nodes);
            setEdges(data.edges);
        } catch (e) {
            console.error("Graph fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [entityId]);

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Entity Link Analysis</h1>
                    <p className="text-sm text-gray-500">Visualizing live connections for ID: <span className="font-mono font-bold text-blue-600">{entityId}</span></p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={fetchData} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                        <AlertCircle className="h-4 w-4" />
                        <span> AI Engine: Collusion Detected</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesState}
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
