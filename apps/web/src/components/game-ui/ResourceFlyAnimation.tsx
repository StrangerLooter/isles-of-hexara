'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ResourceType } from '@hexara/shared';

interface FlyingItem {
  id: string;
  type: 'resource' | 'dev_card';
  icon: string;
  label: string;
  color: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

interface ResourceFlyAnimationProps {
  resources?: Record<ResourceType, number>;
  devCardCount?: number;
}

const RESOURCE_META: Record<ResourceType, { icon: string; name: string; color: string }> = {
  lumber: { icon: '🪵', name: 'Lumber', color: '#16a34a' },
  brick: { icon: '🧱', name: 'Brick', color: '#ea580c' },
  wool: { icon: '🐑', name: 'Wool', color: '#a3e635' },
  grain: { icon: '🌾', name: 'Grain', color: '#eab308' },
  ore: { icon: '⛰️', name: 'Ore', color: '#94a3b8' },
};

export const ResourceFlyAnimation: React.FC<ResourceFlyAnimationProps> = ({
  resources,
  devCardCount = 0,
}) => {
  const [items, setItems] = useState<FlyingItem[]>([]);
  const prevResourcesRef = useRef<Record<ResourceType, number> | null>(null);
  const prevDevCardCountRef = useRef<number | null>(null);

  // Trigger floating animations whenever resource counts increase
  useEffect(() => {
    if (!resources) return;

    if (prevResourcesRef.current !== null) {
      const newItems: FlyingItem[] = [];
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
      const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

      // Target position: Bottom center resource dock
      const dockTargetX = windowWidth / 2;
      const dockTargetY = windowHeight - 40;

      (Object.keys(RESOURCE_META) as ResourceType[]).forEach((res) => {
        const prevVal = prevResourcesRef.current?.[res] ?? 0;
        const currentVal = resources[res] ?? 0;
        const diff = currentVal - prevVal;

        if (diff > 0) {
          for (let i = 0; i < Math.min(diff, 5); i++) {
            const spreadX = (Math.random() - 0.5) * 160;
            const spreadY = (Math.random() - 0.5) * 80;
            newItems.push({
              id: `${res}_${Date.now()}_${i}_${Math.random()}`,
              type: 'resource',
              icon: RESOURCE_META[res].icon,
              label: `+${diff} ${RESOURCE_META[res].name}`,
              color: RESOURCE_META[res].color,
              startX: windowWidth / 2 + spreadX,
              startY: windowHeight / 2 - 60 + spreadY,
              targetX: dockTargetX + spreadX * 0.4,
              targetY: dockTargetY,
            });
          }
        }
      });

      if (newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems]);
      }
    }

    prevResourcesRef.current = { ...resources };
  }, [resources]);

  // Trigger Dev Card flying animation when player gains dev cards
  useEffect(() => {
    if (prevDevCardCountRef.current !== null) {
      const diff = devCardCount - prevDevCardCountRef.current;
      if (diff > 0) {
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
        const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

        const newCard: FlyingItem = {
          id: `devcard_${Date.now()}_${Math.random()}`,
          type: 'dev_card',
          icon: '📜',
          label: '+1 Dev Card',
          color: '#a855f7',
          startX: windowWidth / 2,
          startY: windowHeight / 2 - 100,
          targetX: windowWidth - 140,
          targetY: windowHeight - 40,
        };

        setItems((prev) => [...prev, newCard]);
      }
    }
    prevDevCardCountRef.current = devCardCount;
  }, [devCardCount]);

  // Remove items after animation completes (1.4s)
  useEffect(() => {
    if (items.length === 0) return;
    const timer = setTimeout(() => {
      setItems((prev) => prev.slice(Math.min(prev.length, 5)));
    }, 1400);
    return () => clearTimeout(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute flex items-center gap-2 px-3 py-1.5 rounded-2xl shadow-2xl border-2 backdrop-blur-md animate-resource-fly"
          style={
            {
              '--start-x': `${item.startX}px`,
              '--start-y': `${item.startY}px`,
              '--target-x': `${item.targetX}px`,
              '--target-y': `${item.targetY}px`,
              borderColor: item.color,
              background: 'linear-gradient(135deg, rgba(20,10,5,0.95), rgba(40,20,10,0.9))',
              boxShadow: `0 0 20px ${item.color}80, 0 10px 25px rgba(0,0,0,0.8)`,
            } as React.CSSProperties
          }
        >
          <span className="text-2xl drop-shadow-md animate-bounce">{item.icon}</span>
          <span
            className="text-xs font-black uppercase tracking-wider font-mono drop-shadow"
            style={{ color: item.color }}
          >
            {item.label}
          </span>
        </div>
      ))}
      <style>{`
        @keyframes resourceFly {
          0% {
            transform: translate(var(--start-x), var(--start-y)) scale(0.6);
            opacity: 0;
          }
          20% {
            transform: translate(var(--start-x), var(--start-y)) scale(1.25);
            opacity: 1;
          }
          40% {
            transform: translate(var(--start-x), calc(var(--start-y) - 30px)) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) scale(0.5);
            opacity: 0.1;
          }
        }
        .animate-resource-fly {
          animation: resourceFly 1.25s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>
    </div>
  );
};
