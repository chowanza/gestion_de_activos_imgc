"use client";

import React, { useState } from 'react';

interface BarData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
  // Porcentaje agregado de cobertura de empleados con equipos en la empresa
  coveragePercentage?: number;
  departments?: Array<{
    name: string;
    computers: number;
    devices?: number;
    users: number;
    percentage: number;
  }>;
}

interface BarChartVerticalProps {
  data: BarData[];
  title: string;
  subtitle?: string;
  maxValue?: number;
  showPercentage?: boolean;
  onBarClick?: (barData: BarData) => void;
  equipmentTypeFilter?: string;
}

export function BarChartVertical({ 
  data, 
  title, 
  subtitle, 
  maxValue, 
  showPercentage = true,
  onBarClick,
  equipmentTypeFilter = "todos"
}: BarChartVerticalProps) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [selectedBar, setSelectedBar] = useState<string | null>(null);

  // Calcular el valor máximo si no se proporciona
  const calculatedMaxValue = maxValue || Math.max(...data.map(item => item.value));
  
  // Generar colores únicos para cada empresa
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
      '#6366f1', // indigo
      '#14b8a6', // teal
      '#f43f5e', // rose
      '#a855f7', // purple
      '#06d6a0', // mint
      '#ffd60a'  // yellow
    ];
    return colors[index % colors.length];
  };

  const handleBarClick = (barData: BarData) => {
    setSelectedBar(selectedBar === barData.name ? null : barData.name);
    if (onBarClick) {
      onBarClick(barData);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {selectedBar && (
            <button
              onClick={() => setSelectedBar(null)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 transition-colors"
            >
              Limpiar Selección
            </button>
          )}
        </div>
      </div>
      
      {/* Gráfico de barras verticales */}
      <div className="flex items-end justify-between space-x-6 h-80 mb-6">
        {data.map((item, index) => {
          const isHovered = hoveredBar === item.name;
          const isSelected = selectedBar === item.name;
          const barHeight = calculatedMaxValue > 0 ? (item.value / calculatedMaxValue) * 100 : 0;
          const itemColor = item.color || generateColor(index);
          
          return (
            <div 
              key={item.name}
              className="flex-1 flex flex-col items-center group cursor-pointer transition-all duration-300"
              onMouseEnter={() => setHoveredBar(item.name)}
              onMouseLeave={() => setHoveredBar(null)}
              onClick={() => handleBarClick(item)}
            >
              {/* Barra vertical */}
              <div className="relative w-full flex flex-col justify-end h-full">
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ease-out relative ${
                    isHovered ? 'opacity-90' : 'opacity-85'
                  } ${
                    isSelected ? 'ring-2 ring-blue-300 ring-opacity-50' : ''
                  }`}
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: itemColor,
                    minHeight: item.value > 0 ? '20px' : '0px',
                    transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                    transformOrigin: 'bottom center'
                  }}
                />
                
                {/* Tooltip en hover */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                    <div className="font-semibold">{item.name}</div>
                    <div>{item.value} equipos ({item.percentage}%)</div>
                    {typeof item.coveragePercentage === 'number' && (
                      <div>Cobertura empleados: {item.coveragePercentage}%</div>
                    )}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
              
              {/* Etiqueta del eje X */}
              <div className="mt-3 text-xs text-center text-gray-600 max-w-full">
                <div className="truncate font-medium" title={item.name}>
                  {item.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Panel de departamentos para la empresa seleccionada */}
      {selectedBar && data.find(item => item.name === selectedBar)?.departments && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            <div 
              className="w-4 h-4 rounded-full mr-2"
              style={{ backgroundColor: data.find(item => item.name === selectedBar)?.color || '#3b82f6' }}
            ></div>
            Departamentos de {selectedBar}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.find(item => item.name === selectedBar)?.departments?.map((dept, index) => (
              <div key={index} className="p-3 bg-white rounded border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-800 text-sm">{dept.name}</h5>
                  <span className="text-xs text-gray-600">
                    {isNaN(dept.percentage) ? '0%' : `${dept.percentage}%`}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  {equipmentTypeFilter === "todos" && (
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                      {(dept.computers ?? 0) + (dept.devices ?? 0)} equipos
                    </span>
                  )}
                  {equipmentTypeFilter === "computadores" && (
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                      {dept.computers} computadores
                    </span>
                  )}
                  {equipmentTypeFilter === "dispositivos" && (
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      {dept.devices} dispositivos
                    </span>
                  )}
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                    {dept.users} empleados
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Estadísticas resumidas */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Total: {data.reduce((sum, item) => sum + item.value, 0)} equipos</span>
          <span>{data.length} {data.length === 1 ? 'empresa' : 'empresas'}</span>
        </div>
      </div>
    </div>
  );
}
