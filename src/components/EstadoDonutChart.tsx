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
  label: string;
} } = {
  'OPERATIVO': { 
    bg: 'bg-green-500', 
    text: 'text-green-500', 
    border: 'border-green-500',
    fill: '#22c55e',
    description: 'No asignado - Disponible para uso',
    label: 'Operativo'
  },
  'ASIGNADO': { 
    bg: 'bg-blue-500', 
    text: 'text-blue-500', 
    border: 'border-blue-500',
    fill: '#3b82f6',
    description: 'Asignado a empleado',
    label: 'Asignado'
  },
  'EN_MANTENIMIENTO': { 
    bg: 'bg-orange-500', 
    text: 'text-orange-500', 
    border: 'border-orange-500',
    fill: '#f97316',
    description: 'No asignado - En mantenimiento',
    label: 'En Mantenimiento'
  },
  'EN_RESGUARDO': { 
    bg: 'bg-amber-500', 
    text: 'text-amber-500', 
    border: 'border-amber-500',
    fill: '#f59e0b',
    description: 'No asignado - En resguardo',
    label: 'En Resguardo'
  },
  'DE_BAJA': { 
    bg: 'bg-red-500', 
    text: 'text-red-500', 
    border: 'border-red-500',
    fill: '#ef4444',
    description: 'No asignado - De baja',
    label: 'De Baja'
  },
  // Mantener compatibilidad con estados antiguos
  'En resguardo': { 
    bg: 'bg-orange-500', 
    text: 'text-orange-500', 
    border: 'border-orange-500',
    fill: '#f97316',
    description: 'Guardado, no operativo',
    label: 'En Resguardo'
  },
  'Operativo': { 
    bg: 'bg-green-500', 
    text: 'text-green-500', 
    border: 'border-green-500',
    fill: '#22c55e',
    description: 'Disponible para uso',
    label: 'Operativo'
  },
  'Asignado': { 
    bg: 'bg-blue-500', 
    text: 'text-blue-500', 
    border: 'border-blue-500',
    fill: '#3b82f6',
    description: 'Vinculado a empleado',
    label: 'Asignado'
  },
  'Mantenimiento': { 
    bg: 'bg-yellow-500', 
    text: 'text-yellow-500', 
    border: 'border-yellow-500',
    fill: '#eab308',
    description: 'En reparación',
    label: 'Mantenimiento'
  },
  'De baja': { 
    bg: 'bg-red-500', 
    text: 'text-red-500', 
    border: 'border-red-500',
    fill: '#ef4444',
    description: 'Dañado, en sistema',
    label: 'De Baja'
  },
};

export function EstadoDonutChart({ data, title, total }: EstadoDonutChartProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Debug: ver qué datos estamos recibiendo
  console.log('EstadoDonutChart - Props recibidas:', { data, title, total });
  console.log('EstadoDonutChart - Data detallado:', JSON.stringify(data, null, 2));

  // Calcular el radio y centro del gráfico
  const radius = 50;
  const centerX = 100;
  const centerY = 100;
  const strokeWidth = 25;

  // Filtrar datos para solo incluir estados con count > 0
  const filteredData = data.filter(item => item.count > 0);
  
  // Si solo hay un estado con datos, ajustar su porcentaje a 100%
  if (filteredData.length === 1) {
    filteredData[0].percentage = 100;
  }
  
  // Calcular los arcos para cada estado
  let cumulativePercentage = 0;
  const arcs = filteredData.map((item, index) => {
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + item.percentage) / 100) * 360;
    
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);
    
    const largeArcFlag = item.percentage > 50 ? 1 : 0;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    // Para porcentajes del 100%, necesitamos un círculo completo
    let pathData;
    if (item.percentage >= 100) {
      // Círculo completo
      pathData = [
        `M ${centerX} ${centerY}`,
        `L ${centerX + radius} ${centerY}`,
        `A ${radius} ${radius} 0 1 1 ${centerX - radius} ${centerY}`,
        `A ${radius} ${radius} 0 1 1 ${centerX + radius} ${centerY}`,
        'Z'
      ].join(' ');
    } else {
      // Arco normal
      pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
    }
    
    cumulativePercentage += item.percentage;

    console.log(`Arco ${index}: ${item.estado} - Count: ${item.count}, Percentage: ${item.percentage}, PathData: ${pathData}`);
    
    // Buscar el color para este estado, con fallback
    const colorConfig = estadoColors[item.estado] || { 
      bg: 'bg-gray-500', 
      text: 'text-gray-500', 
      border: 'border-gray-500',
      fill: '#6b7280',
      description: 'Estado no definido',
      label: item.estado
    };

    console.log(`Estado: ${item.estado}, Color config:`, colorConfig);

    return {
      ...item,
      pathData,
      color: colorConfig
    };
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6 text-center">{title}</h3>
      
      <div className="flex items-center justify-center">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80">
          <svg className="w-full h-full cursor-pointer" viewBox="0 0 200 200">
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
              
              console.log(`Renderizando arco: ${arc.estado}, count: ${arc.count}, percentage: ${arc.percentage}, fill: ${arc.color.fill}`);
              
              return (
                <path
                  key={index}
                  d={arc.pathData}
                  fill={arc.color.fill}
                  className={`transition-all duration-300 cursor-pointer ${
                    isZero ? 'opacity-20' : 'opacity-90'
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
              className="text-xl sm:text-2xl font-bold fill-gray-800"
            >
              {total}
            </text>
            <text
              x={centerX}
              y={centerY + 15}
              textAnchor="middle"
              className="text-xs sm:text-sm fill-gray-600"
            >
              Total
            </text>
          </svg>
        </div>
      </div>
      
      {/* Leyenda interactiva */}
      <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
        {data.map((item, index) => {
          const isHovered = hoveredState === item.estado;
          const isSelected = selectedState === item.estado;
          const isZero = item.count === 0;
          const colorConfig = estadoColors[item.estado] || { 
            bg: 'bg-gray-500', 
            text: 'text-gray-500', 
            border: 'border-gray-500',
            fill: '#6b7280',
            description: 'Estado no definido',
            label: item.estado
          };
          
          return (
            <div 
              key={index} 
              className={`flex items-center justify-between p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                isHovered || isSelected ? 'bg-gray-50 shadow-sm' : 'hover:bg-gray-50'
              } ${
                isZero ? 'opacity-50' : ''
              }`}
              onMouseEnter={() => setHoveredState(item.estado)}
              onMouseLeave={() => setHoveredState(null)}
              onClick={() => setSelectedState(selectedState === item.estado ? null : item.estado)}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div 
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${colorConfig.bg} transition-all duration-300 ${
                    isHovered ? 'scale-125' : isSelected ? 'scale-110 ring-2 ring-gray-300' : ''
                  }`}
                  style={{ backgroundColor: colorConfig.fill }}
                ></div>
                <div>
                  <span className={`text-xs sm:text-sm font-medium ${
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {colorConfig.label}
                  </span>
                  {isSelected && (
                    <p className="text-xs text-gray-500 mt-1 hidden sm:block">{colorConfig.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className={`text-xs sm:text-sm font-semibold ${
                  isSelected ? 'text-gray-900' : 'text-gray-800'
                }`}>
                  {item.count}
                </span>
                <span className="text-sm text-gray-500">({item.percentage}%)</span>
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
              <h4 className="font-semibold text-gray-900">{estadoColors[selectedState]?.label || selectedState}</h4>
              <p className="text-sm text-gray-600">{estadoColors[selectedState]?.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
