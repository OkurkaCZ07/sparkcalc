'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import AIPanel from '@/components/AIPanel';
import { useLanguage } from '@/lib/LanguageContext';

// ─── Component Library ───
const COMPONENTS = [
  { id: 'resistor', name: 'Resistor', icon: '▮', color: '#ff8c42', defaultValue: '10kΩ', category: 'passive' },
  { id: 'capacitor', name: 'Capacitor', icon: '⊣⊢', color: '#00d4ff', defaultValue: '100nF', category: 'passive' },
  { id: 'led', name: 'LED', icon: '◉', color: '#22c55e', defaultValue: 'Red 2V', category: 'active' },
  { id: 'transistor', name: 'NPN Transistor', icon: '⊳', color: '#a855f7', defaultValue: '2N2222', category: 'active' },
  { id: 'mosfet', name: 'MOSFET', icon: '⊳|', color: '#ef4444', defaultValue: 'IRFZ44N', category: 'active' },
  { id: 'inductor', name: 'Inductor', icon: '⌇', color: '#f59e0b', defaultValue: '100µH', category: 'passive' },
  { id: 'diode', name: 'Diode', icon: '▷|', color: '#6b7280', defaultValue: '1N4148', category: 'active' },
  { id: 'ic555', name: '555 Timer', icon: '▪▪', color: '#ec4899', defaultValue: 'NE555', category: 'ic' },
  { id: 'battery', name: 'Battery', icon: '🔋', color: '#22c55e', defaultValue: '9V', category: 'power' },
  { id: 'switch', name: 'Switch', icon: '⊡', color: '#94a3b8', defaultValue: 'SPST', category: 'passive' },
  { id: 'potentiometer', name: 'Potentiometer', icon: '↔', color: '#ff8c42', defaultValue: '10kΩ', category: 'passive' },
  { id: 'wire', name: 'Wire', icon: '—', color: '#3b82f6', defaultValue: '', category: 'wire' },
];

const CATEGORIES = [
  { id: 'passive', name: 'Passive' },
  { id: 'active', name: 'Active' },
  { id: 'ic', name: 'ICs' },
  { id: 'power', name: 'Power' },
  { id: 'wire', name: 'Wires' },
];

