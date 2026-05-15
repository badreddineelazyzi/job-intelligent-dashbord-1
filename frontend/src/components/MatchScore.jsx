import React from 'react';

export default function MatchScore({ score = 0, size = 48 }) {
  // 🆕 Normaliser le score (peut être 0.95 ou 95 ou 1.47)
  let normalizedScore = 0;
  
  if (typeof score === 'number' && !isNaN(score)) {
    normalizedScore = score;
  } else if (typeof score === 'string') {
    normalizedScore = parseFloat(score) || 0;
  }
  
  // 🆕 Si score entre 0 et 1, c'est une probabilité → multiplier par 100
  // Sinon, c'est déjà un score brut (0-2) → diviser par 2 et multiplier par 100
  if (normalizedScore > 0 && normalizedScore <= 1) {
    // Score probabilité (0-1)
    normalizedScore = normalizedScore * 100;
  } else if (normalizedScore > 1) {
    // Score brut du matcher (0-2) → normaliser en pourcentage (0-100)
    normalizedScore = (normalizedScore / 2) * 100;
  }
  
  // 🆕 Limiter entre 0 et 100
  normalizedScore = Math.max(0, Math.min(100, normalizedScore));

  const getColor = (s) => {
    if (s >= 90) return '#10b981';
    if (s >= 70) return '#2563eb';
    if (s >= 50) return '#f59e0b';
    return '#cbd5e1';
  };

  const color = getColor(normalizedScore);
  const circumference = 2 * Math.PI * (size / 2 - 4);
  
  // 🆕 Maintenant sûr d'avoir un nombre entre 0 et 100
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>
          {Math.round(normalizedScore)}%
        </span>
      </div>
    </div>
  );
}