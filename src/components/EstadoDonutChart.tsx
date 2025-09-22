"use client";

import React, { useState } from 'react';

interface EstadoData {
  estado: string;
  count: number;
  percentage: number;
}

interface EstadoDonutChartProps {
  data: EstadoData[];
  title: string;
  total: number;
}

// Configuración de colores para cada estado (actualizados según nueva definición)
const estadoColors: { [key: string]: { 
  bg: string; 
  text: string; 
  border: string; 
  fill: string;
  description: string;
} } = {
  'En resguardo': { 
    bg: 'bg-orange-500', 
    text: 'text-orange-500', 
    border: 'border-orange-500',
    fill: '#f97316',
    description: 'Guardado, no operativo'
  },
  'Operativo': { 
    bg: 'bg-green-500', 
    text: 'text-green-500', 
    border: 'border-green-500',
    fill: '#22c55e',
    description: 'Disponible para uso'
  },
  'Asignado': { 
    bg: 'bg-blue-500', 
    text: 'text-blue-500', 
    border: 'border-blue-500',
    fill: '#3b82f6',
    description: 'Vinculado a empleado'
  },
  'Mantenimiento': { 
    bg: 'bg-yellow-500', 
    text: 'text-yellow-500', 
    border: 'border-yellow-500',
    fill: '#eab308',
    description: 'En reparación'
  },
  'De baja': { 
    bg: 'bg-red-500', 
    text: 'text-red-500', 
    border: 'border-red-500',
    fill: '#ef4444',
    description: 'Dañado, en sistema'
  },
};

export function EstadoDonutChart({ data, title, total }: EstadoDonutChartProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Calcular el radio y centro del gráfico
  const radius = 50;
  const centerX = 100;
  const centerY = 100;
  const strokeWidth = 25;

  // Calcular los arcos para cada estado
  let cumulativePercentage = 0;
  const arcs = data.map((item, index) => {
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + item.percentage) / 100) * 360;
    
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);
    
    const largeArcFlag = item.percentage > 50 ? 1 : 0;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    cumulativePercentage += item.percentage;
    
    return {
      ...item,
      pathData,
      color: estadoColors[item.estado] || { 
        bg: 'bg-gray-500', 
        text: 'text-gray-500', 
        border: 'border-gray-500',
        fill: '#6b7280',
        description: 'Estado no definido'
      }
    };
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">{title}</h3>
      
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90 cursor-pointer" viewBox="0 0 200 200">
            {/* Fondo del gráfico */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
            
            {/* Arcos de cada estado */}
            {arcs.map((arc, index) => {
              const isHovered = hoveredState === arc.estado;
              const isSelected = selectedState === arc.estado;
              const isZero = arc.count === 0;
              
              return (
                <path
                  key={index}
                  d={arc.pathData}
                  fill={arc.color.fill}
                  className={`transition-all duration-300 cursor-pointer ${
                    isZero ? 'opacity-30' : 'opacity-90'
                  } ${
                    isHovered ? 'opacity-100' : ''
                  } ${
                    isSelected ? 'opacity-100 drop-shadow-lg' : ''
                  }`}
                  style={{
                    filter: isHovered ? 'brightness(1.1)' : isSelected ? 'brightness(1.2)' : 'none',
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: 'center'
                  }}
                  onMouseEnter={() => setHoveredState(arc.estado)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => setSelectedState(selectedState === arc.estado ? null : arc.estado)}
                />
              );
            })}
            
            {/* Texto central con el total */}
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              className="text-2xl font-bold fill-gray-800"
            >
              {total}
            </text>
            <text
              x={centerX}
              y={centerY + 15}
              textAnchor="middle"
              className="text-sm fill-gray-600"
            >
              Total
            </text>
          </svg>
        </div>
      </div>
      
      {/* Leyenda interactiva */}
      <div className="mt-6 space-y-3">
        {arcs.map((arc, index) => {
          const isHovered = hoveredState === arc.estado;
          const isSelected = selectedState === arc.estado;
          const isZero = arc.count === 0;
          
          return (
            <div 
              key={index} 
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                isHovered || isSelected ? 'bg-gray-50 shadow-sm' : 'hover:bg-gray-50'
              } ${
                isZero ? 'opacity-50' : ''
              }`}
              onMouseEnter={() => setHoveredState(arc.estado)}
              onMouseLeave={() => setHoveredState(null)}
              onClick={() => setSelectedState(selectedState === arc.estado ? null : arc.estado)}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className={`w-4 h-4 rounded-full ${arc.color.bg} transition-all duration-300 ${
                    isHovered ? 'scale-125' : isSelected ? 'scale-110 ring-2 ring-gray-300' : ''
                  }`}
                  style={{ backgroundColor: arc.color.fill }}
                ></div>
                <div>
                  <span className={`text-sm font-medium ${
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {arc.estado}
                  </span>
                  {isSelected && (
                    <p className="text-xs text-gray-500 mt-1">{arc.color.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-semibold ${
                  isSelected ? 'text-gray-900' : 'text-gray-800'
                }`}>
                  {arc.count}
                </span>
                <span className="text-sm text-gray-500">({arc.percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Información del estado seleccionado */}
      {selectedState && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div 
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: estadoColors[selectedState]?.fill || '#6b7280' }}
            ></div>
            <div>
              <h4 className="font-semibold text-gray-900">{selectedState}</h4>
              <p className="text-sm text-gray-600">{estadoColors[selectedState]?.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
