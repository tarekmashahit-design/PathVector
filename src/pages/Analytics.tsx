import { motion } from 'framer-motion';
import { Card } from '../components/primitives/Card';
import { InsightCards } from '../components/analytics/InsightCards';
import { AnomalyTimeline } from '../components/analytics/AnomalyTimeline';
import { PredictionsTable } from '../components/analytics/PredictionsTable';
import { HygieneMeters } from '../components/analytics/HygieneMeters';
import { staggerContainer, staggerItem } from '../components/shell/PageTransition';

export function Analytics() {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mx-auto max-w-[1440px] space-y-5 p-6">
      <motion.div variants={staggerItem}>
        <InsightCards />
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <AnomalyTimeline />
        </motion.div>
        <motion.div variants={staggerItem}>
          <HygieneMeters />
        </motion.div>
      </div>

      <motion.div variants={staggerItem}>
        <PredictionsTable />
      </motion.div>
    </motion.div>
  );
}
