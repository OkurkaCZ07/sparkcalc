'use client';

import { useEffect, useMemo, useRef } from 'react';

export default function Viewport3D({
  defs,
  circuit,
  setCircuit,
  commit,
  mode,
  placingType,
  simRunning,
  sim,
  selected,
  setSelected,
  hovered,
  setHovered,
}) {
  const hostRef = useRef(null);
  const threeRef = useRef(null);
  const wireDraftRef = useRef(null); // {from:{col,row}}
  const dragRef = useRef({ dragging: false, compId: null, startCircuit: null, moved: false });
  const latestRef = useRef({
    defs,
    circuit,
    commit,
    setCircuit,
    mode,
    placingType,
    simRunning,
    sim,
    selected,
    setSelected,
    hovered,
    setHovered,
  });

  useEffect(() => {
    latestRef.current = {
      defs,
      circuit,
      commit,
      setCircuit,
      mode,
      placingType,
      simRunning,
      sim,
      selected,
      setSelected,
      hovered,
      setHovered,
    };
  }, [defs, circuit, commit, mode, placingType, simRunning, sim, selected, setSelected, hovered, setHovered]);

  const isInteractive = !simRunning;

  const pickEnabled = useMemo(() => true, []);

  useEffect(() => {
    let mounted = true;
    let cleanup = null;

    (async () => {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
      const { RoundedBoxGeometry } = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js');

      if (!mounted) return;

      const host = hostRef.current;
      if (!host) return;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(host.clientWidth, host.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      host.appendChild(renderer.domElement);

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(getCssVar('--sc-bg', '#0a0b10'));

      // Camera
      const cameraPersp = new THREE.PerspectiveCamera(45, host.clientWidth / host.clientHeight, 0.1, 200);
      cameraPersp.position.set(0, 8, 10);
      cameraPersp.lookAt(0, 0, 0);

      const orthoSize = 7.5;
      const aspect = host.clientWidth / host.clientHeight;
      const cameraOrtho = new THREE.OrthographicCamera(
        -orthoSize * aspect,
        orthoSize * aspect,
        orthoSize,
        -orthoSize,
        0.1,
        200
      );
      cameraOrtho.position.set(0, 16, 0.001);
      cameraOrtho.lookAt(0, 0, 0);

      let activeCamera = cameraPersp;

      // Lights
      const ambient = new THREE.AmbientLight(0xffffff, 0.55);
      scene.add(ambient);

      const dir = new THREE.DirectionalLight(0xffffff, 0.9);
      dir.position.set(8, 12, 6);
      dir.castShadow = true;
      dir.shadow.mapSize.set(1024, 1024);
      dir.shadow.camera.near = 0.5;
      dir.shadow.camera.far = 60;
      scene.add(dir);

      // Table
      const tableGeo = new THREE.PlaneGeometry(80, 80);
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x0e1018, roughness: 0.95, metalness: 0.0 });
      const table = new THREE.Mesh(tableGeo, tableMat);
      table.rotation.x = -Math.PI / 2;
      table.position.y = -0.9;
      table.receiveShadow = true;
      scene.add(table);

      // Breadboard (procedural, minimal for now)
      const bbGroup = new THREE.Group();
      bbGroup.name = 'Breadboard';
      scene.add(bbGroup);

      const bbBodyGeo = new RoundedBoxGeometry(12.5, 1.2, 6.2, 6, 0.25);
      const bbBodyMat = new THREE.MeshStandardMaterial({ color: 0xf0ebe0, roughness: 0.95, metalness: 0.0 });
      const bbBody = new THREE.Mesh(bbBodyGeo, bbBodyMat);
      bbBody.castShadow = true;
      bbBody.receiveShadow = true;
      bbGroup.add(bbBody);

      // Channel groove
      const grooveGeo = new THREE.BoxGeometry(12.0, 0.2, 0.55);
      const grooveMat = new THREE.MeshStandardMaterial({ color: 0xd5cdb8, roughness: 1.0, metalness: 0.0 });
      const groove = new THREE.Mesh(grooveGeo, grooveMat);
      groove.position.y = 0.45;
      groove.position.z = 0;
      groove.castShadow = false;
      groove.receiveShadow = true;
      bbGroup.add(groove);

      // Rails stripes (top/bot, + red, - blue)
      const stripeGeo = new THREE.BoxGeometry(12.0, 0.02, 0.08);
      const stripePlus = new THREE.MeshStandardMaterial({ color: 0xcc3333, emissive: 0x000000, roughness: 0.6 });
      const stripeMinus = new THREE.MeshStandardMaterial({ color: 0x2b6cff, emissive: 0x000000, roughness: 0.6 });
      const stripeTopPlus = new THREE.Mesh(stripeGeo, stripePlus);
      stripeTopPlus.position.set(0, 0.62, -2.65);
      const stripeTopMinus = new THREE.Mesh(stripeGeo, stripeMinus);
      stripeTopMinus.position.set(0, 0.62, -2.52);
      const stripeBotPlus = new THREE.Mesh(stripeGeo, stripePlus);
      stripeBotPlus.position.set(0, 0.62, 2.52);
      const stripeBotMinus = new THREE.Mesh(stripeGeo, stripeMinus);
      stripeBotMinus.position.set(0, 0.62, 2.65);
      bbGroup.add(stripeTopPlus, stripeTopMinus, stripeBotPlus, stripeBotMinus);

      // Hole grid (instanced cylinders)
      const cols = 30;
      const rows = 10;
      const pitchX = 0.35;
      const pitchZ = 0.35;
      const startX = -((cols - 1) * pitchX) / 2;
      const startZ = -((rows - 1) * pitchZ) / 2;
      const holeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16);
      const holeMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9, metalness: 0.05 });
      const holeCount = cols * rows;
      const holes = new THREE.InstancedMesh(holeGeo, holeMat, holeCount);
      holes.name = 'Holes';
      holes.castShadow = false;
      holes.receiveShadow = false;
      holes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      holes.userData.pickType = 'hole';
      bbGroup.add(holes);

      const tmp = new THREE.Object3D();
      const holeIndexToPos = [];
      let k = 0;
      for (let r = 0; r < rows; r++) {
        const z = startZ + r * pitchZ;
        for (let c = 0; c < cols; c++) {
          const x = startX + c * pitchX;
          tmp.position.set(x, 0.55, z);
          tmp.rotation.x = Math.PI / 2;
          tmp.updateMatrix();
          holes.setMatrixAt(k, tmp.matrix);
          holeIndexToPos.push({ col: c, row: r, x, y: 0.55, z });
          k++;
        }
      }
      holes.instanceMatrix.needsUpdate = true;

      // Ghost component preview
      const ghost = new THREE.Group();
      ghost.name = 'Ghost';
      ghost.visible = false;
      bbGroup.add(ghost);

      const ghostMatOk = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.6 });
      const ghostMatBad = new THREE.MeshStandardMaterial({ color: 0xef4444, transparent: true, opacity: 0.35, roughness: 0.6 });
      const ghostBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.25), ghostMatOk);
      ghostBody.castShadow = false;
      ghostBody.receiveShadow = false;
      ghost.add(ghostBody);

      // Components group (actual instances)
      const compGroup = new THREE.Group();
      compGroup.name = 'Components';
      scene.add(compGroup);

      const wireGroup = new THREE.Group();
      wireGroup.name = 'Wires';
      scene.add(wireGroup);

      const selectionRingMat = new THREE.MeshBasicMaterial({ color: 0xff8c42, transparent: true, opacity: 0.9 });
      const selectionRing = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.24, 32), selectionRingMat);
      selectionRing.rotation.x = -Math.PI / 2;
      selectionRing.visible = false;
      scene.add(selectionRing);

      // Orbit controls
      const controls = new OrbitControls(activeCamera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.screenSpacePanning = true;
      controls.target.set(0, 0.25, 0);

      // Prevent page scroll on wheel
      const wheelHandler = (e) => {
        e.preventDefault();
      };
      renderer.domElement.addEventListener('wheel', wheelHandler, { passive: false });

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      function pick(e) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        raycaster.setFromCamera(mouse, activeCamera);

        const hits = raycaster.intersectObjects([holes, compGroup, wireGroup], true);
        if (hits.length > 0) {
          const h = hits[0];
          // Hole instanced
          if (h.object === holes && typeof h.instanceId === 'number') {
            const pos = holeIndexToPos[h.instanceId];
            const label = `${String.fromCharCode(97 + pos.row)}${pos.col + 1}`;
            latestRef.current.setHovered({ kind: 'hole', col: pos.col, row: pos.row, holeLabel: label, world: { x: pos.x, y: pos.y, z: pos.z } });
            return { kind: 'hole', ...pos, label };
          }
          // Component mesh
          if (h.object?.userData?.pickType === 'component') {
            const compId = h.object.userData.compId;
            const def = latestRef.current.defs[h.object.userData.compType];
            latestRef.current.setHovered({ kind: 'component', id: compId, name: def?.name || h.object.userData.compType });
            return { kind: 'component', id: compId };
          }
          // Wire
          if (h.object?.userData?.pickType === 'wire') {
            const wireId = h.object.userData.wireId;
            latestRef.current.setHovered({ kind: 'wire', id: wireId, name: 'Wire' });
            return { kind: 'wire', id: wireId };
          }
        }
        latestRef.current.setHovered(null);
        return null;
      }

      function onPointerMove(e) {
        if (!pickEnabled) return;
        const hit = pick(e);

        // Dragging component: snap to hovered hole (live, no undo spam)
        if (dragRef.current.dragging && hit?.kind === 'hole') {
          const { compId, startCircuit } = dragRef.current;
          const cur = latestRef.current.circuit;
          if (!compId || !startCircuit) return;
          const comp = cur.components?.find((c) => c.id === compId);
          if (!comp) return;
          if (comp.anchor?.col === hit.col && comp.anchor?.row === hit.row) return;
          dragRef.current.moved = true;
          latestRef.current.setCircuit?.({
            ...cur,
            components: cur.components.map((c) => (c.id === compId ? { ...c, anchor: { col: hit.col, row: hit.row } } : c)),
          });
        }

        // Ghost updates while placing
        const { mode: m, placingType: pt } = latestRef.current;
        if (m === 'placing' && pt && hit?.kind === 'hole') {
          ghost.visible = true;
          ghost.position.set(hit.x, 0.78, hit.z);
          const ok = (hit.col >= 0 && hit.col < 30 && hit.row >= 0 && hit.row < 10);
          ghostBody.material = ok ? ghostMatOk : ghostMatBad;
        } else {
          ghost.visible = false;
        }
      }

      function onPointerDown(e) {
        if (!latestRef.current || latestRef.current.simRunning) return;
        const { mode: m } = latestRef.current;

        // Drag component in move mode
        if (m === 'move') {
          const hit = pick(e);
          if (hit?.kind === 'component') {
            dragRef.current = {
              dragging: true,
              compId: hit.id,
              startCircuit: latestRef.current.circuit,
              moved: false,
            };
            controls.enabled = false;
            latestRef.current.setSelected?.({ kind: 'component', id: hit.id });
            return;
          }
        }
        // When not tool-selected: LMB rotates (OrbitControls default).
        // In placing/wire mode, LMB should place; we temporarily disable controls.
        if (m === 'placing' || m === 'wire') {
          controls.enabled = false;
        } else {
          controls.enabled = true;
        }
      }

      function onPointerUp(e) {
        if (!latestRef.current || latestRef.current.simRunning) return;
        if (dragRef.current.dragging) {
          controls.enabled = true;
          if (dragRef.current.moved) {
            // Commit once for undo
            latestRef.current.commit(latestRef.current.circuit);
          }
          dragRef.current = { dragging: false, compId: null, startCircuit: null, moved: false };
          return;
        }
        const hit = pick(e);
        controls.enabled = true;
        if (!hit) return;

        const { mode: m, placingType: pt, defs: curDefs, circuit: curCircuit, commit: doCommit } = latestRef.current;
        // Wire mode (two-click)
        if (m === 'wire' && hit.kind === 'hole') {
          if (!wireDraftRef.current) {
            wireDraftRef.current = { from: { col: hit.col, row: hit.row } };
            return;
          }
          const from = wireDraftRef.current.from;
          wireDraftRef.current = null;
          if (from.col === hit.col && from.row === hit.row) return;
          const id = crypto.randomUUID?.() || `${Date.now()}_${Math.random()}`;
          doCommit({
            ...curCircuit,
            wires: [...(curCircuit.wires || []), { id, from, to: { col: hit.col, row: hit.row }, color: '#3b82f6' }],
          });
          latestRef.current.setSelected?.({ kind: 'wire', id });
          return;
        }

        // Minimal placement: store anchor at grid coordinate (col,row) for now.
        if (m === 'placing' && pt && hit.kind === 'hole') {
          const def = curDefs[pt];
          if (!def) return;
          const id = crypto.randomUUID?.() || `${Date.now()}_${Math.random()}`;
          doCommit({
            ...curCircuit,
            components: [...(curCircuit.components || []), { id, type: pt, value: def.defaultVal || '', anchor: { col: hit.col, row: hit.row }, rot: 0, props: {} }],
          });
          latestRef.current.setSelected?.({ kind: 'component', id });
          return;
        }

        // Selection
        if (hit.kind === 'component') {
          latestRef.current.setSelected?.({ kind: 'component', id: hit.id });
          return;
        }
        if (hit.kind === 'wire') {
          latestRef.current.setSelected?.({ kind: 'wire', id: hit.id });
          return;
        }
        latestRef.current.setSelected?.(null);
      }

      function resize() {
        if (!hostRef.current) return;
        const w = hostRef.current.clientWidth;
        const h = hostRef.current.clientHeight;
        renderer.setSize(w, h);
        cameraPersp.aspect = w / h;
        cameraPersp.updateProjectionMatrix();
        const a = w / h;
        cameraOrtho.left = -orthoSize * a;
        cameraOrtho.right = orthoSize * a;
        cameraOrtho.top = orthoSize;
        cameraOrtho.bottom = -orthoSize;
        cameraOrtho.updateProjectionMatrix();
      }

      const ro = new ResizeObserver(resize);
      ro.observe(host);

      // Preset views
      const onPreset = (e) => {
        const preset = e.detail?.preset;
        if (preset === 1) {
          activeCamera = cameraOrtho;
          controls.object = activeCamera;
          cameraOrtho.position.set(0, 16, 0.001);
          controls.target.set(0, 0, 0);
          controls.enableRotate = false;
        } else if (preset === 2) {
          activeCamera = cameraPersp;
          controls.object = activeCamera;
          cameraPersp.position.set(0, 8, 10);
          controls.target.set(0, 0.25, 0);
          controls.enableRotate = true;
        } else if (preset === 3) {
          activeCamera = cameraPersp;
          controls.object = activeCamera;
          cameraPersp.position.set(0, 2.5, 16);
          controls.target.set(0, 0.25, 0);
          controls.enableRotate = true;
        } else if (preset === 4) {
          // Detail: zoom in to center (later: selected component)
          activeCamera = cameraPersp;
          controls.object = activeCamera;
          cameraPersp.position.set(0, 3.5, 4.5);
          controls.target.set(0, 0.25, 0);
          controls.enableRotate = true;
        }
        controls.update();
      };

      const onFit = () => {
        activeCamera = cameraPersp;
        controls.object = activeCamera;
        cameraPersp.position.set(0, 10, 12);
        controls.target.set(0, 0.25, 0);
        controls.enableRotate = true;
        controls.update();
      };

      window.addEventListener('prototyper:presetView', onPreset);
      window.addEventListener('prototyper:fitToView', onFit);

      let raf = 0;
      let lastCircuitKey = '';
      let lastSelKey = '';
      const wireMatCache = new Map();
      let wirePreviewMesh = null;

      const makeCompMesh = (comp) => {
        const def = defs[comp.type];
        const color = new THREE.Color(def?.color || '#ff8c42');
        const group = new THREE.Group();
        group.userData.pickType = 'component';
        group.userData.compId = comp.id;
        group.userData.compType = comp.type;

        // Procedural placeholder model per type
        if (comp.type.startsWith('led-')) {
          const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.2, 24), new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.7 }));
          base.position.y = 0.86;
          const dome = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 18), new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.55, roughness: 0.2, metalness: 0.0, emissive: 0x000000 }));
          dome.position.y = 1.02;
          const leadMat = new THREE.MeshStandardMaterial({ color: 0xbababa, roughness: 0.3, metalness: 0.8 });
          const leadGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 10);
          const l1 = new THREE.Mesh(leadGeo, leadMat);
          l1.position.set(-0.08, 0.62, 0);
          const l2 = new THREE.Mesh(leadGeo, leadMat);
          l2.position.set(0.08, 0.62, 0);
          group.add(base, dome, l1, l2);
          // Store dome for emissive updates
          dome.userData.ledDome = true;
        } else if (comp.type.startsWith('resistor')) {
          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 20), new THREE.MeshStandardMaterial({ color: 0xc9935a, roughness: 0.8 }));
          body.rotation.z = Math.PI / 2;
          body.position.y = 0.85;
          const leadMat = new THREE.MeshStandardMaterial({ color: 0xbababa, roughness: 0.3, metalness: 0.8 });
          const leadGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.9, 10);
          const l1 = new THREE.Mesh(leadGeo, leadMat);
          l1.rotation.z = Math.PI / 2;
          l1.position.set(-0.55, 0.75, 0);
          const l2 = new THREE.Mesh(leadGeo, leadMat);
          l2.rotation.z = Math.PI / 2;
          l2.position.set(0.55, 0.75, 0);
          group.add(body, l1, l2);
        } else {
          const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.35), new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
          box.position.y = 0.85;
          group.add(box);
        }

        // Ensure pick works
        group.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = false;
            o.userData.pickType = 'component';
            o.userData.compId = comp.id;
            o.userData.compType = comp.type;
          }
        });
        return group;
      };

      const rebuildSceneFromCircuit = () => {
        // Components
        compGroup.clear();
        for (const comp of circuit.components || []) {
          const mesh = makeCompMesh(comp);
          const anchor = comp.anchor || { col: 0, row: 0 };
          const x = startX + anchor.col * pitchX;
          const z = startZ + anchor.row * pitchZ;
          mesh.position.set(x, 0, z);
          mesh.rotation.y = ((comp.rot || 0) * Math.PI) / 180;
          compGroup.add(mesh);
        }

        // Wires (TubeGeometry with sag)
        wireGroup.clear();
        for (const w of circuit.wires || []) {
          if (!w.from || !w.to) continue;
          const ax = startX + w.from.col * pitchX;
          const az = startZ + w.from.row * pitchZ;
          const bx = startX + w.to.col * pitchX;
          const bz = startZ + w.to.row * pitchZ;
          const dx = bx - ax;
          const dz = bz - az;
          const len = Math.hypot(dx, dz);

          const midY = 1.0 + Math.min(1.2, 0.25 + len * 0.35);
          const p0 = new THREE.Vector3(ax, 0.78, az);
          const p1 = new THREE.Vector3((ax + bx) / 2, midY, (az + bz) / 2);
          const p2 = new THREE.Vector3(bx, 0.78, bz);
          const curve = new THREE.CatmullRomCurve3([p0, p1, p2]);
          const geo = new THREE.TubeGeometry(curve, 32, 0.045, 10, false);

          const colorHex = (w.color || '#3b82f6').toLowerCase();
          const mat = wireMatCache.get(colorHex) || new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex), roughness: 0.35, metalness: 0.05 });
          wireMatCache.set(colorHex, mat);

          const mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = false;
          mesh.userData.pickType = 'wire';
          mesh.userData.wireId = w.id;
          wireGroup.add(mesh);
        }
      };

      const tick = () => {
        raf = requestAnimationFrame(tick);
        controls.enabled = mode === 'move';
        controls.update();

        // Rebuild if circuit changed (cheap key)
        const circuitKey = `${(circuit.components || []).length}:${(circuit.wires || []).length}:${(circuit.components || []).map((c) => c.id).join(',')}:${(circuit.wires || []).map((w) => w.id).join(',')}`;
        if (circuitKey !== lastCircuitKey) {
          rebuildSceneFromCircuit();
          lastCircuitKey = circuitKey;
        }

        // Update selection ring
        const selKey = selected ? `${selected.kind}:${selected.id}` : '';
        if (selKey !== lastSelKey) {
          selectionRing.visible = false;
          if (selected?.kind === 'component') {
            const m = compGroup.children.find((x) => x.userData?.compId === selected.id);
            if (m) {
              selectionRing.position.set(m.position.x, 0.58, m.position.z);
              selectionRing.visible = true;
            }
          }
          lastSelKey = selKey;
        }

        // Sim visuals: LED emissive
        const curSim = latestRef.current.sim;
        if (curSim?.elementStates && compGroup.children.length) {
          for (const g of compGroup.children) {
            const id = g.userData?.compId;
            if (!id) continue;
            const st = curSim.elementStates.get(id);
            if (!st) continue;
            g.traverse((o) => {
              if (o.isMesh && o.userData?.ledDome && o.material?.emissive) {
                const b = st.powered ? (st.brightness || 0) : 0;
                o.material.emissive.setHex(0x000000);
                if (b > 0) {
                  o.material.emissive.setStyle(o.material.color.getStyle());
                  o.material.emissiveIntensity = 0.2 + 1.2 * b;
                } else {
                  o.material.emissiveIntensity = 0.0;
                }
              }
            });
          }
        }

        // Wire preview while drafting
        const { mode: m, hovered: hv } = latestRef.current;
        if (m === 'wire' && wireDraftRef.current?.from && hv?.kind === 'hole') {
          const from = wireDraftRef.current.from;
          const ax = startX + from.col * pitchX;
          const az = startZ + from.row * pitchZ;
          const bx = startX + hv.col * pitchX;
          const bz = startZ + hv.row * pitchZ;
          const len = Math.hypot(bx - ax, bz - az);
          const midY = 1.0 + Math.min(1.2, 0.25 + len * 0.35);
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(ax, 0.78, az),
            new THREE.Vector3((ax + bx) / 2, midY, (az + bz) / 2),
            new THREE.Vector3(bx, 0.78, bz),
          ]);
          const geo = new THREE.TubeGeometry(curve, 24, 0.04, 10, false);
          const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#ff8c42'), transparent: true, opacity: 0.65, roughness: 0.35, metalness: 0.0 });
          if (wirePreviewMesh) {
            wirePreviewMesh.geometry.dispose?.();
            wirePreviewMesh.geometry = geo;
          } else {
            wirePreviewMesh = new THREE.Mesh(geo, mat);
            wirePreviewMesh.castShadow = false;
            wirePreviewMesh.userData.preview = true;
            wireGroup.add(wirePreviewMesh);
          }
        } else if (wirePreviewMesh) {
          wireGroup.remove(wirePreviewMesh);
          wirePreviewMesh.geometry.dispose?.();
          wirePreviewMesh = null;
        }

        renderer.render(scene, activeCamera);
      };
      tick();

      threeRef.current = { THREE, renderer, scene, cameraPersp, cameraOrtho, get activeCamera() { return activeCamera; }, controls, holes, holeIndexToPos };

      cleanup = () => {
        window.removeEventListener('prototyper:presetView', onPreset);
        window.removeEventListener('prototyper:fitToView', onFit);
        renderer.domElement.removeEventListener('wheel', wheelHandler);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.dispose();
        host.removeChild(renderer.domElement);
      };

      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointerup', onPointerUp);
    })();

    return () => {
      mounted = false;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0">
      <div ref={hostRef} className="w-full h-full" />
      {!isInteractive && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="px-3 py-2 rounded-xl border text-xs font-bold"
            style={{ background: 'rgba(0,0,0,0.35)', borderColor: 'var(--sc-border)', color: 'var(--sc-dim)', backdropFilter: 'blur(8px)' }}>
            Simulation running — editing disabled
          </div>
        </div>
      )}
    </div>
  );
}

function getCssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name)?.trim();
  return v || fallback;
}

