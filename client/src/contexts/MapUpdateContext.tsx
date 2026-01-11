"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface MapUpdateContextType {
    triggerMapUpdate: () => void;
    mapUpdateTrigger: number;
}

const MapUpdateContext = createContext<MapUpdateContextType | undefined>(undefined);

export function MapUpdateProvider({ children }: { children: React.ReactNode }) {
    const [mapUpdateTrigger, setMapUpdateTrigger] = useState(0);

    const triggerMapUpdate = useCallback(() => {
        setMapUpdateTrigger(prev => prev + 1);
    }, []);

    return (
        <MapUpdateContext.Provider value={{ triggerMapUpdate, mapUpdateTrigger }}>
            {children}
        </MapUpdateContext.Provider>
    );
}

export function useMapUpdate() {
    const context = useContext(MapUpdateContext);
    if (context === undefined) {
        throw new Error('useMapUpdate must be used within a MapUpdateProvider');
    }
    return context;
}
