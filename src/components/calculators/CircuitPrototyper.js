'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import AIPanel from '@/components/AIPanel';
import { useLanguage } from '@/lib/LanguageContext';
import { analyzeCircuit } from '@/lib/circuitSim';

// ─── Component Library ───
const COMP_DEFS = [
  { id:'resistor', name:'Resistor', icon:'▮', color:'#c9935a', cat:'passive', val:'10kΩ' },
  { id:'capacitor', name:'Ceramic Cap', icon:'||', color:'#2563eb', cat:'passive', val:'100nF' },
  { id:'cap-elec', name:'Electrolytic Cap', icon:'|+', color:'#1e40af', cat:'passive', val:'100µF 25V' },
  { id:'inductor', name:'Inductor', icon:'∿', color:'#eab308', cat:'passive', val:'100µH' },
  { id:'pot', name:'Potentiometer', icon:'↔', color:'#f59e0b', cat:'passive', val:'10kΩ' },
  { id:'photo-res', name:'Photoresistor', icon:'☀', color:'#a16207', cat:'passive', val:'LDR' },
  { id:'fuse', name:'Fuse', icon:'—|—', color:'#94a3b8', cat:'passive', val:'1A' },
  { id:'led-red', name:'LED Red', icon:'◉', color:'#ef4444', cat:'led', val:'2V 20mA' },
  { id:'led-green', name:'LED Green', icon:'◉', color:'#22c55e', cat:'led', val:'2.2V 20mA' },
  { id:'led-blue', name:'LED Blue', icon:'◉', color:'#3b82f6', cat:'led', val:'3.2V 20mA' },
  { id:'led-yellow', name:'LED Yellow', icon:'◉', color:'#eab308', cat:'led', val:'2.1V 20mA' },
  { id:'led-white', name:'LED White', icon:'◉', color:'#e2e8f0', cat:'led', val:'3.4V 20mA' },
  { id:'diode', name:'Diode 1N4148', icon:'▷|', color:'#f97316', cat:'active', val:'1N4148' },
  { id:'zener', name:'Zener Diode', icon:'▷Z', color:'#8b5cf6', cat:'active', val:'5.1V' },
  { id:'npn', name:'NPN 2N2222', icon:'⊳', color:'#a855f7', cat:'active', val:'2N2222' },
  { id:'pnp', name:'PNP 2N3906', icon:'⊲', color:'#c084fc', cat:'active', val:'2N3906' },
  { id:'mosfet-n', name:'N-MOSFET', icon:'⊳|', color:'#ef4444', cat:'active', val:'IRFZ44N' },
  { id:'mosfet-p', name:'P-MOSFET', icon:'⊲|', color:'#f87171', cat:'active', val:'IRF9540' },
  { id:'ic555', name:'555 Timer', icon:'■', color:'#ec4899', cat:'ic', val:'NE555' },
  { id:'ic-opamp', name:'Op-Amp', icon:'△', color:'#06b6d4', cat:'ic', val:'LM358' },
  { id:'seven-seg', name:'7-Segment', icon:'8', color:'#ef4444', cat:'ic', val:'Common Cathode' },
  { id:'battery', name:'9V Battery', icon:'🔋', color:'#16a34a', cat:'power', val:'9V' },
  { id:'dc-supply', name:'DC 5V Supply', icon:'⚡', color:'#ff8c42', cat:'power', val:'5V' },
  { id:'usb-power', name:'USB Power', icon:'⏻', color:'#ef4444', cat:'power', val:'5V 500mA' },
  { id:'button', name:'Push Button', icon:'⊡', color:'#94a3b8', cat:'switch', val:'Momentary' },
  { id:'switch', name:'Toggle Switch', icon:'⊟', color:'#64748b', cat:'switch', val:'SPST' },
  { id:'buzzer', name:'Buzzer', icon:'♪', color:'#22c55e', cat:'output', val:'5V Active' },
  { id:'motor-dc', name:'DC Motor', icon:'⊙', color:'#3b82f6', cat:'output', val:'6V' },
  { id:'relay', name:'Relay', icon:'⎍', color:'#6366f1', cat:'output', val:'5V SPDT' },
];

