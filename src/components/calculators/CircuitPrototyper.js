'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import AIPanel from '@/components/AIPanel';
import { useLanguage } from '@/lib/LanguageContext';

// ─── Component definitions ───
const COMP_DEFS = [
  { id:'resistor', name:'Resistor', icon:'▮', color:'#c9935a', cat:'passive', pins:2, defaultVal:'10kΩ', w:3, h:1 },
  { id:'capacitor', name:'Capacitor', icon:'⊣⊢', color:'#2563eb', cat:'passive', pins:2, defaultVal:'100nF', w:1, h:1 },
  { id:'led-red', name:'LED (Red)', icon:'◉', color:'#ef4444', cat:'active', pins:2, defaultVal:'Red 2V 20mA', w:1, h:1 },
  { id:'led-green', name:'LED (Green)', icon:'◉', color:'#22c55e', cat:'active', pins:2, defaultVal:'Green 2.2V 20mA', w:1, h:1 },
  { id:'led-blue', name:'LED (Blue)', icon:'◉', color:'#3b82f6', cat:'active', pins:2, defaultVal:'Blue 3.2V 20mA', w:1, h:1 },
  { id:'diode', name:'Diode (1N4148)', icon:'▷|', color:'#f97316', cat:'active', pins:2, defaultVal:'1N4148', w:2, h:1 },
  { id:'npn', name:'NPN (2N2222)', icon:'⊳', color:'#a855f7', cat:'active', pins:3, defaultVal:'2N2222', w:1, h:1 },
  { id:'mosfet', name:'N-MOSFET', icon:'⊳|', color:'#ef4444', cat:'active', pins:3, defaultVal:'IRFZ44N', w:1, h:1 },
  { id:'ic555', name:'555 Timer', icon:'■', color:'#ec4899', cat:'ic', pins:8, defaultVal:'NE555', w:4, h:2 },
  { id:'cap-elec', name:'Electrolytic Cap', icon:'⊣⊢', color:'#1d4ed8', cat:'passive', pins:2, defaultVal:'100µF 25V', w:1, h:1 },
  { id:'inductor', name:'Inductor', icon:'⌇', color:'#eab308', cat:'passive', pins:2, defaultVal:'100µH', w:2, h:1 },
  { id:'pot', name:'Potentiometer', icon:'↔', color:'#f59e0b', cat:'passive', pins:3, defaultVal:'10kΩ', w:1, h:1 },
  { id:'button', name:'Push Button', icon:'⊡', color:'#94a3b8', cat:'passive', pins:2, defaultVal:'Momentary', w:2, h:2 },
  { id:'battery', name:'9V Battery', icon:'🔋', color:'#16a34a', cat:'power', pins:2, defaultVal:'9V', w:2, h:2 },
  { id:'dc-supply', name:'DC Supply', icon:'⚡', color:'#ff8c42', cat:'power', pins:2, defaultVal:'5V', w:1, h:1 },
];

const CATS = [
  { id:'passive', name:'Passive', icon:'▮' },
  { id:'active', name:'Active', icon:'◉' },
  { id:'ic', name:'ICs', icon:'■' },
  { id:'power', name:'Power', icon:'⚡' },
];

// ─── Breadboard constants ───
const BB_COLS = 30;
const BB_ROWS = 10;
const HOLE_SPACING = 0.35;
const BB_WIDTH = BB_COLS * HOLE_SPACING;
const BB_HEIGHT = BB_ROWS * HOLE_SPACING;

