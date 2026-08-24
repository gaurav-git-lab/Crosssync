import React from 'react';
import { SpeedDataPoint } from '../types';
import { formatSpeed } from '../../shared/protocol';

interface Props {
  data: SpeedDataPoint[];
  currentSpeedBps: number;
  isTransferring: boolean;
}

export const TransferSpeedGraph: React.FC<Props> = ({ data, currentSpeedBps, isTransferring }) => {
  const maxSpeed = Math.max(20, ...data.map((d) => d.speedMBps));
  const height = 48;
  const width = 160;

  // Generate SVG path coordinates
  const points = data.map((d, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - (d.speedMBps / maxSpeed) * (height - 8) - 4;
    return `${x},${y}`;
  });

  const pathD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;
  const lineD = `M ${points.join(' L ')}`;

  return (
    <div id="transfer-speed-graph" className="flex items-center gap-3 bg-black/20 rounded-xl px-3 py-2 border border-white/5">
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Transfer Rate</span>
        <span className={`text-xs font-semibold ${isTransferring ? 'text-cyan-400 animate-pulse' : 'text-gray-300'}`}>
          {formatSpeed(currentSpeedBps)}
        </span>
      </div>

      <div className="relative w-[120px] h-[36px] overflow-hidden rounded">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <defs>
            <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={pathD} fill="url(#speedGradient)" />
          <path
            d={lineD}
            fill="none"
            stroke="#00E5FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