const CATS = [
  { id:'passive', name:'Passive' },
  { id:'led', name:'LEDs' },
  { id:'active', name:'Semiconductors' },
  { id:'ic', name:'ICs' },
  { id:'power', name:'Power' },
  { id:'switch', name:'Switches' },
  { id:'output', name:'Output' },
];

const BB_COLS = 30;
const BB_ROWS = 12;
const HS = 0.32; // hole spacing

// ─── 3D Scene ───
function Scene3D({ placed, wires, tool, wireMode, wireStart, onClickHole, onHover, hovered }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ scene:null, cam:null, rend:null, THREE:null, holes:[], compGrp:null, wireGrp:null });
  const orbitRef = useRef({ theta: 0.6, phi: 0.7, dist: 10, tx: 0, ty: 0, tz: 0 });
  const dragRef = useRef({ on:false, btn:-1, lx:0, ly:0, moved:false });
  const frameRef = useRef(null);

  // Init
  useEffect(() => {
    if (!mountRef.current) return;
    let dead = false;
    const go = async () => {
      const THREE = await import('three');
      if (dead) return;
      const S = stateRef.current;
      S.THREE = THREE;
      const el = mountRef.current;
      const w = el.clientWidth, h = el.clientHeight;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0c0d14);
      S.scene = scene;

      const cam = new THREE.PerspectiveCamera(45, w/h, 0.1, 200);
      S.cam = cam;

      const rend = new THREE.WebGLRenderer({ antialias:true });
      rend.setSize(w, h);
      rend.setPixelRatio(Math.min(devicePixelRatio, 2));
      rend.shadowMap.enabled = true;
      rend.shadowMap.type = THREE.PCFSoftShadowMap;
      el.appendChild(rend.domElement);
      S.rend = rend;

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 0.45));
      const sun = new THREE.DirectionalLight(0xffffff, 0.75);
      sun.position.set(5, 12, 7);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      scene.add(sun);
      scene.add(new THREE.PointLight(0xff8c42, 0.12, 25).translateX(-5).translateY(6));

      // Desk
      const desk = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.MeshStandardMaterial({ color:0x171923, roughness:0.95 })
      );
      desk.rotation.x = -Math.PI/2; desk.position.y = -0.2; desk.receiveShadow = true;
      scene.add(desk);
      const grid = new THREE.GridHelper(50, 100, 0x1e2030, 0x161824);
      grid.position.y = -0.19; scene.add(grid);

      // ─── Breadboard ───
      const bbW = BB_COLS * HS + 0.8, bbH = BB_ROWS * HS + 0.6;
      const bb = new THREE.Group();

      // Board body
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(bbW, 0.22, bbH),
        new THREE.MeshStandardMaterial({ color:0xf0ebe0, roughness:0.55 })
      );
      board.receiveShadow = true; board.castShadow = true;
      bb.add(board);

      // Center channel
      const chan = new THREE.Mesh(
        new THREE.BoxGeometry(bbW - 0.4, 0.23, 0.2),
        new THREE.MeshStandardMaterial({ color:0xd8d2c2 })
      );
      chan.position.y = 0.005; bb.add(chan);

      // Power rails
      const rlGeo = new THREE.BoxGeometry(bbW - 0.6, 0.008, 0.04);
      const mkRail = (z, col) => {
        const m = new THREE.Mesh(rlGeo, new THREE.MeshStandardMaterial({ color: col }));
        m.position.set(0, 0.115, z); bb.add(m);
      };
      const topZ = -bbH/2 + 0.2, botZ = bbH/2 - 0.2;
      mkRail(topZ - 0.06, 0xcc2222);
      mkRail(topZ + 0.06, 0x2222cc);
      mkRail(botZ - 0.06, 0xcc2222);
      mkRail(botZ + 0.06, 0x2222cc);

      // Holes — use larger invisible click targets
      const holeVisGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.23, 8);
      const holeClickGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
      const holeVisMat = new THREE.MeshStandardMaterial({ color:0x2a2a2a, roughness:0.2 });
      const holeClickMat = new THREE.MeshBasicMaterial({ visible:false });
      const holes = [];

      for (let c = 0; c < BB_COLS; c++) {
        for (let r = 0; r < BB_ROWS; r++) {
          if (r === 5 || r === 6) continue; // center channel gap
          const x = (c - BB_COLS/2 + 0.5) * HS;
          const z = (r - BB_ROWS/2 + 0.5) * HS;
          // Visible hole
          const vis = new THREE.Mesh(holeVisGeo, holeVisMat.clone());
          vis.position.set(x, 0, z);
          bb.add(vis);
          // Invisible click target (larger)
          const click = new THREE.Mesh(holeClickGeo, holeClickMat);
          click.position.set(x, 0.05, z);
          click.userData = { col: c, row: r, visMesh: vis };
          bb.add(click);
          holes.push(click);
        }
      }
      S.holes = holes;
      scene.add(bb);

      // Component + wire groups
      const compGrp = new THREE.Group(); compGrp.name = 'comps'; scene.add(compGrp); S.compGrp = compGrp;
      const wireGrp = new THREE.Group(); wireGrp.name = 'wires'; scene.add(wireGrp); S.wireGrp = wireGrp;

      // Animate
      const tick = () => {
        if (dead) return;
        frameRef.current = requestAnimationFrame(tick);
        const o = orbitRef.current;
        cam.position.set(
          o.tx + o.dist * Math.sin(o.phi) * Math.sin(o.theta),
          o.ty + o.dist * Math.cos(o.phi),
          o.tz + o.dist * Math.sin(o.phi) * Math.cos(o.theta)
        );
        cam.lookAt(o.tx, o.ty, o.tz);
        rend.render(scene, cam);
      };
      tick();

      const onResize = () => {
        if (dead) return;
        const w2 = el.clientWidth, h2 = el.clientHeight;
        cam.aspect = w2/h2; cam.updateProjectionMatrix(); rend.setSize(w2, h2);
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    };
    go();
    return () => { dead = true; cancelAnimationFrame(frameRef.current);
      if (stateRef.current.rend) { stateRef.current.rend.dispose(); try { mountRef.current?.removeChild(stateRef.current.rend.domElement); } catch(e){} }
    };
  }, []);

  // ─── Update components ───
  useEffect(() => {
    const { THREE, compGrp } = stateRef.current;
    if (!THREE || !compGrp) return;
    while (compGrp.children.length) compGrp.remove(compGrp.children[0]);

    placed.forEach(comp => {
      const def = COMP_DEFS.find(d => d.id === comp.type);
      if (!def) return;
      const x = (comp.col - BB_COLS/2 + 0.5) * HS;
      const z = (comp.row - BB_ROWS/2 + 0.5) * HS;
      const g = new THREE.Group();
      const y0 = 0.12;

      if (comp.type === 'resistor') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.55, 12), new THREE.MeshStandardMaterial({ color:0xc9935a, roughness:0.45 }));
        body.rotation.z = Math.PI/2; body.position.y = 0.28; g.add(body);
        [0x8B4513, 0x000000, 0xEA580C, 0xCFB53B].forEach((cl, i) => {
          const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.025, 12), new THREE.MeshStandardMaterial({ color:cl }));
          b.rotation.z = Math.PI/2; b.position.set(-0.12 + i*0.09, 0.28, 0); g.add(b);
        });
        [-0.4, 0.4].forEach(dx => {
          const l = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.28, 6), new THREE.MeshStandardMaterial({ color:0x888888, metalness:0.5 }));
          l.position.set(dx, 0.14, 0); g.add(l);
        });
      } else if (comp.type.startsWith('led-')) {
        const col = parseInt(def.color.replace('#',''), 16);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12, 0, Math.PI*2, 0, Math.PI*0.55),
          new THREE.MeshStandardMaterial({ color:col, transparent:true, opacity:0.85, emissive:col, emissiveIntensity:0.5 }));
        dome.position.y = 0.42; g.add(dome);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16),
          new THREE.MeshStandardMaterial({ color:col, transparent:true, opacity:0.4 }));
        base.position.y = 0.34; g.add(base);
        const glow = new THREE.PointLight(col, 0.3, 1.5); glow.position.y = 0.5; g.add(glow);
        [-0.04, 0.04].forEach((dx, i) => {
          const l = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, i===0?0.34:0.28, 6), new THREE.MeshStandardMaterial({ color:0x999999, metalness:0.6 }));
          l.position.set(dx, i===0?0.17:0.14, 0); g.add(l);
        });
      } else if (comp.type === 'capacitor') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.04), new THREE.MeshStandardMaterial({ color:0x2255cc, roughness:0.3 }));
        body.position.y = 0.32; g.add(body);
        [-0.04, 0.04].forEach(dx => {
          const l = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 6), new THREE.MeshStandardMaterial({ color:0x888888 }));
          l.position.set(dx, 0.11, 0); g.add(l);
        });
      } else if (comp.type === 'cap-elec') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 16), new THREE.MeshStandardMaterial({ color:0x111144, roughness:0.3 }));
        body.position.y = 0.42; g.add(body);
        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.12, 16, 1, false, 0, Math.PI*0.35), new THREE.MeshStandardMaterial({ color:0x888888 }));
        stripe.position.y = 0.48; g.add(stripe);
        const top = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.02, 16), new THREE.MeshStandardMaterial({ color:0x222255 }));
        top.position.y = 0.63; g.add(top);
        [-0.05, 0.05].forEach(dx => {
          const l = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 6), new THREE.MeshStandardMaterial({ color:0x888888 }));
          l.position.set(dx, 0.11, 0); g.add(l);
        });
      } else if (comp.type === 'ic555' || comp.type === 'ic-opamp') {
        const bw = comp.type === 'ic555' ? 0.45 : 0.35;
        const bh = comp.type === 'ic555' ? 0.95 : 0.6;
        const body = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.15, bh), new THREE.MeshStandardMaterial({ color:0x111111, roughness:0.2 }));
        body.position.y = 0.26; g.add(body);
        const notch = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshStandardMaterial({ color:0x222222 }));
        notch.position.set(0, 0.34, -bh/2 + 0.06); g.add(notch);
        const pins = comp.type === 'ic555' ? 4 : 3;
        for (let i = 0; i < pins; i++) {
          [-bw/2-0.04, bw/2+0.04].forEach(dx => {
            const pin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.03), new THREE.MeshStandardMaterial({ color:0xaaaaaa, metalness:0.7 }));
            pin.position.set(dx, 0.19, -bh/2 + 0.12 + i * (bh-0.24)/(pins-1));
            g.add(pin);
          });
        }
      } else if (comp.type === 'battery') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, 0.28), new THREE.MeshStandardMaterial({ color:0x1a1a1a }));
        body.position.y = 0.55; g.add(body);
        const label = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.5, 0.005), new THREE.MeshStandardMaterial({ color:0x1a8a3a }));
        label.position.set(0, 0.55, 0.145); g.add(label);
        const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 8), new THREE.MeshStandardMaterial({ color:0xcccccc, metalness:0.8 }));
        tp.position.set(-0.08, 1.0, 0); g.add(tp);
        const tn = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 8), new THREE.MeshStandardMaterial({ color:0xcccccc, metalness:0.8 }));
        tn.position.set(0.08, 0.99, 0); g.add(tn);
      } else if (comp.type === 'button') {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.4), new THREE.MeshStandardMaterial({ color:0x1a1a1a }));
        base.position.y = 0.24; g.add(base);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 16), new THREE.MeshStandardMaterial({ color:0xdd3333, roughness:0.3 }));
        cap.position.y = 0.36; g.add(cap);
        [[-0.15,-0.15],[0.15,-0.15],[-0.15,0.15],[0.15,0.15]].forEach(([px,pz]) => {
          const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 6), new THREE.MeshStandardMaterial({ color:0x888888 }));
          pin.position.set(px, 0.09, pz); g.add(pin);
        });
      } else if (comp.type === 'diode' || comp.type === 'zener') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.3, 12), new THREE.MeshStandardMaterial({ color:0x1a1a1a }));
        body.rotation.z = Math.PI/2; body.position.y = 0.28; g.add(body);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.03, 12), new THREE.MeshStandardMaterial({ color:0xcccccc }));
        band.rotation.z = Math.PI/2; band.position.set(0.1, 0.28, 0); g.add(band);
        [-0.3, 0.3].forEach(dx => {
          const l = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 6), new THREE.MeshStandardMaterial({ color:0x888888 }));
          l.position.set(dx, 0.14, 0); g.add(l);
        });
      } else if (comp.type === 'npn' || comp.type === 'pnp' || comp.type.startsWith('mosfet')) {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 3), new THREE.MeshStandardMaterial({ color:0x1a1a1a }));
        body.rotation.x = Math.PI/2; body.position.y = 0.35; g.add(body);
        const flat = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.01), new THREE.MeshStandardMaterial({ color:0x111111 }));
        flat.position.set(0, 0.35, 0.05); g.add(flat);
        [-0.06, 0, 0.06].forEach(dx => {
          const l = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 6), new THREE.MeshStandardMaterial({ color:0x888888 }));
          l.position.set(dx, 0.12, 0); g.add(l);
        });
      } else if (comp.type === 'buzzer') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 20), new THREE.MeshStandardMaterial({ color:0x111111 }));
        body.position.y = 0.32; g.add(body);
        const top = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), new THREE.MeshStandardMaterial({ color:0x888888 }));
        top.position.y = 0.4; g.add(top);
      } else if (comp.type === 'motor-dc') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.45, 16), new THREE.MeshStandardMaterial({ color:0x666666, metalness:0.6 }));
        body.rotation.x = Math.PI/2; body.position.y = 0.38; g.add(body);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), new THREE.MeshStandardMaterial({ color:0xcccccc, metalness:0.9 }));
        shaft.rotation.x = Math.PI/2; shaft.position.set(0, 0.38, 0.32); g.add(shaft);
      } else {
        // Generic fallback
        const col = parseInt((def?.color || '#ff8c42').replace('#',''), 16);
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.18), new THREE.MeshStandardMaterial({ color:col }));
        body.position.y = 0.28; g.add(body);
      }

      g.position.set(x, y0, z);
      g.castShadow = true;
      compGrp.add(g);
    });
  }, [placed]);

  // ─── Update wires ───
  useEffect(() => {
    const { THREE, wireGrp } = stateRef.current;
    if (!THREE || !wireGrp) return;
    while (wireGrp.children.length) wireGrp.remove(wireGrp.children[0]);

    const wireColors = [0x3b82f6, 0xef4444, 0x22c55e, 0xeab308, 0xf97316, 0xa855f7, 0xec4899, 0x06b6d4, 0xffffff, 0x6366f1];
    
    wires.forEach((w, i) => {
      const x1 = (w.sc - BB_COLS/2 + 0.5) * HS;
      const z1 = (w.sr - BB_ROWS/2 + 0.5) * HS;
      const x2 = (w.ec - BB_COLS/2 + 0.5) * HS;
      const z2 = (w.er - BB_ROWS/2 + 0.5) * HS;
      const midY = 0.28 + Math.sqrt(Math.pow(x2-x1,2) + Math.pow(z2-z1,2)) * 0.15;

      const pts = [
        new THREE.Vector3(x1, 0.15, z1),
        new THREE.Vector3(x1, midY, z1),
        new THREE.Vector3((x1+x2)/2, midY + 0.05, (z1+z2)/2),
        new THREE.Vector3(x2, midY, z2),
        new THREE.Vector3(x2, 0.15, z2),
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 24, 0.018, 8, false),
        new THREE.MeshStandardMaterial({ color: wireColors[i % wireColors.length], roughness:0.3, metalness:0.1 })
      );
      wireGrp.add(mesh);
    });

    // Wire in progress (from wireStart to hovered)
    if (wireStart && hovered) {
      const x1 = (wireStart.col - BB_COLS/2 + 0.5) * HS;
      const z1 = (wireStart.row - BB_ROWS/2 + 0.5) * HS;
      const x2 = (hovered.col - BB_COLS/2 + 0.5) * HS;
      const z2 = (hovered.row - BB_ROWS/2 + 0.5) * HS;
      const pts = [new THREE.Vector3(x1, 0.15, z1), new THREE.Vector3(x1, 0.35, z1), new THREE.Vector3(x2, 0.35, z2), new THREE.Vector3(x2, 0.15, z2)];
      const curve = new THREE.CatmullRomCurve3(pts);
      const preview = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 16, 0.015, 6, false),
        new THREE.MeshStandardMaterial({ color: 0xff8c42, transparent: true, opacity: 0.5 })
      );
      wireGrp.add(preview);
    }
  }, [wires, wireStart, hovered]);

  // ─── Highlight hovered hole ───
  useEffect(() => {
    const { THREE } = stateRef.current;
    if (!THREE) return;
    stateRef.current.holes.forEach(h => {
      const vis = h.userData.visMesh;
      if (hovered && h.userData.col === hovered.col && h.userData.row === hovered.row) {
        vis.material.color.setHex(0xff8c42);
        vis.material.emissive = new THREE.Color(0xff8c42);
        vis.material.emissiveIntensity = 0.6;
      } else {
        vis.material.color.setHex(0x2a2a2a);
        vis.material.emissive = new THREE.Color(0x000000);
        vis.material.emissiveIntensity = 0;
      }
    });
  }, [hovered]);

  // ─── Input handlers ───
  const raycast = useCallback((cx, cy) => {
    const { THREE, rend, cam } = stateRef.current;
    if (!THREE || !rend) return null;
    const rect = rend.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(((cx-rect.left)/rect.width)*2-1, -((cy-rect.top)/rect.height)*2+1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, cam);
    const hits = ray.intersectObjects(stateRef.current.holes);
    return hits.length > 0 ? hits[0].object.userData : null;
  }, []);

  const onDown = (e) => { dragRef.current = { on:true, btn:e.button, lx:e.clientX, ly:e.clientY, moved:false }; };
  const onMove = (e) => {
    const d = dragRef.current;
    if (d.on) {
      const dx = e.clientX - d.lx, dy = e.clientY - d.ly;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;
      const o = orbitRef.current;
      if (d.btn === 0 && !(tool || wireMode)) {
        o.theta -= dx * 0.005;
        o.phi = Math.max(0.15, Math.min(1.45, o.phi + dy * 0.005));
      } else if (d.btn === 2 || d.btn === 1) {
        o.tx -= dx * 0.008; o.tz -= dy * 0.008;
      }
      d.lx = e.clientX; d.ly = e.clientY;
    }
    onHover(raycast(e.clientX, e.clientY));
  };
  const onUp = (e) => {
    if (!dragRef.current.moved && (tool || wireMode)) {
      const h = raycast(e.clientX, e.clientY);
      if (h) onClickHole(h.col, h.row);
    }
    dragRef.current.on = false;
  };
  const onWheel = (e) => { e.preventDefault(); orbitRef.current.dist = Math.max(3, Math.min(25, orbitRef.current.dist + e.deltaY * 0.008)); };

  return <div ref={mountRef} className="w-full" style={{ height:'480px' }}
    onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
    onWheel={onWheel} onContextMenu={e => e.preventDefault()} />;
}

