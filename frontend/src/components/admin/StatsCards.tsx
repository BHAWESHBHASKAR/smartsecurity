'use client';

import { IconBuilding, IconVideo, IconAlertTriangle, IconTrendingUp, IconActivity } from '@tabler/icons-react';
import type { SystemStats } from '@/types';

interface StatsCardsProps {
  stats: SystemStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Clients',
      value: stats.totalUsers,
      icon: IconBuilding,
      iconColor: 'text-primary',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Cameras',
      value: stats.activeCamera,
      icon: IconVideo,
      iconColor: 'text-primary',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Active Alerts',
      value: stats.activeAlerts,
      icon: IconAlertTriangle,
      iconColor: 'text-destructive',
      trend: stats.activeAlerts > 0 ? 'Critical' : 'Normal',
      trendUp: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <card.icon className={`w-4 h-4 ${card.iconColor}`} stroke={1.5} />
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider font-serif">{card.title}</p>
                {card.trend !== 'Critical' && card.trend !== 'Normal' && (
                  <span className={`text-xs text-green-500 flex items-center gap-1 font-medium`}>
                    <IconTrendingUp className="w-3 h-3" stroke={1.5} />
                    {card.trend}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold text-foreground font-serif">{card.value}</p>
                {(card.trend === 'Critical' || card.trend === 'Normal') && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    card.trend === 'Critical' 
                      ? 'bg-destructive/10 text-destructive' 
                      : 'bg-green-500/10 text-green-500'
                  } flex items-center gap-1 font-medium`}>
                    <IconActivity className="w-3 h-3" stroke={1.5} />
                    {card.trend}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
