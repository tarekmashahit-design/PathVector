import { Logomark } from '../icons/Logomark';

const columns = [
  { title: 'Product', links: ['Platform', 'Topology', 'AI Analytics', 'Pricing'] },
  { title: 'Company', links: ['About', 'Careers', 'Blog'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border-subtle">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <Logomark size={22} />
              <span className="font-display text-sm font-semibold text-text-bright">PathVector</span>
            </div>
            <p className="mt-3 font-mono text-xs leading-relaxed text-text-faint">
              A live digital twin for networks that can’t afford surprises.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-8 sm:gap-16">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-text-faint transition-colors hover:text-text-bright">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-12 font-mono text-[11px] text-text-faint">© 2026 PathVector, Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}
