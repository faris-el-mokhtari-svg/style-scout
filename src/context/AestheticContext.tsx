import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { AESTHETICS, DEFAULT_AESTHETIC, type AestheticConfig, type AestheticId } from '@/lib/aesthetics';

interface AestheticState {
  aesthetic: AestheticId;
  config: AestheticConfig;
  setAesthetic: (id: AestheticId, notify?: boolean) => void;
  pendingUndo: boolean;
}

const AestheticContext = createContext<AestheticState>({
  aesthetic: DEFAULT_AESTHETIC,
  config: AESTHETICS[DEFAULT_AESTHETIC],
  setAesthetic: () => {},
  pendingUndo: false,
});

export function AestheticProvider({ children }: { children: ReactNode }) {
  const [aesthetic, setAestheticState] = useState<AestheticId>(() => {
    return (localStorage.getItem('cur8-aesthetic') as AestheticId | null) ?? DEFAULT_AESTHETIC;
  });
  const [pendingUndo, setPendingUndo] = useState(false);
  const previousRef = useRef<AestheticId | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-aesthetic', aesthetic);
    localStorage.setItem('cur8-aesthetic', aesthetic);
  }, [aesthetic]);

  const setAesthetic = (id: AestheticId, notify = true) => {
    if (id === aesthetic) return;
    const prev = aesthetic;
    previousRef.current = prev;
    setAestheticState(id);

    if (!notify) return;

    setPendingUndo(true);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (toastIdRef.current !== null) toast.dismiss(toastIdRef.current);

    toastIdRef.current = toast.custom(
      (t) => (
        <div
          style={{
            background: 'oklch(98% 0.008 60)',
            color: 'oklch(14% 0.008 50)',
            border: '1px solid oklch(88% 0.006 60)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '11px',
            letterSpacing: '0.02em',
            minWidth: '240px',
            borderRadius: '0px',
          }}
        >
          <span>Dein Style hat sich weiterentwickelt</span>
          <button
            onClick={() => {
              if (previousRef.current) {
                setAestheticState(previousRef.current);
                previousRef.current = null;
              }
              setPendingUndo(false);
              toast.dismiss(t);
              if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
            }}
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderBottom: '1px solid oklch(14% 0.008 50)',
              paddingBottom: '1px',
              flexShrink: 0,
              background: 'none',
              cursor: 'pointer',
              color: 'oklch(14% 0.008 50)',
            }}
          >
            Rückgängig
          </button>
        </div>
      ),
      { duration: 5000 }
    );

    undoTimerRef.current = setTimeout(() => {
      setPendingUndo(false);
      previousRef.current = null;
    }, 5000);
  };

  return (
    <AestheticContext.Provider value={{ aesthetic, config: AESTHETICS[aesthetic], setAesthetic, pendingUndo }}>
      {children}
    </AestheticContext.Provider>
  );
}

export const useAesthetic = () => useContext(AestheticContext);
