'use client';

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

export function ScoreGauge({ score, band }: { score: number; band: 'A'|'B'|'C'|'D' }) {
  let fill = '#16a34a'; // A (green)
  if (band === 'B') fill = '#2563eb'; // blue
  else if (band === 'C') fill = '#d97706'; // amber
  else if (band === 'D') fill = '#dc2626'; // red

  const data = [{ name: 'Score', value: score, fill }];

  return (
    <div className="flex flex-col items-center justify-center relative h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart 
          cx="50%" cy="50%" 
          innerRadius="70%" outerRadius="90%" 
          barSize={16} 
          data={data} 
          startAngle={180} endAngle={0}
        >
          <RadialBar
            background={{ fill: '#f3f4f6' }}
            dataKey="value"
            cornerRadius={8}
            className="gauge-circle"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center top-20">
        <span className="text-4xl font-bold tabular-nums text-gray-900">{score}</span>
        <span className="text-sm text-gray-500 font-medium">Band {band}</span>
      </div>
    </div>
  );
}
