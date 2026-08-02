import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Gauge } from '../components/primitives/Gauge';
import { StatTile } from '../components/primitives/StatTile';
import { Card } from '../components/primitives/Card';
import { BandwidthChart } from '../components/dashboard/BandwidthChart';
import { SeverityDonut } from '../components/dashboard/SeverityDonut';
import { LiveAlertsFeed } from '../components/dashboard/LiveAlertsFeed';
import { RiskLeaderboard } from '../components/dashboard/RiskLeaderboard';
import { useAppShell } from '../context/AppShellContext';
import { dashboardStats, sparkTemplates } from '../data/metrics';
import { staggerContainer, staggerItem } from '../components/shell/PageTransition';

export function Dashboard() {
  const { liveEvents } = useAppShell();
  const activeAlerts = liveEvents.alerts.filter((a) => a.severity !== 'info').length;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mx-auto max-w-[1440px] space-y-5 p-6">
      {/* Hero row */}
      <motion.div variants={staggerItem} className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
        <div className="flex flex-shrink-0 items-center justify-center rounded-hero border border-border-subtle bg-surface p-8 shadow-inset-top lg:w-[340px]">
          <Gauge value={dashboardStats.healthScore} label="Network Health" sublabel={`▲ ${dashboardStats.healthTrend} pts / 24h`} />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-4 xl:grid-cols-4">
          <StatTile
            label="Total Devices"
            value={dashboardStats.totalDevices}
            spark={sparkTemplates.devices}
            trend="+1 this week"
            trendDirection="up"
            caption="22 healthy · 1 offline"
          />
          <StatTile
            label="Active Alerts"
            value={activeAlerts}
            spark={sparkTemplates.alerts}
            sparkColor="#FBBF24"
            emphasize={activeAlerts > 0 ? 'amber' : null}
            icon={activeAlerts > 0 ? <AlertTriangle size={13} className="text-amber" /> : undefined}
            trend={activeAlerts > 3 ? `+${activeAlerts - 3} today` : 'steady'}
            trendDirection={activeAlerts > 3 ? 'up' : 'flat'}
            trendTone={activeAlerts > 3 ? 'bad' : 'neutral'}
            caption="1 critical"
          />
          <StatTile
            label="Uptime"
            value={dashboardStats.uptime}
            decimals={1}
            suffix="%"
            spark={sparkTemplates.uptime}
            sparkColor="#34D399"
            trend="-0.1% vs last week"
            trendDirection="down"
            trendTone="neutral"
            caption="SLA target 99.5%"
          />
          <StatTile
            label="Avg Latency"
            value={dashboardStats.avgLatency}
            decimals={1}
            suffix="ms"
            spark={sparkTemplates.latency}
            sparkColor="#22D3EE"
            trend="-0.3ms vs 24h avg"
            trendDirection="down"
            trendTone="good"
            caption="p95 4.1ms"
          />
        </div>
      </motion.div>

      {/* Second row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Card>
            <BandwidthChart />
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card className="h-full">
            <SeverityDonut />
          </Card>
        </motion.div>
      </div>

      {/* Third row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Card>
            <LiveAlertsFeed alerts={liveEvents.alerts} />
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card>
            <RiskLeaderboard />
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
