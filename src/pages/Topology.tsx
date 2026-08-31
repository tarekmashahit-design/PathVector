import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SegmentedControl } from '../components/primitives/SegmentedControl';
import { TopologyGraph } from '../components/topology/TopologyGraph';
import { SlideOver } from '../components/primitives/SlideOver';
import { DeviceDetailPanel } from '../components/devices/DeviceDetailPanel';
import { useRequireLiveSession } from '../hooks/useRequireLiveSession';
import { fetchLiveDevices, fetchLiveTopology, LiveSessionError } from '../lib/liveApi';
import type { Device } from '../data/devices';
import type { TopoNode, TopoEdge } from '../data/topology';

type FloorFilter = 'all' | '1' | '2' | '3';

export function Topology() {
  const hasSession = useRequireLiveSession();
  const navigate = useNavigate();

  const [floor, setFloor] = useState<FloorFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [nodes, setNodes] = useState<TopoNode[]>([]);
  const [edges, setEdges] = useState<TopoEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSession) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchLiveTopology(), fetchLiveDevices()])
      .then(([topo, devs]) => {
        if (cancelled) return;
        setNodes(topo.nodes);
        setEdges(topo.edges);
        setDevices(devs.devices);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof LiveSessionError) {
          navigate('/app/live/connect', { replace: true });
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load live topology');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [hasSession, navigate]);

  const selectedDevice = selectedId ? devices.find((d) => d.id === selectedId) : undefined;
  const graphFloor = floor === 'all' ? 'all' : ((Number(floor) as 1 | 2 | 3));

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center gap-3 text-text-muted">
        <Loader2 size={16} className="animate-spin" />
        <span className="font-mono text-xs">{error ?? 'Loading live topology…'}</span>
      </div>
    );
  }

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

      <TopologyGraph floor={graphFloor} onSelect={setSelectedId} nodes={nodes} edges={edges} />

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
