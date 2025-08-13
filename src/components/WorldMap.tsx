"use client";
import React, { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from "react-simple-maps";

// World map topology URL
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CountryData {
  id: string;
  name: string;
  value: number;
  roi: number;
  spend: number;
  nr: number;
}

interface WorldMapProps {
  data: CountryData[];
  onCountryClick?: (country: CountryData) => void;
  selectedCountry?: string | null;
}

export function WorldMap({ data, onCountryClick, selectedCountry }: WorldMapProps) {
  // Create a map for quick lookup of country data
  const dataMap = useMemo(() => {
    const map = new Map<string, CountryData>();
    data.forEach(d => {
      map.set(d.id, d);
      // Also map by name for fallback
      map.set(d.name.toLowerCase(), d);
    });
    return map;
  }, [data]);

  // Calculate color scale based on ROI values
  const { minROI, maxROI } = useMemo(() => {
    const rois = data.map(d => d.roi);
    return {
      minROI: Math.min(...rois),
      maxROI: Math.max(...rois)
    };
  }, [data]);

  const getCountryColor = (geo: { id: string; properties: { NAME?: string; name?: string } }) => {
    const countryId = geo.id;
    const countryName = geo.properties.NAME || geo.properties.name;
    
    // Try to find data by ID first, then by name
    const countryData = dataMap.get(countryId) || (countryName ? dataMap.get(countryName.toLowerCase()) : undefined);
    
    if (!countryData) {
      return "#f0f0f0"; // Light gray for countries with no data
    }

    // Calculate color intensity based on ROI
    const intensity = (countryData.roi - minROI) / (maxROI - minROI);
    
    // Create color gradient from light blue to dark blue
    const lightness = 90 - (intensity * 40); // 90% to 50% lightness
    return `hsl(210, 70%, ${lightness}%)`;
  };

  const handleCountryClick = (geo: { id: string; properties: { NAME?: string; name?: string } }) => {
    const countryId = geo.id;
    const countryName = geo.properties.NAME || geo.properties.name;
    
    const countryData = dataMap.get(countryId) || (countryName ? dataMap.get(countryName.toLowerCase()) : undefined);
    if (countryData && onCountryClick) {
      onCountryClick(countryData);
    }
  };

  return (
    <div className="w-full h-full">
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{
          scale: 160,
          center: [0, 0]
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Sphere id="world-sphere" stroke="#E4E5E6" strokeWidth={0.5} fill="transparent" />
        <Graticule stroke="#E4E5E6" strokeWidth={0.3} />
        
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryName = geo.properties.NAME || geo.properties.name;
              const countryData = dataMap.get(geo.id) || dataMap.get(countryName?.toLowerCase());
              const isSelected = selectedCountry === countryData?.id || selectedCountry === countryData?.name;
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getCountryColor(geo)}
                  stroke={isSelected ? "#2d2d2d" : "#ffffff"}
                  strokeWidth={isSelected ? 2 : 0.5}
                  style={{
                    default: {
                      outline: "none",
                    },
                    hover: {
                      outline: "none",
                      cursor: countryData ? "pointer" : "default",
                      filter: countryData ? "brightness(0.85)" : "none",
                    },
                    pressed: {
                      outline: "none",
                    },
                  }}
                  onClick={() => handleCountryClick(geo)}
                >
                  {/* Tooltip would go here if needed */}
                </Geography>
              );
            })
          }
        </Geographies>
      </ComposableMap>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <span className="text-xs text-black/60">ROI Performance</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-gradient-to-r from-blue-100 to-blue-800 rounded"></div>
          <span className="text-xs text-black/60">
            {minROI.toFixed(1)} - {maxROI.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          <span className="text-xs text-black/60">No data</span>
        </div>
      </div>
    </div>
  );
}