import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export const CHART_COLORS = [
  '#1e3a5f',
  '#7c2d12',
  '#556b2f',
  '#b45309',
  '#4b5563',
  '#0f766e',
]

const MARGIN = { top: 10, right: 20, left: 20, bottom: 10 }

export default function ChartRenderer({
  chartType,
  data,
  xKey,
  yKeys,
  title,
  height = 300,
}) {
  if (!data || data.length === 0 || !xKey || !yKeys || yKeys.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-subtle text-sm text-ink/40">
        אין נתונים לגרף
      </div>
    )
  }

  let chart
  if (chartType === 'pie') {
    const yKey = yKeys[0]
    const pieData = data.map((d) => ({
      name: String(d[xKey]),
      value: Number(d[yKey]) || 0,
    }))
    chart = (
      <PieChart>
        <Tooltip />
        <Legend />
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
          isAnimationActive={false}
        >
          {pieData.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    )
  } else if (chartType === 'line') {
    chart = (
      <LineChart data={data} margin={MARGIN}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e0" />
        <XAxis dataKey={xKey} stroke="#6b6b6b" fontSize={12} />
        <YAxis stroke="#6b6b6b" fontSize={12} />
        <Tooltip />
        <Legend />
        {yKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    )
  } else if (chartType === 'area') {
    chart = (
      <AreaChart data={data} margin={MARGIN}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e0" />
        <XAxis dataKey={xKey} stroke="#6b6b6b" fontSize={12} />
        <YAxis stroke="#6b6b6b" fontSize={12} />
        <Tooltip />
        <Legend />
        {yKeys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            fillOpacity={0.25}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    )
  } else {
    chart = (
      <BarChart data={data} margin={MARGIN}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e0" />
        <XAxis dataKey={xKey} stroke="#6b6b6b" fontSize={12} />
        <YAxis stroke="#6b6b6b" fontSize={12} />
        <Tooltip />
        <Legend />
        {yKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <h4 className="text-center font-serif text-lg font-semibold text-ink">
          {title}
        </h4>
      )}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>{chart}</ResponsiveContainer>
      </div>
    </div>
  )
}
