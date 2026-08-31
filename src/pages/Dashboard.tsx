import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Gauge } from '../components/primitives/Gauge';
import { StatTile } from '../components/primitives/StatTile';
import { Card } from '../components/primitives/Card';
import { BandwidthChart } from '../components/dashboard/BandwidthChart';
import { SeverityDonut } from '../components/dashboard/SeverityDonut';
import { LiveAlertsFeed } from '../components/dashboard/LiveAlertsFeed';
import { RiskLeaderboard } from '../components/dashboard/RiskLeaderboard';
import { staggerContainer, staggerItem } from '../components/shell/PageTransition';
import { useRequireLiveSession } from '../hooks/useRequireLiveSession';
import { fetchLiveDashboard, LiveSessionError, type LiveDashboardStats } from '../lib/liveApi';
import type { Alert } from '../data/alerts';
import type { RiskDevice } from '../data/metrics';

export function Dashboard() {
  const hasSession = useRequireLiveSession();
  const navigate = useNavigate();

  const [stats, setStats] = useState<LiveDashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bandwidthSeries, setBandwidthSeries] = useState<{ hour: string; mbps: number }[] | undefined>(undefined);
  const [severityBreakdown, setSeverityBreakdown] = useState<{ name: string; value: number; color: string }[] | undefined>(undefined);
  const [riskLeaderboard, setRiskLeaderboard] = useState<RiskDevice[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSession) return;
    let cancelled = false;
    setLoading(true);
    fetchLiveDashboard()
      .then((data) => {
        if (cancelled) return;
        setStats(data.stats);
        setAlerts(data.alerts);
        setBandwidthSeries(data.bandwidthSeries);
        setSeverityBreakdown(data.severityBreakdown);
        setRiskLeaderboard(data.riskLeaderboard);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof LiveSessionError) {
          navigate('/app/live/connect', { replace: true });
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load live dashboard');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [hasSession, navigate]);

  const activeAlerts = alerts.filter((a) => a.severity !== 'info').length;
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;

  if (loading || !stats) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center gap-3 text-text-muted">
        <Loader2 size={16} className="animate-spin" />
        <span className="font-mono text-xs">{error ?? 'Loading live dashboard…'}</span>
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mx-auto max-w-[1440px] space-y-5 p-6">
      {/* Hero row */}
      <motion.div variants={staggerItem} className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
        <div className="flex flex-shrink-0 items-center justify-center rounded-hero border border-border-subtle bg-surface p-8 shadow-inset-top lg:w-[340px]">
          <Gauge value={stats.healthScore} label="Network Health" sublabel={`▲ ${stats.healthTrend} pts / 24h`} />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-4 xl:grid-cols-4">
          <StatTile
            label="Total Devices"
            value={stats.totalDevices}
            trend="live"
            trendDirection="flat"
            caption="switch + CDP neighbors"
          />
          <StatTile
            label="Active Alerts"
            value={activeAlerts}
            sparkColor="#FBBF24"
            emphasize={activeAlerts > 0 ? 'amber' : null}
            icon={activeAlerts > 0 ? <AlertTriangle size={13} className="text-amber" /> : undefined}
            trend={criticalAlerts > 0 ? `${criticalAlerts} critical` : 'steady'}
            trendDirection={criticalAlerts > 0 ? 'up' : 'flat'}
            trendTone={criticalAlerts > 0 ? 'bad' : 'neutral'}
            caption={`${criticalAlerts} critical`}
          />
          <StatTile
            label="Uptime"
            value={stats.uptime}
            decimals={1}
            suffix="%"
            sparkColor="#34D399"
            trend="live poll"
            trendDirection="flat"
            trendTone="neutral"
            caption="from current connection"
          />
          <StatTile
            label="Avg Latency"
            value={stats.avgLatency}
            decimals={1}
            suffix="ms"
            sparkColor="#22D3EE"
            trend="not measured"
            trendDirection="flat"
            trendTone="neutral"
            caption="requires ICMP probing"
          />
        </div>
      </motion.div>

      {/* Second row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Card>
            <BandwidthChart data={bandwidthSeries} />
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card className="h-full">
            <SeverityDonut data={severityBreakdown} />
          </Card>
        </motion.div>
      </div>

      {/* Third row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Card>
            <LiveAlertsFeed alerts={alerts} />
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card>
            <RiskLeaderboard data={riskLeaderboard} />
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
