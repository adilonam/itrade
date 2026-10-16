'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject
} from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type SignaturePadHandle = {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string | null;
};

type SignaturePadProps = {
  className?: string;
  onChange?: (isEmpty: boolean) => void;
  handleRef?: MutableRefObject<SignaturePadHandle | null>;
};

export function SignaturePad({
  className,
  onChange,
  handleRef
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const emptyRef = useRef(true);
  const [isEmpty, setIsEmpty] = useState(true);

  const notify = useCallback(
    (empty: boolean) => {
      emptyRef.current = empty;
      setIsEmpty(empty);
      onChange?.(empty);
    },
    [onChange]
  );

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    const snapshot = canvas.toDataURL('image/png');
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.25;
    ctx.strokeStyle = '#111827';

    if (!emptyRef.current) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = snapshot;
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const point = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const point = getPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    if (emptyRef.current) {
      notify(false);
    }
  };

  const endStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    try {
      canvasRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    notify(true);
  }, [notify]);

  useEffect(() => {
    if (!handleRef) return;
    handleRef.current = {
      clear,
      isEmpty: () => emptyRef.current,
      toDataURL: () => {
        if (emptyRef.current || !canvasRef.current) return null;
        return canvasRef.current.toDataURL('image/png');
      }
    };
    return () => {
      handleRef.current = null;
    };
  }, [clear, handleRef]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className='relative h-40 w-full overflow-hidden rounded-md border border-[var(--trade-border)] bg-white'>
        <canvas
          ref={canvasRef}
          className='touch-none absolute inset-0 h-full w-full cursor-crosshair'
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
          aria-label='Signature pad'
        />
        {isEmpty ? (
          <p className='pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400'>
            Draw your signature here
          </p>
        ) : null}
      </div>
      <div className='flex justify-end'>
        <Button type='button' variant='outline' size='sm' onClick={clear}>
          Clear signature
        </Button>
      </div>
    </div>
  );
}
