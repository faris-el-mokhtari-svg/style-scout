import { useState } from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { ExternalLink, X, Heart, Bookmark } from 'lucide-react';
import { useAesthetic } from '@/context/AestheticContext';

export type SwipeAction = 'like' | 'nope' | 'save';

export type SwipeProduct = {
  id: string;
  title: string;
  price: string;
  source: string;
  link: string;
  image: string;
  category?: string;
};

interface SwipeCardStackProps {
  products: SwipeProduct[];
  onAction: (product: SwipeProduct, action: SwipeAction) => void;
}

function DraggableCard({
  product,
  maxRotation,
  swipeExitDuration,
  onExit,
}: {
  product: SwipeProduct;
  maxRotation: number;
  swipeExitDuration: number;
  onExit: (action: SwipeAction) => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-280, 0, 280], [-maxRotation, 0, maxRotation]);

  const likeOpacity  = useTransform(x, [20, 90], [0, 1]);
  const nopeOpacity  = useTransform(x, [-90, -20], [1, 0]);
  const saveOpacity  = useTransform(y, [-90, -20], [1, 0]);

  const [flying, setFlying] = useState(false);

  const flyOff = async (action: SwipeAction) => {
    if (flying) return;
    setFlying(true);

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const exitDuration = swipeExitDuration / 1000;

    if (action === 'like') {
      await animate(x, screenW + 300, { duration: exitDuration, ease: [0.4, 0, 1, 1] });
    } else if (action === 'nope') {
      await animate(x, -(screenW + 300), { duration: exitDuration, ease: [0.4, 0, 1, 1] });
    } else {
      await animate(y, -(screenH + 200), { duration: exitDuration, ease: [0.4, 0, 1, 1] });
    }

    onExit(action);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (flying) return;
    const { velocity, offset } = info;
    const screenW = window.innerWidth;

    if (velocity.x > 800 || offset.x > screenW * 0.4) {
      flyOff('like');
    } else if (velocity.x < -800 || offset.x < -(screenW * 0.4)) {
      flyOff('nope');
    } else if (velocity.y < -800 || offset.y < -(window.innerHeight * 0.3)) {
      flyOff('save');
    } else {
      animate(x, 0, { type: 'spring', stiffness: 350, damping: 28 });
      animate(y, 0, { type: 'spring', stiffness: 350, damping: 28 });
    }
  };

  return (
    <motion.div
      style={{ x, y, rotate, touchAction: 'none' }}
      drag={!flying}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing select-none"
    >
      <div
        className="w-full h-full overflow-hidden relative"
        style={{ borderRadius: 'var(--radius-card)', backgroundColor: 'var(--card)' }}
      >
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        {/* Meta */}
        <div className="absolute bottom-16 inset-x-0 px-4 pointer-events-none">
          <p className="text-white/60 text-[10px] font-bold tracking-[0.1em] uppercase">{product.source}</p>
          <p className="text-white text-sm font-medium leading-tight mt-0.5 line-clamp-2">{product.title}</p>
          <p className="text-white/70 text-[10px] tracking-[0.1em] uppercase mt-1">{product.price}</p>
        </div>

        {/* Shop link */}
        <a
          href={product.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          style={{ borderRadius: '9999px' }}
          aria-label="Im Shop ansehen"
        >
          <ExternalLink className="size-3.5 text-white" strokeWidth={1.5} />
        </a>

        {/* Action labels */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 left-5 pointer-events-none"
        >
          <span
            className="font-black text-2xl tracking-widest uppercase px-3 py-1 block"
            style={{
              color: 'var(--like)',
              border: '2.5px solid var(--like)',
              transform: 'rotate(-20deg)',
            }}
          >
            Like
          </span>
        </motion.div>

        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-8 right-5 pointer-events-none"
        >
          <span
            className="font-black text-2xl tracking-widest uppercase px-3 py-1 block"
            style={{
              color: 'var(--dislike)',
              border: '2.5px solid var(--dislike)',
              transform: 'rotate(20deg)',
            }}
          >
            Nope
          </span>
        </motion.div>

        <motion.div
          style={{ opacity: saveOpacity }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <span
            className="font-black text-2xl tracking-widest uppercase px-3 py-1 block"
            style={{ color: 'var(--save)', border: '2.5px solid var(--save)' }}
          >
            Save
          </span>
        </motion.div>

        {/* Action buttons */}
        <div className="absolute bottom-0 inset-x-0 px-6 pb-4 flex justify-between items-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={e => { e.stopPropagation(); flyOff('nope'); }}
            className="w-12 h-12 flex items-center justify-center border-2"
            style={{
              borderColor: 'var(--dislike)',
              borderRadius: '9999px',
              backgroundColor: 'oklch(0% 0 0 / 0.3)',
              backdropFilter: 'blur(4px)',
            }}
            aria-label="Nicht mögen"
          >
            <X className="size-5 text-white" strokeWidth={2.5} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={e => { e.stopPropagation(); flyOff('save'); }}
            className="w-10 h-10 flex items-center justify-center border-2"
            style={{
              borderColor: 'var(--save)',
              borderRadius: '9999px',
              backgroundColor: 'oklch(0% 0 0 / 0.3)',
              backdropFilter: 'blur(4px)',
            }}
            aria-label="Speichern"
          >
            <Bookmark className="size-4 text-white" strokeWidth={2} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={e => { e.stopPropagation(); flyOff('like'); }}
            className="w-12 h-12 flex items-center justify-center border-2"
            style={{
              borderColor: 'var(--like)',
              borderRadius: '9999px',
              backgroundColor: 'oklch(0% 0 0 / 0.3)',
              backdropFilter: 'blur(4px)',
            }}
            aria-label="Mögen"
          >
            <Heart className="size-5 text-white" strokeWidth={2} fill="none" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function SwipeCardStack({ products, onAction }: SwipeCardStackProps) {
  const { config } = useAesthetic();
  const [topIndex, setTopIndex] = useState(0);

  const handleExit = (product: SwipeProduct, action: SwipeAction) => {
    onAction(product, action);
    setTopIndex(i => i + 1);
  };

  const remaining = products.slice(topIndex);

  if (remaining.length === 0) return null;

  const top   = remaining[0];
  const mid   = remaining[1];
  const back  = remaining[2];

  return (
    <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
      {/* Back card */}
      {back && (
        <div
          className="absolute inset-0"
          style={{
            borderRadius: 'var(--radius-card)',
            backgroundColor: 'var(--card)',
            transform: 'scale(0.92) translateY(20px)',
            transformOrigin: 'bottom center',
            overflow: 'hidden',
          }}
        >
          <img src={back.image} alt="" className="w-full h-full object-cover opacity-50" draggable={false} />
        </div>
      )}

      {/* Middle card */}
      {mid && (
        <div
          className="absolute inset-0"
          style={{
            borderRadius: 'var(--radius-card)',
            backgroundColor: 'var(--card)',
            transform: 'scale(0.96) translateY(10px)',
            transformOrigin: 'bottom center',
            overflow: 'hidden',
            transition: `transform ${config.standardDuration}ms ${config.easing}`,
          }}
        >
          <img src={mid.image} alt="" className="w-full h-full object-cover opacity-70" draggable={false} />
        </div>
      )}

      {/* Top card (draggable) — key forces remount on index change */}
      <DraggableCard
        key={top.id}
        product={top}
        maxRotation={config.maxRotation}
        swipeExitDuration={config.swipeExitDuration}
        onExit={(action) => handleExit(top, action)}
      />
    </div>
  );
}
