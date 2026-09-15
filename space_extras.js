/* ============================================================================
   space_extras.js — ЧАСТЬ 1 (v2): объёмный космос.
   ----------------------------------------------------------------------------
   v2:
     - УБРАНЫ КОМЕТЫ (слишком быстрые/мельтешащие).
     - Мир ЗНАЧИТЕЛЬНО больше: объекты унесены на 18k–42k, пояс шире.
     - ОБЪЁМ: многослойные туманности-спрайты, глубина по Z, туманный «пол».
     - КРАСОТА: планеты с кольцами и атмосферой, мерцающие пульсары,
       пылевые облака, далёкие галактики-спрайты.

   Грузится ПОСЛЕ space.js, видит его top-level const (scene, camera, THREE, isMobile).
   ОПТИМИЗАЦИЯ: общие геометрии/материалы, лимиты на мобиле, update() без аллокаций.
   ========================================================================== */
(function () {
  'use strict';

  if (typeof THREE === 'undefined' || typeof scene === 'undefined') {
    console.warn('[space_extras] THREE/scene не найдены — пропуск');
    return;
  }

  var MOBILE = (typeof isMobile !== 'undefined') ? isMobile : false;

  // Общие геометрии (переиспользование = меньше GC)
  var GEO = {
    sphere8:  new THREE.SphereGeometry(1, 8, 8),
    sphere12: new THREE.SphereGeometry(1, 12, 12),
    sphere20: new THREE.SphereGeometry(1, 20, 20),
    box:      new THREE.BoxGeometry(1, 1, 1),
    cyl6:     new THREE.CylinderGeometry(1, 1, 1, 6),
    ring:     new THREE.RingGeometry(1, 1.7, 48),
    dodeca:   new THREE.DodecahedronGeometry(1, 0)
  };
  function mat(color, opts) {
    var o = opts || {};
    o.color = color;
    return new THREE.MeshBasicMaterial(o);
  }

  // Радиальный спрайт-градиент (гало/свечение/туманность)
  function glowTexture(stops) {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }

  // Рваная текстура туманности (пятна + маска)
  function nebulaTexture(c1, c2) {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var x = c.getContext('2d');
    for (var i = 0; i < 70; i++) {
      var a = Math.random() * 6.283, r0 = Math.random() * 78;
      var px = 128 + Math.cos(a) * r0, py = 128 + Math.sin(a) * r0;
      var pr = 20 + Math.random() * 46;
      var g = x.createRadialGradient(px, py, 0, px, py, pr);
      var col = Math.random() > 0.5 ? c1 : c2;
      g.addColorStop(0, col + '55');
      g.addColorStop(0.55, col + '18');
      g.addColorStop(1, col + '00');
      x.fillStyle = g;
      x.beginPath(); x.arc(px, py, pr, 0, 6.283); x.fill();
    }
    // звёздная пыль
    for (var s = 0; s < 140; s++) {
      var aa = Math.random() * 6.283, rr = Math.random() * 96;
      x.fillStyle = 'rgba(255,255,255,' + (0.25 + Math.random() * 0.6).toFixed(2) + ')';
      var ss = Math.random() * 1.7 + 0.3;
      x.fillRect(128 + Math.cos(aa) * rr, 128 + Math.sin(aa) * rr, ss, ss);
    }
    x.globalCompositeOperation = 'destination-in';
    var m = x.createRadialGradient(128, 128, 18, 128, 128, 126);
    m.addColorStop(0, 'rgba(0,0,0,1)');
    m.addColorStop(0.6, 'rgba(0,0,0,.7)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = m; x.fillRect(0, 0, 256, 256);
    x.globalCompositeOperation = 'source-over';
    return new THREE.CanvasTexture(c);
  }

  // Процедурная текстура планеты (полосы/пятна)
  function planetTexture(base, accent, bands) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    var x = c.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, 256, 128);
    var i;
    if (bands) {
      for (i = 0; i < 16; i++) {
        x.globalAlpha = 0.10 + Math.random() * 0.25;
        x.fillStyle = accent;
        x.fillRect(0, Math.random() * 128, 256, 2 + Math.random() * 9);
      }
    } else {
      for (i = 0; i < 46; i++) {
        x.globalAlpha = 0.08 + Math.random() * 0.30;
        x.fillStyle = accent;
        x.beginPath();
        x.arc(Math.random() * 256, Math.random() * 128, 3 + Math.random() * 18, 0, 6.283);
        x.fill();
      }
    }
    x.globalAlpha = 1;
    return new THREE.CanvasTexture(c);
  }

  function collectMats(obj) {
    var out = [];
    obj.traverse(function (n) {
      if (!n.material) return;
      var ms = Array.isArray(n.material) ? n.material : [n.material];
      for (var i = 0; i < ms.length; i++) {
        if (!ms[i]) continue;
        ms[i].transparent = true;
        out.push(ms[i]);
      }
    });
    obj.userData.mats = out;
    return out;
  }

  var distant = [];   // плавное появление + параллакс
  var pulsars = [];
  var spinners = [];
  var drifts = [];    // медленно плывущие туманности

  // ==========================================================================
  //  1. ПУЛЬСАРЫ (медленная глубокая пульсация)
  // ==========================================================================
  (function buildPulsars() {
    var palette = [0x9fd8ff, 0xc9a6ff, 0xffd0a0, 0x9fffe0];
    var count = MOBILE ? 3 : 6;
    var haloTex = glowTexture([[0, 'rgba(255,255,255,.95)'], [0.35, 'rgba(160,200,255,.35)'], [1, 'rgba(0,0,0,0)']]);

    for (var i = 0; i < count; i++) {
      var g = new THREE.Group();
      var col = palette[i % palette.length];

      var core = new THREE.Mesh(GEO.sphere8, mat(0xffffff));
      core.scale.setScalar(16 + Math.random() * 14);
      g.add(core);

      var halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: haloTex, color: col, blending: THREE.AdditiveBlending,
        depthWrite: false, transparent: true, opacity: 0.85
      }));
      halo.scale.setScalar(260 + Math.random() * 180);
      g.add(halo);

      var a = Math.random() * 6.283, r = 20000 + Math.random() * 16000;
      g.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 12000, Math.sin(a) * r);
      collectMats(g);
      g.userData.kind = 'pulsar';
      g.userData.phase = Math.random() * 6.283;
      g.userData.speed = 0.18 + Math.random() * 0.25; // медленно
      g.userData.halo = halo;
      g.userData.core = core;
      g.userData.haloBase = halo.scale.x;
      scene.add(g);
      pulsars.push(g);
      distant.push(g);
    }
  })();

  // ==========================================================================
  //  2. ОБЪЁМНЫЕ ТУМАННОСТИ (многослойные спрайты, медленный дрейф)
  // ==========================================================================
  (function buildNebulae() {
    var cfgs = [
      { pos: [26000, 3000, -30000], size: 14000, c1: '#ff5b8a', c2: '#b04dff' },
      { pos: [-32000, 2000, -24000], size: 11000, c1: '#4fa8ff', c2: '#37e0c8' },
      { pos: [6000, -5000, 38000], size: 13000, c1: '#7dff8f', c2: '#ffe45b' },
      { pos: [-18000, 6000, 28000], size: 9000, c1: '#ff8f5b', c2: '#ff5bd0' }
    ];
    var n = MOBILE ? 2 : cfgs.length;
    for (var i = 0; i < n; i++) {
      var cfg = cfgs[i];
      var grp = new THREE.Group();
      grp.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);

      var tex = nebulaTexture(cfg.c1, cfg.c2);
      // 3 слоя на разной глубине — даёт объём
      var layers = MOBILE ? 2 : 3;
      for (var L = 0; L < layers; L++) {
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({
          map: tex, blending: THREE.AdditiveBlending, depthWrite: false,
          transparent: true, opacity: 0.35 - L * 0.08, rotation: Math.random() * 6.283
        }));
        var sc = cfg.size * (1 - L * 0.18);
        sp.scale.set(sc, sc * (0.7 + Math.random() * 0.4), 1);
        sp.position.z = -L * cfg.size * 0.12;
        grp.add(sp);
      }
      grp.userData.kind = 'nebula';
      grp.userData.drift = 0.00004 + Math.random() * 0.00005;
      scene.add(grp);
      drifts.push(grp);
      distant.push(grp);
      collectMats(grp);
      grp.userData.noFade = true; // туманности не мигают
    }
  })();

  // ==========================================================================
  //  3. ДАЛЁКИЕ ГАЛАКТИКИ (спрайты-диски)
  // ==========================================================================
  (function buildGalaxies() {
    var n = MOBILE ? 4 : 9;
    var texes = [
      glowTexture([[0, 'rgba(255,240,220,.9)'], [0.3, 'rgba(200,160,255,.35)'], [1, 'rgba(0,0,0,0)']]),
      glowTexture([[0, 'rgba(220,240,255,.9)'], [0.3, 'rgba(120,180,255,.3)'], [1, 'rgba(0,0,0,0)']])
    ];
    for (var i = 0; i < n; i++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texes[i % texes.length], blending: THREE.AdditiveBlending,
        depthWrite: false, transparent: true, opacity: 0.5, rotation: Math.random() * 6.283
      }));
      var sc = 4000 + Math.random() * 6000;
      sp.scale.set(sc, sc * 0.5, 1);
      var a = Math.random() * 6.283, r = 30000 + Math.random() * 16000;
      sp.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 20000, Math.sin(a) * r);
      sp.userData.kind = 'galaxy';
      scene.add(sp);
      distant.push(sp);
      collectMats(sp);
      sp.userData.noFade = true;
    }
  })();

  // ==========================================================================
  //  4. ОБЛОМКИ И СПУТНИКИ
  // ==========================================================================
  (function buildDebris() {
    var count = MOBILE ? 10 : 22;
    var cols = [0x8a94a0, 0x6e7884, 0xa8b2be];
    var panelMat = mat(0x2a4a8a, { side: THREE.DoubleSide });
    for (var i = 0; i < count; i++) {
      var g = new THREE.Group();
      if (i % 4 === 0) {
        var body = new THREE.Mesh(GEO.box, mat(cols[i % 3]));
        body.scale.set(12, 8, 9); g.add(body);
        var p1 = new THREE.Mesh(GEO.box, panelMat); p1.scale.set(30, 0.8, 11); p1.position.x = 21; g.add(p1);
        var p2 = new THREE.Mesh(GEO.box, panelMat); p2.scale.set(30, 0.8, 11); p2.position.x = -21; g.add(p2);
        var ant = new THREE.Mesh(GEO.cyl6, mat(0xb8c2cc)); ant.scale.set(0.4, 14, 0.4); ant.position.y = 10; g.add(ant);
      } else {
        var pieces = 2 + Math.floor(Math.random() * 3);
        for (var p = 0; p < pieces; p++) {
          var m = new THREE.Mesh(GEO.dodeca, mat(cols[(i + p) % 3]));
          m.scale.setScalar(4 + Math.random() * 9);
          m.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
          m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
          g.add(m);
        }
      }
      var a = Math.random() * 6.283, r = 8000 + Math.random() * 26000;
      g.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 16000, Math.sin(a) * r);
      g.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      collectMats(g);
      g.userData.kind = 'debris';
      g.userData.spin = new THREE.Vector3((Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.006);
      scene.add(g);
      spinners.push(g);
      distant.push(g);
    }
  })();

  // ==========================================================================
  //  5. ПЛАНЕТЫ (с кольцами и атмосферой), дальше и крупнее
  // ==========================================================================
  (function buildPlanets() {
    var cfgs = [
      { c1: '#c96b3a', c2: '#7a3d1e', bands: false, size: 320, dist: 9000, speed: 0.00022, ring: false },
      { c1: '#3f6fc9', c2: '#1e3d7a', bands: true,  size: 420, dist: 13000, speed: 0.00016, ring: true },
      { c1: '#3ac9a0', c2: '#1e7a63', bands: false, size: 260, dist: 7000, speed: 0.00026, ring: false },
      { c1: '#d9c46a', c2: '#8a7524', bands: true,  size: 520, dist: 16000, speed: 0.00012, ring: true },
      { c1: '#a05ad9', c2: '#5a2a8a', bands: false, size: 350, dist: 11500, speed: 0.00020, ring: false },
      { c1: '#5bd9c9', c2: '#1e6a7a', bands: true,  size: 300, dist: 8200, speed: 0.00024, ring: false }
    ];
    var n = MOBILE ? 4 : cfgs.length;
    for (var i = 0; i < n; i++) {
      var cfg = cfgs[i];
      var pivot = new THREE.Group();
      pivot.rotation.x = (Math.random() - 0.5) * 0.7;
      pivot.rotation.z = (Math.random() - 0.5) * 0.7;

      var planet = new THREE.Mesh(
        new THREE.SphereGeometry(cfg.size, MOBILE ? 20 : 32, MOBILE ? 14 : 24),
        new THREE.MeshBasicMaterial({ map: planetTexture(cfg.c1, cfg.c2, cfg.bands) })
      );
      planet.position.x = cfg.dist;
      pivot.add(planet);

      // Атмосферное гало
      var halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture([[0, 'rgba(255,255,255,.4)'], [0.4, 'rgba(170,210,255,.16)'], [1, 'rgba(0,0,0,0)']]),
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55
      }));
      halo.scale.setScalar(cfg.size * 3.0);
      planet.add(halo);

      // Кольцо
      if (cfg.ring) {
        var ring = new THREE.Mesh(GEO.ring, mat(0xd8c9a0, {
          transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false
        }));
        ring.scale.setScalar(cfg.size * 1.9);
        ring.rotation.x = Math.PI / 2.35;
        planet.add(ring);
      }

      pivot.userData.speed = cfg.speed * (Math.random() > 0.5 ? 1 : -1);
      pivot.userData.planet = planet;
      pivot.userData.kind = 'planetPivot';
      pivot.userData.noFade = true;

      var a = Math.random() * 6.283, r = 16000 + Math.random() * 14000;
      pivot.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 9000, Math.sin(a) * r);
      scene.add(pivot);
      spinners.push(pivot);
      distant.push(pivot);
    }
  })();

  // ==========================================================================
  //  6. ПОЯС АСТЕРОИДОВ (шире и дальше, InstancedMesh)
  // ==========================================================================
  (function buildBelt() {
    if (!THREE.InstancedMesh) return;
    var COUNT = MOBILE ? 120 : 320;
    var geo = new THREE.DodecahedronGeometry(1, 0);
    var m = new THREE.MeshBasicMaterial({ color: 0x8a7a6a });
    var belt = new THREE.InstancedMesh(geo, m, COUNT);
    var dummy = new THREE.Object3D();
    var inner = 26000, outer = 42000;

    for (var i = 0; i < COUNT; i++) {
      var a = Math.random() * 6.283;
      var r = inner + Math.random() * (outer - inner);
      dummy.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 2600, Math.sin(a) * r);
      var s = 20 + Math.random() * 70;
      dummy.scale.set(s, s * (0.6 + Math.random() * 0.6), s);
      dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      dummy.updateMatrix();
      belt.setMatrixAt(i, dummy.matrix);
    }
    belt.instanceMatrix.needsUpdate = true;
    belt.userData.kind = 'belt';
    belt.userData.spin = 0.000035;
    scene.add(belt);
    spinners.push(belt);
  })();

  // ==========================================================================
  //  UPDATE
  // ==========================================================================
  var last = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  var parallaxPrev = new THREE.Vector3();
  var parallaxCur = new THREE.Vector3();

  function update() {
    var t = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    var dt = Math.min(50, t - last);
    last = t;
    var time = t * 0.001;
    var i;

    // Пульсары — медленное дыхание
    for (i = 0; i < pulsars.length; i++) {
      var p = pulsars[i];
      var k = 0.5 + 0.5 * Math.sin(time * p.userData.speed + p.userData.phase);
      p.userData.halo.scale.setScalar(p.userData.haloBase * (0.85 + k * 0.3));
      p.userData.core.scale.setScalar(16 + 14 * k);
      p.rotation.y += 0.0015;
    }

    // Туманности — дрейф
    for (i = 0; i < drifts.length; i++) {
      drifts[i].rotation.z += drifts[i].userData.drift;
    }

    // Вращение
    for (i = 0; i < spinners.length; i++) {
      var o = spinners[i];
      if (o.userData.kind === 'planetPivot') {
        o.rotation.y += o.userData.speed * (dt / 16.67);
        if (o.userData.planet) o.userData.planet.rotation.y += 0.002;
      } else if (o.userData.kind === 'belt') {
        o.rotation.y += o.userData.spin * dt;
      } else if (o.userData.spin && o.userData.spin.isVector3) {
        o.rotation.x += o.userData.spin.x;
        o.rotation.y += o.userData.spin.y;
        o.rotation.z += o.userData.spin.z;
      }
    }

    // Плавное появление + параллакс
    parallaxCur.copy(camera.position);
    var camX = camera.position.x, camY = camera.position.y, camZ = camera.position.z;
    for (i = 0; i < distant.length; i++) {
      var obj = distant[i];
      if (obj.userData.noFade) continue;
      var dx = obj.position.x - camX, dy = obj.position.y - camY, dz = obj.position.z - camZ;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      var appear = Math.max(0, Math.min(1, (60000 - dist) / 24000));
      var mats = obj.userData.mats;
      if (mats) {
        for (var mi = 0; mi < mats.length; mi++) {
          if (!mats[mi].userData) mats[mi].userData = {};
          if (mats[mi].userData.__base === undefined) mats[mi].userData.__base = 1;
          mats[mi].opacity = mats[mi].userData.__base * appear;
        }
      }
      obj.position.x += (camX - parallaxPrev.x) * 0.018;
      obj.position.y += (camY - parallaxPrev.y) * 0.018;
      obj.position.z += (camZ - parallaxPrev.z) * 0.018;
    }
    parallaxPrev.copy(parallaxCur);
  }

  window.__spaceExtras = {
    update: update,
    counts: { pulsars: pulsars.length, nebulae: drifts.length, debris: spinners.length, distant: distant.length }
  };

  console.log('[space_extras] v2 загружено:', window.__spaceExtras.counts);
})();