// ─── Simulation Panel ───
function SimPanel({ results }) {
  if (!results) return null;
  const scoreColor = results.score >= 80 ? '#22c55e' : results.score >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = results.score >= 80 ? 'Good' : results.score >= 50 ? 'Issues Found' : 'Problems Detected';

  return (
    <div className="rounded-2xl border p-3 space-y-2" style={{ background:'var(--sc-surface)', borderColor:'var(--sc-border)' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--sc-dim)' }}>⚡ Circuit Analysis</h3>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: scoreColor + '22', color: scoreColor }}>
            {results.score}/100 — {scoreLabel}
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'var(--sc-surface2)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width:`${results.score}%`, background: scoreColor }} />
      </div>

      <div className="space-y-1 max-h-[200px] overflow-auto">
        {results.errors.map((e, i) => (
          <div key={'e'+i} className="flex gap-2 p-2 rounded-lg text-[11px]" style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
            <span>🔴</span>
            <span style={{ color:'#fca5a5' }}>{e.msg}</span>
          </div>
        ))}
        {results.warnings.map((w, i) => (
          <div key={'w'+i} className="flex gap-2 p-2 rounded-lg text-[11px]" style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)' }}>
            <span>🟡</span>
            <span style={{ color:'#fcd34d' }}>{w.msg}</span>
          </div>
        ))}
        {results.info.map((inf, i) => (
          <div key={'i'+i} className="flex gap-2 p-2 rounded-lg text-[11px]" style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)' }}>
            <span>💡</span>
            <span style={{ color:'var(--sc-dim)' }}>{inf.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Palette ───
function Palette({ tool, setTool, wireMode, setWireMode }) {
  const [cat, setCat] = useState('passive');
  return (
    <div className="rounded-2xl border p-3" style={{ background:'var(--sc-surface)', borderColor:'var(--sc-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--sc-dim)' }}>Components</h3>
        <button onClick={() => { setWireMode(!wireMode); setTool(null); }}
          className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer border"
          style={{ background: wireMode ? 'rgba(59,130,246,0.15)' : 'var(--sc-surface2)', borderColor: wireMode ? '#3b82f6' : 'var(--sc-border)', color: wireMode ? '#3b82f6' : 'var(--sc-dim)' }}>
          {wireMode ? '🔗 Wire ON' : '🔗 Wire'}
        </button>
      </div>
      <div className="flex gap-1 mb-2 flex-wrap">
        {CATS.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className="px-1.5 py-0.5 rounded text-[9px] font-semibold cursor-pointer border"
            style={{ background: cat===c.id ? 'color-mix(in srgb, var(--sc-accent) 10%, transparent)' : 'var(--sc-surface2)', borderColor: cat===c.id ? 'var(--sc-accent)' : 'var(--sc-border)', color: cat===c.id ? 'var(--sc-accent)' : 'var(--sc-dim)' }}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1 max-h-[200px] overflow-auto">
        {COMP_DEFS.filter(c => c.cat === cat).map(comp => (
          <button key={comp.id} onClick={() => { setTool(tool===comp.id ? null : comp.id); setWireMode(false); }}
            className="flex items-center gap-1 p-1.5 rounded-lg text-left cursor-pointer border"
            style={{ background: tool===comp.id ? 'color-mix(in srgb, var(--sc-accent) 10%, transparent)' : 'var(--sc-surface2)', borderColor: tool===comp.id ? 'var(--sc-accent)' : 'var(--sc-border)' }}>
            <span className="text-[10px] w-4 text-center" style={{ color:comp.color }}>{comp.icon}</span>
            <div className="min-w-0">
              <div className="text-[9px] font-semibold truncate" style={{ color:'var(--sc-text)' }}>{comp.name}</div>
              <div className="text-[8px] truncate" style={{ color:'var(--sc-dim)' }}>{comp.val}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Parts List ───
function PartsList({ placed, wires, onRemove, onRemoveWire, onUpdateVal, onClear }) {
  return (
    <div className="rounded-2xl border p-3" style={{ background:'var(--sc-surface)', borderColor:'var(--sc-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--sc-dim)' }}>BOM ({placed.length} parts, {wires.length} wires)</h3>
        {(placed.length > 0 || wires.length > 0) && <button onClick={onClear} className="text-[9px] cursor-pointer" style={{ color:'var(--sc-accent)' }}>Clear</button>}
      </div>
      {placed.length === 0 ? (
        <p className="text-[10px] text-center py-3" style={{ color:'var(--sc-dim)' }}>Select a component and click a hole on the breadboard.</p>
      ) : (
        <div className="space-y-1 max-h-[150px] overflow-auto">
          {placed.map((c, i) => {
            const d = COMP_DEFS.find(x => x.id === c.type);
            return (
              <div key={i} className="flex items-center gap-1.5 p-1 rounded border" style={{ background:'var(--sc-surface2)', borderColor:'var(--sc-border)' }}>
                <span className="text-[9px]" style={{ color:d?.color }}>{d?.icon}</span>
                <span className="text-[9px] font-semibold flex-1 truncate" style={{ color:'var(--sc-text)' }}>{d?.name}</span>
                <input type="text" value={c.value} onChange={e => onUpdateVal(i, e.target.value)}
                  className="text-[8px] bg-transparent border-none outline-none w-16 font-mono" style={{ color:'var(--sc-accent)' }} />
                <button onClick={() => onRemove(i)} className="text-[9px] cursor-pointer opacity-40 hover:opacity-100">✕</button>
              </div>
            );
          })}
          {wires.map((w, i) => (
            <div key={'w'+i} className="flex items-center gap-1.5 p-1 rounded border" style={{ background:'var(--sc-surface2)', borderColor:'var(--sc-border)' }}>
              <span className="text-[9px]">🔗</span>
              <span className="text-[8px] font-mono flex-1" style={{ color:'var(--sc-dim)' }}>({w.sc},{w.sr})→({w.ec},{w.er})</span>
              <button onClick={() => onRemoveWire(i)} className="text-[9px] cursor-pointer opacity-40 hover:opacity-100">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Status Bar ───
function Status({ tool, wireMode, wireStart, hovered }) {
  let msg = '🖱️ Left-drag: orbit · Scroll: zoom · Right-drag: pan';
  if (tool) { const d = COMP_DEFS.find(x => x.id === tool); msg = `📌 Click hole to place ${d?.name}. Click again in palette to deselect.`; }
  if (wireMode) msg = wireStart ? `🔗 Click second hole to finish wire (from ${wireStart.col},${wireStart.row})` : '🔗 Click first hole to start wire';
  return (
    <div className="flex items-center justify-between px-3 py-1 text-[9px]" style={{ background:'var(--sc-surface)', color:'var(--sc-dim)', borderTop:'1px solid var(--sc-border)' }}>
      <span>{msg}</span>
      {hovered && <span className="font-mono" style={{ color:'var(--sc-accent)' }}>Hole: {hovered.col},{hovered.row}</span>}
    </div>
  );
}

// ─── Main ───
export default function CircuitPrototyper() {
  const { lang } = useLanguage();
  const [tool, setTool] = useState(null);
  const [wireMode, setWireMode] = useState(false);
  const [wireStart, setWireStart] = useState(null);
  const [placed, setPlaced] = useState([]);
  const [wires, setWires] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [simResults, setSimResults] = useState(null);

  // Run simulation whenever circuit changes
  useEffect(() => {
    const results = analyzeCircuit(placed, wires);
    setSimResults(results);
  }, [placed, wires]);

  const onClickHole = useCallback((col, row) => {
    if (wireMode) {
      if (!wireStart) { setWireStart({ col, row }); }
      else {
        if (wireStart.col !== col || wireStart.row !== row) {
          setWires(p => [...p, { sc:wireStart.col, sr:wireStart.row, ec:col, er:row }]);
        }
        setWireStart(null);
      }
    } else if (tool) {
      const def = COMP_DEFS.find(d => d.id === tool);
      setPlaced(p => [...p, { type: tool, col, row, value: def?.val || '' }]);
    }
  }, [tool, wireMode, wireStart]);

  const ctx = {
    components: placed.map(c => ({ type: COMP_DEFS.find(d => d.id === c.type)?.name, value: c.value, pos: `${c.col},${c.row}` })),
    wires: wires.map(w => `(${w.sc},${w.sr})→(${w.ec},${w.er})`),
    analysis: simResults ? { score: simResults.score, errors: simResults.errors.length, warnings: simResults.warnings.length } : null,
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor:'var(--sc-border)' }}>
        <Scene3D placed={placed} wires={wires} tool={wireMode ? null : tool} wireMode={wireMode}
          wireStart={wireStart} onClickHole={onClickHole} onHover={setHovered} hovered={hovered} />
        <Status tool={tool} wireMode={wireMode} wireStart={wireStart} hovered={hovered} />
      </div>

      {/* Simulation Results */}
      <SimPanel results={simResults} />

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[250px] space-y-3">
          <Palette tool={tool} setTool={setTool} wireMode={wireMode} setWireMode={setWireMode} />
          <PartsList placed={placed} wires={wires}
            onRemove={i => setPlaced(p => p.filter((_,idx) => idx !== i))}
            onRemoveWire={i => setWires(p => p.filter((_,idx) => idx !== i))}
            onUpdateVal={(i,v) => setPlaced(p => p.map((c,idx) => idx===i ? {...c, value:v} : c))}
            onClear={() => { setPlaced([]); setWires([]); }} />
        </div>
        <div className="flex-1 min-w-[300px]">
          <AIPanel context={ctx} toolId="prototyper" />
        </div>
      </div>
    </div>
  );
}
