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
  //  7. ДАЛЬНИЙ ОБЪЁМНЫЙ КОСМОС v3 — 20 детальных объектов + пиксель-зона
  //     Все объекты уходят на 110k..300k, живут в существующих массивах
  //     distant (появление+параллакс) и spinners (вращение) — ноль нового кода в update.
  // ==========================================================================
  var deepObjs = [];
  var anim = [];
  var R_MIN = 110000, R_MAX = 300000;

  var G2 = {
    octa:  new THREE.OctahedronGeometry(1, 0),
    tetra: new THREE.TetrahedronGeometry(1, 0),
    torus: new THREE.TorusGeometry(1, 0.26, 8, 30),
    cone:  new THREE.ConeGeometry(1, 1, 8),
    cyl:   new THREE.CylinderGeometry(1, 1, 1, 10),
    plane: new THREE.PlaneGeometry(1, 1),
    hex:   new THREE.CylinderGeometry(1, 1, 0.14, 6)
  };

  function farPos(ySpread) {
    var a = Math.random() * 6.283;
    var r = R_MIN + Math.random() * (R_MAX - R_MIN);
    return new THREE.Vector3(Math.cos(a) * r, (Math.random() - 0.5) * (ySpread || 90000), Math.sin(a) * r);
  }
  function halo(scale, stops, op) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(stops), blending: THREE.AdditiveBlending,
      depthWrite: false, transparent: true, opacity: op === undefined ? 0.8 : op
    }));
    s.scale.setScalar(scale);
    return s;
  }
  function reg(g, spin, kind, hitR) {
    collectMats(g);
    if (spin) { g.userData.spin = spin; spinners.push(g); }
    if (kind) g.userData.kind = kind;
    // радиус для быстрого пикинга (без traverse по тысячам мешей)
    g.userData.hitR = hitR || 3000;
    g.userData.fxName = kind;
    scene.add(g); deepObjs.push(g); distant.push(g);
    return g;
  }
  function pixelTex(cols, size) {
    var n = size || 16;
    var c = document.createElement('canvas');
    c.width = c.height = n;
    var x = c.getContext('2d');
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        x.fillStyle = cols[(i * 7 + j * 13 + ((i * j) % 5)) % cols.length];
        x.fillRect(i, j, 1, 1);
      }
    }
    var t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    return t;
  }

  /* ---- 1. КОЛЬЦЕВОЙ МИР ------------------------------------------------ */
  (function () {
    var g = new THREE.Group(), Rr = 9000;
    var main = new THREE.Mesh(new THREE.TorusGeometry(Rr, 430, 10, 72), mat(0x7d8ba8, { side: THREE.DoubleSide }));
    main.rotation.x = Math.PI / 2; g.add(main);
    var land = new THREE.Mesh(new THREE.TorusGeometry(Rr, 370, 4, 72), mat(0x3f8f6f, { side: THREE.DoubleSide }));
    land.rotation.x = Math.PI / 2; land.position.y = -100; g.add(land);
    var sea = new THREE.Mesh(new THREE.TorusGeometry(Rr, 310, 4, 72), mat(0x2a6fa8, { side: THREE.DoubleSide }));
    sea.rotation.x = Math.PI / 2; sea.position.y = -210; g.add(sea);
    var N = MOBILE ? 36 : 110;
    var panels = new THREE.InstancedMesh(GEO.box, mat(0xa9bcd9), N);
    var d = new THREE.Object3D();
    for (var i = 0; i < N; i++) {
      var a = (i / N) * 6.283;
      d.position.set(Math.cos(a) * Rr, 370, Math.sin(a) * Rr);
      d.rotation.set(0, -a, 0);
      d.scale.set(150, 26, 520);
      d.updateMatrix(); panels.setMatrixAt(i, d.matrix);
    }
    panels.instanceMatrix.needsUpdate = true; g.add(panels);
    var star = new THREE.Mesh(GEO.sphere12, mat(0xfff0b8)); star.scale.setScalar(520); g.add(star);
    g.add(halo(3200, [[0, 'rgba(255,244,200,.95)'], [0.42, 'rgba(255,190,90,.26)'], [1, 'rgba(0,0,0,0)']]));
    g.position.copy(farPos(110000));
    g.rotation.set(0.55, 0, 0.32);
    reg(g, new THREE.Vector3(0, 0.00007, 0), 'ringworld', 15000);
  })();

  /* ---- 2. СФЕРА ДАЙСОНА (недостроенная) -------------------------------- */
  (function () {
    var g = new THREE.Group(), Rr = 4200;
    var star = new THREE.Mesh(GEO.sphere20, mat(0xffd88a)); star.scale.setScalar(900); g.add(star);
    g.add(halo(5200, [[0, 'rgba(255,230,170,.9)'], [0.45, 'rgba(255,150,60,.22)'], [1, 'rgba(0,0,0,0)']]));
    var N = MOBILE ? 90 : 260;
    var plates = new THREE.InstancedMesh(G2.hex, mat(0x9fb2cc), N);
    var d = new THREE.Object3D();
    for (var i = 0; i < N; i++) {
      var u = Math.random() * 2 - 1, th = Math.random() * 6.283;
      var sq = Math.sqrt(1 - u * u), rr = Rr * 1.02;
      d.position.set(rr * sq * Math.cos(th), rr * u * 0.72, rr * sq * Math.sin(th));
      d.lookAt(0, 0, 0);
      var s = 230 + Math.random() * 90;
      d.scale.set(s, s, s);
      d.updateMatrix(); plates.setMatrixAt(i, d.matrix);
    }
    plates.instanceMatrix.needsUpdate = true; g.add(plates);
    var gap = new THREE.Mesh(new THREE.TorusGeometry(Rr * 0.98, 60, 6, 60), mat(0x5f7ba8));
    gap.rotation.x = Math.PI / 2; g.add(gap);
    g.position.copy(farPos(120000));
    reg(g, new THREE.Vector3(0.00004, 0.00009, 0), 'dyson', 7500);
  })();

  /* ---- 3. СТАНЦИЯ-ТОР -------------------------------------------------- */
  (function () {
    var g = new THREE.Group();
    var torus = new THREE.Mesh(new THREE.TorusGeometry(1400, 230, 12, 40), mat(0xc3d2e6));
    g.add(torus);
    var hub = new THREE.Mesh(G2.cyl, mat(0x8fa4c2)); hub.scale.set(240, 340, 240); g.add(hub);
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 2;
      var spoke = new THREE.Mesh(G2.cyl, mat(0xa8b9d4));
      spoke.scale.set(70, 2800, 70);
      spoke.position.set(Math.cos(a) * 1400, 0, Math.sin(a) * 1400);
      spoke.rotation.z = Math.PI / 2;
      spoke.lookAt(0, 0, 0);
      g.add(spoke);
      var pod = new THREE.Mesh(G2.octa, mat(0xff9a4a));
      pod.scale.setScalar(120);
      pod.position.set(Math.cos(a) * 1400, 0, Math.sin(a) * 1400);
      g.add(pod);
    }
    g.add(halo(2200, [[0, 'rgba(180,220,255,.7)'], [0.5, 'rgba(90,150,255,.18)'], [1, 'rgba(0,0,0,0)']], 0.6));
    g.position.copy(farPos(90000));
    g.rotation.set(0.3, 0, 0.4);
    reg(g, new THREE.Vector3(0, 0.00035, 0.00012), 'station', 3400);
  })();

  /* ---- 4. КОРАБЛЬ-КОВЧЕГ ----------------------------------------------- */
  (function () {
    var g = new THREE.Group();
    var hull = new THREE.Mesh(G2.cyl, mat(0xb8c6dc));
    hull.scale.set(420, 5200, 420); hull.rotation.z = Math.PI / 2; g.add(hull);
    var nose = new THREE.Mesh(G2.cone, mat(0xd8e4f4));
    nose.scale.set(430, 1400, 430); nose.rotation.z = -Math.PI / 2; nose.position.x = 3300; g.add(nose);
    for (var i = -3; i <= 3; i++) {
      var fin = new THREE.Mesh(GEO.box, mat(0x7f92b4));
      fin.scale.set(700, 120, 1800);
      fin.position.set(i * 700 - 1200, 0, 0);
      fin.rotation.z = i * 0.06;
      g.add(fin);
    }
    for (var e = 0; e < 3; e++) {
      var eng = halo(900, [[0, 'rgba(150,230,255,.95)'], [0.45, 'rgba(60,140,255,.28)'], [1, 'rgba(0,0,0,0)']]);
      eng.position.set(-2800, (e - 1) * 320, 0);
      g.add(eng);
    }
    g.add(halo(4200, [[0, 'rgba(200,230,255,.5)'], [0.5, 'rgba(80,150,255,.14)'], [1, 'rgba(0,0,0,0)']], 0.5));
    g.position.copy(farPos(120000));
    g.rotation.set(0.2, 0.9, 0.15);
    reg(g, new THREE.Vector3(0.00006, 0.0002, 0), 'ark', 6800);
  })();

  /* ---- 5. КРИСТАЛЛИЧЕСКИЙ АСТЕРОИД ------------------------------------- */
  (function () {
    var g = new THREE.Group();
    var core = new THREE.Mesh(G2.octa, mat(0x6fe6ff));
    core.scale.setScalar(420); g.add(core);
    for (var i = 0; i < 9; i++) {
      var sh = new THREE.Mesh(GEO.dodeca, mat(i % 2 ? 0x9fdcff : 0xcfe9ff));
      var s = 90 + Math.random() * 200;
      sh.scale.setScalar(s);
      sh.position.set((Math.random() - 0.5) * 700, (Math.random() - 0.5) * 700, (Math.random() - 0.5) * 700);
      sh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      g.add(sh);
    }
    g.add(halo(2400, [[0, 'rgba(190,250,255,.85)'], [0.45, 'rgba(0,190,255,.2)'], [1, 'rgba(0,0,0,0)']]));
    g.position.copy(farPos(80000));
    reg(g, new THREE.Vector3(0.00022, 0.00035, 0.00016), 'crystal', 1800);
  })();

  /* ---- 6. ЛЕДЯНАЯ КОМЕТА С ДВУМЯ ХВОСТАМИ ----------------------------- */
  (function () {
    var g = new THREE.Group();
    var core = new THREE.Mesh(GEO.sphere8, mat(0xdff4ff)); core.scale.setScalar(180); g.add(core);
    var t1 = halo(2600, [[0, 'rgba(200,240,255,.7)'], [0.4, 'rgba(90,180,255,.16)'], [1, 'rgba(0,0,0,0)']], 0.55);
    t1.position.set(-1400, 0, 0); t1.scale.set(5200, 1400, 1); g.add(t1);
    var t2 = halo(2600, [[0, 'rgba(255,240,200,.55)'], [0.4, 'rgba(255,190,120,.14)'], [1, 'rgba(0,0,0,0)']], 0.45);
    t2.position.set(-1900, 260, 0); t2.scale.set(6000, 900, 1); g.add(t2);
    g.position.copy(farPos(90000));
    g.rotation.set(0, 0.8, 0.25);
    reg(g, null, 'comet', 2000);
  })();

  /* ---- 7. ДВОЙНАЯ ЗВЕЗДА ----------------------------------------------- */
  (function () {
    var g = new THREE.Group();
    var a = new THREE.Mesh(GEO.sphere12, mat(0xffd27a)); a.scale.setScalar(620); a.position.x = -1500; g.add(a);
    var b = new THREE.Mesh(GEO.sphere12, mat(0x9fd0ff)); b.scale.setScalar(430); b.position.x = 1500; g.add(b);
    var ha = halo(3400, [[0, 'rgba(255,225,160,.9)'], [0.45, 'rgba(255,150,60,.22)'], [1, 'rgba(0,0,0,0)']]); ha.position.x = -1500; g.add(ha);
    var hb = halo(2600, [[0, 'rgba(180,220,255,.9)'], [0.45, 'rgba(70,140,255,.22)'], [1, 'rgba(0,0,0,0)']]); hb.position.x = 1500; g.add(hb);
    var bridge = new THREE.Mesh(G2.cyl, mat(0xffc9a0));
    bridge.scale.set(70, 3000, 70); bridge.rotation.z = Math.PI / 2; g.add(bridge);
    g.position.copy(farPos(100000));
    reg(g, new THREE.Vector3(0, 0.00016, 0), 'binary', 4500);
    anim.push({ o: g, fn: function (o, t) {
      var k = Math.sin(t * 0.35) * 1500;
      o.children[0].position.x = -Math.abs(k) - 200;
      o.children[1].position.x = Math.abs(k) + 200;
      o.children[2].position.x = -Math.abs(k) - 200;
      o.children[3].position.x = Math.abs(k) + 200;
    }});
  })();

  /* ---- 8. ПРОТОПЛАНЕТНЫЙ ДИСК ------------------------------------------ */
  (function () {
    var g = new THREE.Group();
    var proto = new THREE.Mesh(GEO.sphere12, mat(0xfff1c8)); proto.scale.setScalar(700); g.add(proto);
    g.add(halo(4200, [[0, 'rgba(255,240,200,.9)'], [0.45, 'rgba(255,170,70,.2)'], [1, 'rgba(0,0,0,0)']]));
    var N = MOBILE ? 140 : 420;
    var disc = new THREE.InstancedMesh(GEO.dodeca, mat(0x9a8a76), N);
    var d = new THREE.Object3D();
    for (var i = 0; i < N; i++) {
      var a = Math.random() * 6.283, rr = 1200 + Math.random() * 3000;
      d.position.set(Math.cos(a) * rr, (Math.random() - 0.5) * 180, Math.sin(a) * rr);
      var s = 40 + Math.random() * 130;
      d.scale.set(s, s * 0.7, s);
      d.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      d.updateMatrix(); disc.setMatrixAt(i, d.matrix);
    }
    disc.instanceMatrix.needsUpdate = true; g.add(disc);
    g.position.copy(farPos(110000));
    g.rotation.set(0.42, 0, 0.22);
    reg(g, new THREE.Vector3(0, 0.00025, 0), 'protoplanet', 5500);
  })();

  /* ---- 9. КВАЗАР С РЕЛЯТИВИСТСКИМИ ДЖЕТАМИ ----------------------------- */
  (function () {
    var g = new THREE.Group();
    var core = new THREE.Mesh(GEO.sphere8, mat(0xffffff)); core.scale.setScalar(260); g.add(core);
    g.add(halo(4200, [[0, 'rgba(230,240,255,.95)'], [0.4, 'rgba(140,190,255,.24)'], [1, 'rgba(0,0,0,0)']]));
    for (var s = -1; s <= 1; s += 2) {
      var jet = new THREE.Mesh(G2.cone, mat(0x9fd8ff));
      jet.scale.set(320, 5200, 320);
      jet.position.y = s * 2600;
      if (s < 0) jet.rotation.z = Math.PI;
      g.add(jet);
      var tip = halo(2200, [[0, 'rgba(180,225,255,.75)'], [0.45, 'rgba(80,140,255,.18)'], [1, 'rgba(0,0,0,0)']], 0.6);
      tip.position.y = s * 5600; g.add(tip);
    }
    var acc = new THREE.Mesh(new THREE.TorusGeometry(1400, 90, 6, 48), mat(0xffb066));
    acc.rotation.x = Math.PI / 2.4; g.add(acc);
    g.position.copy(farPos(130000));
    reg(g, new THREE.Vector3(0, 0.0003, 0), 'quasar', 6500);
  })();

  /* ---- 10. КОСМИЧЕСКИЙ МАЯК -------------------------------------------- */
  (function () {
    var g = new THREE.Group();
    var base = new THREE.Mesh(G2.cyl, mat(0x6f7f9a)); base.scale.set(500, 240, 500); g.add(base);
    var tower = new THREE.Mesh(G2.cyl, mat(0xcfdcef)); tower.scale.set(150, 2600, 150); tower.position.y = 1400; g.add(tower);
    for (var i = 0; i < 3; i++) {
      var ring = new THREE.Mesh(new THREE.TorusGeometry(420 - i * 90, 34, 6, 30), mat(0x9fd8ff));
      ring.rotation.x = Math.PI / 2; ring.position.y = 700 + i * 750; g.add(ring);
    }
    var lamp = halo(2600, [[0, 'rgba(255,120,120,.9)'], [0.45, 'rgba(255,40,40,.2)'], [1, 'rgba(0,0,0,0)']]);
    lamp.position.y = 2900; g.add(lamp);
    var beam = new THREE.Mesh(G2.cone, mat(0xff8a8a));
    beam.scale.set(900, 9000, 900); beam.position.y = 7200; beam.material.transparent = true; beam.material.opacity = 0.18;
    g.add(beam);
    g.position.copy(farPos(90000));
    reg(g, new THREE.Vector3(0, 0.0004, 0), 'beacon', 7500);
    anim.push({ o: g, fn: function (o, t) {
      var k = 0.55 + 0.45 * Math.sin(t * 1.6);
      o.children[5].scale.setScalar(2600 * (0.8 + k * 0.4));   // лампа
      o.children[6].material.opacity = 0.06 + k * 0.2;          // луч
    }});
  })();

  /* ---- 11. АНОМАЛИЯ-ПОРТАЛ --------------------------------------------- */
  (function () {
    var g = new THREE.Group();
    var rim = new THREE.Mesh(new THREE.TorusGeometry(1500, 200, 14, 48), mat(0x8b5cf6));
    g.add(rim);
    var rim2 = new THREE.Mesh(new THREE.TorusGeometry(1500, 90, 10, 48), mat(0xd8b4ff));
    g.add(rim2);
    var disc = new THREE.Mesh(new THREE.CircleGeometry(1400, 40), mat(0x2a0f5a));
    disc.material.transparent = true; disc.material.opacity = 0.85; g.add(disc);
    var swirl = new THREE.Mesh(new THREE.CircleGeometry(1400, 6), mat(0xa78bfa));
    swirl.material.transparent = true; swirl.material.opacity = 0.35; g.add(swirl);
    g.add(halo(4600, [[0, 'rgba(200,160,255,.75)'], [0.45, 'rgba(120,60,255,.2)'], [1, 'rgba(0,0,0,0)']]));
    g.position.copy(farPos(100000));
    reg(g, null, 'portal', 3200);
    anim.push({ o: g, fn: function (o, t) { o.children[3].rotation.z = -t * 0.55; o.children[2].material.opacity = 0.7 + 0.2 * Math.sin(t * 1.2); } });
  })();

  /* ---- 12. ФЛОТ МАЛЫХ КОРАБЛЕЙ (V-строй) ------------------------------- */
  (function () {
    var g = new THREE.Group();
    var N = MOBILE ? 24 : 64;
    var ships = new THREE.InstancedMesh(G2.cone, mat(0xb6c8e2), N);
    var d = new THREE.Object3D();
    for (var i = 0; i < N; i++) {
      var row = Math.floor(i / 8), col = (i % 8) - 3.5;
      d.position.set(-row * 900, Math.abs(col) * 260, col * 420);
      d.rotation.set(0, 0, -Math.PI / 2);
      d.scale.set(120, 520, 120);
      d.updateMatrix(); ships.setMatrixAt(i, d.matrix);
    }
    ships.instanceMatrix.needsUpdate = true; g.add(ships);
    var flag = new THREE.Mesh(G2.cyl, mat(0xd8e4f4));
    flag.scale.set(220, 3600, 220); flag.rotation.z = Math.PI / 2; flag.position.x = 1800; g.add(flag);
    for (var e = 0; e < 3; e++) {
      var eg = halo(600, [[0, 'rgba(160,230,255,.9)'], [0.5, 'rgba(60,140,255,.2)'], [1, 'rgba(0,0,0,0)']], 0.6);
      eg.position.set(2200, (e - 1) * 300, 0); g.add(eg);
    }
    g.position.copy(farPos(110000));
    g.rotation.set(0.1, -0.6, 0.1);
    reg(g, null, 'fleet', 6000);
    anim.push({ o: g, fn: function (o, t) {
      o.rotation.y += 0.0004;
      o.rotation.z = 0.1 + Math.sin(t * 0.5) * 0.02;
    }});
  })();

  /* ---- 13. ОРБИТАЛЬНЫЙ ЛИФТ -------------------------------------------- */
  (function () {
    var g = new THREE.Group();
    var planet = new THREE.Mesh(GEO.sphere20, new THREE.MeshBasicMaterial({ map: planetTexture('#4a7fb5', '#1e3d6b', true) }));
    planet.scale.setScalar(2600); g.add(planet);
    g.add(halo(6200, [[0, 'rgba(150,200,255,.5)'], [0.5, 'rgba(60,120,220,.14)'], [1, 'rgba(0,0,0,0)']], 0.5));
    var cable = new THREE.Mesh(G2.cyl, mat(0xdfe8f5));
    cable.scale.set(34, 5200, 34); cable.position.y = 5200; g.add(cable);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(600, 90, 8, 30), mat(0xa9bcd9));
    ring.rotation.x = Math.PI / 2; ring.position.y = 3100; g.add(ring);
    var st = new THREE.Mesh(GEO.box, mat(0xc8d6ea));
    st.scale.set(420, 260, 420); st.position.y = 7800; g.add(st);
    var tip = new THREE.Mesh(G2.octa, mat(0xffb066)); tip.scale.setScalar(260); tip.position.y = 8300; g.add(tip);
    g.position.copy(farPos(100000));
    g.rotation.set(0.2, 0, 0.5);
    reg(g, new THREE.Vector3(0, 0.00018, 0), 'tether', 9500);
  })();

  /* ---- 14. ГАЗОВЫЙ ГИГАНТ СО ШТОРМОМ ----------------------------------- */
  (function () {
    var g = new THREE.Group();
    var p = new THREE.Mesh(new THREE.SphereGeometry(3400, MOBILE ? 24 : 40, MOBILE ? 18 : 28),
      new THREE.MeshBasicMaterial({ map: planetTexture('#e0a45e', '#7a4a1e', true) }));
    g.add(p);
    var storm = new THREE.Mesh(new THREE.CircleGeometry(760, 32), mat(0xd85a3a));
    storm.material.transparent = true; storm.material.opacity = 0.9;
    storm.position.set(1100, -900, 3050); storm.lookAt(4400, -900, 3050); g.add(storm);
    g.add(halo(9400, [[0, 'rgba(255,220,170,.4)'], [0.5, 'rgba(255,150,80,.13)'], [1, 'rgba(0,0,0,0)']], 0.5));
    var m1 = new THREE.Mesh(new THREE.TorusGeometry(4600, 60, 6, 64), mat(0xc9b48c));
    m1.rotation.set(Math.PI / 2.1, 0, 0.2); g.add(m1);
    var m2 = new THREE.Mesh(new THREE.TorusGeometry(5400, 90, 6, 64), mat(0xa89572));
    m2.rotation.set(Math.PI / 1.95, 0, -0.15); g.add(m2);
    g.position.copy(farPos(120000));
    reg(g, new THREE.Vector3(0, 0.00009, 0), 'gasgiant', 11500);
    anim.push({ o: g, fn: function (o, t) { o.children[0].rotation.y += 0.0009; o.children[1].rotation.z = t * 0.06; } });
  })();

  /* ---- 15. ТУМАННОСТЬ-«ГЛАЗ» ------------------------------------------- */
  (function () {
    var g = new THREE.Group();
    var iris = nebulaTexture('#5b8cff', '#b04dff');
    var s1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: iris, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 }));
    s1.scale.setScalar(26000); g.add(s1);
    var pupil = halo(7000, [[0, 'rgba(255,255,255,.7)'], [0.35, 'rgba(140,90,255,.22)'], [1, 'rgba(0,0,0,0)']], 0.6);
    g.add(pupil);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(9000, 260, 6, 64), mat(0x9fd8ff));
    ring.material.transparent = true; ring.material.opacity = 0.35; g.add(ring);
    g.position.copy(farPos(130000));
    g.rotation.z = 0.4;
    reg(g, null, 'eye', 14000);
    anim.push({ o: g, fn: function (o, t) { o.children[1].scale.setScalar(7000 * (0.9 + 0.12 * Math.sin(t * 0.9))); o.children[2].rotation.z += 0.0006; } });
  })();

  /* ---- 16. ОСКОЛКИ ДРЕВНЕГО КОЛЬЦА ------------------------------------- */
  (function () {
    var g = new THREE.Group();
    var Rr = 6200;
    var N = MOBILE ? 70 : 200;
    var frag = new THREE.InstancedMesh(GEO.dodeca, mat(0x8f9bb0), N);
    var d = new THREE.Object3D();
    for (var i = 0; i < N; i++) {
      var a = -0.9 + (i / N) * 3.2 + (Math.random() - 0.5) * 0.1;
      var rr = Rr + (Math.random() - 0.5) * 900;
      d.position.set(Math.cos(a) * rr, (Math.random() - 0.5) * 500, Math.sin(a) * rr);
      var s = 60 + Math.random() * 220;
      d.scale.set(s, s * (0.5 + Math.random()), s);
      d.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      d.updateMatrix(); frag.setMatrixAt(i, d.matrix);
    }
    frag.instanceMatrix.needsUpdate = true; g.add(frag);
    var arc = new THREE.Mesh(new THREE.TorusGeometry(Rr, 40, 6, 48, 3.0), mat(0xd8c48a));
    arc.rotation.x = Math.PI / 2; arc.rotation.z = -0.9; g.add(arc);
    g.position.copy(farPos(110000));
    g.rotation.set(0.6, 0, 0.25);
    reg(g, new THREE.Vector3(0, 0.00012, 0), 'ringdebris', 8500);
  })();

  /* ---- 17. КОСМИЧЕСКИЙ КИТ --------------------------------------------- */
  (function () {
    var g = new THREE.Group();
    var bodyMat = mat(0x4a6fa8);
    var body = new THREE.Mesh(G2.cyl, bodyMat);
    body.scale.set(1200, 6800, 1500); body.rotation.z = Math.PI / 2; g.add(body);
    var head = new THREE.Mesh(G2.cone, mat(0x5f88c4));
    head.scale.set(1250, 2600, 1450); head.rotation.z = -Math.PI / 2; head.position.x = 4400; g.add(head);
    var tail = new THREE.Mesh(G2.cone, mat(0x3d5f92));
    tail.scale.set(900, 3200, 1100); tail.rotation.z = Math.PI / 2; tail.position.x = -4800; g.add(tail);
    for (var i = 0; i < 2; i++) {
      var fin = new THREE.Mesh(G2.plane, mat(0x7fa8dc, { side: THREE.DoubleSide }));
      fin.scale.set(2600, 1500, 1);
      fin.position.set(-800 + i * 2600, 0, i ? -1200 : 1200);
      fin.rotation.set(Math.PI / 2, 0, i ? 0.4 : -0.4);
      g.add(fin);
    }
    var eye = new THREE.Mesh(GEO.sphere8, mat(0xcfe8ff)); eye.scale.setScalar(180); eye.position.set(4600, 400, 700); g.add(eye);
    var eye2 = eye.clone(); eye2.position.z = -700; g.add(eye2);
    g.add(halo(6000, [[0, 'rgba(150,200,255,.45)'], [0.5, 'rgba(60,120,220,.12)'], [1, 'rgba(0,0,0,0)']], 0.45));
    g.position.copy(farPos(100000));
    g.rotation.set(0.15, 1.1, 0.2);
    reg(g, null, 'whale', 9000);
    anim.push({ o: g, fn: function (o, t) {
      o.children[3].rotation.z = -0.4 + Math.sin(t * 0.7) * 0.22;
      o.children[4].rotation.z = 0.4 - Math.sin(t * 0.7 + 0.6) * 0.22;
      o.rotation.z = Math.sin(t * 0.4) * 0.05;
    }});
  })();

  /* ---- 18. МОНОЛИТ ----------------------------------------------------- */
  (function () {
    var g = new THREE.Group();
    var slab = new THREE.Mesh(GEO.box, mat(0x0a0d18));
    slab.scale.set(1400, 4600, 380); g.add(slab);
    var edgeMat = mat(0x7fe8ff);
    var e1 = new THREE.Mesh(GEO.box, edgeMat); e1.scale.set(1460, 90, 90); e1.position.set(0, 2300, 0); g.add(e1);
    var e2 = new THREE.Mesh(GEO.box, edgeMat); e2.scale.set(1460, 90, 90); e2.position.set(0, -2300, 0); g.add(e2);
    var e3 = new THREE.Mesh(GEO.box, edgeMat); e3.scale.set(90, 4600, 90); e3.position.set(-700, 0, 190); g.add(e3);
    var e4 = new THREE.Mesh(GEO.box, edgeMat); e4.scale.set(90, 4600, 90); e4.position.set(700, 0, 190); g.add(e4);
    g.add(halo(4600, [[0, 'rgba(130,235,255,.6)'], [0.45, 'rgba(0,160,255,.16)'], [1, 'rgba(0,0,0,0)']], 0.55));
    g.position.copy(farPos(90000));
    reg(g, new THREE.Vector3(0, 0.00022, 0), 'monolith', 5200);
  })();

  /* ---- 19. ДРЕВНИЙ ХРАМ-КОРАБЛЬ ---------------------------------------- */
  (function () {
    var g = new THREE.Group();
    var base = new THREE.Mesh(G2.cyl, mat(0x9a7f4f));
    base.scale.set(3600, 700, 3600); g.add(base);
    var p1 = new THREE.Mesh(G2.cone, mat(0xc9a86a)); p1.scale.set(2600, 2400, 2600); p1.position.y = 1500; g.add(p1);
    var p2 = new THREE.Mesh(G2.cone, mat(0xe0c489)); p2.scale.set(1500, 1800, 1500); p2.position.y = 3200; g.add(p2);
    var spire = new THREE.Mesh(G2.cyl, mat(0xffe6a8)); spire.scale.set(140, 2200, 140); spire.position.y = 5200; g.add(spire);
    var top = halo(3000, [[0, 'rgba(255,235,180,.85)'], [0.45, 'rgba(255,180,60,.2)'], [1, 'rgba(0,0,0,0)']]);
    top.position.y = 6500; g.add(top);
    for (var i = 0; i < 8; i++) {
      var a = (i / 8) * 6.283;
      var col = new THREE.Mesh(G2.cyl, mat(0xd8c493));
      col.scale.set(180, 1400, 180);
      col.position.set(Math.cos(a) * 2700, 700, Math.sin(a) * 2700);
      g.add(col);
      var lamp = new THREE.Mesh(GEO.sphere8, mat(0x9fe8ff));
      lamp.scale.setScalar(90);
      lamp.position.set(Math.cos(a) * 2700, 1450, Math.sin(a) * 2700);
      g.add(lamp);
    }
    g.position.copy(farPos(110000));
    g.rotation.set(0.12, 0.4, 0.1);
    reg(g, new THREE.Vector3(0, 0.00014, 0), 'temple', 7500);
    anim.push({ o: g, fn: function (o, t) { o.children[4].scale.setScalar(3000 * (0.9 + 0.12 * Math.sin(t * 1.1))); } });
  })();

  /* ---- 20. ТЁМНАЯ ЗВЕЗДА / ГРАВИТАЦИОННАЯ ЛИНЗА ------------------------ */
  (function () {
    var g = new THREE.Group();
    var core = new THREE.Mesh(GEO.sphere20, mat(0x05060d));
    core.scale.setScalar(1400); g.add(core);
    var lens = new THREE.Mesh(new THREE.TorusGeometry(1900, 130, 8, 64), mat(0xfff0c8));
    lens.rotation.x = Math.PI / 2.3; g.add(lens);
    var lens2 = new THREE.Mesh(new THREE.TorusGeometry(2400, 60, 6, 64), mat(0xbfe0ff));
    lens2.rotation.set(Math.PI / 2.6, 0.4, 0); g.add(lens2);
    g.add(halo(5600, [[0, 'rgba(255,240,200,.5)'], [0.4, 'rgba(160,190,255,.16)'], [1, 'rgba(0,0,0,0)']], 0.5));
    g.position.copy(farPos(100000));
    reg(g, new THREE.Vector3(0.00006, 0.00011, 0), 'darkstar', 5500);
    anim.push({ o: g, fn: function (o, t) { o.children[1].rotation.z += 0.0008; o.children[2].rotation.z -= 0.0005; } });
  })();

  /* ========================================================================
     21. ПИКСЕЛЬ-ТЕМА: РЕТРО-СЕКТОР «8-BIT»
     Всё с NearestFilter — намеренно грубая пиксельная графика в одном секторе.
     ======================================================================== */
  (function () {
    var g = new THREE.Group();
    var base = farPos(60000);
    var planetTex = pixelTex(['#2b6cb0', '#3182ce', '#63b3ed', '#90cdf4', '#1a365d', '#276749', '#38a169']);
    var rockTex = pixelTex(['#4a5568', '#718096', '#a0aec0', '#2d3748']);
    var goldTex = pixelTex(['#b7791f', '#d69e2e', '#ecc94b', '#f6e05e']);

    var planet = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ map: planetTex }));
    planet.scale.setScalar(2600); g.add(planet);
    var cap = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ map: rockTex }));
    cap.scale.set(2700, 240, 2700); cap.position.y = 1380; g.add(cap);
    var cap2 = cap.clone(); cap2.position.y = -1380; g.add(cap2);

    var N = MOBILE ? 40 : 96;
    var ring = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ map: rockTex }), N);
    var d = new THREE.Object3D();
    for (var i = 0; i < N; i++) {
      var a = (i / N) * 6.283, rr = 4200 + Math.random() * 900;
      d.position.set(Math.cos(a) * rr, (Math.random() - 0.5) * 180, Math.sin(a) * rr);
      d.rotation.set(0, -a, 0);
      var s = 260 + Math.random() * 380;
      d.scale.set(s, s * 0.5, s * 0.5);
      d.updateMatrix(); ring.setMatrixAt(i, d.matrix);
    }
    ring.instanceMatrix.needsUpdate = true; g.add(ring);

    var sat = new THREE.Group();
    var satBody = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ map: goldTex }));
    satBody.scale.set(620, 620, 620); sat.add(satBody);
    for (var p = -1; p <= 1; p += 2) {
      var panel = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ map: planetTex }));
      panel.scale.set(1400, 60, 760); panel.position.x = p * 1200; sat.add(panel);
    }
    sat.position.set(5200, 900, 0); g.add(sat);

    for (var k = 0; k < 3; k++) {
      var inv = new THREE.Group();
      var im = new THREE.MeshBasicMaterial({ map: pixelTex(['#e53e3e', '#f56565', '#c53030']) });
      var invBody = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), im);
      invBody.scale.set(560, 380, 380); inv.add(invBody);
      var legL = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), im);
      legL.scale.set(140, 260, 140); legL.position.set(-200, -320, 0); inv.add(legL);
      var legR = legL.clone(); legR.position.x = 200; inv.add(legR);
      var ant = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), im);
      ant.scale.set(60, 340, 60); ant.position.set(0, 360, 0); inv.add(ant);
      inv.position.set(-4200 + k * 2600, -1400 + k * 500, -2600 - k * 900);
      inv.userData.by = inv.position.y;
      g.add(inv);
    }

    g.position.copy(base);
    g.rotation.set(0.4, 0.6, 0.18);
    reg(g, new THREE.Vector3(0, 0.00016, 0), 'pixel', 8500);
    anim.push({ o: g, fn: function (o, t) {
      o.children[0].rotation.y += 0.0007;
      o.children[4].position.x = 5200 * Math.cos(t * 0.35);   // спутник
      o.children[4].position.z = 5200 * Math.sin(t * 0.35);
      o.children[4].rotation.y = -t * 0.35;
      for (var k2 = 5; k2 < 8; k2++) {                        // 3 инвейдера
        var inv = o.children[k2];
        inv.position.y = inv.userData.by + Math.sin(t * 2 + k2) * 12;
      }
    }});
  })();

  // ==========================================================================
  //  UPDATE
  // ==========================================================================
  var FADE_FAR = 400000, FADE_NEAR = 120000;
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

    // Вращение (только видимые — грубый фрустум-чек по ди��танции)
    var camFar = camera.far * 0.95;
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
      var appear = Math.max(0, Math.min(1, (FADE_FAR - dist) / (FADE_FAR - FADE_NEAR)));
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


  // ---- БЫСТРЫЙ ПИКИНГ: пересечение луча со сферами (без traverse) ----
  var _pickVec = new THREE.Vector3();
  function pick(raycaster) {
    var ray = raycaster.ray;
    var best = null, bestT = Infinity;
    for (var i = 0; i < deepObjs.length; i++) {
      var o = deepObjs[i];
      if (!o.userData.kind) continue;
      var r = o.userData.hitR || 3000;
      var t = ray.direction.dot(_pickVec.subVectors(o.position, ray.origin));
      if (t < 0) continue;                       // сфера позади камеры
      _pickVec.copy(ray.origin).addScaledVector(ray.direction, t);
      var d2 = _pickVec.distanceToSquared(o.position);
      if (d2 > r * r) continue;                  // луч прошёл мимо
      var dist = ray.origin.distanceTo(o.position);
      if (dist < bestT) { bestT = dist; best = o; }
    }
    return best ? { kind: best.userData.kind, object: best, dist: bestT } : null;
  }

    // v3: собственная анимация дальних объектов
    var camX2 = camera.position.x, camY2 = camera.position.y, camZ2 = camera.position.z;
    for (i = 0; i < anim.length; i++) {
      var A = anim[i];
      // LOD: объекты дальше 420k от камеры не анимируем
      var ax = A.o.position.x - camX2, ay = A.o.position.y - camY2, az = A.o.position.z - camZ2;
      if (ax * ax + ay * ay + az * az > 1.764e11) continue;
      A.fn(A.o, time, dt);
    }
  }

  window.__spaceExtras = {
    update: update,
    pick: pick,
    objects: deepObjs,
    counts: { pulsars: pulsars.length, nebulae: drifts.length, debris: spinners.length, distant: distant.length, deep: deepObjs.length }
  };

  console.log('[space_extras] v2 загружено:', window.__spaceExtras.counts);
})();
