import React, { useState } from 'react';

// 1. Premium Donut Chart
export const SVGDonutChart = ({ data, title, centerValue, centerLabel }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Data format: [{ label: 'Late', value: 5, color: '#f59e0b' }, ...]
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  
  let currentAngle = 0;
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {title && <h4 className="mb-2" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{title}</h4>}
      
      <div style={{ position: 'relative', width: '160px', height: '160px' }}>
        <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
          {data.map((item, idx) => {
            const percentage = item.value / total;
            const strokeDashoffset = circumference - percentage * circumference;
            const rotation = currentAngle;
            currentAngle += percentage * 360;

            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={idx}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: '60px 60px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Text inside Donut */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
            {centerValue}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
            {centerLabel}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem', justifyContent: 'center' }}>
        {data.map((item, idx) => (
          <div 
            key={idx} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              fontSize: '0.75rem', 
              color: hoveredIdx === idx ? '#fff' : 'var(--text-secondary)',
              transition: 'color var(--transition-fast)'
            }}
          >
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
            <span>{item.label} ({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. Interactive SVG Bar Chart
export const SVGBarChart = ({ data, title, height = 150 }) => {
  // Data format: [{ label: 'Arjun', value: 85 }, ...]
  const [hoveredBar, setHoveredBar] = useState(null);
  const maxVal = Math.max(...data.map(d => d.value), 10);
  const chartHeight = height;
  const paddingBottom = 25;
  const paddingLeft = 35;
  const paddingTop = 15;
  const paddingRight = 10;
  
  const width = 300;
  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  
  const barSpacing = innerWidth / data.length;
  const barWidth = Math.max(8, barSpacing * 0.5);

  return (
    <div style={{ width: '100%' }}>
      {title && <h4 className="mb-2" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{title}</h4>}
      
      <div style={{ position: 'relative', width: '100%' }}>
        <svg viewBox={`0 0 ${width} ${chartHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          {/* Y Axis Gridlines & Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + innerHeight * (1 - ratio);
            const val = Math.round(maxVal * ratio);
            return (
              <g key={idx}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeWidth="1" 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 3} 
                  fill="var(--text-muted)" 
                  fontSize="8.5" 
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bar rendering */}
          {data.map((d, idx) => {
            const barHeight = (d.value / maxVal) * innerHeight;
            const x = paddingLeft + idx * barSpacing + (barSpacing - barWidth) / 2;
            const y = paddingTop + innerHeight - barHeight;
            const isHovered = hoveredBar === idx;

            return (
              <g key={idx}>
                {/* Visual Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(2, barHeight)}
                  rx="3"
                  fill={isHovered ? 'url(#barGradHover)' : 'url(#barGrad)'}
                  style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                />
                
                {/* Labels */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 8}
                  fill={isHovered ? '#fff' : 'var(--text-secondary)'}
                  fontSize="8.5"
                  textAnchor="middle"
                  style={{ transition: 'color var(--transition-fast)' }}
                >
                  {d.label}
                </text>

                {/* Hover value tooltip tag */}
                {isHovered && (
                  <g>
                    <rect 
                      x={x + barWidth / 2 - 20} 
                      y={y - 18} 
                      width="40" 
                      height="14" 
                      rx="3" 
                      fill="#1e293b" 
                      stroke="var(--primary)" 
                      strokeWidth="0.5" 
                    />
                    <text 
                      x={x + barWidth / 2} 
                      y={y - 8} 
                      fill="#fff" 
                      fontSize="8" 
                      textAnchor="middle" 
                      fontWeight="bold"
                    >
                      {d.value}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Gradients */}
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

// 3. Shaded Area Line Chart
export const SVGLineChart = ({ data, title, height = 150 }) => {
  // Data format: [{ label: 'Jan', value: 80 }, ...]
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const maxVal = Math.max(...data.map(d => d.value), 10);
  
  const chartHeight = height;
  const paddingBottom = 25;
  const paddingLeft = 35;
  const paddingTop = 15;
  const paddingRight = 15;
  
  const width = 300;
  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  
  const stepX = innerWidth / (data.length - 1 || 1);

  // Generate path points
  const points = data.map((d, idx) => {
    const x = paddingLeft + idx * stepX;
    const y = paddingTop + innerHeight - (d.value / maxVal) * innerHeight;
    return { x, y, value: d.value, label: d.label };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length-1].x} ${paddingTop + innerHeight} L ${points[0].x} ${paddingTop + innerHeight} Z`
    : '';

  return (
    <div style={{ width: '100%' }}>
      {title && <h4 className="mb-2" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{title}</h4>}
      
      <div style={{ position: 'relative', width: '100%' }}>
        <svg viewBox={`0 0 ${width} ${chartHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          {/* Y Axis Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + innerHeight * (1 - ratio);
            const val = Math.round(maxVal * ratio);
            return (
              <g key={idx}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeWidth="1" 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 3} 
                  fill="var(--text-muted)" 
                  fontSize="8.5" 
                  textAnchor="end"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Area under line */}
          {areaPath && (
            <path 
              d={areaPath} 
              fill="url(#areaGrad)" 
              style={{ transition: 'all 0.5s ease' }} 
            />
          )}

          {/* Line Path */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              style={{ transition: 'all 0.5s ease' }} 
            />
          )}

          {/* Interactive dots */}
          {points.map((p, idx) => {
            const isHovered = hoveredPoint === idx;
            return (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#10b981"
                  stroke="#fff"
                  strokeWidth="1"
                  style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <text
                  x={p.x}
                  y={chartHeight - 8}
                  fill={isHovered ? '#fff' : 'var(--text-secondary)'}
                  fontSize="8.5"
                  textAnchor="middle"
                >
                  {p.label}
                </text>

                {isHovered && (
                  <g>
                    <rect 
                      x={p.x - 20} 
                      y={p.y - 18} 
                      width="40" 
                      height="14" 
                      rx="3" 
                      fill="#1e293b" 
                      stroke="var(--secondary)" 
                      strokeWidth="0.5" 
                    />
                    <text 
                      x={p.x} 
                      y={p.y - 8} 
                      fill="#fff" 
                      fontSize="8" 
                      textAnchor="middle" 
                      fontWeight="bold"
                    >
                      {p.value}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Gradients */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
