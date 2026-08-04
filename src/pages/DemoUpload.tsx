import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, X, Loader2, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { Logomark } from '../components/icons/Logomark';
import { Button } from '../components/primitives/Button';
import { uploadDemoFile, startFixtureSession } from '../lib/demoApi';
import { useDemoStore } from '../store/demoStore';
import { cn } from '../lib/cn';

const ACCEPTED = ['.pkt', '.pka', '.gns3', '.zip'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DemoUpload() {
  const navigate = useNavigate();
  const setSession = useDemoStore((s) => s.setSession);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateAndSet(f: File) {
    const lower = f.name.toLowerCase();
    if (!ACCEPTED.some((ext) => lower.endsWith(ext))) {
      toast.error(`Unsupported file type. Upload one of: ${ACCEPTED.join(', ')}`);
      return;
    }
    setFile(f);
  }

  async function handleAnalyze() {
    if (!file) return;
    setUploading(true);
    try {
      const { session_id } = await uploadDemoFile(file);
      setSession(session_id, file.name);
      navigate(`/app/demo/${session_id}/analysis`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  }

  async function handleLoadDemo() {
    setLoadingDemo(true);
    try {
      const { session_id } = await startFixtureSession();
      setSession(session_id, 'demo-fixture.pkt');
      navigate(`/app/demo/${session_id}/analysis`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start demo session');
      setLoadingDemo(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center app-canvas-texture px-6 py-16">
      <div className="w-full max-w-[600px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logomark size={30} />
          <h1 className="mt-4 font-display text-2xl font-semibold text-text-bright">Upload Your Network</h1>
          <p className="mt-1.5 text-sm text-text-muted">Drop a Cisco Packet Tracer (.pkt) or GNS3 (.gns3) file to begin analysis</p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) validateAndSet(dropped);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-3 rounded-hero border-2 border-dashed px-6 py-14 text-center transition-colors',
            dragging ? 'border-blue bg-blue/[0.06]' : 'border-blue/30 bg-surface/40 hover:border-blue/50',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) validateAndSet(f);
            }}
          />
          <UploadCloud size={28} className="text-blue" />
          <p className="text-sm text-text-default">Drag and drop your file here, or click to browse</p>
          <p className="font-mono text-[10.5px] text-text-faint">.pkt · .gns3 · .zip</p>
        </div>

        {file && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-between rounded-card border border-blue/30 bg-blue/[0.05] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <FileText size={16} className="flex-shrink-0 text-blue" />
              <div className="min-w-0">
                <p className="truncate text-sm text-text-bright">{file.name}</p>
                <p className="font-mono text-[10.5px] text-text-faint">{formatBytes(file.size)}</p>
              </div>
            </div>
            <button onClick={() => setFile(null)} className="flex-shrink-0 text-text-faint hover:text-red">
              <X size={15} />
            </button>
          </motion.div>
        )}

        {file && (
          <Button variant="solid" sheen className="mt-4 w-full py-2.5" onClick={handleAnalyze} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Uploading…
              </>
            ) : (
              'Analyze'
            )}
          </Button>
        )}

        <div className="mt-6 space-y-1 text-center">
          <p className="text-[11px] text-text-faint">Supported: Cisco Packet Tracer 7.x/8.x (.pkt), GNS3 projects (.gns3 or .zip)</p>
          <p className="text-[11px] text-text-faint">Your file is processed in memory and never stored permanently.</p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-[11px] text-text-faint">or</span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        <button
          onClick={handleLoadDemo}
          disabled={loadingDemo}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-btn border border-border-subtle py-2.5 text-sm text-text-muted transition-colors hover:border-blue/40 hover:text-text-bright disabled:opacity-50"
        >
          {loadingDemo ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
          Try with built-in demo data
        </button>
      </div>
    </div>
  );
}
