"use client";

import { useState, useCallback } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AlertCircle } from 'lucide-react';

// Government "Spider Web" mock data
const initialNodes: Node[] = [
    // The Vendor (Center)
    { id: '1', position: { x: 250, y: 250 }, data: { label: 'Vendor: AGRO TECH' }, style: { background: '#fef2f2', border: '2px solid #ef4444', fontWeight: 'bold' } },

    // Beneficiaries
    { id: '2', position: { x: 100, y: 100 }, data: { label: 'Ben: R. Kumar' } },
    { id: '3', position: { x: 400, y: 100 }, data: { label: 'Ben: S. Singh' } },
    { id: '4', position: { x: 400, y: 400 }, data: { label: 'Ben: A. Verma' } },
    { id: '5', position: { x: 100, y: 400 }, data: { label: 'Ben: P. Yadav' } },

    // Suspicious Links
    { id: '6', position: { x: 550, y: 250 }, data: { label: 'Phone: +91-98765XXXX' }, style: { background: '#fff7ed', border: '1px dashed #f97316' } },
];

const initialEdges: Edge[] = [
    // Payments
    { id: 'e1-2', source: '1', target: '2', label: '₹12k', type: 'smoothstep' },
    { id: 'e1-3', source: '1', target: '3', label: '₹12k', type: 'smoothstep' },
    { id: 'e1-4', source: '1', target: '4', label: '₹45k', type: 'smoothstep', animated: true, style: { stroke: '#ef4444' } },
    { id: 'e1-5', source: '1', target: '5', label: '₹12k', type: 'smoothstep' },

    // Collusion
    { id: 'e3-6', source: '3', target: '6', style: { stroke: '#f97316', strokeDasharray: '5,5' } },
    { id: 'e1-6', source: '1', target: '6', style: { stroke: '#f97316', strokeDasharray: '5,5' }, label: 'Shared Phone!' },
];

export default function NetworkPage() {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Entity Link Analysis</h1>
                    <p className="text-sm text-gray-500">Visualizing hidden relationships between Vendors and Beneficiaries.</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                    <AlertCircle className="h-4 w-4" />
                    <span>Coluusion Detected: Shared Contact Details</span>
                </div>
            </div>

            <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                >
                    <Background color="#f1f5f9" gap={16} />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}
