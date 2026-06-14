import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CATEGORIES } from './catalog.js';
import { TRUCK, SECTION_IDS, totalsOf } from './planModel.js';

const { length: L, width: W, height: H } = TRUCK;
const SECTION_LEN = L / 4;
const LAYER_H = H / 3;
const Y_INDEX = { piso: 0, medio: 1, superior: 2 };

// Etiqueta de texto como sprite (siempre mira a la cámara).
function crearEtiqueta(texto) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(58,44,29,0.88)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(4, 4, 248, 56, 12);
  else ctx.rect(4, 4, 248, 56);
  ctx.fill();
  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, 128, 34);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(1.6, 0.4, 1);
  sprite.renderOrder = 10;
  return sprite;
}

// Posición central de una sección en el eje X (cabina a la izquierda, puerta a la derecha).
function centerXDeSeccion(id) {
  const slot = 4 - id; // S4=cabina (slot 0) … S1=puerta (slot 3)
  return -L / 2 + SECTION_LEN * (slot + 0.5);
}

export default function Truck3D({ plan, destinos }) {
  const mountRef = useRef(null);
  const tres = useRef({});

  // ── Montaje: escena, cámara, luces, contorno del camión, controles ─────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(L * 0.95, H * 2.1, W * 2.6);
    camera.lookAt(0, H / 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(6, 10, 7);
    scene.add(dir);

    // Piso de la caja
    const piso = new THREE.Mesh(
      new THREE.PlaneGeometry(L, W),
      new THREE.MeshStandardMaterial({ color: 0xcDB892, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
    );
    piso.rotation.x = -Math.PI / 2;
    piso.position.y = 0.001;
    scene.add(piso);

    // Contorno de la caja (alambre)
    const box = new THREE.BoxGeometry(L, H, W);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(box),
      new THREE.LineBasicMaterial({ color: 0x6b4c2a })
    );
    edges.position.set(0, H / 2, 0);
    scene.add(edges);

    // Pared de la cabina (marca el frente)
    const cabina = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshStandardMaterial({ color: 0x8a5a2b, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    cabina.rotation.y = Math.PI / 2;
    cabina.position.set(-L / 2, H / 2, 0);
    scene.add(cabina);

    // Divisiones virtuales entre secciones (líneas en el piso)
    for (let i = 1; i < 4; i++) {
      const x = -L / 2 + SECTION_LEN * i;
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.01, -W / 2),
        new THREE.Vector3(x, 0.01, W / 2),
      ]);
      scene.add(new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0x8a7355, dashSize: 0.2, gapSize: 0.15 })).computeLineDistances());
    }

    const cargoGroup = new THREE.Group();
    scene.add(cargoGroup);

    const labelGroup = new THREE.Group();
    scene.add(labelGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, H / 2, 0);
    controls.minDistance = 4;
    controls.maxDistance = 30;

    let raf;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth || 600;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    tres.current = { scene, camera, renderer, controls, cargoGroup, labelGroup };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
        }
      });
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      tres.current = {};
    };
  }, []);

  // ── Reconstruir la carga y etiquetas cuando cambia el plan ─────────────────
  useEffect(() => {
    const t = tres.current;
    if (!t.cargoGroup) return;

    const vaciar = (group) => {
      while (group.children.length) {
        const o = group.children.pop();
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
        }
      }
    };
    vaciar(t.cargoGroup);
    vaciar(t.labelGroup);

    const capCelda = SECTION_LEN * W * LAYER_H; // capacidad geométrica de una celda

    for (const id of SECTION_IDS) {
      const cx = centerXDeSeccion(id);

      // Etiqueta de la sección
      const stop = (destinos && destinos[id - 1]) || '';
      const etiqueta = crearEtiqueta(`S${id}${stop ? ' · ' + stop : ''}`);
      etiqueta.position.set(cx, H + 0.5, 0);
      t.labelGroup.add(etiqueta);

      for (const capa of ['piso', 'medio', 'superior']) {
        const items = plan[id][capa];
        if (!items || items.length === 0) continue;
        const vol = totalsOf(items).volume;
        if (vol <= 0) continue;

        const frac = Math.max(0.18, Math.min(vol / capCelda, 0.97));
        const boxH = LAYER_H * frac;
        const yBase = LAYER_H * Y_INDEX[capa];

        const color = CATEGORIES[items[0].category]?.swatch || '#888888';
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(SECTION_LEN * 0.86, boxH, W * 0.86),
          new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.92 })
        );
        mesh.position.set(cx, yBase + boxH / 2, 0);
        t.cargoGroup.add(mesh);

        const wire = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry),
          new THREE.LineBasicMaterial({ color: 0x3a2c1d, transparent: true, opacity: 0.3 })
        );
        wire.position.copy(mesh.position);
        t.cargoGroup.add(wire);
      }
    }
  }, [plan, destinos]);

  return (
    <div className="bg-white/60 border-2 border-[#8a5a2b] rounded-2xl p-3 sm:p-4 mb-4">
      <div ref={mountRef} className="w-full" style={{ height: 380 }} />
      <p className="text-[11px] sm:text-xs text-[#8a7355] mt-2 text-center">
        Arrastra para girar · rueda/pellizco para acercar · la pared marrón es la cabina (S4); la puerta queda al otro extremo (S1).
        La altura de cada bloque representa cuánto espacio ocupa la carga en esa celda.
      </p>
    </div>
  );
}
