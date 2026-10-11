import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  color: string;
  height?: number;
  width?: number;
  fillOpacity?: number;
  unit?: string;
}

export default function Sparkline({
  data,
  color,
  height = 60,
  width = 280,
  fillOpacity = 0.15,
  unit = '',
}: SparklineProps) {
  const { path, fillPath, min, max } = useMemo(() => {
    if (data.length === 0) {
      return { path: '', fillPath: '', min: 0, max: 0 };
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / Math.max(data.length - 1, 1);

    const points = data.map((d, i) => {
      const x = i * stepX;
      const y = height - ((d - min) / range) * (height - 8) - 4;
      return { x, y };
    });

    const path = points
      .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
      .join(' ');

    const fillPath = `${path} L ${width},${height} L 0,${height} Z`;

    return { path, fillPath, min, max };
  }, [data, height, width]);

  const gradientId = useMemo(
    () => `spark-grad-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fillPath && <path d={fillPath} fill={`url(#${gradientId})`} />}
      {path && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {data.length > 0 && (
        <>
          <text x={2} y={12} className="text-[10px] fill-slate-400 font-medium">
            {max.toFixed(1)}{unit}
          </text>
          <text x={2} y={height - 2} className="text-[10px] fill-slate-400 font-medium">
            {min.toFixed(1)}{unit}
          </text>
        </>
      )}
    </svg>
  );
}