// ─── 3D Breadboard Scene ───
function Scene3D({ placedComponents, selectedTool, onPlaceComponent, onRemoveComponent }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const frameRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  const rotRef = useRef({ x: -0.6, y: 0.4 });
  const dragRef = useRef({ startX: 0, startY: 0 });
  const [hoverPos, setHoverPos] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    let THREE;
    const initScene = async () => {
      THREE = await import('three');
      
      const canvas = canvasRef.current;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0b10);
      scene.fog = new THREE.Fog(0x0a0b10, 30, 60);
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
      camera.position.set(0, 12, 14);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      rendererRef.current = renderer;

      // Lights
      const ambient = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambient);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(5, 10, 5);
      dirLight.castShadow = true;
      scene.add(dirLight);
      const pointLight = new THREE.PointLight(0xff8c42, 0.3, 30);
      pointLight.position.set(-5, 8, -5);
      scene.add(pointLight);

      // Grid floor
      const gridHelper = new THREE.GridHelper(30, 30, 0x1a1b28, 0x1a1b28);
      gridHelper.position.y = -0.5;
      scene.add(gridHelper);

      // ─── Breadboard ───
      const bbGroup = new THREE.Group();
      
      // Main board
      const boardGeo = new THREE.BoxGeometry(12, 0.4, 6);
      const boardMat = new THREE.MeshPhongMaterial({ color: 0xf0f0e8, specular: 0x222222 });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.receiveShadow = true;
      board.castShadow = true;
      bbGroup.add(board);

      // Center channel
      const channelGeo = new THREE.BoxGeometry(10, 0.42, 0.3);
      const channelMat = new THREE.MeshPhongMaterial({ color: 0xd0d0c8 });
      const channel = new THREE.Mesh(channelGeo, channelMat);
      channel.position.y = 0.01;
      bbGroup.add(channel);

      // Holes
      const holeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.42, 8);
      const holeMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
      
      for (let row = -5; row <= 5; row++) {
        for (let col = -2.5; col <= 2.5; col++) {
          if (Math.abs(col) < 0.2) continue; // Skip center channel
          const hole = new THREE.Mesh(holeGeo, holeMat);
          hole.position.set(row * 0.9, 0, col * 0.9);
          bbGroup.add(hole);
        }
      }

      // Power rails (red/blue lines)
      const railGeo = new THREE.BoxGeometry(10, 0.02, 0.08);
      const redRail = new THREE.Mesh(railGeo, new THREE.MeshPhongMaterial({ color: 0xff3333 }));
      redRail.position.set(0, 0.21, 2.7);
      bbGroup.add(redRail);
      const blueRail = new THREE.Mesh(railGeo, new THREE.MeshPhongMaterial({ color: 0x3333ff }));
      blueRail.position.set(0, 0.21, -2.7);
      bbGroup.add(blueRail);

      scene.add(bbGroup);

      // ─── Placed components as 3D objects ───
      const compGroup = new THREE.Group();
      compGroup.name = 'components';
      scene.add(compGroup);

      // Animate
      const animate = () => {
        frameRef.current = requestAnimationFrame(animate);
        
        // Orbit camera
        const radius = 18;
        camera.position.x = Math.sin(rotRef.current.y) * Math.cos(rotRef.current.x) * radius;
        camera.position.y = Math.sin(-rotRef.current.x) * radius * 0.5 + 8;
        camera.position.z = Math.cos(rotRef.current.y) * Math.cos(rotRef.current.x) * radius;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      };
      animate();

      // Resize
      const handleResize = () => {
        const w = canvas.parentElement.clientWidth;
        const h = canvas.parentElement.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameRef.current);
        renderer.dispose();
      };
    };
    
    initScene();
  }, []);

  // Update 3D components when placedComponents change
  useEffect(() => {
    if (!sceneRef.current) return;
    const updateComponents = async () => {
      const THREE = await import('three');
      const scene = sceneRef.current;
      const existing = scene.getObjectByName('components');
      if (existing) {
        while (existing.children.length) existing.remove(existing.children[0]);
        
        placedComponents.forEach((comp, idx) => {
          let mesh;
          const y = 0.5;
          
          switch (comp.type) {
            case 'resistor': {
              const group = new THREE.Group();
              const body = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.15, 0.8, 12),
                new THREE.MeshPhongMaterial({ color: 0xc9935a })
              );
              body.rotation.z = Math.PI / 2;
              group.add(body);
              // Leads
              const leadGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6);
              const leadMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
              const lead1 = new THREE.Mesh(leadGeo, leadMat);
              lead1.position.x = -0.7;
              lead1.rotation.z = Math.PI / 2;
              group.add(lead1);
              const lead2 = new THREE.Mesh(leadGeo, leadMat);
              lead2.position.x = 0.7;
              lead2.rotation.z = Math.PI / 2;
              group.add(lead2);
              // Color bands
              const bandColors = [0x8B4513, 0x000000, 0xEA580C, 0xCFB53B];
              bandColors.forEach((c, i) => {
                const band = new THREE.Mesh(
                  new THREE.CylinderGeometry(0.16, 0.16, 0.06, 12),
                  new THREE.MeshPhongMaterial({ color: c })
                );
                band.rotation.z = Math.PI / 2;
                band.position.x = -0.2 + i * 0.13;
                group.add(band);
              });
              group.position.set(comp.x, y, comp.z);
              mesh = group;
              break;
            }
            case 'led': {
              const group = new THREE.Group();
              const bulb = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
                new THREE.MeshPhongMaterial({ color: comp.color || 0x22c55e, transparent: true, opacity: 0.8, emissive: comp.color || 0x22c55e, emissiveIntensity: 0.3 })
              );
              bulb.position.y = 0.15;
              group.add(bulb);
              const base = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 0.15, 16),
                new THREE.MeshPhongMaterial({ color: comp.color || 0x22c55e, transparent: true, opacity: 0.6 })
              );
              group.add(base);
              const lead1 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6),
                new THREE.MeshPhongMaterial({ color: 0x888888 })
              );
              lead1.position.set(-0.08, -0.35, 0);
              group.add(lead1);
              const lead2 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6),
                new THREE.MeshPhongMaterial({ color: 0x888888 })
              );
              lead2.position.set(0.08, -0.3, 0);
              group.add(lead2);
              group.position.set(comp.x, y, comp.z);
              mesh = group;
              break;
            }
            case 'capacitor': {
              const group = new THREE.Group();
              const body = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16),
                new THREE.MeshPhongMaterial({ color: 0x2244aa })
              );
              group.add(body);
              const lead1 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6),
                new THREE.MeshPhongMaterial({ color: 0x888888 })
              );
              lead1.position.set(-0.1, -0.45, 0);
              group.add(lead1);
              const lead2 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6),
                new THREE.MeshPhongMaterial({ color: 0x888888 })
              );
              lead2.position.set(0.1, -0.45, 0);
              group.add(lead2);
              group.position.set(comp.x, y, comp.z);
              mesh = group;
              break;
            }
            case 'ic555': {
              const group = new THREE.Group();
              const body = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.3, 0.5),
                new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
              );
              group.add(body);
              // Notch
              const notch = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 8, 8),
                new THREE.MeshPhongMaterial({ color: 0x333333 })
              );
              notch.position.set(-0.3, 0.15, 0);
              group.add(notch);
              // Pins
              for (let i = 0; i < 4; i++) {
                const pin = new THREE.Mesh(
                  new THREE.BoxGeometry(0.03, 0.3, 0.03),
                  new THREE.MeshPhongMaterial({ color: 0x888888 })
                );
                pin.position.set(-0.3 + i * 0.2, -0.3, 0.3);
                group.add(pin);
                const pin2 = pin.clone();
                pin2.position.z = -0.3;
                group.add(pin2);
              }
              // Label
              group.position.set(comp.x, y + 0.1, comp.z);
              mesh = group;
              break;
            }
            case 'battery': {
              const group = new THREE.Group();
              const body = new THREE.Mesh(
                new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16),
                new THREE.MeshPhongMaterial({ color: 0x333333 })
              );
              group.add(body);
              const top = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.15, 0.15, 16),
                new THREE.MeshPhongMaterial({ color: 0xcccccc })
              );
              top.position.y = 0.65;
              group.add(top);
              const label = new THREE.Mesh(
                new THREE.CylinderGeometry(0.36, 0.36, 0.6, 16),
                new THREE.MeshPhongMaterial({ color: 0x22aa44 })
              );
              label.position.y = 0;
              group.add(label);
              group.position.set(comp.x, y + 0.3, comp.z);
              mesh = group;
              break;
            }
            default: {
              mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.3, 0.3),
                new THREE.MeshPhongMaterial({ color: COMPONENTS.find(c => c.id === comp.type)?.color ? parseInt(COMPONENTS.find(c => c.id === comp.type).color.replace('#', ''), 16) : 0xff8c42 })
              );
              mesh.position.set(comp.x, y, comp.z);
            }
          }
          
          if (mesh) {
            mesh.castShadow = true;
            mesh.userData = { index: idx };
            existing.add(mesh);
          }
        });
      }
    };
    updateComponents();
  }, [placedComponents]);

  // Mouse handlers for orbit + placement
  const handleMouseDown = (e) => {
    mouseRef.current.isDown = true;
    dragRef.current = { startX: e.clientX, startY: e.clientY, moved: false };
  };

  const handleMouseMove = (e) => {
    if (mouseRef.current.isDown) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
      rotRef.current.y += dx * 0.005;
      rotRef.current.x = Math.max(-1.2, Math.min(-0.1, rotRef.current.x + dy * 0.005));
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
    }
  };

  const handleMouseUp = (e) => {
    if (!dragRef.current.moved && selectedTool) {
      // Place component at a grid position on the breadboard
      const rect = canvasRef.current.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      const nz = ((e.clientY - rect.top) / rect.height - 0.5) * 4;
      // Snap to grid
      const x = Math.round(nx * 2) / 2;
      const z = Math.round(nz * 2) / 2;
      onPlaceComponent(selectedTool, x, z);
    }
    mouseRef.current.isDown = false;
  };

  return (
    <div className="relative w-full" style={{ height: '450px' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { mouseRef.current.isDown = false; }}
      />
      {/* Overlay hints */}
      <div className="absolute bottom-3 left-3 text-[10px] px-2 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--sc-dim)' }}>
        🖱️ Drag to orbit · Click to place · Scroll to zoom
      </div>
      {selectedTool && (
        <div className="absolute top-3 left-3 text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(255,140,66,0.15)', color: 'var(--sc-accent)', border: '1px solid rgba(255,140,66,0.3)' }}>
          Placing: {COMPONENTS.find(c => c.id === selectedTool)?.name}
        </div>
      )}
    </div>
  );
}

