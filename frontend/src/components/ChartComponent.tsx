import React, { useEffect, useRef } from 'react'
import './ChartComponent.css'

interface ChartPoint {
  label: string
  value: number
}

interface ChartComponentProps {
  title: string
  type: 'bar' | 'line' | 'pie'
  data: ChartPoint[]
  height?: number
  showLegend?: boolean
  color?: string
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  title,
  type,
  data,
  height = 300,
  showLegend = true,
  color = '#3498db'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const width = canvas.offsetWidth
    const maxValue = Math.max(...data.map(d => d.value)) || 1

    if (type === 'bar') {
      drawBarChart(ctx, data, width, height, maxValue, color)
    } else if (type === 'line') {
      drawLineChart(ctx, data, width, height, maxValue, color)
    } else if (type === 'pie') {
      drawPieChart(ctx, data, width, height, color)
    }
  }, [data, type, height, color])

  const drawBarChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartPoint[],
    width: number,
    height: number,
    maxValue: number,
    color: string
  ) => {
    const padding = 40
    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding
    const barWidth = chartWidth / (data.length * 1.2)
    const gap = barWidth * 0.2

    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(padding, padding, chartWidth, chartHeight)

    data.forEach((point, i) => {
      const x = padding + i * (barWidth + gap)
      const barHeight = (point.value / maxValue) * chartHeight
      const y = padding + chartHeight - barHeight

      ctx.fillStyle = color
      ctx.fillRect(x, y, barWidth, barHeight)

      ctx.fillStyle = '#333'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(point.label, x + barWidth / 2, padding + chartHeight + 20)
    })
  }

  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartPoint[],
    width: number,
    height: number,
    maxValue: number,
    color: string
  ) => {
    const padding = 40
    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding

    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(padding, padding, chartWidth, chartHeight)

    const points = data.map((point, i) => ({
      x: padding + (i / (data.length - 1 || 1)) * chartWidth,
      y: padding + chartHeight - (point.value / maxValue) * chartHeight
    }))

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    points.forEach(p => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })
  }

  const drawPieChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartPoint[],
    width: number,
    height: number,
    color: string
  ) => {
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 3
    const total = data.reduce((sum, d) => sum + d.value, 0)

    const colors = [color, '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']

    let currentAngle = -Math.PI / 2
    data.forEach((point, i) => {
      const sliceAngle = (point.value / total) * 2 * Math.PI
      ctx.fillStyle = colors[i % colors.length]
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      ctx.lineTo(centerX, centerY)
      ctx.fill()
      currentAngle += sliceAngle
    })
  }

  return (
    <div className="chart-container">
      <h4 className="chart-title">{title}</h4>
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />
      {showLegend && (
        <div className="chart-legend">
          {data.map((point, i) => (
            <div key={i} className="legend-item">
              <span>{point.label}: R$ {point.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChartComponent
