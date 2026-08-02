import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#131A2A',
          border: '1px solid rgba(148,163,184,0.14)',
          color: '#F1F5F9',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
        },
      }}
    />
  );
}
