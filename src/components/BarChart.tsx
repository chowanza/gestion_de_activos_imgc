"use client";

import React, { useState } from 'react';

interface BarData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  title: string;
  subtitle?: string;
  maxValue?: number;
  showPercentage?: boolean;
  barColor?: string;
}

export function BarChart({ 
  data, 
  title, 
  subtitle, 
  maxValue, 
  showPercentage = true,
  barColor = '#3b82f6'
}: BarChartProps) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [selectedBar, setSelectedBar] = useState<string | null>(null);

  // Calcular el valor máximo si no se proporciona
  const calculatedMaxValue = maxValue || Math.max(...data.map(item => item.value));
  
  // Generar colores si no se proporcionan
  const generateColor = (index: number) => {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // emerald
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#f97316', // orange
      '#ec4899', // pink
      '#6b7280'  // gray
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      
      <div className="space-y-4">
        {data.map((item, index) => {
          const isHovered = hoveredBar === item.name;
          const isSelected = selectedBar === item.name;
          const barWidth = calculatedMaxValue > 0 ? (item.value / calculatedMaxValue) * 100 : 0;
          const itemColor = item.color || generateColor(index);
          
          return (
            <div 
              key={item.name}
              className="group cursor-pointer transition-all duration-300"
              onMouseEnter={() => setHoveredBar(item.name)}
              onMouseLeave={() => setHoveredBar(null)}
              onClick={() => setSelectedBar(selectedBar === item.name ? null : item.name)}
            >
              {/* Barra */}
              <div className="flex items-center space-x-4 mb-2">
                <div className="w-24 text-sm font-medium text-gray-700 truncate">
                  {item.name}
                </div>
                <div className="flex-1 relative">
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        isHovered ? 'opacity-90' : 'opacity-80'
                      } ${
                        isSelected ? 'ring-2 ring-blue-300 ring-opacity-50' : ''
                      }`}
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: itemColor,
                        transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                        transformOrigin: 'left center'
                      }}
                    />
                  </div>
                  
                  {/* Valor en la barra */}
                  {item.value > 0 && (
                    <div 
                      className={`absolute inset-y-0 left-2 flex items-center text-sm font-semibold transition-colors duration-300 ${
                        barWidth > 30 ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      {item.value}
                    </div>
                  )}
                </div>
                
                {/* Porcentaje */}
                {showPercentage && (
                  <div className="w-16 text-right">
                    <span className={`text-sm font-semibold ${
                      isSelected ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {item.percentage}%
                    </span>
                  </div>
                )}
              </div>
              
              {/* Información adicional al seleccionar */}
              {isSelected && (
                <div className="ml-28 mb-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">{item.name}</p>
                      <p className="text-xs text-blue-700">
                        {item.value} equipos • {item.percentage}% del total
                      </p>
                    </div>
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: itemColor }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Estadísticas resumidas */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Total: {data.reduce((sum, item) => sum + item.value, 0)} equipos</span>
          <span>{data.length} {data.length === 1 ? 'entidad' : 'entidades'}</span>
        </div>
      </div>
    </div>
  );
}

