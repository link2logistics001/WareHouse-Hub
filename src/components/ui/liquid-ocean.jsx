"use client";
import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export const LiquidOcean = ({ children, className }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.offsetWidth;
    const h = container.offsetHeight;

    const scene = new THREE.Scene();

    const BG_COLOR = 0x020c1b;
    scene.background = new THREE.Color(BG_COLOR);
    // Exponential fog — tight, so back rows dissolve fast
    scene.fog = new THREE.FogExp2(BG_COLOR, 0.07);

    // Narrow FOV = more compressed / cinematic, like the reference
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "0";
    container.appendChild(canvas);

    // ── Ground plane ─────────────────────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x030f26,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3.2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Boxes ─────────────────────────────────────────────────────
    // Wider grid so it fills the screen edge to edge
    const BOX_W = 2.0;
    const GAP   = 0.1;
    const STEP  = BOX_W + GAP;
    const COLS  = 14;
    const ROWS  = 14;

    const boxes = [];
    const group = new THREE.Group();

    const topColor  = new THREE.Color(0x2277ee);  // bright blue top
    const sideColor = new THREE.Color(0x0a2a66);  // dark navy sides
    const botColor  = new THREE.Color(0x040e22);  // near-black base

    for (let xi = 0; xi < COLS; xi++) {
      for (let zi = 0; zi < ROWS; zi++) {
        const geo     = new THREE.BoxGeometry(BOX_W, BOX_W, BOX_W);
        const posAttr = geo.attributes.position;
        const colors  = new Float32Array(posAttr.count * 3);

        for (let vi = 0; vi < posAttr.count; vi++) {
          const y = posAttr.getY(vi);
          const c = y > 0.3 ? topColor : y > -0.3 ? sideColor : botColor;
          colors[vi * 3]     = c.r;
          colors[vi * 3 + 1] = c.g;
          colors[vi * 3 + 2] = c.b;
        }
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness:    0.3,
          metalness:    0.6,
          flatShading:  true,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
        mesh.position.set(
          (xi - COLS / 2) * STEP,
          0,
          (zi - ROWS / 2) * STEP
        );
        group.add(mesh);
        boxes.push(mesh);
      }
    }
    scene.add(group);

    // ── Lighting ─────────────────────────────────────────────────
    // Strong overhead key — bright tops like the reference
    const keyLight = new THREE.DirectionalLight(0x99ccff, 7.0);
    keyLight.position.set(2, 30, 6);
    keyLight.castShadow = true;
    keyLight.shadow.camera.near   = 0.1;
    keyLight.shadow.camera.far    = 80;
    keyLight.shadow.camera.left   = keyLight.shadow.camera.bottom = -40;
    keyLight.shadow.camera.right  = keyLight.shadow.camera.top    = 40;
    keyLight.shadow.mapSize.set(2048, 2048);
    scene.add(keyLight);

    // Left rim — blue edge glow
    const rimLight = new THREE.DirectionalLight(0x1155cc, 3.5);
    rimLight.position.set(-15, 5, -8);
    scene.add(rimLight);

    // Front accent — subtle warm blue at ground level
    const frontLight = new THREE.PointLight(0x1a44bb, 5.0, 35);
    frontLight.position.set(0, -1, 8);
    scene.add(frontLight);

    scene.add(new THREE.AmbientLight(0x060e1e, 6));

    // ── CAMERA — the key to the pink reference look ───────────────
    // Very low, close to the front row, looking slightly upward
    // This makes boxes TOWER above you and fills the screen dramatically
    camera.position.set(0, 1.5, 11);
    camera.lookAt(0, 2.5, -5);   // look UP into the box field

    // ── Animation — slow fluid wave ──────────────────────────────
    let animId;
    const animate = (time) => {
      const t = time * 0.001;
      boxes.forEach((box) => {
        const px = box.position.x;
        const pz = box.position.z;
        const wave =
          Math.sin(px * 0.4 + t * 0.32) *
          Math.cos(pz * 0.4 + t * 0.25) * 3.5;
        box.position.y = wave;
        box.scale.y    = Math.max(0.1, 1.0 + wave * 0.7);
      });
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      const nw = container.offsetWidth;
      const nh = container.offsetHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener("resize", handleResize);
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      if (container.contains(canvas)) container.removeChild(canvas);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${className ?? ""}`}
      style={{ isolation: "isolate" }}
    >
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};