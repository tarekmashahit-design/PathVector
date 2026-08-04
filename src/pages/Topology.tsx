import { useState } from 'react';
import { SegmentedControl } from '../components/primitives/SegmentedControl';
import { TopologyGraph } from '../components/topology/TopologyGraph';
import { SlideOver } from '../components/primitives/SlideOver';
import { DeviceDetailPanel } from '../components/devices/DeviceDetailPanel';
import { devices } from '../data/devices';

type FloorFilter = 'all' | '1' | '2' | '3';

export function Topology() {
  const [floor, setFloor] = useState<FloorFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedDevice = selectedId ? devices.find((d) => d.id === selectedId) : undefined;
  const graphFloor = floor === 'all' ? 'all' : ((Number(floor) as 1 | 2 | 3));

  return (
    <div className="relative h-[calc(100vh-64px)] w-full">
      <div className="absolute left-6 top-6 z-10">
        <SegmentedControl
          value={floor}
          onChange={setFloor}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Floor 1', value: '1' },
            { label: 'Floor 2', value: '2' },
            { label: 'Floor 3', value: '3' },
          ]}
        />
      </div>

      <TopologyGraph floor={graphFloor} onSelect={setSelectedId} />

      <SlideOver
        open={!!selectedDevice}
        onClose={() => setSelectedId(null)}
        title={selectedDevice && <span className="font-mono text-sm font-semibold text-text-bright">{selectedDevice.name}</span>}
      >
        {selectedDevice && <DeviceDetailPanel device={selectedDevice} />}
      </SlideOver>
    </div>
  );
}
