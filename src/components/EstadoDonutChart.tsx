"use client";

import React from 'react';

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

// Configuración de colores para cada estado
const estadoColors: { [key: string]: { bg: string; text: string; border: string } } = {
  'Asignado': { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
  'Resguardo': { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
  'Operativo': { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' },
  'En reparación': { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
  'Mantenimiento': { bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500' },
  'De baja': { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
  'Por asignar': { bg: 'bg-gray-400', text: 'text-gray-400', border: 'border-gray-400' },
  'Nuevo': { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500' },
};

export function EstadoDonutChart({ data, title, total }: EstadoDonutChartProps) {
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
      color: estadoColors[item.estado] || { bg: 'bg-gray-500', text: 'text-gray-500', border: 'border-gray-500' }
    };
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">{title}</h3>
      
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
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
            {arcs.map((arc, index) => (
              <path
                key={index}
                d={arc.pathData}
                fill={arc.color.bg.replace('bg-', '').replace('-500', '')}
                className="opacity-90"
              />
            ))}
            
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
      
      {/* Leyenda */}
      <div className="mt-6 space-y-3">
        {arcs.map((arc, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${arc.color.bg}`}></div>
              <span className="text-sm font-medium text-gray-700">{arc.estado}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-900">{arc.count}</span>
              <span className="text-sm text-gray-500">({arc.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
