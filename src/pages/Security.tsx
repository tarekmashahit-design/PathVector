import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Search, ServerCog } from 'lucide-react';
import { Card } from '../components/primitives/Card';
import { StatTile } from '../components/primitives/StatTile';
import { ThreatFeed } from '../components/security/ThreatFeed';
import { AuditLog } from '../components/security/AuditLog';
import { VulnPosture } from '../components/security/VulnPosture';
import { PortSecurityMap } from '../components/security/PortSecurityMap';
import { securityOverview } from '../data/security';
import { staggerContainer, staggerItem } from '../components/shell/PageTransition';

export function Security() {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mx-auto max-w-[1440px] space-y-5 p-6">
      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          label="Active Threats"
          value={securityOverview.activeThreats}
          emphasize={securityOverview.activeThreats > 0 ? 'red' : null}
          icon={<ShieldAlert size={13} className="text-red" />}
          trend="2 critical"
          trendDirection="flat"
          caption="last 24h"
        />
        <StatTile
          label="Blocked Today"
          value={securityOverview.blockedToday}
          icon={<ShieldCheck size={13} className="text-green" />}
          trend="+3 vs yesterday"
          trendDirection="up"
          trendTone="good"
          caption="auto-remediated"
        />
        <StatTile
          label="Open Investigations"
          value={securityOverview.openInvestigations}
          icon={<Search size={13} className="text-blue" />}
          trend="1 assigned"
          trendDirection="flat"
          caption="avg 40min to close"
        />
        <StatTile
          label="Devices at Risk"
          value={securityOverview.devicesAtRisk}
          emphasize={securityOverview.devicesAtRisk > 0 ? 'amber' : null}
          icon={<ServerCog size={13} className="text-amber" />}
          trend="steady"
          trendDirection="flat"
          caption="of 23 managed"
        />
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div variants={staggerItem} className="lg:col-span-2 lg:row-span-2">
          <Card className="h-full">
            <ThreatFeed />
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card>
            <VulnPosture />
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card>
            <PortSecurityMap />
          </Card>
        </motion.div>
      </div>
      <motion.div variants={staggerItem}>
        <Card>
          <AuditLog />
        </Card>
      </motion.div>
    </motion.div>
  );
}