// ─── 3D Scene ───
function BreadboardScene({ placed, wires, selectedTool, onClickHole, wireStart, onHoverHole, hoveredHole }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const camRef = useRef(null);
  const rendRef = useRef(null);
  const frameRef = useRef(null);
  const orbitRef = useRef({ theta: 0.5, phi: 0.8, dist: 12, target: [0, 0, 0] });
  const dragRef = useRef({ active: false, button: -1, lastX: 0, lastY: 0 });
  const holeMarkersRef = useRef([]);
  const compMeshesRef = useRef([]);
  const wireMeshesRef = useRef([]);
  const raycasterRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const threeRef = useRef(null);

  // Init scene
  useEffect(() => {
    if (!mountRef.current) return;
    let disposed = false;

    const init = async () => {
      const THREE = await import('three');
      threeRef.current = THREE;
      if (disposed) return;

      const container = mountRef.current;
      const w = container.clientWidth;
      const h = container.clientHeight;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0d0e15);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);
      camRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      rendRef.current = renderer;

      const raycaster = new THREE.Raycaster();
      raycasterRef.current = raycaster;

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const sun = new THREE.DirectionalLight(0xffffff, 0.7);
      sun.position.set(6, 12, 8);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      scene.add(sun);
      const fill = new THREE.PointLight(0xff8c42, 0.15, 20);
      fill.position.set(-4, 6, -4);
      scene.add(fill);

      // ─── Desk surface ───
      const desk = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshStandardMaterial({ color: 0x1a1c24, roughness: 0.9 })
      );
      desk.rotation.x = -Math.PI / 2;
      desk.position.y = -0.3;
      desk.receiveShadow = true;
      scene.add(desk);

      // Subtle grid on desk
      const grid = new THREE.GridHelper(40, 80, 0x222233, 0x191a22);
      grid.position.y = -0.29;
      scene.add(grid);

      // ─── Breadboard ───
      const bbGroup = new THREE.Group();
      
      // Main board body
      const boardMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.6 });
      const board = new THREE.Mesh(new THREE.BoxGeometry(BB_WIDTH + 1.0, 0.25, BB_HEIGHT + 0.8), boardMat);
      board.position.y = 0;
      board.receiveShadow = true;
      board.castShadow = true;
      bbGroup.add(board);

      // Power rail strips
      const railMat1 = new THREE.MeshStandardMaterial({ color: 0xdd3333 });
      const railMat2 = new THREE.MeshStandardMaterial({ color: 0x3333dd });
      const railGeo = new THREE.BoxGeometry(BB_WIDTH - 0.5, 0.01, 0.05);
      
      const redTop = new THREE.Mesh(railGeo, railMat1);
      redTop.position.set(0, 0.131, -BB_HEIGHT / 2 - 0.15);
      bbGroup.add(redTop);
      const blueTop = new THREE.Mesh(railGeo, railMat2);
      blueTop.position.set(0, 0.131, -BB_HEIGHT / 2 + 0.0);
      bbGroup.add(blueTop);
      const redBot = new THREE.Mesh(railGeo, railMat1);
      redBot.position.set(0, 0.131, BB_HEIGHT / 2 + 0.15);
      bbGroup.add(redBot);
      const blueBot = new THREE.Mesh(railGeo, railMat2);
      blueBot.position.set(0, 0.131, BB_HEIGHT / 2 + 0.0);
      bbGroup.add(blueBot);

      // Center divider groove
      const groove = new THREE.Mesh(
        new THREE.BoxGeometry(BB_WIDTH + 0.2, 0.26, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xd8d0b8 })
      );
      groove.position.y = 0.005;
      bbGroup.add(groove);

      // ─── Holes as clickable spheres ───
      const holeMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3 });
      const holeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.26, 8);
      const markers = [];

      for (let col = 0; col < BB_COLS; col++) {
        for (let row = 0; row < BB_ROWS; row++) {
          // Skip center row for divider
          if (row === 4 || row === 5) continue;
          
          const x = (col - BB_COLS / 2 + 0.5) * HOLE_SPACING;
          const z = (row - BB_ROWS / 2 + 0.5) * HOLE_SPACING;
          
          const hole = new THREE.Mesh(holeGeo, holeMat.clone());
          hole.position.set(x, 0, z);
          hole.userData = { type: 'hole', col, row };
          bbGroup.add(hole);
          markers.push(hole);
        }
      }
      holeMarkersRef.current = markers;

      scene.add(bbGroup);

      // Animate
      const animate = () => {
        if (disposed) return;
        frameRef.current = requestAnimationFrame(animate);

        const o = orbitRef.current;
        camera.position.x = o.target[0] + o.dist * Math.sin(o.phi) * Math.sin(o.theta);
        camera.position.y = o.target[1] + o.dist * Math.cos(o.phi);
        camera.position.z = o.target[2] + o.dist * Math.sin(o.phi) * Math.cos(o.theta);
        camera.lookAt(o.target[0], o.target[1], o.target[2]);

        renderer.render(scene, camera);
      };
      animate();

      // Resize
      const onResize = () => {
        if (disposed) return;
        const w2 = container.clientWidth;
        const h2 = container.clientHeight;
        camera.aspect = w2 / h2;
        camera.updateProjectionMatrix();
        renderer.setSize(w2, h2);
      };
      window.addEventListener('resize', onResize);

      return () => { window.removeEventListener('resize', onResize); };
    };

    init();

    return () => {
      disposed = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendRef.current) {
        rendRef.current.dispose();
        if (mountRef.current && rendRef.current.domElement) {
          mountRef.current.removeChild(rendRef.current.domElement);
        }
      }
    };
  }, []);

  // ─── Update 3D components ───
  useEffect(() => {
    const THREE = threeRef.current;
    const scene = sceneRef.current;
    if (!THREE || !scene) return;

    // Remove old component meshes
    compMeshesRef.current.forEach(m => scene.remove(m));
    compMeshesRef.current = [];

    placed.forEach((comp) => {
      const def = COMP_DEFS.find(d => d.id === comp.type);
      if (!def) return;

      const x = (comp.col - BB_COLS / 2 + 0.5) * HOLE_SPACING;
      const z = (comp.row - BB_ROWS / 2 + 0.5) * HOLE_SPACING;
      const group = new THREE.Group();

      if (comp.type === 'resistor') {
        // Resistor body
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.7, 12),
          new THREE.MeshStandardMaterial({ color: 0xc9935a, roughness: 0.5 })
        );
        body.rotation.z = Math.PI / 2;
        body.position.y = 0.35;
        group.add(body);
        // Color bands
        [0x8B4513, 0x000000, 0xEA580C, 0xCFB53B].forEach((c, i) => {
          const band = new THREE.Mesh(
            new THREE.CylinderGeometry(0.085, 0.085, 0.03, 12),
            new THREE.MeshStandardMaterial({ color: c })
          );
          band.rotation.z = Math.PI / 2;
          band.position.set(-0.15 + i * 0.1, 0.35, 0);
          group.add(band);
        });
        // Leads
        [-0.5, 0.5].forEach(dx => {
          const lead = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.012, 0.35, 6),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
          );
          lead.position.set(dx, 0.17, 0);
          group.add(lead);
        });
      } else if (comp.type.startsWith('led-')) {
        const ledColor = parseInt(def.color.replace('#', ''), 16);
        // Dome
        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
          new THREE.MeshStandardMaterial({ color: ledColor, transparent: true, opacity: 0.85, emissive: ledColor, emissiveIntensity: 0.4 })
        );
        dome.position.y = 0.55;
        group.add(dome);
        // Base
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16),
          new THREE.MeshStandardMaterial({ color: ledColor, transparent: true, opacity: 0.5 })
        );
        base.position.y = 0.42;
        group.add(base);
        // Leads
        [-0.06, 0.06].forEach((dx, i) => {
          const lead = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, i === 0 ? 0.42 : 0.35, 6),
            new THREE.MeshStandardMaterial({ color: 0x999999 })
          );
          lead.position.set(dx, i === 0 ? 0.21 : 0.175, 0);
          group.add(lead);
        });
        // Point light glow
        const glow = new THREE.PointLight(ledColor, 0.2, 2);
        glow.position.y = 0.6;
        group.add(glow);
      } else if (comp.type === 'capacitor' || comp.type === 'cap-elec') {
        const isElec = comp.type === 'cap-elec';
        const bodyColor = isElec ? 0x1a1a4a : 0x2244aa;
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(isElec ? 0.18 : 0.10, isElec ? 0.18 : 0.10, isElec ? 0.5 : 0.3, 16),
          new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.4 })
        );
        body.position.y = isElec ? 0.5 : 0.4;
        group.add(body);
        if (isElec) {
          // Stripe
          const stripe = new THREE.Mesh(
            new THREE.CylinderGeometry(0.185, 0.185, 0.15, 16, 1, false, 0, Math.PI * 0.4),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
          );
          stripe.position.y = 0.55;
          group.add(stripe);
        }
        [-0.06, 0.06].forEach(dx => {
          const lead = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
          );
          lead.position.set(dx, 0.15, 0);
          group.add(lead);
        });
      } else if (comp.type === 'ic555') {
        // IC body
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.18, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3 })
        );
        body.position.y = 0.35;
        group.add(body);
        // Notch
        const notch = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        notch.position.set(0, 0.44, -0.5);
        group.add(notch);
        // Label
        // Pins (4 each side)
        for (let i = 0; i < 4; i++) {
          [-0.3, 0.3].forEach(dx => {
            const pin = new THREE.Mesh(
              new THREE.BoxGeometry(0.12, 0.02, 0.04),
              new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
            );
            pin.position.set(dx, 0.26, -0.42 + i * 0.28);
            group.add(pin);
          });
        }
      } else if (comp.type === 'battery') {
        // 9V battery
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 1.0, 0.35),
          new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        body.position.y = 0.7;
        group.add(body);
        // Label
        const label = new THREE.Mesh(
          new THREE.BoxGeometry(0.58, 0.6, 0.01),
          new THREE.MeshStandardMaterial({ color: 0x1a8a3a })
        );
        label.position.set(0, 0.7, 0.18);
        group.add(label);
        // Terminals
        const snapPos = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8),
          new THREE.MeshStandardMaterial({ color: 0xcccccc })
        );
        snapPos.position.set(-0.1, 1.24, 0);
        group.add(snapPos);
        const snapNeg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8),
          new THREE.MeshStandardMaterial({ color: 0xcccccc })
        );
        snapNeg.position.set(0.1, 1.23, 0);
        group.add(snapNeg);
      } else if (comp.type === 'button') {
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.15, 0.5),
          new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        base.position.y = 0.3;
        group.add(base);
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.14, 0.12, 16),
          new THREE.MeshStandardMaterial({ color: 0xdd3333 })
        );
        cap.position.y = 0.44;
        group.add(cap);
      } else {
        // Generic component
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.25, 0.2),
          new THREE.MeshStandardMaterial({ color: parseInt(def.color.replace('#', ''), 16) })
        );
        body.position.y = 0.35;
        group.add(body);
      }

      group.position.set(x, 0.13, z);
      group.castShadow = true;
      scene.add(group);
      compMeshesRef.current.push(group);
    });

    // ─── Update wires ───
    wireMeshesRef.current.forEach(m => scene.remove(m));
    wireMeshesRef.current = [];

    wires.forEach((wire) => {
      const x1 = (wire.startCol - BB_COLS / 2 + 0.5) * HOLE_SPACING;
      const z1 = (wire.startRow - BB_ROWS / 2 + 0.5) * HOLE_SPACING;
      const x2 = (wire.endCol - BB_COLS / 2 + 0.5) * HOLE_SPACING;
      const z2 = (wire.endRow - BB_ROWS / 2 + 0.5) * HOLE_SPACING;

      const points = [
        new THREE.Vector3(x1, 0.2, z1),
        new THREE.Vector3(x1, 0.35, z1),
        new THREE.Vector3(x2, 0.35, z2),
        new THREE.Vector3(x2, 0.2, z2),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.02, 8, false);
      const colors = [0x3b82f6, 0xef4444, 0x22c55e, 0xeab308, 0xffffff, 0xf97316];
      const wireMesh = new THREE.Mesh(
        tubeGeo,
        new THREE.MeshStandardMaterial({ color: wire.color || colors[wires.indexOf(wire) % colors.length], roughness: 0.3 })
      );
      scene.add(wireMesh);
      wireMeshesRef.current.push(wireMesh);
    });

    // ─── Highlight hovered hole ───
    holeMarkersRef.current.forEach(h => {
      if (hoveredHole && h.userData.col === hoveredHole.col && h.userData.row === hoveredHole.row) {
        h.material.color.setHex(0xff8c42);
        h.material.emissive = new THREE.Color(0xff8c42);
        h.material.emissiveIntensity = 0.5;
      } else {
        h.material.color.setHex(0x333333);
        h.material.emissive = new THREE.Color(0x000000);
        h.material.emissiveIntensity = 0;
      }
    });

  }, [placed, wires, hoveredHole]);

  // ─── Mouse handlers ───
  const getHoleAtMouse = useCallback((clientX, clientY) => {
    const THREE = threeRef.current;
    if (!THREE || !rendRef.current || !camRef.current) return null;
    const rect = rendRef.current.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycasterRef.current.setFromCamera(mouse, camRef.current);
    const hits = raycasterRef.current.intersectObjects(holeMarkersRef.current);
    if (hits.length > 0) return hits[0].object.userData;
    return null;
  }, []);

  const handlePointerDown = (e) => {
    dragRef.current = { active: true, button: e.button, lastX: e.clientX, lastY: e.clientY, moved: false };
  };

  const handlePointerMove = (e) => {
    const d = dragRef.current;
    if (d.active) {
      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;

      if (d.button === 0 && !selectedTool) {
        // Left drag = orbit
        orbitRef.current.theta -= dx * 0.005;
        orbitRef.current.phi = Math.max(0.2, Math.min(1.4, orbitRef.current.phi + dy * 0.005));
      } else if (d.button === 2 || d.button === 1) {
        // Right/middle drag = pan
        orbitRef.current.target[0] -= dx * 0.01;
        orbitRef.current.target[2] -= dy * 0.01;
      }
      d.lastX = e.clientX;
      d.lastY = e.clientY;
    }

    // Hover detection
    const hole = getHoleAtMouse(e.clientX, e.clientY);
    onHoverHole(hole);
  };

  const handlePointerUp = (e) => {
    if (!dragRef.current.moved && selectedTool) {
      const hole = getHoleAtMouse(e.clientX, e.clientY);
      if (hole) onClickHole(hole.col, hole.row);
    }
    dragRef.current.active = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    orbitRef.current.dist = Math.max(4, Math.min(25, orbitRef.current.dist + e.deltaY * 0.01));
  };

  const handleContextMenu = (e) => e.preventDefault();

  return (
    <div ref={mountRef} className="w-full rounded-xl overflow-hidden relative" style={{ height: '500px', background: '#0d0e15' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
    />
  );
}

// ─── Component Palette ───
function Palette({ selectedTool, setSelectedTool, wireMode, setWireMode }) {
  const [cat, setCat] = useState('passive');
  const filtered = COMP_DEFS.filter(c => c.cat === cat);

  return (
    <div className="rounded-2xl border p-3" style={{ background: 'var(--sc-surface)', borderColor: 'var(--sc-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sc-dim)' }}>Components</h3>
        <button onClick={() => { setWireMode(!wireMode); setSelectedTool(null); }}
          className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer border transition-all"
          style={{
            background: wireMode ? 'color-mix(in srgb, #3b82f6 15%, transparent)' : 'var(--sc-surface2)',
            borderColor: wireMode ? '#3b82f6' : 'var(--sc-border)',
            color: wireMode ? '#3b82f6' : 'var(--sc-dim)',
          }}>
          {wireMode ? '🔗 Wire Mode ON' : '🔗 Wire'}
        </button>
      </div>

      <div className="flex gap-1 mb-2 flex-wrap">
        {CATS.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className="px-2 py-1 rounded text-[10px] font-semibold cursor-pointer border transition-all"
            style={{
              background: cat === c.id ? 'color-mix(in srgb, var(--sc-accent) 10%, transparent)' : 'var(--sc-surface2)',
              borderColor: cat === c.id ? 'var(--sc-accent)' : 'var(--sc-border)',
              color: cat === c.id ? 'var(--sc-accent)' : 'var(--sc-dim)',
            }}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1">
        {filtered.map(comp => (
          <button key={comp.id} onClick={() => { setSelectedTool(selectedTool === comp.id ? null : comp.id); setWireMode(false); }}
            className="flex items-center gap-1.5 p-1.5 rounded-lg text-left cursor-pointer transition-all border"
            style={{
              background: selectedTool === comp.id ? 'color-mix(in srgb, var(--sc-accent) 10%, transparent)' : 'var(--sc-surface2)',
              borderColor: selectedTool === comp.id ? 'var(--sc-accent)' : 'var(--sc-border)',
            }}>
            <span className="w-5 h-5 rounded flex items-center justify-center text-[10px]" style={{ background: comp.color + '22', color: comp.color }}>{comp.icon}</span>
            <div>
              <div className="text-[10px] font-semibold leading-tight" style={{ color: 'var(--sc-text)' }}>{comp.name}</div>
              <div className="text-[8px]" style={{ color: 'var(--sc-dim)' }}>{comp.defaultVal}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Placed list ───
function PlacedList({ placed, wires, onRemoveComp, onRemoveWire, onUpdateVal, onClearAll }) {
  return (
    <div className="rounded-2xl border p-3" style={{ background: 'var(--sc-surface)', borderColor: 'var(--sc-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sc-dim)' }}>
          Circuit ({placed.length} parts, {wires.length} wires)
        </h3>
        {(placed.length > 0 || wires.length > 0) && (
          <button onClick={onClearAll} className="text-[10px] cursor-pointer" style={{ color: 'var(--sc-accent)' }}>Clear all</button>
        )}
      </div>

      {placed.length === 0 && wires.length === 0 ? (
        <div className="text-center py-4" style={{ color: 'var(--sc-dim)' }}>
          <p className="text-xs">Select a component and click on the breadboard to place it.</p>
          <p className="text-[10px] mt-1">Use Wire mode to connect components.</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[180px] overflow-auto">
          {placed.map((comp, i) => {
            const def = COMP_DEFS.find(d => d.id === comp.type);
            return (
              <div key={'c' + i} className="flex items-center gap-2 p-1.5 rounded-lg border" style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)' }}>
                <span className="text-[10px]" style={{ color: def?.color }}>{def?.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold" style={{ color: 'var(--sc-text)' }}>{def?.name}</div>
                  <input type="text" value={comp.value} onChange={(e) => onUpdateVal(i, e.target.value)}
                    className="text-[9px] bg-transparent border-none outline-none w-full font-mono" style={{ color: 'var(--sc-accent)' }} />
                </div>
                <span className="text-[8px] font-mono" style={{ color: 'var(--sc-dim)' }}>({comp.col},{comp.row})</span>
                <button onClick={() => onRemoveComp(i)} className="text-[10px] cursor-pointer opacity-40 hover:opacity-100" style={{ color: 'var(--sc-dim)' }}>✕</button>
              </div>
            );
          })}
          {wires.map((w, i) => (
            <div key={'w' + i} className="flex items-center gap-2 p-1.5 rounded-lg border" style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)' }}>
              <span className="text-[10px]">🔗</span>
              <span className="text-[9px] font-mono flex-1" style={{ color: 'var(--sc-text)' }}>
                ({w.startCol},{w.startRow}) → ({w.endCol},{w.endRow})
              </span>
              <button onClick={() => onRemoveWire(i)} className="text-[10px] cursor-pointer opacity-40 hover:opacity-100" style={{ color: 'var(--sc-dim)' }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Status Bar ───
function StatusBar({ selectedTool, wireMode, wireStart, hoveredHole }) {
  let msg = 'Drag to orbit · Scroll to zoom · Right-drag to pan';
  if (selectedTool) {
    const def = COMP_DEFS.find(d => d.id === selectedTool);
    msg = `Click a hole to place ${def?.name}. Click component again to deselect.`;
  }
  if (wireMode) {
    msg = wireStart ? `Click second hole to complete wire (from ${wireStart.col},${wireStart.row})` : 'Click first hole to start wire';
  }
  if (hoveredHole) {
    msg += ` · Hole: (${hoveredHole.col}, ${hoveredHole.row})`;
  }

  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded-b-xl text-[10px]" style={{ background: 'var(--sc-surface)', color: 'var(--sc-dim)', borderTop: '1px solid var(--sc-border)' }}>
      <span>{msg}</span>
      {hoveredHole && <span className="font-mono" style={{ color: 'var(--sc-accent)' }}>Col:{hoveredHole.col} Row:{hoveredHole.row}</span>}
    </div>
  );
}

// ─── Main Export ───
export default function CircuitPrototyper() {
  const { lang } = useLanguage();
  const [selectedTool, setSelectedTool] = useState(null);
  const [wireMode, setWireMode] = useState(false);
  const [wireStart, setWireStart] = useState(null);
  const [placed, setPlaced] = useState([]);
  const [wires, setWires] = useState([]);
  const [hoveredHole, setHoveredHole] = useState(null);

  const handleClickHole = useCallback((col, row) => {
    if (wireMode) {
      if (!wireStart) {
        setWireStart({ col, row });
      } else {
        if (wireStart.col !== col || wireStart.row !== row) {
          setWires(prev => [...prev, { startCol: wireStart.col, startRow: wireStart.row, endCol: col, endRow: row }]);
        }
        setWireStart(null);
      }
    } else if (selectedTool) {
      const def = COMP_DEFS.find(d => d.id === selectedTool);
      setPlaced(prev => [...prev, { type: selectedTool, col, row, value: def?.defaultVal || '' }]);
    }
  }, [selectedTool, wireMode, wireStart]);

  const circuitContext = {
    components: placed.map(c => {
      const def = COMP_DEFS.find(d => d.id === c.type);
      return { type: def?.name, value: c.value, position: `col:${c.col} row:${c.row}` };
    }),
    wires: wires.map(w => `(${w.startCol},${w.startRow})→(${w.endCol},${w.endRow})`),
    totalComponents: placed.length,
    totalWires: wires.length,
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--sc-border)' }}>
        <BreadboardScene
          placed={placed}
          wires={wires}
          selectedTool={wireMode ? null : selectedTool}
          onClickHole={handleClickHole}
          wireStart={wireStart}
          onHoverHole={setHoveredHole}
          hoveredHole={hoveredHole}
        />
        <StatusBar selectedTool={selectedTool} wireMode={wireMode} wireStart={wireStart} hoveredHole={hoveredHole} />
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[260px] space-y-3">
          <Palette selectedTool={selectedTool} setSelectedTool={setSelectedTool} wireMode={wireMode} setWireMode={setWireMode} />
          <PlacedList placed={placed} wires={wires}
            onRemoveComp={(i) => setPlaced(prev => prev.filter((_, idx) => idx !== i))}
            onRemoveWire={(i) => setWires(prev => prev.filter((_, idx) => idx !== i))}
            onUpdateVal={(i, v) => setPlaced(prev => prev.map((c, idx) => idx === i ? { ...c, value: v } : c))}
            onClearAll={() => { setPlaced([]); setWires([]); }}
          />
        </div>
        <div className="flex-1 min-w-[300px]">
          <AIPanel context={circuitContext} toolId="prototyper" />
        </div>
      </div>
    </div>
  );
}
