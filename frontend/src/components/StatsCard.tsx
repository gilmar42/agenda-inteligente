import React from 'react'
import './StatsCard.css'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  trend?: { direction: 'up' | 'down'; percentage: number }
  color?: 'primary' | 'success' | 'warning' | 'danger'
  onClick?: () => void
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  onClick
}) => (
  <div className={`stats-card stats-${color}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div className="stats-header">
      {icon && <span className="stats-icon">{icon}</span>}
      <h3 className="stats-title">{title}</h3>
    </div>
    <div className="stats-value">{value}</div>
    {subtitle && <p className="stats-subtitle">{subtitle}</p>}
    {trend && (
      <div className={`stats-trend trend-${trend.direction}`}>
        <span className="trend-arrow">{trend.direction === 'up' ? '↑' : '↓'}</span>
        <span className="trend-percent">{trend.percentage}%</span>
      </div>
    )}
  </div>
)

export default StatsCard
