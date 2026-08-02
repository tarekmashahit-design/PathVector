import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, Building2, Layers3 } from 'lucide-react';
import { useOnboardingStore, uid, type Site } from '../../store/onboardingStore';
import { WizardShell } from './WizardShell';
import { StepHeader, InfoNote } from './shared';
import { Button } from '../primitives/Button';

export function Step2Sites() {
  const { sites, setField, orgName } = useOnboardingStore();
  const canContinue = sites.length > 0 && sites.every((site) => site.buildings.length > 0);

  function updateSites(next: Site[]) {
    setField('sites', next);
  }

  function addSite() {
    updateSites([...sites, { id: uid(), name: `Site ${sites.length + 1}`, buildings: [] }]);
  }
  function removeSite(id: string) {
    updateSites(sites.filter((s) => s.id !== id));
  }
  function renameSite(id: string, name: string) {
    updateSites(sites.map((s) => (s.id === id ? { ...s, name } : s)));
  }
  function addBuilding(siteId: string) {
    updateSites(
      sites.map((s) =>
        s.id === siteId ? { ...s, buildings: [...s.buildings, { id: uid(), name: `Building ${String.fromCharCode(65 + s.buildings.length)}`, floors: [] }] } : s,
      ),
    );
  }
  function removeBuilding(siteId: string, buildingId: string) {
    updateSites(sites.map((s) => (s.id === siteId ? { ...s, buildings: s.buildings.filter((b) => b.id !== buildingId) } : s)));
  }
  function renameBuilding(siteId: string, buildingId: string, name: string) {
    updateSites(sites.map((s) => (s.id === siteId ? { ...s, buildings: s.buildings.map((b) => (b.id === buildingId ? { ...b, name } : b)) } : s)));
  }
  function addFloor(siteId: string, buildingId: string) {
    updateSites(
      sites.map((s) =>
        s.id === siteId
          ? { ...s, buildings: s.buildings.map((b) => (b.id === buildingId ? { ...b, floors: [...b.floors, { id: uid(), name: `Floor ${b.floors.length + 1}` }] } : b)) }
          : s,
      ),
    );
  }
  function removeFloor(siteId: string, buildingId: string, floorId: string) {
    updateSites(
      sites.map((s) =>
        s.id === siteId
          ? { ...s, buildings: s.buildings.map((b) => (b.id === buildingId ? { ...b, floors: b.floors.filter((f) => f.id !== floorId) } : b)) }
          : s,
      ),
    );
  }
  function renameFloor(siteId: string, buildingId: string, floorId: string, name: string) {
    updateSites(
      sites.map((s) =>
        s.id === siteId
          ? { ...s, buildings: s.buildings.map((b) => (b.id === buildingId ? { ...b, floors: b.floors.map((f) => (f.id === floorId ? { ...f, name } : f)) } : b)) }
          : s,
      ),
    );
  }

  return (
    <WizardShell canContinue={canContinue}>
      <StepHeader title="Sites & Buildings" subtitle="Build the physical hierarchy PathVector will monitor." />

      <div className="rounded-card border border-border-subtle bg-void/40 px-4 py-3">
        <p className="font-mono text-xs text-text-muted">
          Root: <span className="text-text-bright">{orgName || 'Your Organization'}</span>
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <AnimatePresence initial={false}>
          {sites.map((site) => (
            <motion.div
              key={site.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-card border border-border-subtle bg-surface p-4"
            >
              <div className="flex items-center gap-2">
                <input
                  value={site.name}
                  onChange={(e) => renameSite(site.id, e.target.value)}
                  className="flex-1 border-b border-transparent bg-transparent font-display text-sm font-semibold text-text-bright outline-none focus:border-blue/40"
                />
                <button onClick={() => addBuilding(site.id)} className="flex items-center gap-1 rounded-btn border border-border-subtle px-2 py-1 text-[11px] text-text-muted hover:border-blue/40 hover:text-text-bright">
                  <Plus size={11} /> Add Building
                </button>
                <button onClick={() => removeSite(site.id)} className="text-text-faint hover:text-red">
                  <X size={14} />
                </button>
              </div>

              <div className="ml-4 mt-3 space-y-2.5 border-l border-border-subtle pl-4">
                <AnimatePresence initial={false}>
                  {site.buildings.map((building) => (
                    <motion.div key={building.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="rounded-inset border border-border-subtle bg-elevated/40 p-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={13} className="flex-shrink-0 text-blue" />
                        <input
                          value={building.name}
                          onChange={(e) => renameBuilding(site.id, building.id, e.target.value)}
                          className="flex-1 border-b border-transparent bg-transparent text-sm text-text-default outline-none focus:border-blue/40"
                        />
                        <button onClick={() => addFloor(site.id, building.id)} className="flex items-center gap-1 rounded-btn border border-border-subtle px-2 py-1 text-[10.5px] text-text-muted hover:border-blue/40 hover:text-text-bright">
                          <Plus size={10} /> Add Floor
                        </button>
                        <button onClick={() => removeBuilding(site.id, building.id)} className="text-text-faint hover:text-red">
                          <X size={13} />
                        </button>
                      </div>

                      {building.floors.length > 0 && (
                        <div className="ml-5 mt-2 flex flex-wrap gap-1.5 border-l border-border-subtle pl-3">
                          <AnimatePresence initial={false}>
                            {building.floors.map((floor) => (
                              <motion.div
                                key={floor.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-1.5 rounded-pill border border-border-subtle bg-surface px-2.5 py-1"
                              >
                                <Layers3 size={11} className="text-text-faint" />
                                <input
                                  value={floor.name}
                                  onChange={(e) => renameFloor(site.id, building.id, floor.id, e.target.value)}
                                  className="w-20 bg-transparent font-mono text-[11px] text-text-default outline-none"
                                />
                                <button onClick={() => removeFloor(site.id, building.id, floor.id)} className="text-text-faint hover:text-red">
                                  <X size={10} />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Button variant="ghost" className="mt-3 w-full" onClick={addSite}>
        <Plus size={14} /> Add Site
      </Button>

      <InfoNote>You can always edit this structure later from Settings.</InfoNote>
    </WizardShell>
  );
}
