'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  Color4,
  Color3,
} from '@babylonjs/core';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import '@babylonjs/loaders/glTF';
import { Loader2, RotateCw } from 'lucide-react';

interface CharacterModelViewerProps {
  modelUrl?: string;
  className?: string;
  onModelClick?: () => void;
}

export const CharacterModelViewer: React.FC<CharacterModelViewerProps> = ({
  modelUrl = '/models/tanjiro.glb',
  className = '',
  onModelClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isMounted = true;
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      alpha: true,
      powerPreference: 'high-performance',
      antialias: true,
    });

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0); // Transparent background

    // ArcRotateCamera for 360 degree showcase view
    const camera = new ArcRotateCamera(
      'charCamera',
      -Math.PI / 2,
      Math.PI / 2.25,
      3.4,
      new Vector3(0, 1.05, 0),
      scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 1.8;
    camera.upperRadiusLimit = 6.0;
    camera.lowerBetaLimit = Math.PI / 4;
    camera.upperBetaLimit = Math.PI / 2.05;
    camera.wheelPrecision = 50;
    camera.pinchPrecision = 50;
    camera.inertia = 0.85;

    // Warm Sunset Ambient Lighting
    const ambientLight = new HemisphericLight('charAmbient', new Vector3(0, 1, 0), scene);
    ambientLight.intensity = 1.1;
    ambientLight.diffuse = new Color3(1.0, 0.92, 0.82);
    ambientLight.groundColor = new Color3(0.25, 0.15, 0.08);

    // Warm Key Light (Golden Hour Sunset)
    const keyLight = new DirectionalLight('charKeyLight', new Vector3(0.6, -1.2, 1.0), scene);
    keyLight.position = new Vector3(-3, 6, -5);
    keyLight.intensity = 1.5;
    keyLight.diffuse = new Color3(1.0, 0.88, 0.7);

    // Rim Backlight for sharp heroic silhouette
    const rimLight = new DirectionalLight('charRimLight', new Vector3(-0.5, 0.8, -1.2), scene);
    rimLight.intensity = 1.0;
    rimLight.diffuse = new Color3(1.0, 0.65, 0.3);

    // Load the 3D GLB Character Model
    SceneLoader.ImportMeshAsync('', '', modelUrl, scene as any)
      .then((result: any) => {
        if (!isMounted) return;

        const meshes = result.meshes || [];
        if (meshes.length === 0) {
          setLoadError('No meshes in model');
          setIsLoading(false);
          return;
        }

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        meshes.forEach((mesh: any) => {
          if (mesh.name === '__root__') return;
          try {
            const bounds = mesh.getHierarchyBoundingVectors();
            if (bounds && bounds.min && bounds.max) {
              minX = Math.min(minX, bounds.min.x);
              minY = Math.min(minY, bounds.min.y);
              minZ = Math.min(minZ, bounds.min.z);
              maxX = Math.max(maxX, bounds.max.x);
              maxY = Math.max(maxY, bounds.max.y);
              maxZ = Math.max(maxZ, bounds.max.z);
            }
          } catch {
            // Ignore uncalculable submeshes
          }
        });

        const sizeX = isFinite(maxX - minX) ? maxX - minX : 1;
        const sizeY = isFinite(maxY - minY) ? maxY - minY : 1;
        const sizeZ = isFinite(maxZ - minZ) ? maxZ - minZ : 1;
        const maxDim = Math.max(sizeX, sizeY, sizeZ);
        const desiredHeight = 2.2;
        const scale = maxDim > 0 ? desiredHeight / maxDim : 1.0;

        const root = meshes[0];
        root.scaling = new Vector3(scale, scale, scale);

        // Center model on X and Z, set bottom to Y=0
        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        root.position.x = -centerX * scale;
        root.position.z = -centerZ * scale;
        root.position.y = -minY * scale;

        // Camera target to torso
        camera.target = new Vector3(0, 1.05, 0);

        // Play animations if present
        if (result.animationGroups && result.animationGroups.length > 0) {
          result.animationGroups.forEach((anim: any) => {
            anim.start(true, 1.0);
          });
        }

        setIsLoading(false);
      })
      .catch((err: any) => {
        console.error('Failed to load character model:', err);
        if (isMounted) {
          setLoadError('Unable to load 3D model');
          setIsLoading(false);
        }
      });

    // Turntable auto-orbit when idle
    let isUserInteracting = false;
    canvas.addEventListener('pointerdown', () => {
      isUserInteracting = true;
    });
    window.addEventListener('pointerup', () => {
      isUserInteracting = false;
    });

    scene.onBeforeRenderObservable.add(() => {
      if (!isUserInteracting) {
        camera.alpha += 0.004; // Gentle slow rotation
      }
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, [modelUrl]);

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none touch-none"
        onClick={onModelClick}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl border border-amber-500/30">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-2" />
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-200 animate-pulse">
            Summoning 3D Hero...
          </span>
        </div>
      )}

      {/* Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2b170c]/90 rounded-2xl border border-red-500/50 p-4 text-center">
          <span className="text-3xl mb-1">🧑‍✈️</span>
          <span className="text-xs font-bold text-amber-200">{loadError}</span>
          <span className="text-[10px] text-amber-400/70 mt-1">Captain Amber</span>
        </div>
      )}

      {/* Interactive Hint Indicator */}
      {!isLoading && !loadError && (
        <div className="absolute bottom-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-500/40 pointer-events-none backdrop-blur-sm z-20">
          <RotateCw className="w-3 h-3 text-amber-400 animate-spin-slow" />
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-200/90">
            3D Drag to Rotate
          </span>
        </div>
      )}
    </div>
  );
};