// ─── Component Palette ───
function ComponentPalette({ selectedTool, setSelectedTool }) {
  const [activeCategory, setActiveCategory] = useState('passive');
  const filtered = COMPONENTS.filter(c => c.category === activeCategory);

  return (
    <div className="rounded-2xl border p-3" style={{ background: 'var(--sc-surface)', borderColor: 'var(--sc-border)' }}>
      <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--sc-dim)' }}>Components</h3>
      
      <div className="flex gap-1 mb-3 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className="px-2 py-1 rounded text-[10px] font-semibold cursor-pointer transition-all border"
            style={{
              background: activeCategory === cat.id ? 'color-mix(in srgb, var(--sc-accent) 10%, transparent)' : 'var(--sc-surface2)',
              borderColor: activeCategory === cat.id ? 'var(--sc-accent)' : 'var(--sc-border)',
              color: activeCategory === cat.id ? 'var(--sc-accent)' : 'var(--sc-dim)'
            }}>
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {filtered.map(comp => (
          <button key={comp.id} onClick={() => setSelectedTool(selectedTool === comp.id ? null : comp.id)}
            className="flex items-center gap-2 p-2 rounded-lg text-left cursor-pointer transition-all border"
            style={{
              background: selectedTool === comp.id ? 'color-mix(in srgb, var(--sc-accent) 10%, transparent)' : 'var(--sc-surface2)',
              borderColor: selectedTool === comp.id ? 'var(--sc-accent)' : 'var(--sc-border)',
            }}>
            <span className="w-6 h-6 rounded flex items-center justify-center text-sm" style={{ background: comp.color + '22', color: comp.color }}>
              {comp.icon}
            </span>
            <div>
              <div className="text-[11px] font-semibold" style={{ color: 'var(--sc-text)' }}>{comp.name}</div>
              <div className="text-[9px]" style={{ color: 'var(--sc-dim)' }}>{comp.defaultValue}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Placed Components List ───
function ComponentList({ components, onRemove, onUpdateValue }) {
  if (components.length === 0) return (
    <div className="rounded-xl p-4 text-center" style={{ background: 'var(--sc-surface2)', color: 'var(--sc-dim)' }}>
      <p className="text-xs">No components placed yet.</p>
      <p className="text-[10px] mt-1">Select a component and click on the breadboard.</p>
    </div>
  );

  return (
    <div className="space-y-1.5 max-h-[200px] overflow-auto">
      {components.map((comp, i) => {
        const def = COMPONENTS.find(c => c.id === comp.type);
        return (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg border" style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)' }}>
            <span className="text-sm" style={{ color: def?.color }}>{def?.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold" style={{ color: 'var(--sc-text)' }}>{def?.name}</div>
              <input
                type="text"
                value={comp.value}
                onChange={(e) => onUpdateValue(i, e.target.value)}
                className="text-[10px] bg-transparent border-none outline-none w-full"
                style={{ color: 'var(--sc-accent)' }}
              />
            </div>
            <button onClick={() => onRemove(i)} className="text-xs cursor-pointer opacity-50 hover:opacity-100" style={{ color: 'var(--sc-dim)' }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Prototyper Component ───
export default function CircuitPrototyper() {
  const { lang } = useLanguage();
  const [selectedTool, setSelectedTool] = useState(null);
  const [placedComponents, setPlacedComponents] = useState([]);

  const handlePlace = useCallback((type, x, z) => {
    const def = COMPONENTS.find(c => c.id === type);
    setPlacedComponents(prev => [...prev, {
      type,
      x,
      z,
      value: def?.defaultValue || '',
      color: type === 'led' ? 0x22c55e : undefined,
    }]);
    // Don't deselect tool so user can place multiple
  }, []);

  const handleRemove = useCallback((index) => {
    setPlacedComponents(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateValue = useCallback((index, value) => {
    setPlacedComponents(prev => prev.map((c, i) => i === index ? { ...c, value } : c));
  }, []);

  const clearAll = () => setPlacedComponents([]);

  // Build context for AI
  const circuitContext = {
    components: placedComponents.map(c => ({
      type: COMPONENTS.find(d => d.id === c.type)?.name,
      value: c.value,
      position: `(${c.x}, ${c.z})`,
    })),
    totalComponents: placedComponents.length,
    componentTypes: [...new Set(placedComponents.map(c => c.type))].join(', '),
  };

  return (
    <div className="space-y-4">
      {/* 3D View */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--sc-surface)', borderColor: 'var(--sc-border)' }}>
        <Scene3D
          placedComponents={placedComponents}
          selectedTool={selectedTool}
          onPlaceComponent={handlePlace}
          onRemoveComponent={handleRemove}
        />
      </div>

      {/* Controls row */}
      <div className="flex gap-4 flex-wrap">
        {/* Left: Palette + Component List */}
        <div className="flex-1 min-w-[280px] space-y-3">
          <ComponentPalette selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
          
          <div className="rounded-2xl border p-3" style={{ background: 'var(--sc-surface)', borderColor: 'var(--sc-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sc-dim)' }}>
                Placed ({placedComponents.length})
              </h3>
              {placedComponents.length > 0 && (
                <button onClick={clearAll} className="text-[10px] cursor-pointer" style={{ color: 'var(--sc-accent)' }}>Clear all</button>
              )}
            </div>
            <ComponentList components={placedComponents} onRemove={handleRemove} onUpdateValue={handleUpdateValue} />
          </div>
        </div>

        {/* Right: AI Panel */}
        <div className="flex-1 min-w-[300px]">
          <AIPanel
            context={circuitContext}
            toolId="prototyper"
          />
        </div>
      </div>
    </div>
  );
}
