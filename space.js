const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 6000000); // Расширенный фрустум для дальнего космоса
camera.position.set(0, 30, 70);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 1 : 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
if (THREE.SRGBColorSpace) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
} else if (renderer.outputEncoding !== undefined) {
  renderer.outputEncoding = THREE.sRGBEncoding;
}

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.8;
controls.zoomSpeed = 0.8;
controls.maxDistance = Infinity;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Определение устройства
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Кинематографичный свет глубокого космоса
const ambientLight = new THREE.AmbientLight(0x141829, 0.8);
scene.add(ambientLight);

// Центральное светило
const sunLight = new THREE.PointLight(0xfffaed, 4.5, 2000, 1.2);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Мягкий диффузный контражур Млечного Пути
const galaxyBackLight = new THREE.DirectionalLight(0x7367f0, 0.45);
galaxyBackLight.position.set(-3000, 1200, -4000).normalize();
scene.add(galaxyBackLight);

// Звёздная подсветка с противоположной стороны для рельефа
const rimSpaceLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
rimSpaceLight.position.set(2000, -800, 3000).normalize();
scene.add(rimSpaceLight);

// Многослойное звёздное поле с температурным спектром (OBAFGKM)
function createStarField() {
  const starsGeo = new THREE.BufferGeometry();
  const count = isMobile ? 16000 : 38000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const starPalette = [
    new THREE.Color(0xaec9ff), // O/B: Голубые гиганты
    new THREE.Color(0xdce7ff), // A: Бело-голубые
    new THREE.Color(0xffffff), // F: Чисто белые
    new THREE.Color(0xfff4e8), // G: Жёлто-белые (как Солнце)
    new THREE.Color(0xffddb4), // K: Оранжевые субгиганты
    new THREE.Color(0xffbb8b), // M: Красные карлики
    new THREE.Color(0x90b0ff)  // Неоновые далёкие звёзды
  ];

  for (let i = 0; i < count; i++) {
    // Сферическое распределение по глубокому космосу
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 80000 + Math.cbrt(Math.random()) * 280000;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const col = starPalette[Math.floor(Math.random() * starPalette.length)];
    const brightness = 0.65 + Math.random() * 0.55;
    colors[i * 3] = col.r * brightness;
    colors[i * 3 + 1] = col.g * brightness;
    colors[i * 3 + 2] = col.b * brightness;
  }

  starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Сглаженная круглая альфа-текстура для звёзд
  const sCanvas = document.createElement('canvas');
  sCanvas.width = 32;
  sCanvas.height = 32;
  const sCtx = sCanvas.getContext('2d');
  const sGrad = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  sGrad.addColorStop(0.0, 'rgba(255,255,255,1)');
  sGrad.addColorStop(0.3, 'rgba(255,255,255,0.85)');
  sGrad.addColorStop(0.65, 'rgba(255,255,255,0.25)');
  sGrad.addColorStop(1.0, 'rgba(255,255,255,0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 32, 32);
  const starDiscTex = new THREE.CanvasTexture(sCanvas);

  const starsMat = new THREE.PointsMaterial({
    size: 2.2,
    map: starDiscTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Points(starsGeo, starsMat);
}
const starField = createStarField();
scene.add(starField);

// ==================== ВЕЛИЧЕСТВЕННЫЙ МЛЕЧНЫЙ ПУТЬ ====================
const milkyWayGroup = new THREE.Group();
const particlesCount = isMobile ? 32000 : 75000;
const mwGeometry = new THREE.BufferGeometry();
const mwPositions = new Float32Array(particlesCount * 3);
const mwColors = new Float32Array(particlesCount * 3);

// Спектральная палитра спиральной галактики
const colCoreBright = new THREE.Color(0xfffae0); // Сверхгорячий центр
const colCoreBulge  = new THREE.Color(0xffd180); // Старые звёзды балджа
const colArmInner   = new THREE.Color(0xf472b6); // Зоны звездообразования H II
const colArmMid     = new THREE.Color(0x818cf8); // Молодые звёздные скопления
const colArmOuter   = new THREE.Color(0x38bdf8); // Голубые гиганты края
const colDustLane   = new THREE.Color(0x475569); // Темные пылевые рукава

for (let i = 0; i < particlesCount; i++) {
  let x, y, z, col;

  if (i < particlesCount * 0.22) {
    // 1. Сфероидальный балдж ядра (высокая плотность в центре)
    const u = Math.random();
    const r = Math.pow(u, 2.4) * 380;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2.0 * Math.random() - 1.0);
    
    x = r * Math.sin(phi) * Math.cos(theta);
    y = r * Math.cos(phi) * 0.42; // Сплюснутость ядра
    z = r * Math.sin(phi) * Math.sin(theta);

    const tCore = r / 380;
    col = colCoreBright.clone().lerp(colCoreBulge, tCore);
  } else {
    // 2. Логарифмические спиральные рукава (4 рукава + рукава-перемычки)
    const arms = 4;
    const armIndex = i % arms;
    const armOffset = (armIndex * (Math.PI * 2)) / arms;
    
    // Плотность распределения звёзд вдоль радиуса рукава
    const distFactor = Math.pow(Math.random(), 0.72);
    const r = 240 + distFactor * 1650;
    
    // Логарифмическое закручивание рукавов
    const spiralAngle = Math.log(r / 200) * 2.85 + armOffset;
    const spread = (Math.random() - 0.5) * (60 + r * 0.16);
    const angle = spiralAngle + (Math.random() - 0.5) * 0.28;

    x = Math.cos(angle) * r + spread;
    y = (Math.random() - 0.5) * (36 + (1650 - r) * 0.04);
    z = Math.sin(angle) * r + spread;

    // Градация цвета от балджа к внешним звёздным полям
    if (r < 600) {
      col = colCoreBulge.clone().lerp(colArmInner, (r - 240) / 360);
    } else if (r < 1100) {
      col = colArmInner.clone().lerp(colArmMid, (r - 600) / 500);
    } else if (r < 1550) {
      col = colArmMid.clone().lerp(colArmOuter, (r - 1100) / 450);
    } else {
      col = (Math.random() > 0.4) ? colArmOuter : colDustLane;
    }
  }

  mwPositions[i * 3]     = x;
  mwPositions[i * 3 + 1] = y;
  mwPositions[i * 3 + 2] = z;

  const vBright = 0.75 + Math.random() * 0.45;
  mwColors[i * 3]     = col.r * vBright;
  mwColors[i * 3 + 1] = col.g * vBright;
  mwColors[i * 3 + 2] = col.b * vBright;
}

mwGeometry.setAttribute('position', new THREE.BufferAttribute(mwPositions, 3));
mwGeometry.setAttribute('color', new THREE.BufferAttribute(mwColors, 3));

const mwMaterial = new THREE.PointsMaterial({
  size: 3.2,
  vertexColors: true,
  transparent: true,
  opacity: 0.96,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const milkyWay = new THREE.Points(mwGeometry, mwMaterial);
milkyWayGroup.add(milkyWay);

// Центральное сверхсветящееся гало ядра галактики
const coreHaloC = document.createElement('canvas');
coreHaloC.width = 128;
coreHaloC.height = 128;
const chCtx = coreHaloC.getContext('2d');
const chGrad = chCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
chGrad.addColorStop(0.0, 'rgba(255, 250, 220, 0.95)');
chGrad.addColorStop(0.2, 'rgba(255, 200, 110, 0.6)');
chGrad.addColorStop(0.55, 'rgba(210, 80, 160, 0.25)');
chGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
chCtx.fillStyle = chGrad;
chCtx.fillRect(0, 0, 128, 128);
const mwCoreGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(coreHaloC),
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  })
);
mwCoreGlow.scale.set(450, 450, 1);
milkyWayGroup.add(mwCoreGlow);

const mwHitboxGeo = new THREE.SphereGeometry(800, 16, 16);
const mwHitboxMat = new THREE.MeshBasicMaterial({ visible: false });
const mwHitbox = new THREE.Mesh(mwHitboxGeo, mwHitboxMat);
milkyWayGroup.add(mwHitbox);

milkyWayGroup.position.set(-3000, 1200, -4000);
milkyWayGroup.rotation.x = Math.PI / 3;
milkyWayGroup.rotation.z = Math.PI / 6;
scene.add(milkyWayGroup);

// REALISTIC BLACK HOLE (Camera-Facing Gravitational Lensing Billboard + Accretion Disk)
const blackHoleGroup = new THREE.Group();

// 1. Физическое ядро горизонта событий (Schawarzschild Event Horizon)
const bhCoreGeo = new THREE.SphereGeometry(18, 64, 64);
const bhCoreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const bhCore = new THREE.Mesh(bhCoreGeo, bhCoreMat);
blackHoleGroup.add(bhCore);

// 2. Плоский адаптивный квад гравитационного линзирования (всегда смотрит в камеру)
const lensingGeo = new THREE.PlaneGeometry(160, 160);
const lensingMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.NormalBlending,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    void main() {
      vec2 centered = vUv - 0.5;
      float dist = length(centered) * 2.0;
      float rEvent = 0.225;
      float rPhoton = 0.252;
      
      // Горизонт событий: абсолютная сингулярность
      if (dist < rEvent) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }
      
      // Фотонная сфера Эйнштейна с релятивистским свечением
      float photonRing = 0.0;
      if (dist >= rEvent && dist <= rPhoton) {
        float t = (dist - rEvent) / (rPhoton - rEvent);
        photonRing = pow(sin(t * 3.14159265), 1.2);
      }
      
      // Гравитационное искажение пространства и световое гало
      float halo = pow(clamp(1.0 - (dist - rPhoton) * 1.35, 0.0, 1.0), 4.2);
      // Релятивистский доплеровский сдвиг спектра (левая сторона смещена в синюю область)
      float dopplerShift = clamp(centered.x * 1.4, -0.4, 0.4);
      vec3 baseRingCol = mix(vec3(1.0, 0.96, 0.88), vec3(0.5, 0.85, 1.0), dopplerShift + 0.35);
      vec3 ringColor = baseRingCol * photonRing * 3.2;
      vec3 haloColor = vec3(1.0, 0.45, 0.1) * halo * 0.65;
      
      float alpha = clamp(photonRing * 1.1 + halo * 0.55, 0.0, 1.0);
      gl_FragColor = vec4(ringColor + haloColor, alpha);
    }
  `
});
const lensingBillboard = new THREE.Mesh(lensingGeo, lensingMat);
blackHoleGroup.add(lensingBillboard);

// 3. Кинематографичный процедурный аккреционный диск с кеплеровским дифференциальным вращением
const diskGeo = new THREE.RingGeometry(18.2, 115, 220, 8);
const diskUniforms = {
  uTime: { value: 0 },
  uInnerRadius: { value: 18.2 },
  uOuterRadius: { value: 115.0 }
};

const diskMat = new THREE.ShaderMaterial({
  uniforms: diskUniforms,
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    void main() {
      vUv = uv;
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uInnerRadius;
    uniform float uOuterRadius;
    varying vec2 vUv;
    
    // Псевдослучайный шум плазмы
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.55;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.08;
        a *= 0.5;
      }
      return v;
    }
    
    void main() {
      vec2 uv = (vUv - 0.5) * 2.0;
      float r = length(uv);
      
      // Нормализованный радиус аккреционного диска [0 .. 1]
      float normR = clamp((r - 0.22) / 0.78, 0.0, 1.0);
      if (normR <= 0.0 || normR >= 0.98) discard;
      
      float angle = atan(uv.y, uv.x);
      
      // Дифференциальное кеплеровское вращение
      float keplerSpeed = 1.0 / sqrt(normR + 0.08);
      float rot = angle + uTime * keplerSpeed * 0.8;
      
      // Бесшовные тригонометрические координаты: устраняют радиальный шов на 100%
      vec2 seamlessUv = vec2(cos(rot * 2.0), sin(rot * 2.0)) * (normR * 5.0 + 1.2);
      float plasmaDensity = fbm(seamlessUv + vec2(uTime * 0.22, -uTime * 0.12));
      plasmaDensity = pow(plasmaDensity * 1.32, 1.5);
      
      // Плавный релятивистский биминг Доплера без шва
      float dopplerBeam = 1.0 + 0.55 * sin(angle + 0.5);
      
      // Плавное угасание у горизонта событий и на внешнем крае
      float edgeFade = sin(normR * 3.14159265);
      edgeFade = pow(edgeFade, 0.7);
      
      // Градиент излучения черного тела (от 10000K до глубокого карминового)
      vec3 colHot  = vec3(1.0, 0.98, 0.92);
      vec3 colMid  = vec3(1.0, 0.55, 0.12);
      vec3 colCool = vec3(0.85, 0.18, 0.04);
      vec3 colDark = vec3(0.35, 0.03, 0.01);
      
      vec3 baseCol = mix(colHot, colMid, smoothstep(0.0, 0.35, normR));
      baseCol = mix(baseCol, colCool, smoothstep(0.35, 0.75, normR));
      baseCol = mix(baseCol, colDark, smoothstep(0.75, 1.0, normR));
      
      // Внутреннее сверхъяркое фотонное свечение
      float photonPeak = exp(-normR * 9.5) * 1.8;
      vec3 finalColor = (baseCol * plasmaDensity + colHot * photonPeak) * dopplerBeam * 1.4;
      float alpha = clamp((plasmaDensity * 0.85 + photonPeak) * edgeFade * dopplerBeam, 0.0, 1.0);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
});
const mainDisk = new THREE.Mesh(diskGeo, diskMat);
mainDisk.rotation.x = Math.PI / 2.35;
blackHoleGroup.add(mainDisk);

// 4. Мягкие круглые частицы темной материи (без черных квадратов)
function createDustParticleTexture() {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(5, 5, 5, 0.85)');
  g.addColorStop(0.5, 'rgba(10, 10, 10, 0.4)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

const darkPCount = 1400;
const darkPGeo = new THREE.BufferGeometry();
const darkPPos = new Float32Array(darkPCount * 3);
const darkPData = [];

for (let i = 0; i < darkPCount; i++) {
  const r = 24 + Math.pow(Math.random(), 2.2) * 140;
  const theta = Math.random() * Math.PI * 2;
  const y = (Math.random() - 0.5) * (r * 0.18);
  darkPPos[i * 3] = Math.cos(theta) * r;
  darkPPos[i * 3 + 1] = y;
  darkPPos[i * 3 + 2] = Math.sin(theta) * r;
  darkPData.push({ r, theta, speed: (1.5 / Math.sqrt(r)) * 0.025, y });
}

darkPGeo.setAttribute('position', new THREE.BufferAttribute(darkPPos, 3));
const darkPMat = new THREE.PointsMaterial({
  map: createDustParticleTexture(),
  size: 5.5,
  transparent: true,
  opacity: 0.75,
  depthWrite: false
});
const darkParallaxCloud = new THREE.Points(darkPGeo, darkPMat);
blackHoleGroup.add(darkParallaxCloud);

blackHoleGroup.position.set(300, 100, -400);
scene.add(blackHoleGroup);

let isConsuming = false;
let consumeTimer = 0;
let isBlackHoleActive = false;

// VERY SCARY HORROR DARK ROOM
const darkRoomGroup = new THREE.Group();

function createScaryWallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#050202';
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = Math.random() * 120 + 20;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, 'rgba(140, 0, 0, 0.8)');
    grad.addColorStop(0.5, 'rgba(60, 0, 0, 0.5)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#880000';
  ctx.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    const sx = Math.random() * 1024;
    const sy = Math.random() * 1024;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    for (let j = 0; j < 5; j++) {
      ctx.lineTo(sx + (Math.random() - 0.5) * 150, sy + Math.random() * 120);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 25; i++) {
    const ex = Math.random() * 1024;
    const ey = Math.random() * 1024;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(ex, ey, 6, 0, Math.PI * 2);
    ctx.arc(ex + 20, ey, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex, ey, 2, 0, Math.PI * 2);
    ctx.arc(ex + 20, ey, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Очищено от плоских 2D надписей

  return new THREE.CanvasTexture(canvas);
}

const scaryTexture = createScaryWallTexture();
const roomBoxGeo = new THREE.BoxGeometry(100, 100, 100);
const roomBoxMat = new THREE.MeshBasicMaterial({ map: scaryTexture, side: THREE.BackSide });
const roomBox = new THREE.Mesh(roomBoxGeo, roomBoxMat);
darkRoomGroup.add(roomBox);

const doorGeo = new THREE.PlaneGeometry(3.5, 7);
const doorMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const whiteDoor = new THREE.Mesh(doorGeo, doorMat);
whiteDoor.position.set(0, -10, -48);
darkRoomGroup.add(whiteDoor);

const doorLight = new THREE.PointLight(0xff0000, 4, 80);
doorLight.position.set(0, 0, 0);
darkRoomGroup.add(doorLight);

darkRoomGroup.position.set(15000, 15000, 15000);
scene.add(darkRoomGroup);
let inDarkRoom = false;
let inBlackHoleMode = false;
let darkRoomPressLock = false;

// COSMIC ANGEL EASTER EGG
const angelGroup = new THREE.Group();
const angelHaloGeo = new THREE.RingGeometry(4, 5, 32);
const angelHaloMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide });
const angelHalo = new THREE.Mesh(angelHaloGeo, angelHaloMat);
angelHalo.rotation.x = Math.PI / 2;
angelHalo.position.y = 12;
angelGroup.add(angelHalo);

const angelBodyGeo = new THREE.ConeGeometry(5, 16, 16);
const angelBodyMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
const angelBody = new THREE.Mesh(angelBodyGeo, angelBodyMat);
angelGroup.add(angelBody);

const wingShape = new THREE.Shape();
wingShape.moveTo(0, 0);
wingShape.quadraticCurveTo(10, 15, 20, 10);
wingShape.quadraticCurveTo(12, 0, 0, -5);
const wingGeo = new THREE.ShapeGeometry(wingShape);
const wingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
const leftWing = new THREE.Mesh(wingGeo, wingMat);
leftWing.position.set(-2, 2, 0);
const rightWing = new THREE.Mesh(wingGeo, wingMat);
rightWing.position.set(2, 2, 0);
rightWing.scale.set(-1, 1, 1);
angelGroup.add(leftWing);
angelGroup.add(rightWing);

angelGroup.position.set(-500, -200, -600);
scene.add(angelGroup);

let isAngelTriggered = false;

// ==================== КРАСИВЫЙ ПИКСЕЛЬНЫЙ ЧЕЛОВЕЧЕК С КРЫЛЬЯМИ ====================
const pixelManGroup = new THREE.Group();

function createPixelTexture(color, glow = false) {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 16, 16);
  if (glow) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(2, 2, 12, 12);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 16; i += 4) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(16, i); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

const headGeo = new THREE.BoxGeometry(2.4, 2.4, 2.4);
const headMat = new THREE.MeshBasicMaterial({ map: createPixelTexture('#ffccaa') });
const head = new THREE.Mesh(headGeo, headMat);
head.position.y = 5.8;
pixelManGroup.add(head);

const helmetGeo = new THREE.BoxGeometry(2.7, 2.7, 2.7);
const helmetMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.35 });
const helmet = new THREE.Mesh(helmetGeo, helmetMat);
helmet.position.y = 5.8;
pixelManGroup.add(helmet);

const eyeGeo = new THREE.BoxGeometry(0.4, 0.4, 0.2);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
leftEye.position.set(-0.6, 6.1, 1.3);
const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
rightEye.position.set(0.6, 6.1, 1.3);
pixelManGroup.add(leftEye, rightEye);

const bodyGeo = new THREE.BoxGeometry(3.0, 3.8, 1.8);
const bodyMat = new THREE.MeshBasicMaterial({ map: createPixelTexture('#3366ff', true) });
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.y = 2.6;
pixelManGroup.add(body);

const armGeo = new THREE.BoxGeometry(1.0, 3.0, 1.0);
const armMat = new THREE.MeshBasicMaterial({ map: createPixelTexture('#ffccaa') });
const leftArm = new THREE.Mesh(armGeo, armMat);
leftArm.position.set(-2.2, 2.7, 0);
const rightArm = new THREE.Mesh(armGeo, armMat);
rightArm.position.set(2.2, 2.7, 0);
pixelManGroup.add(leftArm, rightArm);

const legGeo = new THREE.BoxGeometry(1.2, 3.4, 1.2);
const legMat = new THREE.MeshBasicMaterial({ map: createPixelTexture('#1a1a2e') });
const leftLeg = new THREE.Mesh(legGeo, legMat);
leftLeg.position.set(-0.85, -0.9, 0);
const rightLeg = new THREE.Mesh(legGeo, legMat);
rightLeg.position.set(0.85, -0.9, 0);
pixelManGroup.add(leftLeg, rightLeg);

function createWing() {
  const wingGroup = new THREE.Group();
  const colors = ['#aaddff', '#88ccff', '#66aaff', '#4488ff'];
  for (let i = 0; i < 4; i++) {
    const featherGeo = new THREE.BoxGeometry(0.6, 3.5 - i * 0.4, 0.15);
    const featherMat = new THREE.MeshBasicMaterial({ 
      color: colors[i], 
      transparent: true, 
      opacity: 0.85 - i * 0.1 
    });
    const feather = new THREE.Mesh(featherGeo, featherMat);
    feather.position.set(i * 0.7, 1.5 - i * 0.3, 0);
    feather.rotation.z = -0.3 + i * 0.1;
    wingGroup.add(feather);
  }
  return wingGroup;
}

const leftWingGroup = createWing();
leftWingGroup.position.set(-2.5, 3.5, -0.5);
leftWingGroup.rotation.y = 0.4;
pixelManGroup.add(leftWingGroup);

const rightWingGroup = createWing();
rightWingGroup.position.set(2.5, 3.5, -0.5);
rightWingGroup.rotation.y = -0.4;
rightWingGroup.scale.x = -1;
pixelManGroup.add(rightWingGroup);

const manHitboxGeo = new THREE.BoxGeometry(8, 12, 5);
const manHitboxMat = new THREE.MeshBasicMaterial({ visible: false });
const manHitbox = new THREE.Mesh(manHitboxGeo, manHitboxMat);
manHitbox.position.y = 2.5;
pixelManGroup.add(manHitbox);

const glowGeo = new THREE.SphereGeometry(6, 16, 16);
const glowMat = new THREE.MeshBasicMaterial({ 
  color: 0x4488ff, 
  transparent: true, 
  opacity: 0.08,
  side: THREE.BackSide
});
const glow = new THREE.Mesh(glowGeo, glowMat);
glow.position.y = 3;
pixelManGroup.add(glow);

pixelManGroup.position.set(800, 50, -900);
scene.add(pixelManGroup);

let isPixelManTriggered = false;
let pixelManShakeTimer = 0;

// ==================== ERRORR ====================
const errorCanvas = document.createElement('canvas');
errorCanvas.width = 512;
errorCanvas.height = 128;
const errorCtx = errorCanvas.getContext('2d');
errorCtx.fillStyle = '#ff0000';
errorCtx.font = 'bold 90px Courier New';
errorCtx.fillText('ERRORR', 40, 95);
const errorTexture = new THREE.CanvasTexture(errorCanvas);
errorTexture.magFilter = THREE.NearestFilter;

const errorGeo = new THREE.PlaneGeometry(90, 22);
const errorMat = new THREE.MeshBasicMaterial({ 
  map: errorTexture, 
  transparent: true, 
  side: THREE.DoubleSide,
  color: 0xff0000
});
const errorMesh = new THREE.Mesh(errorGeo, errorMat);
errorMesh.position.set(700, 350, -300);
errorMesh.lookAt(0, 0, 0);
scene.add(errorMesh);

let isErrorTriggered = false;

// ==================== PIXEL DRAGON ====================
const pixelDragonGroup = new THREE.Group();
let isDragonTriggered = false;
let dragonFireCleanup = null;
let dragonHeatCleanup = null;
let dragonAngle = 0;

const dBodyMat = new THREE.MeshBasicMaterial({ map: createPixelTexture('#2e7d32', true) });
const dBellyMat = new THREE.MeshBasicMaterial({ map: createPixelTexture('#9ccc65') });
const dSpikeMat = new THREE.MeshBasicMaterial({ color: 0xff5722 });
const dHornMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
const dEyeMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });

for (let i = 0; i < 7; i++) {
  const seg = new THREE.Mesh(new THREE.BoxGeometry(7 - i * 0.5, 6 - i * 0.4, 9), dBodyMat);
  seg.position.z = i * 6.5;
  pixelDragonGroup.add(seg);
  const belly = new THREE.Mesh(new THREE.BoxGeometry(5 - i * 0.4, 1.6, 8), dBellyMat);
  belly.position.set(0, -3 - i * 0.2, i * 6.5 + 0.5);
  pixelDragonGroup.add(belly);
  const spike = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3, 4), dSpikeMat);
  spike.position.set(0, 4 - i * 0.2, i * 6.5);
  pixelDragonGroup.add(spike);
}

const dHead = new THREE.Group();
const dSkull = new THREE.Mesh(new THREE.BoxGeometry(6.5, 5.5, 7), dBodyMat);
dHead.add(dSkull);
const dSnout = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 4.5), dBodyMat);
dSnout.position.set(0, -1, -5);
dHead.add(dSnout);
const dEyeL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.4), dEyeMat);
dEyeL.position.set(-1.7, 0.9, -3.6);
const dEyeR = dEyeL.clone();
dEyeR.position.x = 1.7;
dHead.add(dEyeL, dEyeR);
const dHornL = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.6, 4), dHornMat);
dHornL.position.set(-1.9, 3.8, 0.6);
dHornL.rotation.z = 0.35;
const dHornR = dHornL.clone();
dHornR.position.x = 1.9;
dHornR.rotation.z = -0.35;
dHead.add(dHornL, dHornR);
dHead.position.set(0, 0.6, -6);
pixelDragonGroup.add(dHead);

const dWingMat = new THREE.MeshBasicMaterial({ color: 0x1b5e20, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
const dragonWingL = new THREE.Group();
for (let i = 0; i < 4; i++) {
  const feather = new THREE.Mesh(new THREE.BoxGeometry(10 - i * 1.4, 0.7, 3.6 - i * 0.5), dWingMat);
  feather.position.set(-4 - i * 4.4, i * 0.4, -i * 0.9);
  dragonWingL.add(feather);
}
dragonWingL.position.set(-3.5, 3, 8);
pixelDragonGroup.add(dragonWingL);
const dragonWingR = dragonWingL.clone();
dragonWingR.position.x = 3.5;
dragonWingR.scale.x = -1;
pixelDragonGroup.add(dragonWingR);

for (let i = 0; i < 4; i++) {
  const tSeg = new THREE.Mesh(new THREE.BoxGeometry(3.6 - i * 0.7, 3.6 - i * 0.7, 5.5), dBodyMat);
  tSeg.position.set(0, -0.3 * i, 44 + i * 4.8);
  pixelDragonGroup.add(tSeg);
}
const dTailTip = new THREE.Mesh(new THREE.ConeGeometry(2, 4.5, 4), dSpikeMat);
dTailTip.position.set(0, -1.2, 63);
dTailTip.rotation.x = Math.PI / 2;
pixelDragonGroup.add(dTailTip);

[[-3.4, 12], [3.4, 12], [-2.6, 30], [2.6, 30]].forEach(function (lp) {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(2.1, 6.5, 2.6), dBodyMat);
  leg.position.set(lp[0], -5, lp[1]);
  pixelDragonGroup.add(leg);
});

const dragonHitbox = new THREE.Mesh(new THREE.SphereGeometry(26, 12, 12), new THREE.MeshBasicMaterial({ visible: false }));
pixelDragonGroup.add(dragonHitbox);

pixelDragonGroup.position.set(5200, 120, -3800);
pixelDragonGroup.lookAt(0, 120, 0);
pixelDragonGroup.rotation.y += Math.PI;
pixelDragonGroup.scale.set(1.6, 1.6, 1.6);
scene.add(pixelDragonGroup);

// ==================== ANCIENT STATUES ====================
const statues = [];
const statueHitboxes = [];
let statuesCollected = 0;
const statuePositions = [[-6000, 200, 5000], [7000, 300, 4500], [-2000, 600, 9500]];

function createStatue(index) {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshBasicMaterial({ map: createPixelTexture('#8d99ae') });
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

  const base = new THREE.Mesh(new THREE.BoxGeometry(14, 4, 14), stoneMat);
  base.position.y = -8;
  g.add(base);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(9, 16, 6), stoneMat);
  torso.position.y = 3;
  g.add(torso);
  const headS = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6), stoneMat);
  headS.position.y = 15;
  g.add(headS);
  const eL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.5), eyeMat);
  eL.position.set(-1.5, 15.5, 3.1);
  g.add(eL);
  const eR = eL.clone();
  eR.position.x = 1.5;
  g.add(eR);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(3.5, 4, 4), goldMat);
  crown.position.y = 20;
  g.add(crown);
  const arms = new THREE.Mesh(new THREE.BoxGeometry(12, 2.5, 3), stoneMat);
  arms.position.y = 6;
  g.add(arms);

  const hb = new THREE.Mesh(new THREE.SphereGeometry(16, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hb.userData.statueIndex = index;
  g.add(hb);

  const sp = statuePositions[index];
  g.position.set(sp[0], sp[1], sp[2]);
  g.scale.set(1.8, 1.8, 1.8);
  scene.add(g);
  statues.push({ group: g, collected: false });
  statueHitboxes.push(hb);
}

for (let i = 0; i < 3; i++) createStatue(i);

// ==================== УЛЬТРА-ДЕТАЛИЗИРОВАННАЯ HATSUNE MIKU + DANCE ====================
const mikuGroup = new THREE.Group();
let isMikuTriggered = false;

// Палитра материалов PBR
const mMikuTeal = new THREE.MeshStandardMaterial({ color: 0x00f5d4, roughness: 0.25, metalness: 0.15 });
const mMikuGlow = new THREE.MeshBasicMaterial({ color: 0x39ffea });
const mMikuPink = new THREE.MeshBasicMaterial({ color: 0xff007f });
const mSkinMat  = new THREE.MeshStandardMaterial({ color: 0xffe5d9, roughness: 0.65 });
const mShirtMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, metalness: 0.25, roughness: 0.35 });
const mDarkMat  = new THREE.MeshStandardMaterial({ color: 0x111625, roughness: 0.2, metalness: 0.4 });
const mTrimTeal = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const mGold     = new THREE.MeshBasicMaterial({ color: 0xffd166 });

// Сцена и голографический танцпол
const mikuStage = new THREE.Group();
const stageDisc = new THREE.Mesh(new THREE.CylinderGeometry(14, 15, 1.2, 32), mDarkMat);
stageDisc.position.y = -6.2;
const stageRing = new THREE.Mesh(new THREE.TorusGeometry(14.2, 0.35, 16, 48), mTrimTeal);
stageRing.rotation.x = Math.PI / 2;
stageRing.position.y = -5.6;
mikuStage.add(stageDisc, stageRing);
mikuGroup.add(mikuStage);

// Торс и верхняя часть тела
const mikuUpperBody = new THREE.Group();
mikuUpperBody.position.y = 4.0;
mikuGroup.add(mikuUpperBody);

const mTorso = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.4, 2.1), mShirtMat);
mTorso.position.y = 2.2;
mikuUpperBody.add(mTorso);

// Воротничок и галстук
const mCollar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 2.25), mDarkMat);
mCollar.position.y = 4.45;
const mTie = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.4, 0.3), mMikuTeal);
mTie.position.set(0, 2.4, 1.15);
const mPin = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.2, 0.36), mGold);
mPin.position.set(0, 3.4, 1.18);
mikuUpperBody.add(mCollar, mTie, mPin);

// Юбка с ремнем и неоновым паттерном
const mSkirtGroup = new THREE.Group();
const mSkirt = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.4, 24, 1, true), mDarkMat);
mSkirt.rotation.y = Math.PI;
mSkirt.position.y = -0.2;
const mBelt = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.4, 24), mTrimTeal);
mBelt.position.y = 0.9;
mSkirtGroup.add(mSkirt, mBelt);
mikuUpperBody.add(mSkirtGroup);

// Голова с деталями лица
const mHeadGroup = new THREE.Group();
mHeadGroup.position.set(0, 5.8, 0);
mikuUpperBody.add(mHeadGroup);

const mHead = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 2.6), mSkinMat);
mHead.position.y = 1.4;
mHeadGroup.add(mHead);

// Глаза с бликами
const mikuEyeGeo = new THREE.PlaneGeometry(0.55, 0.7);
const mikuEyeMat = new THREE.MeshBasicMaterial({ color: 0x00bbba, side: THREE.DoubleSide });
const eyeL = new THREE.Mesh(mikuEyeGeo, mikuEyeMat);
eyeL.position.set(-0.68, 1.5, 1.32);
const eyeR = eyeL.clone();
eyeR.position.x = 0.68;
mHeadGroup.add(eyeL, eyeR);

// Челка и объемные волосы
const mBang = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.3, 2.85), mMikuTeal);
mBang.position.set(0, 2.65, 0.1);
mHeadGroup.add(mBang);

// Наушники с гарнитурой
const hpBand = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.2, 8, 24, Math.PI), mDarkMat);
hpBand.position.set(0, 2.4, 0);
hpBand.rotation.x = -Math.PI / 2;
const hpCupL = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16), mDarkMat);
hpCupL.rotation.z = Math.PI / 2;
hpCupL.position.set(-1.6, 1.5, 0);
const hpGlowL = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.55, 16), mMikuPink);
hpGlowL.rotation.z = Math.PI / 2;
hpGlowL.position.set(-1.65, 1.5, 0);
const hpCupR = hpCupL.clone();
hpCupR.position.x = 1.6;
const hpGlowR = hpGlowL.clone();
hpGlowR.position.x = 1.65;
const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8), mDarkMat);
mic.rotation.z = Math.PI / 3;
mic.position.set(1.4, 0.9, 0.9);
const micTip = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mMikuPink);
micTip.position.set(0.7, 0.5, 1.5);
mHeadGroup.add(hpBand, hpCupL, hpCupR, hpGlowL, hpGlowR, mic, micTip);

// Двойные хвосты (Twin Tails) для динамического раскачивания
function createMikuTail(isRight) {
  const tailRoot = new THREE.Group();
  const dir = isRight ? 1 : -1;
  const ribBox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), mDarkMat);
  const ribCore = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.45, 0.45), mMikuPink);
  tailRoot.add(ribBox, ribCore);
  
  let prev = tailRoot;
  const segs = [];
  for (let s = 0; s < 6; s++) {
    const node = new THREE.Group();
    const w = 1.1 - s * 0.12;
    const h = 2.4;
    const segMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.9), (s >= 4) ? mMikuGlow : mMikuTeal);
    segMesh.position.y = -h / 2;
    node.add(segMesh);
    node.position.y = (s === 0) ? -0.4 : -2.3;
    node.position.x = dir * 0.15;
    prev.add(node);
    prev = node;
    segs.push(node);
  }
  tailRoot.position.set(dir * 1.8, 2.5, -0.6);
  tailRoot.userData = { segs, dir };
  return tailRoot;
}
const mikuTailL = createMikuTail(false);
const mikuTailR = createMikuTail(true);
mHeadGroup.add(mikuTailL, mikuTailR);

// Руки с суставами для танцевальных движений
function createDancingArm(isRight) {
  const shoulder = new THREE.Group();
  const dir = isRight ? 1 : -1;
  shoulder.position.set(dir * 2.0, 3.8, 0);
  
  const armUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.2, 12), mSkinMat);
  armUpper.position.y = -1.1;
  shoulder.add(armUpper);
  
  const forearm = new THREE.Group();
  forearm.position.y = -2.2;
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 2.4, 12), mDarkMat);
  sleeve.position.y = -1.2;
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 8, 16), mTrimTeal);
trim.rotation.x = Math.PI / 2;
trim.position.y = -2.3;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), mSkinMat);
hand.position.y = -2.5;
  forearm.add(sleeve, trim, hand);
  shoulder.add(forearm);
  
  return { shoulder, forearm };
}
const armL = createDancingArm(false);
const armR = createDancingArm(true);
mikuUpperBody.add(armL.shoulder, armR.shoulder);

// Ноги для танцевальных шагов
function createDancingLeg(isRight) {
  const hip = new THREE.Group();
  const dir = isRight ? 1 : -1;
  hip.position.set(dir * 1.1, 0.2, 0);
  
  const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 2.4, 12), mSkinMat);
thigh.position.y = -1.2;
  hip.add(thigh);
  
  const lowerLeg = new THREE.Group();
  lowerLeg.position.y = -2.4;
  const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.75, 3.2, 12), mDarkMat);
  boot.position.y = -1.6;
  const sole = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.8), mTrimTeal);
  sole.position.set(0, -3.2, 0.25);
  lowerLeg.add(boot, sole);
  hip.add(lowerLeg);
  
  return { hip, lowerLeg };
}
const legL = createDancingDancingLeg = createDancingLeg(false);
const legR = createDancingLeg(true);
mikuGroup.add(legL.hip, legR.hip);

const mikuHitbox = new THREE.Mesh(new THREE.SphereGeometry(15, 10, 10), new THREE.MeshBasicMaterial({ visible: false }));
mikuHitbox.position.y = 4;
mikuGroup.add(mikuHitbox);

mikuGroup.position.set(1500, 40, -1200);
mikuGroup.scale.set(1.5, 1.5, 1.5);
scene.add(mikuGroup);

// ==================== ВЕЛИЧЕСТВЕННЫЕ НЕБЕСНЫЕ ВРАТА (CELESTIAL CHRONO-GATE) ====================
const celestialGateGroup = new THREE.Group();

// 1. Центральное эфирное ядро сверхновой и вихревой диск
function createGateCoreTex() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(256, 256, 15, 256, 256, 256);
  g.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  g.addColorStop(0.18, 'rgba(130, 245, 255, 0.95)');
  g.addColorStop(0.42, 'rgba(195, 80, 255, 0.55)');
  g.addColorStop(0.75, 'rgba(45, 15, 110, 0.2)');
  g.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(c);
}

const gateCoreSprite = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: createGateCoreTex(),
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.98,
    depthWrite: false
  })
);
gateCoreSprite.scale.set(220, 220, 1);
celestialGateGroup.add(gateCoreSprite);

// Вихревой полупрозрачный аккреционный диск врат
const gatePortalGeo = new THREE.RingGeometry(12, 82, 64);
const gatePortalMat = new THREE.MeshBasicMaterial({
  color: 0x8a2be2,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.4,
  blending: THREE.AdditiveBlending
});
const gatePortalMesh = new THREE.Mesh(gatePortalGeo, gatePortalMat);
celestialGateGroup.add(gatePortalMesh);

// 2. Древние хроно-кольца с рунической подсветкой
const gateRingMat1 = new THREE.MeshStandardMaterial({
  color: 0x241d3b,
  metalness: 0.92,
  roughness: 0.18,
  emissive: 0x6c2ebd,
  emissiveIntensity: 0.65
});
const gateRingMat2 = new THREE.MeshStandardMaterial({
  color: 0x122c3d,
  metalness: 0.95,
  roughness: 0.15,
  emissive: 0x00d4ff,
  emissiveIntensity: 0.8
});
const gateGlowLineMat = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
  wireframe: true,
  transparent: true,
  opacity: 0.45,
  blending: THREE.AdditiveBlending
});

const gateRing1 = new THREE.Mesh(new THREE.TorusGeometry(85, 3.2, 16, 96), gateRingMat1);
const gateRing2 = new THREE.Mesh(new THREE.TorusGeometry(105, 2.4, 16, 96), gateRingMat2);
const gateRing3 = new THREE.Mesh(new THREE.TorusGeometry(125, 1.8, 12, 64), gateGlowLineMat);
gateRing2.rotation.x = Math.PI / 4;
gateRing3.rotation.y = Math.PI / 3;
celestialGateGroup.add(gateRing1, gateRing2, gateRing3);

// 3. 4 древних монолитных обелиска-пилона по краям Врат
const pylonGeo = new THREE.BoxGeometry(7, 36, 12);
const pylonMat = new THREE.MeshStandardMaterial({
  color: 0x181a28,
  metalness: 0.92,
  roughness: 0.22,
  emissive: 0x1a0933
});
const pylonGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

for (let pi = 0; pi < 4; pi++) {
  const pylonGroup = new THREE.Group();
  const pAng = (pi / 4) * Math.PI * 2;
  const pylon = new THREE.Mesh(pylonGeo, pylonMat);
  const runeStrip = new THREE.Mesh(new THREE.BoxGeometry(0.8, 30, 12.4), pylonGlowMat);
  pylonGroup.add(pylon, runeStrip);
  pylonGroup.position.set(Math.cos(pAng) * 115, Math.sin(pAng) * 115, 0);
  pylonGroup.rotation.z = pAng + Math.PI / 2;
  celestialGateGroup.add(pylonGroup);
}

// 4. Парящие звездные кристаллы-ретрансляторы
const gateCrystals = [];
const gCrystGeo = new THREE.OctahedronGeometry(6.5, 0);
const gCrystMat = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  emissive: 0x9333ea,
  emissiveIntensity: 1.4,
  roughness: 0.1,
  metalness: 0.9,
  transparent: true,
  opacity: 0.92
});

for (let ci = 0; ci < 8; ci++) {
  const ang = (ci / 8) * Math.PI * 2;
  const cr = new THREE.Mesh(gCrystGeo, gCrystMat);
  cr.userData = { angle: ang, radius: 105, speed: 0.008 + (ci % 2) * 0.004 };
  celestialGateGroup.add(cr);
  gateCrystals.push(cr);
}

// 4. Позиционирование в живописном секторе глубокого космоса
celestialGateGroup.position.set(-2800, 950, 1800);
celestialGateGroup.rotation.y = -Math.PI / 5;
scene.add(celestialGateGroup);

function triggerMikuConcert() {
  if (isMikuTriggered) return;
  isMikuTriggered = true;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:9600;pointer-events:none;overflow:hidden;';
  document.body.appendChild(wrap);
  const st = document.createElement('style');
  st.textContent = '@keyframes mikuFall{from{transform:translateY(0) rotate(0deg);opacity:1}to{transform:translateY(108vh) rotate(300deg);opacity:.15}}';
  document.head.appendChild(st);
  const notes = ['\u266A', '\u266B', '\u2669', '\u266C'];
  const cols = ['#39c5bb', '#ff4fd8', '#ffe14f', '#7b2cbf', '#ff7b4f', '#4fff8f', '#4fa8ff', '#ff4f6e'];
  const spawner = setInterval(() => {
    for (let k = 0; k < 3; k++) {
      const n = document.createElement('div');
      n.textContent = notes[Math.floor(Math.random() * notes.length)];
      n.style.cssText = 'position:absolute;top:-40px;left:' + (Math.random() * 96) + 'vw;font-size:' + (22 + Math.random() * 26) + 'px;color:' + cols[Math.floor(Math.random() * cols.length)] + ';text-shadow:0 0 12px currentColor;animation:mikuFall ' + (2.2 + Math.random() * 2) + 's linear forwards;';
      wrap.appendChild(n);
    }
  }, 90);
  setTimeout(() => {
    clearInterval(spawner);
    setTimeout(() => {
      if (wrap.parentNode) wrap.remove();
      if (st.parentNode) st.remove();
      isMikuTriggered = false;
    }, 4200);
  }, 4000);
}

function collectStatue(i) {
  if (statues[i].collected) return;
  statues[i].collected = true;
  statuesCollected++;
  const g = statues[i].group;
  g.scale.set(0.3, 0.3, 0.3);
  g.children.forEach(c => {
    if (c.material) {
      c.material.transparent = true;
      c.material.opacity = 0.25;
    }
  });

  if (statuesCollected >= 3) {
    triggerStatueBonus();
  } else {
    artifactOverlay.textContent = 'Древняя статуя: ' + statuesCollected + '/3';
    artifactOverlay.style.display = 'block';
    setTimeout(() => { artifactOverlay.style.display = 'none'; }, 1800);
  }
}

function triggerStatueBonus() {
  card.classList.add('hidden-ui');
  controls.autoRotate = false;
  artifactOverlay.textContent = '✦ ТРИ ДРЕВНИЕ СТАТУИ ПРОБУЖДЕНЫ ✦';
  artifactOverlay.style.display = 'block';
  artifactOverlay.style.fontSize = '32px';
  artifactOverlay.style.color = '#ffd700';
  document.body.classList.add('crazy-mode');
  let hue = 45;
  const goldenInterval = setInterval(() => {
    hue = (hue + 6) % 360;
    document.body.style.filter = 'saturate(2.2) contrast(1.35) brightness(1.25) hue-rotate(' + hue + 'deg)';
  }, 60);
  setTimeout(() => {
    clearInterval(goldenInterval);
    document.body.classList.remove('crazy-mode');
    document.body.style.filter = '';
    artifactOverlay.style.display = 'none';
    artifactOverlay.style.fontSize = '26px';
    artifactOverlay.style.color = '#fff';
    resetCamera();
  }, 4500);
}

function triggerDragonFire() {
  if (isDragonTriggered) return;
  isDragonTriggered = true;
  card.classList.add('hidden-ui');
  telescopeOverlay.classList.add('hidden');
  flyOverlay.classList.add('hidden');
  controls.autoRotate = false;

  const fireCanvas = document.createElement('canvas');
  fireCanvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:10001;pointer-events:none;';
  document.body.appendChild(fireCanvas);
  fireCanvas.width = window.innerWidth;
  fireCanvas.height = window.innerHeight;
  const fctx = fireCanvas.getContext('2d');
  const W = fireCanvas.width, H = fireCanvas.height;
  const edgeW = Math.max(120, W * 0.16);
  const particles = [];

  const fireInterval = setInterval(() => {
    for (let i = 0; i < 7; i++) {
      particles.push({ x: Math.random() * edgeW, y: H + 30, vx: 0.4 + Math.random() * 0.8, vy: -(2.5 + Math.random() * 4), life: 1, size: 14 + Math.random() * 30 });
      particles.push({ x: W - Math.random() * edgeW, y: H + 30, vx: -(0.4 + Math.random() * 0.8), vy: -(2.5 + Math.random() * 4), life: 1, size: 14 + Math.random() * 30 });
    }
    fctx.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy *= 0.985;
      p.life -= 0.012 + Math.random() * 0.012;
      p.size *= 0.988;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      const grad = fctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, 'rgba(255,235,120,' + (p.life * 0.95).toFixed(3) + ')');
      grad.addColorStop(0.45, 'rgba(255,110,20,' + (p.life * 0.8).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(140,10,0,0)');
      fctx.fillStyle = grad;
      fctx.beginPath();
      fctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      fctx.fill();
    }
  }, 33);

  dragonFireCleanup = () => {
    clearInterval(fireInterval);
    particles.length = 0;
    fctx.clearRect(0, 0, W, H);
    if (fireCanvas.parentNode) fireCanvas.remove();
  };

  setTimeout(() => {
    if (dragonFireCleanup) { dragonFireCleanup(); dragonFireCleanup = null; }

    const hotOverlay = document.createElement('div');
    hotOverlay.style.cssText = 'position:fixed;inset:0;z-index:10001;pointer-events:none;background:radial-gradient(ellipse at center, rgba(255,90,0,0) 25%, rgba(255,40,0,0.65) 100%);opacity:0;';
    document.body.appendChild(hotOverlay);
    let heat = 0;
    const heatInterval = setInterval(() => {
      heat = Math.min(heat + 0.03, 1);
      hotOverlay.style.opacity = (heat * (0.75 + Math.sin(Date.now() * 0.02) * 0.25)).toFixed(3);
      document.body.style.filter = 'saturate(' + (1 + heat).toFixed(2) + ') contrast(' + (1 + heat * 0.7).toFixed(2) + ') brightness(' + (1 + heat * 0.15).toFixed(2) + ') hue-rotate(' + (-14 * heat).toFixed(1) + 'deg)';
    }, 50);

    dragonHeatCleanup = () => {
      clearInterval(heatInterval);
      if (hotOverlay.parentNode) hotOverlay.remove();
      document.body.style.filter = '';
    };

    setTimeout(() => {
      if (dragonHeatCleanup) { dragonHeatCleanup(); dragonHeatCleanup = null; }
      isDragonTriggered = false;
      resetCamera();
    }, 2500);
  }, 5000);
}

// ==================== ФУТУРИСТИЧЕСКИЙ 3D КОРАБЛЬ (PBR материалы) ====================
const shipGroup = new THREE.Group();

const hullMat = new THREE.MeshStandardMaterial({ 
  color: 0x334155, 
  metalness: 0.85, 
  roughness: 0.25 
});
const trimMat = new THREE.MeshStandardMaterial({ 
  color: 0x0f172a, 
  metalness: 0.9, 
  roughness: 0.2 
});
const cockpitMat = new THREE.MeshPhysicalMaterial ? new THREE.MeshPhysicalMaterial({
  color: 0x38bdf8,
  metalness: 0.1,
  roughness: 0.05,
  transmission: 0.75,
  transparent: true,
  opacity: 0.85
}) : new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  metalness: 0.6,
  roughness: 0.1
});

// Основной диск (тарелка)
const saucerGeo = new THREE.CylinderGeometry(5.2, 4.4, 1.2, 48);
const saucer = new THREE.Mesh(saucerGeo, hullMat);
shipGroup.add(saucer);

// Верхний фонарь кокпита
const domeGeo = new THREE.SphereGeometry(2.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
const dome = new THREE.Mesh(domeGeo, cockpitMat);
dome.position.y = 0.6;
shipGroup.add(dome);

// Нижний резонатор
const bottomDome = new THREE.Mesh(domeGeo, trimMat);
bottomDome.rotation.x = Math.PI;
bottomDome.position.y = -0.6;
shipGroup.add(bottomDome);

// Центральный реакторный сердечник
const coreGeo = new THREE.CylinderGeometry(1.6, 1.6, 2.6, 24);
const core = new THREE.Mesh(coreGeo, trimMat);
shipGroup.add(core);

// Неоновое фотонное кольцо стабилизации
const ringGeo = new THREE.TorusGeometry(5.4, 0.16, 16, 64);
const ringMat = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  emissive: 0x00b4d8,
  emissiveIntensity: 2.2,
  roughness: 0.1
});
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
shipGroup.add(ring);

// Ионные дюзы двигателей
const engGeo = new THREE.CylinderGeometry(0.5, 0.75, 1.8, 16);
const engMat = new THREE.MeshStandardMaterial({
  color: 0xff5500,
  emissive: 0xff3300,
  emissiveIntensity: 2.8,
  roughness: 0.3
});
const eng1 = new THREE.Mesh(engGeo, engMat);
eng1.position.set(-2.5, -0.25, -3.8);
eng1.rotation.x = Math.PI / 2;
const eng2 = new THREE.Mesh(engGeo, engMat);
eng2.position.set(2.5, -0.25, -3.8);
eng2.rotation.x = Math.PI / 2;
const eng3 = new THREE.Mesh(engGeo, engMat);
eng3.position.set(0, -0.25, -4.3);
eng3.rotation.x = Math.PI / 2;
shipGroup.add(eng1, eng2, eng3);

// Сенсорные шпили
const antGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8);
const antMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
const ant1 = new THREE.Mesh(antGeo, antMat);
ant1.position.set(-1.4, 2.4, 0);
const ant2 = new THREE.Mesh(antGeo, antMat);
ant2.position.set(1.4, 2.4, 0);
shipGroup.add(ant1, ant2);

// Хитбокс
const shipHitboxGeo = new THREE.SphereGeometry(7, 8, 8);
const shipHitboxMat = new THREE.MeshBasicMaterial({ visible: false });
const shipHitbox = new THREE.Mesh(shipHitboxGeo, shipHitboxMat);
shipGroup.add(shipHitbox);

shipGroup.position.set(-400, 80, 300);
scene.add(shipGroup);

let shipBoost = false;
let shipBoostTimer = 0;
let shipAngle = 0;

const asteroids = [];
const comets = [];
const debris = [];
const stations = [];
const asteroidHitboxes = [];
const debrisHitboxes = [];
const stationHitboxes = [];

// ==================== ASTEROIDS ====================
(function () {
  const rockMats = [
    new THREE.MeshStandardMaterial({ color: 0x85796f, roughness: 0.95, metalness: 0.05 }),
    new THREE.MeshStandardMaterial({ color: 0x665c52, roughness: 0.92, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ color: 0x4d433b, roughness: 0.98, metalness: 0.02 })
  ];
  function crater(parent, rr) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(rr, 7, 7), new THREE.MeshStandardMaterial({ color: 0x2e2722, roughness: 0.95 }));
    c.scale.set(1, 0.35, 1);
    const a = Math.random() * Math.PI * 2;
    const b = (Math.random() - 0.3) * Math.PI;
    c.position.set(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)).multiplyScalar(0.92);
    parent.add(c);
  }
  for (let i = 0; i < 26; i++) {
    const cls = i < 12 ? 0 : (i < 21 ? 1 : 2);
    const rad = cls === 0 ? 8 + Math.random() * 10 : (cls === 1 ? 20 + Math.random() * 25 : 55 + Math.random() * 65);
    const g = new THREE.Group();
    const geo = new THREE.DodecahedronGeometry(rad, 1);
    const pa = geo.attributes.position;
    for (let v = 0; v < pa.count; v++) {
      const k = 0.75 + Math.random() * 0.5;
      pa.setXYZ(v, pa.getX(v) * k, pa.getY(v) * k, pa.getZ(v) * k);
    }
    g.add(new THREE.Mesh(geo, rockMats[cls]));
    const nc = cls === 0 ? 2 : (cls === 1 ? 4 : 7);
    for (let c = 0; c < nc; c++) crater(g, rad * (0.12 + Math.random() * 0.14));
    const ang = Math.random() * Math.PI * 2;
    const dist = 1200 + Math.random() * 7800;
    g.position.set(Math.cos(ang) * dist, (Math.random() - 0.5) * 2400, Math.sin(ang) * dist);
    g.userData.spin = new THREE.Vector3((Math.random() - 0.5) * 0.004, (Math.random() - 0.5) * 0.004, (Math.random() - 0.5) * 0.004);
    const hb = new THREE.Mesh(new THREE.SphereGeometry(rad * 1.25, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
    g.add(hb);
    asteroidHitboxes.push(hb);
    scene.add(g);
    asteroids.push(g);
  }
})();

// ==================== COMETS ====================
(function () {
  const glowC = document.createElement('canvas');
  glowC.width = 64; glowC.height = 64;
  const gx = glowC.getContext('2d');
  const gg = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gg.addColorStop(0, 'rgba(220,240,255,1)');
  gg.addColorStop(0.4, 'rgba(150,200,255,.5)');
  gg.addColorStop(1, 'rgba(100,160,255,0)');
  gx.fillStyle = gg;
  gx.fillRect(0, 0, 64, 64);
  const glowTex = new THREE.CanvasTexture(glowC);
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    const rad = 9 + Math.random() * 7;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(rad, 12, 12), new THREE.MeshBasicMaterial({ color: 0xdfefff })));
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    halo.scale.set(rad * 8, rad * 8, 1);
    g.add(halo);
    const tailLen = 260 + Math.random() * 320;
    const tail = new THREE.Mesh(new THREE.ConeGeometry(14, tailLen, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    tail.rotation.x = -Math.PI / 2;
    tail.position.z = tailLen / 2;
    const tail2 = new THREE.Mesh(new THREE.ConeGeometry(8, tailLen * 0.65, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    tail2.rotation.x = -Math.PI / 2;
    tail2.position.z = tailLen * 0.33;
    g.add(tail, tail2);
    g.position.set((Math.random() - 0.5) * 12000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 12000);
    g.userData.dir = new THREE.Vector3(Math.random() - 0.5, (Math.random() - 0.5) * 0.3, Math.random() - 0.5).normalize();
    g.userData.speed = 2.2 + Math.random() * 3.4;
    g.lookAt(g.position.clone().add(g.userData.dir));
    scene.add(g);
    comets.push(g);
  }
})();

// ==================== SPACE DEBRIS ====================
(function () {
  const panelMat = new THREE.MeshBasicMaterial({ color: 0x2a4a7a, side: THREE.DoubleSide });
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x9aa3ad });
  const rustMat = new THREE.MeshBasicMaterial({ color: 0x7a5a3a });
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group();
    const kind = i % 3;
    if (kind === 0) {
      g.add(new THREE.Mesh(new THREE.BoxGeometry(26, 0.7, 10), panelMat));
      for (let f = 0; f < 3; f++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 10.4), frameMat);
        bar.position.x = -9 + f * 9;
        g.add(bar);
      }
    } else if (kind === 1) {
      g.add(new THREE.Mesh(new THREE.TorusGeometry(16, 2.4, 7, 22, Math.PI * (0.5 + Math.random() * 0.5)), frameMat));
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 12, 8), rustMat);
      seg.position.set(16, 3, 0);
      g.add(seg);
    } else {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(5, 7, 22, 7, 1, true), rustMat));
      const plate = new THREE.Mesh(new THREE.BoxGeometry(12, 0.6, 9), panelMat);
      plate.position.set(4, 6, 2);
      plate.rotation.z = 0.4;
      g.add(plate);
    }
    g.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
    const ang = Math.random() * Math.PI * 2;
    const dist = 900 + Math.random() * 5000;
    g.position.set(Math.cos(ang) * dist, (Math.random() - 0.5) * 1800, Math.sin(ang) * dist);
    g.userData.spin = new THREE.Vector3((Math.random() - 0.5) * 0.008, (Math.random() - 0.5) * 0.008, 0);
    const hb = new THREE.Mesh(new THREE.SphereGeometry(24, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
    g.add(hb);
    debrisHitboxes.push(hb);
    scene.add(g);
    debris.push(g);
  }
})();

// ==================== SPACE STATIONS ====================
(function () {
  const cfgs = [
    { pos: [2600, 300, -1800], sc: 1 },
    { pos: [-4200, -400, 5200], sc: 1.45 }
  ];
  cfgs.forEach(function (cf) {
    const st = new THREE.Group();
    const stMetal = new THREE.MeshStandardMaterial({ color: 0xa0aab5, metalness: 0.85, roughness: 0.3 });
    const stDark = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.9, roughness: 0.4 });
    const stSolar = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.2, metalness: 0.6 });
    
    st.add(new THREE.Mesh(new THREE.TorusGeometry(60, 8, 16, 64), stMetal));
    st.add(new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 34, 24), stDark));
    for (let s = 0; s < 4; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.4, 52), stMetal);
      spoke.rotation.y = s * Math.PI / 2;
      spoke.position.set(Math.sin(s * Math.PI / 2) * 26, 0, Math.cos(s * Math.PI / 2) * 26);
      st.add(spoke);
    }
    for (let pn = 0; pn < 2; pn++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(70, 1.6, 22), stSolar);
      panel.position.x = pn === 0 ? -78 : 78;
      st.add(panel);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 30, 8), stMetal);
      arm.rotation.z = Math.PI / 2;
      arm.position.x = pn === 0 ? -46 : 46;
      st.add(arm);
    }
    const b1 = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff3b4f, emissive: 0xff002b, emissiveIntensity: 2.0 }));
    b1.position.set(60, 8, 0);
    const b2 = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), new THREE.MeshStandardMaterial({ color: 0x4fff8f, emissive: 0x00ff66, emissiveIntensity: 2.0 }));
    b2.position.set(-60, -8, 0);
    st.add(b1, b2);
    st.userData.beacons = [b1, b2];
    st.userData.beaconPhase = Math.random() * 6.283;
    const hb = new THREE.Mesh(new THREE.SphereGeometry(85, 10, 10), new THREE.MeshBasicMaterial({ visible: false }));
    st.add(hb);
    stationHitboxes.push(hb);
    st.position.set(cf.pos[0], cf.pos[1], cf.pos[2]);
    st.scale.set(cf.sc, cf.sc, cf.sc);
    scene.add(st);
    stations.push(st);
  });
})();

// ==================== NEBULAE ====================
(function () {
  function nebTexture(c1, c2) {
    const nc = document.createElement('canvas');
    nc.width = 256; nc.height = 256;
    const nx = nc.getContext('2d');
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * 6.283;
      const rr0 = Math.random() * 70;
      const x = 128 + Math.cos(a) * rr0;
      const y = 128 + Math.sin(a) * rr0;
      const rr = 18 + Math.random() * 42;
      const grad = nx.createRadialGradient(x, y, 0, x, y, rr);
      const uc = Math.random() > 0.45 ? c1 : c2;
      grad.addColorStop(0, uc + (Math.random() > 0.5 ? '66' : '33'));
      grad.addColorStop(0.55, uc + '18');
      grad.addColorStop(1, uc + '00');
      nx.fillStyle = grad;
      nx.beginPath();
      nx.arc(x, y, rr, 0, 6.283);
      nx.fill();
    }
    for (let s = 0; s < 110; s++) {
      const a = Math.random() * 6.283;
      const rr0 = Math.random() * 88;
      nx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.random() * 0.6).toFixed(2) + ')';
      const ss = Math.random() * 1.8 + 0.4;
      nx.fillRect(128 + Math.cos(a) * rr0, 128 + Math.sin(a) * rr0, ss, ss);
    }
    nx.globalCompositeOperation = 'destination-in';
    const mask = nx.createRadialGradient(128, 128, 20, 128, 128, 126);
    mask.addColorStop(0, 'rgba(0,0,0,1)');
    mask.addColorStop(0.55, 'rgba(0,0,0,0.75)');
    mask.addColorStop(0.85, 'rgba(0,0,0,0.18)');
    mask.addColorStop(1, 'rgba(0,0,0,0)');
    nx.fillStyle = mask;
    nx.fillRect(0, 0, 256, 256);
    nx.globalCompositeOperation = 'source-over';
    return new THREE.CanvasTexture(nc);
  }
  const cfgs = [
    { pos: [7000, 900, -8000], size: 1700, c1: '#ff5b8a', c2: '#b04dff' },
    { pos: [-8200, 600, -6200], size: 1300, c1: '#4fa8ff', c2: '#37e0c8' },
    { pos: [1200, -1400, 9800], size: 1500, c1: '#7dff8f', c2: '#ffe45b' }
  ];
  cfgs.forEach(function (cf) {
    for (let layer = 0; layer < 3; layer++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebTexture(cf.c1, cf.c2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: layer === 0 ? 0.9 : (layer === 1 ? 0.55 : 0.4), rotation: Math.random() * 6.283 }));
      sp.position.set(cf.pos[0] + (Math.random() - 0.5) * cf.size * 0.25, cf.pos[1] + (Math.random() - 0.5) * cf.size * 0.25, cf.pos[2] + (Math.random() - 0.5) * cf.size * 0.2);
      const ls = cf.size * (layer === 0 ? 1 : (layer === 1 ? 0.72 : 1.35));
      sp.scale.set(ls, ls, 1);
      scene.add(sp);
    }
    const dotC = document.createElement('canvas');
    dotC.width = 32; dotC.height = 32;
    const dx2 = dotC.getContext('2d');
    const dg2 = dx2.createRadialGradient(16, 16, 0, 16, 16, 16);
    dg2.addColorStop(0, 'rgba(255,255,255,1)');
    dg2.addColorStop(1, 'rgba(255,255,255,0)');
    dx2.fillStyle = dg2;
    dx2.fillRect(0, 0, 32, 32);
    const dotTex = new THREE.CanvasTexture(dotC);
    const N = 320;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const cA = new THREE.Color(cf.c1);
    const cB = new THREE.Color(cf.c2);
    const R = cf.size * 0.42;
    for (let i = 0; i < N; i++) {
      const a = Math.random() * 6.283;
      const b = Math.acos(2 * Math.random() - 1);
      const rr = Math.pow(Math.random(), 0.6) * R;
      pos[i * 3] = cf.pos[0] + Math.sin(b) * Math.cos(a) * rr;
      pos[i * 3 + 1] = cf.pos[1] + Math.sin(b) * Math.sin(a) * rr * 0.6;
      pos[i * 3 + 2] = cf.pos[2] + Math.cos(b) * rr;
      const cc = Math.random() > 0.5 ? cA : cB;
      col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: 30, map: dotTex, vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })));
  });
})();

// ==================== TRIPLE STAR SYSTEM (далеко) ====================
const starSystemGroup = new THREE.Group();
(function () {
  const redGiant = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 24), new THREE.MeshBasicMaterial({ color: 0xff5a3c }));
  starSystemGroup.add(redGiant);
  const yellowStar = new THREE.Mesh(new THREE.SphereGeometry(90, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffd75e }));
  yellowStar.position.set(420, 30, -160);
  starSystemGroup.add(yellowStar);
  const whiteStar = new THREE.Mesh(new THREE.SphereGeometry(55, 20, 20), new THREE.MeshBasicMaterial({ color: 0xeaf4ff }));
  whiteStar.position.set(-260, -60, 320);
  starSystemGroup.add(whiteStar);
  const haloC = document.createElement('canvas');
  haloC.width = 128; haloC.height = 128;
  const hx = haloC.getContext('2d');
  const hg = hx.createRadialGradient(64, 64, 0, 64, 64, 64);
  hg.addColorStop(0, 'rgba(255,220,180,.9)');
  hg.addColorStop(0.35, 'rgba(255,150,90,.4)');
  hg.addColorStop(1, 'rgba(255,100,50,0)');
  hx.fillStyle = hg;
  hx.fillRect(0, 0, 128, 128);
  const sysHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(haloC), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, visible: false }));
  sysHalo.scale.set(0, 0, 1); sysHalo.visible = false;
  starSystemGroup.add(sysHalo);
  const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(420, 1.5, 6, 64), new THREE.MeshBasicMaterial({ color: 0xffb080, transparent: true, opacity: 0.25 }));
  orbitRing.rotation.x = Math.PI / 2.4;
  starSystemGroup.add(orbitRing);
  starSystemGroup.userData.planet = yellowStar;
  starSystemGroup.position.set(-11500, 2200, -10500);
  scene.add(starSystemGroup);
})();

// ==================== 20 АРТЕФАКТОВ — ДАЛЕКО И РАЗБРОСАННО ====================
const artifacts = [];
const artifactMeshes = [];
const collected = {
  crystal: 0,
  eye: 0,
  cube: 0,
  ring: 0,
  spike: 0,
  orb: 0,
  cross: 0,
  pyramid: 0
};
const totalByType = {
  crystal: 0,
  eye: 0,
  cube: 0,
  ring: 0,
  spike: 0,
  orb: 0,
  cross: 0,
  pyramid: 0
};

const artifactTypes = [
  { type: 'crystal', color: 0xff00ff, name: 'Кристалл' },
  { type: 'eye', color: 0xff0000, name: 'Глаз' },
  { type: 'cube', color: 0x00ff88, name: 'Куб' },
  { type: 'ring', color: 0xffff00, name: 'Кольцо' },
  { type: 'spike', color: 0xff8800, name: 'Шип' },
  { type: 'orb', color: 0x00ffff, name: 'Сфера' },
  { type: 'cross', color: 0xffffff, name: 'Крест' },
  { type: 'pyramid', color: 0xaa00ff, name: 'Пирамида' },
];

function createArtifact(index) {
  const group = new THREE.Group();
  const typeInfo = artifactTypes[index % artifactTypes.length];
  totalByType[typeInfo.type]++;
  
  let mesh;

  switch (typeInfo.type) {
    case 'crystal':
      mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(4 + Math.random() * 3, 0),
        new THREE.MeshBasicMaterial({ color: typeInfo.color, transparent: true, opacity: 0.85 })
      );
      break;
    case 'eye':
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 16, 16),
        new THREE.MeshBasicMaterial({ color: typeInfo.color })
      );
      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      pupil.position.z = 2.5;
      group.add(pupil);
      break;
    case 'cube':
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(4, 4, 4),
        new THREE.MeshBasicMaterial({ color: typeInfo.color, wireframe: Math.random() > 0.5 })
      );
      break;
    case 'ring':
      mesh = new THREE.Mesh(
        new THREE.TorusGeometry(3.5, 0.8, 8, 24),
        new THREE.MeshBasicMaterial({ color: typeInfo.color })
      );
      break;
    case 'spike':
      mesh = new THREE.Mesh(
        new THREE.ConeGeometry(2, 7, 6),
        new THREE.MeshBasicMaterial({ color: typeInfo.color })
      );
      break;
    case 'orb':
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(3.8, 16, 16),
        new THREE.MeshBasicMaterial({ color: typeInfo.color, transparent: true, opacity: 0.6 })
      );
      break;
    case 'cross':
      const crossGroup = new THREE.Group();
      const bar1 = new THREE.Mesh(new THREE.BoxGeometry(7, 1.3, 1.3), new THREE.MeshBasicMaterial({ color: typeInfo.color }));
      const bar2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 7, 1.3), new THREE.MeshBasicMaterial({ color: typeInfo.color }));
      crossGroup.add(bar1, bar2);
      mesh = crossGroup;
      break;
    case 'pyramid':
      mesh = new THREE.Mesh(
        new THREE.TetrahedronGeometry(4.5),
        new THREE.MeshBasicMaterial({ color: typeInfo.color })
      );
      break;
  }

  group.add(mesh);
  
  const hitbox = new THREE.Mesh(
    new THREE.SphereGeometry(7, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  group.add(hitbox);

  // Разбрасываем далеко и всё дальше
  const angle = Math.random() * Math.PI * 2;
  const distance = 600 + index * 280 + Math.random() * 200; // каждый дальше
  const y = (Math.random() - 0.5) * 400;
  
  group.position.set(
    Math.cos(angle) * distance,
    y,
    Math.sin(angle) * distance
  );

  group.userData = {
    type: typeInfo.type,
    name: typeInfo.name,
    baseY: y,
    speed: 0.2 + Math.random() * 0.6,
    rotSpeed: 0.008 + Math.random() * 0.02,
    index: index,
    collected: false
  };

  scene.add(group);
  artifacts.push(group);
  artifactMeshes.push(hitbox);
}

for (let i = 0; i < 20; i++) {
  createArtifact(i);
}

// ==================== ОБЛАКО ДОЖДЯ ДАЛЕКО ====================
const rainCloudGroup = new THREE.Group();

// Само облако (несколько сфер)
for (let i = 0; i < 12; i++) {
  const cloudPart = new THREE.Mesh(
    new THREE.SphereGeometry(40 + Math.random() * 50, 12, 12),
    new THREE.MeshBasicMaterial({ 
      color: 0x334455, 
      transparent: true, 
      opacity: 0.55 + Math.random() * 0.25 
    })
  );
  cloudPart.position.set(
    (Math.random() - 0.5) * 180,
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 100
  );
  rainCloudGroup.add(cloudPart);
}

// Капли дождя
const rainDrops = [];
const rainGeo = new THREE.CylinderGeometry(0.4, 0.15, 8, 4);
const rainMat = new THREE.MeshBasicMaterial({ 
  color: 0x88aaff, 
  transparent: true, 
  opacity: 0.6 
});

for (let i = 0; i < 120; i++) {
  const drop = new THREE.Mesh(rainGeo, rainMat);
  drop.position.set(
    (Math.random() - 0.5) * 220,
    -20 - Math.random() * 200,
    (Math.random() - 0.5) * 140
  );
  drop.userData = { speed: 3 + Math.random() * 6 };
  rainCloudGroup.add(drop);
  rainDrops.push(drop);
}

rainCloudGroup.position.set(-4500, 800, 3200); // далеко
scene.add(rainCloudGroup);

// ==================== СОЛНЕЧНЫЕ БЛИКИ (LENS FLARE) И КИНЕМАТОГРАФИЧНОЕ СОЛНЦЕ ====================
const sunGroup = new THREE.Group();

// 2D-оверлей для оптических бликов в объективе
const flareCanvas = document.createElement('canvas');
flareCanvas.id = 'sun-lens-flare';
// Размещаем строго под UI (z-index: 2), не перекрывая карточки и диалоги
flareCanvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2;mix-blend-mode:screen;';
document.body.appendChild(flareCanvas);
const flareCtx = flareCanvas.getContext('2d');

function resizeFlareCanvas() {
  flareCanvas.width = window.innerWidth;
  flareCanvas.height = window.innerHeight;
}
resizeFlareCanvas();
window.addEventListener('resize', resizeFlareCanvas);

function drawBokehDisc(ctx, x, y, r, innerCol, rimCol, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x, y, r * 0.55, x, y, r);
  g.addColorStop(0.0, innerCol);
  g.addColorStop(0.85, rimCol);
  g.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderSunGlare(screenX, screenY, intensity) {
  flareCtx.clearRect(0, 0, flareCanvas.width, flareCanvas.height);
  if (intensity <= 0.01) return;

  const cx = flareCanvas.width / 2;
  const cy = flareCanvas.height / 2;
  const dx = cx - screenX;
  const dy = cy - screenY;

  // 1. Мягкое глубинное свечение вокруг Солнца (без полос и резких линий)
  const haloR = Math.max(120, flareCanvas.width * 0.28) * intensity;
  const haloGrad = flareCtx.createRadialGradient(screenX, screenY, 0, screenX, screenY, haloR);
  haloGrad.addColorStop(0.0, 'rgba(255, 252, 235, ' + (0.75 * intensity).toFixed(3) + ')');
  haloGrad.addColorStop(0.25, 'rgba(255, 205, 120, ' + (0.35 * intensity).toFixed(3) + ')');
  haloGrad.addColorStop(0.6, 'rgba(255, 140, 50, ' + (0.12 * intensity).toFixed(3) + ')');
  haloGrad.addColorStop(1.0, 'rgba(255, 100, 20, 0)');
  flareCtx.fillStyle = haloGrad;
  flareCtx.beginPath();
  flareCtx.arc(screenX, screenY, haloR, 0, Math.PI * 2);
  flareCtx.fill();

  // 2. Реалистичные мягкие боке-кольца линзы фотоаппарата по оптической оси
  const bokehElements = [
    { dist: 0.18, r: 35, inCol: 'rgba(255,230,170,0.18)', rimCol: 'rgba(255,190,80,0.5)', a: 0.35 },
    { dist: 0.38, r: 22, inCol: 'rgba(120,210,255,0.15)', rimCol: 'rgba(56,189,248,0.45)', a: 0.3 },
    { dist: 0.62, r: 58, inCol: 'rgba(255,170,120,0.1)',  rimCol: 'rgba(251,146,60,0.35)', a: 0.25 },
    { dist: 0.88, r: 18, inCol: 'rgba(220,150,255,0.2)',  rimCol: 'rgba(168,85,247,0.55)', a: 0.4 },
    { dist: 1.15, r: 42, inCol: 'rgba(100,240,200,0.12)', rimCol: 'rgba(45,212,191,0.4)',  a: 0.28 },
    { dist: 1.45, r: 75, inCol: 'rgba(255,120,160,0.08)', rimCol: 'rgba(244,63,94,0.3)',   a: 0.22 }
  ];

  for (let i = 0; i < bokehElements.length; i++) {
    const b = bokehElements[i];
    const px = screenX + dx * b.dist;
    const py = screenY + dy * b.dist;
    const pr = b.r * (0.8 + intensity * 0.4);
    drawBokehDisc(flareCtx, px, py, pr, b.inCol, b.rimCol, b.a * intensity);
  }
}

function createSunPlasmaTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');
  
  // Раскаленная фотосфера с гранулированной плазмой
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#ff7900');
  grad.addColorStop(0.3, '#ffaa00');
  grad.addColorStop(0.7, '#ffd000');
  grad.addColorStop(1.0, '#ff5500');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Микрогрануляция и конвекционные ячейки
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = Math.random() * 26 + 6;
    const cell = ctx.createRadialGradient(x, y, 0, x, y, r);
    cell.addColorStop(0.0, 'rgba(255, 255, 240, 0.9)');
    cell.addColorStop(0.35, 'rgba(255, 195, 45, 0.55)');
    cell.addColorStop(0.8, 'rgba(255, 100, 10, 0.15)');
    cell.addColorStop(1.0, 'rgba(200, 40, 0, 0)');
    ctx.fillStyle = cell;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Солнечные пятна с темной полутенью
  for (let s = 0; s < 18; s++) {
    const sx = Math.random() * 1024;
    const sy = 120 + Math.random() * 270;
    const sr = Math.random() * 16 + 5;
    const spot = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    spot.addColorStop(0.0, 'rgba(80, 15, 0, 0.85)');
    spot.addColorStop(0.5, 'rgba(160, 45, 0, 0.5)');
    spot.addColorStop(1.0, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

const sunGeo = new THREE.SphereGeometry(5.2, 48, 48);
const sunMat = new THREE.MeshBasicMaterial({
  map: createSunPlasmaTexture(),
  color: 0xfffae0
});
const sun = new THREE.Mesh(sunGeo, sunMat);
sunGroup.add(sun);

// Ореол и свечение короны
function createCoronaTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(256, 256, 45, 256, 256, 256);
  grad.addColorStop(0.00, 'rgba(255, 255, 240, 1.0)');
  grad.addColorStop(0.18, 'rgba(255, 220, 110, 0.85)');
  grad.addColorStop(0.42, 'rgba(255, 140, 30, 0.45)');
  grad.addColorStop(0.70, 'rgba(255, 60, 10, 0.16)');
  grad.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(c);
}
const sunCorona = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: createCoronaTexture(),
    color: 0xffd570,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  })
);
sunCorona.scale.set(36, 36, 1);
sunGroup.add(sunCorona);
scene.add(sunGroup);

function createCraterMap(colorBase, craterColor, isBump = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = isBump ? '#808080' : colorBase;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const count = 350;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.pow(Math.random(), 3) * 28 + 3;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    if (isBump) {
      grad.addColorStop(0, '#202020');
      grad.addColorStop(0.7, '#606060');
      grad.addColorStop(0.85, '#ffffff');
      grad.addColorStop(1, '#808080');
    } else {
      grad.addColorStop(0, craterColor);
      grad.addColorStop(0.8, colorBase);
      grad.addColorStop(1, colorBase);
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createEarthTextures() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0f2b5c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#2d6a4f';
  for (let i = 0; i < 90; i++) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const size = Math.random() * 90 + 30;
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 1.6, size, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#b5835a';
  for (let i = 0; i < 40; i++) {
    const cx = Math.random() * canvas.width;
    const cy = canvas.height * 0.4 + (Math.random() - 0.5) * 120;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.random() * 40 + 10, 0, Math.PI * 2);
    ctx.fill();
  }
  const map = new THREE.CanvasTexture(canvas);
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 1024;
  roughCanvas.height = 512;
  const rCtx = roughCanvas.getContext('2d');
  rCtx.drawImage(canvas, 0, 0);
  const imgData = rCtx.getImageData(0, 0, 1024, 512);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const isWater = (imgData.data[i] === 15 && imgData.data[i + 1] === 43 && imgData.data[i + 2] === 92);
    const val = isWater ? 35 : 210;
    imgData.data[i] = val;
    imgData.data[i + 1] = val;
    imgData.data[i + 2] = val;
  }
  rCtx.putImageData(imgData, 0, 0);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = 1024;
  cloudCanvas.height = 512;
  const cCtx = cloudCanvas.getContext('2d');
  cCtx.fillStyle = 'rgba(255, 255, 255, 0)';
  cCtx.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = Math.random() * 45 + 15;
    const grad = cCtx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    cCtx.fillStyle = grad;
    cCtx.beginPath();
    cCtx.arc(x, y, r, 0, Math.PI * 2);
    cCtx.fill();
  }
  const cloudMap = new THREE.CanvasTexture(cloudCanvas);
  return { map, roughnessMap, cloudMap };
}

function createGasGiantTexture(colors) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < canvas.height; y++) {
    const n = Math.sin(y * 0.08) * 0.5 + Math.cos(y * 0.03) * 0.5;
    const colorIdx = Math.floor(((n + 1) / 2) * (colors.length - 1));
    ctx.fillStyle = colors[colorIdx];
    ctx.fillRect(0, y, canvas.width, 1);
  }
  return new THREE.CanvasTexture(canvas);
}

const earthData = createEarthTextures();
const earthClouds = [];

const planetConfigs = [
  { name: 'Меркурий', radius: 0.5, dist: 9, color: 10066329, speed: 0.025, desc: 'Самая близкая к Солнцу планета. Перепады температур до 600 градусов!' },
  { name: 'Венера', radius: 0.9, dist: 14, color: 14924662, speed: 0.018, desc: 'Самая горячая планета Солнечной системы с плотной атмосферой из углекислого газа.' },
  { name: 'Земля', radius: 1, dist: 20, color: 2845872, speed: 0.012, desc: 'Наш родной дом! Единственное известное место во Вселенной с жизнью.' },
  { name: 'Марс', radius: 0.6, dist: 26, color: 12922928, speed: 0.009, desc: 'Красная планета. Здесь находится гигантский вулкан Олимп и древние русла рек.' },
  { name: 'Юпитер', radius: 2.4, dist: 35, color: 13013524, speed: 0.005, desc: 'Крупнейший газовый гигант. Его Большое Красное Пятно — это ураган, бушующий века.' },
  { name: 'Сатурн', radius: 1.9, dist: 46, color: 14065198, speed: 0.003, ring: true, desc: 'Властелин колец! Его ледяные кольца простираются на тысячи километров.' },
  { name: 'Уран', radius: 1.3, dist: 55, color: 3250069, speed: 0.002, desc: 'Ледяной гигант, который вращается на боку с наклоном оси почти в 98 градусов.' },
  { name: 'Нептун', radius: 1.2, dist: 63, color: 2845872, speed: 0.001, desc: 'Самая дальняя планета. Здесь дуют самые быстрые ветра в Солнечной системе.' }
];

const planets = [];
const planetMeshes = [];
const planetHitMeshes = [];
planetConfigs.forEach(cfg => {
  const orbitGeo = new THREE.BufferGeometry();
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * cfg.dist, 0, Math.sin(theta) * cfg.dist));
  }
  orbitGeo.setFromPoints(points);
  const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 });
  const orbit = new THREE.Line(orbitGeo, orbitMat);
  scene.add(orbit);

  const pGeo = new THREE.SphereGeometry(cfg.radius, 64, 64);
  let pMat;
  const pName = cfg.name || '';
  if (pName.includes('Меркурий')) {
    pMat = new THREE.MeshStandardMaterial({
      color: 0xa8a59b,
      bumpMap: createCraterMap('#888', '#222', true),
      bumpScale: 0.08,
      roughness: 0.9,
      metalness: 0.12
    });
  } else if (pName.includes('Венера')) {
    pMat = new THREE.MeshStandardMaterial({
      color: 0xe3bb76,
      roughness: 0.4,
      metalness: 0.05
    });
  } else if (pName.includes('Нептун')) {
    pMat = new THREE.MeshStandardMaterial({
      color: 0x2753a7,
      roughness: 0.35,
      metalness: 0.15
    });
  } else if (pName.includes('Уран')) {
    pMat = new THREE.MeshStandardMaterial({
      color: 0x4b70dd,
      roughness: 0.4,
      metalness: 0.1
    });
  } else if (pName.includes('Марс')) {
    pMat = new THREE.MeshStandardMaterial({
      color: 0xbf4b24,
      bumpMap: createCraterMap('#d14924', '#551505', true),
      bumpScale: 0.06,
      roughness: 0.88,
      metalness: 0.08
    });
  } else if (pName.includes('Земля')) {
    pMat = new THREE.MeshStandardMaterial({
      map: earthData.map,
      roughnessMap: earthData.roughnessMap,
      metalness: 0.15,
      roughness: 0.65
    });
  } else if (pName.includes('Юпитер')) {
    pMat = new THREE.MeshStandardMaterial({
      map: createGasGiantTexture(['#4a2c16', '#87532a', '#d4a373', '#faedcd', '#bc6c25', '#dda15e']),
      roughness: 0.45,
      metalness: 0.05
    });
  } else if (pName.includes('Сатурн')) {
    pMat = new THREE.MeshStandardMaterial({
      map: createGasGiantTexture(['#bfa378', '#dfcb9f', '#9f8558', '#ebd8aa', '#8c734b']),
      roughness: 0.48,
      metalness: 0.05
    });
  } else {
    pMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.6, metalness: 0.1 });
  }

  const planet = new THREE.Mesh(pGeo, pMat);
  planet.userData = { name: cfg.name, desc: cfg.desc };

  const pHitMesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 3 + 1, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
  pHitMesh.userData = { name: cfg.name, desc: cfg.desc };
  planet.add(pHitMesh);
  planetHitMeshes.push(pHitMesh);

  if (pName.includes('Земля')) {
    const cloudGeo = new THREE.SphereGeometry(cfg.radius * 1.025, 64, 64);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: earthData.cloudMap,
      transparent: true,
      opacity: 0.85,
      blending: THREE.NormalBlending
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    planet.add(cloudMesh);
    earthClouds.push(cloudMesh);
  }

  const pivot = new THREE.Group();
  scene.add(pivot);
  pivot.add(planet);
  planet.position.x = cfg.dist;

  if (cfg.ring) {
    const ringGeo = new THREE.RingGeometry(cfg.radius + 0.5, cfg.radius + 2.6, 64);
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 256;
    ringCanvas.height = 1;
    const rCtx = ringCanvas.getContext('2d');
    const rGrad = rCtx.createLinearGradient(0, 0, 256, 0);
    rGrad.addColorStop(0, 'rgba(180, 150, 100, 0.1)');
    rGrad.addColorStop(0.3, 'rgba(215, 185, 130, 0.9)');
    rGrad.addColorStop(0.6, 'rgba(140, 110, 70, 0.3)');
    rGrad.addColorStop(0.85, 'rgba(200, 175, 120, 0.8)');
    rGrad.addColorStop(1, 'rgba(150, 120, 80, 0)');
    rCtx.fillStyle = rGrad;
    rCtx.fillRect(0, 0, 256, 1);
    const ringTex = new THREE.CanvasTexture(ringCanvas);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.2;
    planet.add(ring);
  }

  planets.push({ pivot, speed: cfg.speed, planet });
  planetMeshes.push(planet);
});

// UI
const telescopeBtn = document.getElementById('telescope-btn');
const flyBtn = document.getElementById('fly-btn');
const closeTelescopeBtn = document.getElementById('close-telescope');
const closeFlyBtn = document.getElementById('close-fly');

const telescopeOverlay = document.getElementById('telescope-overlay');
const flyOverlay = document.getElementById('fly-overlay');
const heartOverlay = document.getElementById('heart-easter-egg');
const heartIcon = document.getElementById('heart-icon');
const heartMsg = document.getElementById('heart-msg');
const flashOverlay = document.getElementById('blackhole-flash');
const glitchOverlay = document.getElementById('glitch-flash');
const angelDialog = document.getElementById('angel-dialog');
const darkRoomOverlay = document.getElementById('dark-room-overlay');
const card = document.querySelector('.card');

const planetModal = document.getElementById('planet-modal');
const planetTitle = document.getElementById('planet-title');
const planetDesc = document.getElementById('planet-desc');
const closePlanetModalBtn = document.getElementById('close-planet-modal');

// Меняем текст подсказки в зависимости от устройства
const flyHint = document.getElementById('fly-hint');
if (flyHint) {
  if (isMobile) {
    flyHint.textContent = 'Управление: вращение | зажмите для перемещения';
  } else {
    flyHint.textContent = 'Управление: вращение | зажмите для перемещения';
  }
}

const pixelManOverlay = document.createElement('div');
pixelManOverlay.id = 'pixel-man-overlay';
pixelManOverlay.style.cssText = `
  position: fixed; inset: 0; z-index: 9999; display: none;
  background: rgba(0,0,0,0.3); pointer-events: none;
  justify-content: center; align-items: center;
`;
pixelManOverlay.innerHTML = `
  <div style="
    font-family: 'Courier New', monospace;
    font-size: 48px;
    color: #fff;
    text-shadow: 0 0 20px #ff00ff, 0 0 40px #00ffff;
    text-align: center;
    animation: pulseText 0.3s infinite alternate;
  ">для чего?</div>
`;
document.body.appendChild(pixelManOverlay);

const artifactOverlay = document.createElement('div');
artifactOverlay.id = 'artifact-overlay';
artifactOverlay.style.cssText = `
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  z-index: 9998; display: none; pointer-events: none;
  font-family: 'Courier New', monospace; font-size: 26px;
  color: #fff; text-shadow: 0 0 15px #0ff;
  background: rgba(0,0,0,0.65); padding: 12px 28px; border-radius: 10px;
`;
document.body.appendChild(artifactOverlay);

if (!document.getElementById('crazy-styles')) {
  const style = document.createElement('style');
  style.id = 'crazy-styles';
  style.textContent = `
    @keyframes pulseText {
      from { transform: scale(1); opacity: 0.8; }
      to { transform: scale(1.15); opacity: 1; }
    }
    @keyframes crazyShake {
      0% { transform: translate(0,0) rotate(0deg); }
      10% { transform: translate(-15px,8px) rotate(-3deg); }
      20% { transform: translate(12px,-10px) rotate(4deg); }
      30% { transform: translate(-10px,15px) rotate(-5deg); }
      40% { transform: translate(18px,-5px) rotate(3deg); }
      50% { transform: translate(-8px,12px) rotate(-2deg); }
      60% { transform: translate(10px,-15px) rotate(5deg); }
      70% { transform: translate(-18px,5px) rotate(-4deg); }
      80% { transform: translate(8px,-8px) rotate(2deg); }
      90% { transform: translate(-12px,10px) rotate(-3deg); }
      100% { transform: translate(0,0) rotate(0deg); }
    }
    html, body {
      width: 100vw !important;
      height: 100vh !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      position: fixed !important;
    }
    #bg-canvas {
      width: 100vw !important;
      height: 100vh !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      display: block !important;
    }
    body.crazy-mode {
      animation: crazyShake 0.08s infinite;
    }
    body.crazy-mode #bg-canvas {
      filter: contrast(1.4) saturate(2) hue-rotate(var(--hue, 0deg));
    }
    body.battle-active #clicker-btn,
    body.battle-active .clicker-btn,
    body.battle-active #book-btn,
    body.battle-active .book-btn,
    body.battle-active #rules-btn,
    body.battle-active #fly-overlay {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
}

closePlanetModalBtn.addEventListener('click', () => {
  planetModal.classList.add('hidden');
});

heartIcon.addEventListener('click', () => {
  heartMsg.classList.remove('hidden');
});

telescopeBtn.addEventListener('click', () => {
  card.classList.add('hidden-ui');
  telescopeOverlay.classList.remove('hidden');
  
  const targetPos = new THREE.Vector3(-1800, 700, -2400);
  let progress = 0;
  
  function zoomToMilkyWay() {
    if (progress < 1) {
      progress += 0.02;
      camera.position.lerp(targetPos, 0.04);
      controls.target.lerp(milkyWayGroup.position, 0.04);
      controls.update();
      requestAnimationFrame(zoomToMilkyWay);
    }
  }
  zoomToMilkyWay();
});

flyBtn.addEventListener('click', () => {
  card.classList.add('hidden-ui');
  flyOverlay.classList.remove('hidden');
  controls.autoRotate = false;
  controls.minDistance = 1;
  controls.maxDistance = Infinity;
});

function resetCamera() {
  isBlackHoleActive = false;
  document.body.classList.remove('blackhole-active', 'in-subscene', 'battle-active');
  card.classList.remove('hidden-ui');
  telescopeOverlay.classList.add('hidden');
  flyOverlay.classList.add('hidden');
  angelDialog.classList.add('hidden');
  planetModal.classList.add('hidden');
  darkRoomOverlay.classList.add('hidden');
  pixelManOverlay.style.display = 'none';

  // Жесткая фиксация исходной точки камеры и угла обзора
  camera.position.set(0, 30, 70);
  controls.target.set(0, 0, 0);
  controls.minDistance = 1;
  controls.maxDistance = Infinity;
  controls.autoRotate = true;
  controls.enableZoom = true;
  controls.update();

  // Окна регистрации, статистики и оверлей кликера ОСТАЮТСЯ скрытыми
  const keepHidden = [
    '#clicker-overlay', '.clicker-ui', '#rules-modal', '.book-modal', '#quest-book', '#guide-modal',
    '#reg-modal', '.reg-modal', '#admin-modal', '#stats-modal', '.modal'
  ];
  keepHidden.forEach(sel => {
    try {
      document.querySelectorAll(sel).forEach(modal => {
        modal.classList.add('hidden');
        modal.style.setProperty('display', 'none', 'important');
      });
    } catch (e) {}
  });

  // Гарантированно возвращаем видимость кнопкам КЛИКЕР и КНИЖКА при выходе в открытый космос
  function forceRestoreButtons() {
    document.body.classList.remove('blackhole-active', 'in-subscene', 'crazy-mode');
    document.documentElement.style.setProperty('--hue', '0deg');
    
    // 1. Восстанавливаем кнопку КЛИКЕР (со скриншота)
    document.querySelectorAll('#clicker-btn, .clicker-btn, [id*="clicker-btn"], [class*="clicker-btn"]').forEach(btn => {
      btn.classList.remove('hidden');
      btn.style.removeProperty('display');
      btn.style.removeProperty('opacity');
      btn.style.removeProperty('pointer-events');
      btn.style.removeProperty('visibility');
      btn.style.display = '';
    });
    document.querySelectorAll('button, a, div').forEach(el => {
      if (el.children.length <= 1 && (el.textContent || '').trim() === 'КЛИКЕР') {
        el.classList.remove('hidden');
        el.style.display = '';
      }
    });

    // 2. Восстанавливаем кнопку КНИЖКА справа внизу (со скриншота)
    document.querySelectorAll('#book-btn, .book-btn, #rules-btn, #journal-btn, [id*="book-btn"], [id*="rules-btn"]').forEach(btn => {
      btn.classList.remove('hidden');
      btn.style.removeProperty('display');
      btn.style.removeProperty('opacity');
      btn.style.removeProperty('pointer-events');
      btn.style.removeProperty('visibility');
      btn.style.display = '';
    });

    // 3. Восстанавливаем кнопку чата (иконка сообщения слева)
    document.querySelectorAll('#chat-btn, .chat-btn, [id*="chat-toggle"], [class*="chat-toggle"]').forEach(btn => {
      btn.classList.remove('hidden');
      btn.style.display = '';
    });

    // 4. Восстанавливаем блок управления по центру 'Завершить исследование' и 'Управление: вращение...'
    if (flyOverlay) {
      flyOverlay.classList.remove('hidden');
      flyOverlay.style.display = '';
    }
    const flyHintEl = document.getElementById('fly-hint');
    if (flyHintEl) flyHintEl.style.display = '';
    const closeFly = document.getElementById('close-fly');
    if (closeFly) closeFly.style.display = '';
  }
  forceRestoreButtons();
  window.__restoreSpaceButtons = forceRestoreButtons;

  // Синхронизация видимости интерфейса в свободном космосе
  setInterval(function () {
    var ck = document.getElementById('clicker-overlay');
    var isClickerOpen = !!(ck && !ck.classList.contains('hidden') && ck.style.display !== 'none');
    var isBattleOpen = !!(window.inBlackHoleMode || document.body.classList.contains('battle-active') || document.body.classList.contains('blackhole-active') || document.querySelector('.battle-room-active, #battle-overlay:not(.hidden)'));
    
    if (!isClickerOpen && !isBattleOpen && !inDarkRoom && !isConsuming) {
      const cBtn = document.getElementById('clicker-btn') || document.querySelector('.clicker-btn');
      if (cBtn && (cBtn.classList.contains('hidden') || cBtn.style.display === 'none')) {
        if (typeof setSpaceUIVisible === 'function') {
          setSpaceUIVisible(true);
        }
      }
    }
  }, 350);

  // Автоматический возврат кнопок при закрытии баттл-арены (отслеживание battle-active)
  if (!window.__battleObserverAttached) {
    window.__battleObserverAttached = true;
    const bObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'class') {
          const isBattle = document.body.classList.contains('battle-active');
          if (!isBattle && (document.body.classList.contains('blackhole-active') || document.body.classList.contains('in-subscene') || isConsuming)) {
            isConsuming = false;
            resetCamera();
            forceRestoreButtons();
          }
        }
      });
    });
    bObserver.observe(document.body, { attributes: true });

    // Слушатель клика по любым элементам закрытия арены и ESC
    document.addEventListener('click', function (e) {
      const t = e.target;
      if (t && (t.closest('.battle-close') || t.closest('#battle-close') || t.closest('[data-action="battle-exit"]') || t.closest('.battle-exit-btn') || t.closest('.battle-back-btn'))) {
        setTimeout(function() {
          resetCamera();
          forceRestoreButtons();
        }, 50);
        setTimeout(function() {
          resetCamera();
          forceRestoreButtons();
        }, 300);
      }
    }, true);

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        setTimeout(forceRestoreButtons, 60);
      }
    });
  }
  artifactOverlay.style.display = 'none';
  document.body.classList.remove('crazy-mode');
  document.body.style.filter = '';
  document.documentElement.style.setProperty('--hue', '0deg');
  
  isAngelTriggered = false;
  isPixelManTriggered = false;
  isErrorTriggered = false;
  if (dragonFireCleanup) { dragonFireCleanup(); dragonFireCleanup = null; }
  if (dragonHeatCleanup) { dragonHeatCleanup(); dragonHeatCleanup = null; }
  isDragonTriggered = false;
  inDarkRoom = false;
  darkRoomPressLock = false;
  controls.autoRotate = true;
  controls.enableZoom = true;
  controls.minDistance = 1;
  controls.maxDistance = Infinity;
  camera.position.set(0, 30, 70);
  controls.target.set(0, 0, 0);
  controls.update();
  
  if (typeof forceRestoreButtons === 'function') {
    forceRestoreButtons();
  }
}

closeTelescopeBtn.addEventListener('click', resetCamera);
closeFlyBtn.addEventListener('click', resetCamera);

// ==================== КЛИКИ + ТАПЫ (телефон + компьютер) ====================

function getPointerPosition(e) {
  if (e.changedTouches && e.changedTouches.length > 0) {
    return {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
  }
  return {
    x: e.clientX,
    y: e.clientY
  };
}


// ==================== SCREEN FX (клики по объектам) ====================
(function () {
  var fx = document.createElement("div");
  fx.id = "space-fx";
  fx.style.cssText = "position:fixed;inset:0;z-index:9998;pointer-events:none;opacity:0;transition:opacity .18s ease;mix-blend-mode:screen;";
  document.body.appendChild(fx);

  var label = document.createElement("div");
  label.id = "space-fx-label";
  label.style.cssText = "position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:9999;pointer-events:none;font-family:Segoe UI,sans-serif;font-size:19px;font-weight:700;letter-spacing:2px;color:#fff;text-shadow:0 0 22px rgba(120,190,255,.9),0 0 50px rgba(90,60,255,.6);opacity:0;transition:opacity .25s ease,transform .35s cubic-bezier(.2,.9,.3,1.3);white-space:nowrap;";
  document.body.appendChild(label);

  var busy = false;
  function runLabel(text) {
    label.textContent = text;
    label.style.transition = "none";
    label.style.opacity = "0";
    label.style.transform = "translateX(-50%) translateY(14px) scale(.9)";
    requestAnimationFrame(function () {
      label.style.transition = "opacity .28s ease, transform .38s cubic-bezier(.2,.9,.3,1.3)";
      label.style.opacity = "1";
      label.style.transform = "translateX(-50%) translateY(0) scale(1)";
    });
    clearTimeout(runLabel._t);
    runLabel._t = setTimeout(function () {
      label.style.opacity = "0";
      label.style.transform = "translateX(-50%) translateY(-14px) scale(.94)";
    }, 1500);
  }

  // стили тряски выносим один раз
  var sh = document.createElement("style");
  sh.textContent = "@keyframes fxShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-7px,4px)}40%{transform:translate(6px,-5px)}60%{transform:translate(-4px,-3px)}80%{transform:translate(5px,4px)}}"
    + ".fx-shake{animation:fxShake .42s cubic-bezier(.36,.07,.19,.97)}"
    + "@keyframes fxPulse{0%{filter:brightness(1)}35%{filter:brightness(2.6) saturate(1.7)}100%{filter:brightness(1)}}"
    + ".fx-pulse{animation:fxPulse .5s ease-out}";
  document.head.appendChild(sh);

  function bodyFx(cls, ms) {
    document.body.classList.add(cls);
    setTimeout(function () { document.body.classList.remove(cls); }, ms || 520);
  }

  function overlay(color, a, ms) {
    if (busy) return;
    busy = true;
    fx.style.background = color;
    fx.style.opacity = String(a);
    setTimeout(function () { fx.style.opacity = "0"; busy = false; }, ms || 320);
  }

  // 21 эффект — по одному на каждый объект
  var FX = {
    ringworld:  function () { overlay("radial-gradient(circle at 50% 50%, rgba(255,220,140,.85), rgba(255,140,40,.3) 45%, transparent 75%)", 0.5, 420); runLabel("КОЛЬЦЕВОЙ МИР · ОБИТАЕМ"); },
    dyson:      function () { overlay("radial-gradient(circle at 50% 50%, rgba(255,240,180,.95), rgba(255,150,40,.35) 50%, transparent 80%)", 0.62, 520); bodyFx("fx-pulse", 520); runLabel("СФЕРА ДАЙСОНА · ЗАРЯД"); },
    station:    function () { overlay("linear-gradient(180deg, rgba(140,200,255,.35), transparent 60%)", 0.45, 340); runLabel("СТАНЦИЯ · СТЫКОВКА РАЗРЕШЕНА"); },
    ark:        function () { overlay("linear-gradient(90deg, rgba(120,180,255,.5), transparent 70%)", 0.5, 420); runLabel("КОВЧЕГ · ДВИГАТЕЛИ ЗАПУЩЕНЫ"); },
    crystal:    function () { overlay("radial-gradient(circle at 50% 50%, rgba(190,250,255,.9), rgba(0,190,255,.35) 45%, transparent 78%)", 0.6, 400); runLabel("КРИСТАЛЛ · РЕЗОНАНС"); },
    comet:      function () { overlay("linear-gradient(270deg, transparent, rgba(200,240,255,.55))", 0.5, 360); runLabel("КОМЕТА · ХВОСТ РАСТЁТ"); },
    binary:     function () { overlay("radial-gradient(circle at 35% 45%, rgba(255,220,150,.7), transparent 55%), radial-gradient(circle at 65% 55%, rgba(150,210,255,.7), transparent 55%)", 0.55, 480); runLabel("ДВОЙНАЯ ЗВЕЗДА · СЛИЯНИЕ"); },
    protoplanet:function () { overlay("radial-gradient(circle at 50% 50%, rgba(255,240,200,.75), rgba(255,170,70,.28) 50%, transparent 80%)", 0.5, 460); runLabel("ПРОТОПЛАНЕТА · АККРЕЦИЯ"); },
    quasar:     function () { overlay("linear-gradient(0deg, rgba(160,220,255,.6), transparent 45%, rgba(160,220,255,.6))", 0.6, 440); bodyFx("fx-pulse", 440); runLabel("КВАЗАР · ДЖЕТЫ АКТИВНЫ"); },
    beacon:     function () { overlay("radial-gradient(circle at 50% 50%, rgba(255,120,120,.5), transparent 65%)", 0.45, 380); runLabel("МАЯК · СИГНАЛ ОТПРАВЛЕН"); },
    portal:     function () { overlay("radial-gradient(circle at 50% 50%, rgba(200,160,255,.95), rgba(90,30,200,.4) 48%, transparent 80%)", 0.65, 520); bodyFx("fx-shake", 420); runLabel("ПОРТАЛ · ОТКРЫТИЕ"); },
    fleet:      function () { overlay("linear-gradient(180deg, transparent 40%, rgba(150,200,255,.45))", 0.4, 340); runLabel("ФЛОТ · КУРС ПОСТРОЕН"); },
    tether:     function () { overlay("linear-gradient(0deg, rgba(190,220,255,.5), transparent 55%)", 0.42, 360); runLabel("ЛИФТ · ПОДЪЁМ"); },
    gasgiant:   function () { overlay("radial-gradient(circle at 62% 58%, rgba(220,110,60,.7), rgba(255,190,120,.28) 45%, transparent 78%)", 0.55, 460); runLabel("ШТОРМ · КАТЕГОРИЯ 5"); },
    eye:        function () { overlay("radial-gradient(circle at 50% 50%, rgba(150,120,255,.6), rgba(40,10,90,.5) 50%, transparent 85%)", 0.6, 520); runLabel("ГЛАЗ · ОН СМОТРИТ"); },
    ringdebris: function () { overlay("linear-gradient(45deg, rgba(220,200,140,.4), transparent 60%)", 0.4, 340); runLabel("ОСКОЛКИ · ДРЕВНЕЕ КОЛЬЦО"); },
    whale:      function () { overlay("radial-gradient(circle at 50% 60%, rgba(120,180,255,.5), transparent 70%)", 0.45, 480); runLabel("КИТ · ЗОВ В ТЕМНОТЕ"); },
    monolith:   function () { overlay("linear-gradient(180deg, rgba(130,235,255,.55), rgba(0,60,120,.35))", 0.55, 480); bodyFx("fx-shake", 420); runLabel("МОНОЛИТ · КОНТАКТ"); },
    temple:     function () { overlay("radial-gradient(circle at 50% 30%, rgba(255,235,180,.8), rgba(255,180,60,.3) 48%, transparent 78%)", 0.58, 500); runLabel("ХРАМ · ПРОБУЖДЕНИЕ"); },
    darkstar:   function () { overlay("radial-gradient(circle at 50% 50%, rgba(255,245,210,.85), transparent 38%), radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,.75) 62%)", 0.7, 560); bodyFx("fx-shake", 480); runLabel("ТЁМНАЯ ЗВЕЗДА · ЛИНЗА"); },
    pixel:      function () { overlay("repeating-linear-gradient(0deg, rgba(80,255,120,.28) 0 3px, transparent 3px 6px)", 0.6, 420); bodyFx("fx-pulse", 420); runLabel("8-BIT СЕКТОР · УРОВЕНЬ 1"); }
  };

  var NAMES = {
    ringworld: "Кольцевой мир", dyson: "Сфера Дайсона", station: "Станция-тор",
    ark: "Корабль-ковчег", crystal: "Кристаллический астероид", comet: "Ледяная комета",
    binary: "Двойная звезда", protoplanet: "Протопланетный диск", quasar: "Квазар",
    beacon: "Космический маяк", portal: "Портал-аномалия", fleet: "Флот",
    tether: "Орбитальный лифт", gasgiant: "Газовый гигант", eye: "Туманность-глаз",
    ringdebris: "Осколки кольца", whale: "Космический кит", monolith: "Монолит",
    temple: "Храм-корабль", darkstar: "Тёмная звезда", pixel: "Пиксель-сектор"
  };

  window.__spaceFX = {
    fire: function (kind) {
      var f = FX[kind];
      if (f) f();
      return !!f;
    },
    name: function (kind) { return NAMES[kind] || kind; }
  };
})();

function handleInteraction(e) {
  if (document.body.classList.contains('battle-active')) return; // арена открыта — 3D не трогаем
  if (isConsuming || isAngelTriggered || isPixelManTriggered || isErrorTriggered || isDragonTriggered) return;

  // Не реагируем на кнопки и карточку
  if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.card') || e.target.closest('.planet-modal') || e.target.closest('.clicker-ui')) {
    return;
  }

  const pos = getPointerPosition(e);

  mouse.x = (pos.x / window.innerWidth) * 2 - 1;
  mouse.y = -(pos.y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // ---- дальние объекты v3: приоритетный пикинг по сферам ----
  if (window.__spaceExtras && window.__spaceExtras.pick) {
    const deep = window.__spaceExtras.pick(raycaster);
    if (deep) {
      if (window.__spaceFX) window.__spaceFX.fire(deep.kind);
      return;
    }
  }

  if (inDarkRoom) {
    // Первое отпускание после входа по нажатию — глотаем, чтобы не сбросить комнату мгновенно
    if (darkRoomPressLock) {
      darkRoomPressLock = false;
      return;
    }
    const doorHits = raycaster.intersectObject(whiteDoor);
    if (doorHits.length > 0) resetCamera();
    return;
  }

  // ERRORR
  const errorHits = raycaster.intersectObject(errorMesh);
  if (errorHits.length > 0) {
    triggerErrorLag();
    return;
  }

  // Корабль
  const shipHits = raycaster.intersectObject(shipHitbox);
  if (shipHits.length > 0) {
    triggerShipBoost();
    return;
  }

  // Пиксельный человечек
  const manHits = raycaster.intersectObject(manHitbox);
  if (manHits.length > 0) {
    triggerPixelMan();
    return;
  }

  // Артефакты
  const artHits = raycaster.intersectObjects(artifactMeshes);
  if (artHits.length > 0) {
    const hit = artHits[0].object;
    const parent = hit.parent;
    if (!parent.userData.collected) {
      triggerArtifact(parent);
    }
    return;
  }

  // Чёрная дыра
  const bhHits = raycaster.intersectObject(bhCore);
  if (bhHits.length > 0) {
    triggerBlackHoleEvent();
    return;
  }

  // Ангел
  const angelHits = raycaster.intersectObject(angelBody);
  if (angelHits.length > 0) {
    triggerAngelEvent();
    return;
  }

  const dragonHits = raycaster.intersectObject(dragonHitbox);
  if (dragonHits.length > 0) {
    triggerDragonFire();
    return;
  }

  const mikuHits = raycaster.intersectObject(mikuHitbox);
  if (mikuHits.length > 0) {
    triggerMikuConcert();
    return;
  }

  const stationHits = raycaster.intersectObjects(stationHitboxes);
  if (stationHits.length > 0) {
    artifactOverlay.textContent = 'Станция: стыковка разрешена';
    artifactOverlay.style.display = 'block';
    setTimeout(() => { artifactOverlay.style.display = 'none'; }, 2600);
    return;
  }

  const astHits = raycaster.intersectObjects(asteroidHitboxes);
  if (astHits.length > 0) {
    artifactOverlay.textContent = 'Астероид';
    artifactOverlay.style.display = 'block';
    setTimeout(() => { artifactOverlay.style.display = 'none'; }, 2000);
    return;
  }

  const debHits = raycaster.intersectObjects(debrisHitboxes);
  if (debHits.length > 0) {
    artifactOverlay.textContent = 'Обломки корабля';
    artifactOverlay.style.display = 'block';
    setTimeout(() => { artifactOverlay.style.display = 'none'; }, 1800);
    return;
  }

  const statueHits = raycaster.intersectObjects(statueHitboxes);
  if (statueHits.length > 0) {
    collectStatue(statueHits[0].object.userData.statueIndex);
    return;
  }

  // Млечный Путь — вход ТОЛЬКО если нажатие/тап начались на галактике
  // (обрабатывается в handleMilkyWayPress / handleMilkyWayRelease).
  // Отжатие здесь галактику больше не открывает.
  const mwHits = raycaster.intersectObject(mwHitbox);
  if (mwHits.length > 0) {
    return;
  }

  // Планеты
  const planetHits = raycaster.intersectObjects(planetHitMeshes);
  if (planetHits.length > 0) {
    const hitPlanet = planetHits[0].object;
    planetTitle.textContent = hitPlanet.userData.name;
    planetDesc.textContent = hitPlanet.userData.desc;
    planetModal.classList.remove('hidden');
    return;
  }
}

// Компьютер
window.addEventListener('click', handleInteraction);

// Телефон
window.addEventListener('touchend', (e) => {
  // Небольшая задержка, чтобы не конфликтовать с OrbitControls
  setTimeout(() => {
    handleInteraction(e);
  }, 15);
}, { passive: true });

function enterDarkRoom() {
  inDarkRoom = true;
  darkRoomPressLock = true;
  mwPressCandidate = null;
  document.body.classList.add('blackhole-active', 'in-subscene');
  card.classList.add('hidden-ui');
  telescopeOverlay.classList.add('hidden');
  flyOverlay.classList.add('hidden');
  controls.autoRotate = false;
  controls.enableZoom = false;
  
  const hideAllModals = [
    '#clicker-overlay', '#clicker-btn', '.clicker-ui', '.clicker-btn',
    '#book-btn', '.book-btn', '#rules-btn', '#journal-btn', '#quest-book',
    '#rules-modal', '.book-modal', '#guide-modal', '#instructions-modal',
    '#reg-modal', '.reg-modal', '#admin-modal', '#stats-modal', '.modal'
  ];
  hideAllModals.forEach(sel => {
    try {
      document.querySelectorAll(sel).forEach(el => {
        el.style.setProperty('display', 'none', 'important');
        el.classList.add('hidden');
      });
    } catch (e) {}
  });
  
  darkRoomOverlay.classList.remove('hidden');
  camera.position.set(15000, 15000, 15040);
  controls.target.set(15000, 15000, 15000);
  controls.update();
}

function setSpaceUIVisible(visible) {
  const uiTargets = document.querySelectorAll('#clicker-btn, .clicker-btn, [id*="clicker-btn"], #book-btn, .book-btn, #rules-btn, #journal-btn, [id*="book-btn"], #chat-btn, .chat-btn, [class*="chat-toggle"], #fly-overlay');
  
  if (visible) {
    inBlackHoleMode = false;
    document.body.classList.remove('battle-active', 'blackhole-active', 'in-subscene');
    uiTargets.forEach(el => {
      el.classList.remove('hidden');
      el.style.removeProperty('display');
      el.style.removeProperty('opacity');
      el.style.removeProperty('visibility');
      el.style.removeProperty('pointer-events');
      el.style.display = '';
    });
    document.querySelectorAll('button, a, div').forEach(el => {
      if (el.children.length <= 1 && (el.textContent || '').trim() === 'КЛИКЕР') {
        el.classList.remove('hidden');
        el.style.display = '';
      }
    });
  } else {
    inBlackHoleMode = true;
    document.body.classList.add('battle-active', 'blackhole-active', 'in-subscene');
    uiTargets.forEach(el => {
      el.classList.add('hidden');
      el.style.setProperty('display', 'none', 'important');
    });
    document.querySelectorAll('button, a, div').forEach(el => {
      if (el.children.length <= 1 && (el.textContent || '').trim() === 'КЛИКЕР') {
        el.classList.add('hidden');
        el.style.setProperty('display', 'none', 'important');
      }
    });
    if (card) { card.classList.add('hidden-ui'); }
    if (telescopeOverlay) { telescopeOverlay.classList.add('hidden'); }
  }
}

function triggerBlackHoleEvent() {
  isBlackHoleActive = true;
  isConsuming = true;
  consumeTimer = 0;
  blackHoleGroup.position.set(300, 100, -400);
  blackHoleGroup.scale.set(1, 1, 1);
  controls.autoRotate = false;

  // Жестко скрываем UI и блокируем его возврат до закрытия арены
  setSpaceUIVisible(false);

  setTimeout(function () {
    isConsuming = false;
    blackHoleGroup.scale.set(1, 1, 1);
    blackHoleGroup.position.set(300, 100, -400);
    
    if (window.BattleRoom && typeof window.BattleRoom.open === 'function') {
      var bn = '';
      try { bn = sessionStorage.getItem('spaceChatNick') || ''; } catch (e) {}
      
      if (!window.__battleClosePatched && typeof window.BattleRoom.close === 'function') {
        window.__battleClosePatched = true;
        var origClose = window.BattleRoom.close;
        window.BattleRoom.close = function() {
          origClose.apply(this, arguments);
          isBlackHoleActive = false;
          blackHoleGroup.scale.set(1, 1, 1);
          blackHoleGroup.position.set(300, 100, -400);
          resetCamera();
          setSpaceUIVisible(true);
        };
      }
      
      window.BattleRoom.open(bn);
    } else {
      console.warn('[battle] battle.js не загружен — арена недоступна');
      resetCamera();
      setSpaceUIVisible(true);
    }
  }, 900);
}

function triggerAngelEvent() {
  isAngelTriggered = true;
  card.classList.add('hidden-ui');
  flyOverlay.classList.add('hidden');
  controls.autoRotate = false;
  
  const angelTarget = angelGroup.position.clone().add(new THREE.Vector3(0, 5, 30));
  camera.position.copy(angelTarget);
  controls.target.copy(angelGroup.position);
  controls.update();
  
  angelDialog.classList.remove('hidden');
  
  setTimeout(() => {
    angelDialog.classList.add('hidden');
    document.body.classList.add('shake-screen');
    
    setTimeout(() => {
      document.body.classList.remove('shake-screen');
      glitchOverlay.classList.add('active');
      
      let count = 0;
      const totalColors = 666;
      const intervalTime = 5000 / totalColors;
      
      const colorInterval = setInterval(() => {
        if (count === 0) {
          glitchOverlay.style.background = '#ff0000';
        } else {
          const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
          glitchOverlay.style.background = randomColor;
        }
        count++;
        
        if (count >= totalColors) {
          clearInterval(colorInterval);
          glitchOverlay.classList.remove('active');
          glitchOverlay.style.background = '';
          resetCamera();
        }
      }, intervalTime);
      
    }, 400);
  }, 2500);
}

function triggerPixelMan() {
  isPixelManTriggered = true;
  card.classList.add('hidden-ui');
  telescopeOverlay.classList.add('hidden');
  flyOverlay.classList.add('hidden');
  controls.autoRotate = false;
  controls.enableZoom = false;

  const targetPos = pixelManGroup.position.clone().add(new THREE.Vector3(0, 3, 18));
  camera.position.copy(targetPos);
  controls.target.copy(pixelManGroup.position.clone().add(new THREE.Vector3(0, 2, 0)));
  controls.update();

  pixelManOverlay.style.display = 'flex';
  document.body.classList.add('crazy-mode');
  pixelManShakeTimer = 0;

  let hue = 0;
  const crazyInterval = setInterval(() => {
    hue = (hue + 40 + Math.random() * 80) % 360;
    document.documentElement.style.setProperty('--hue', hue + 'deg');
    
    const filters = [
      `contrast(${1 + Math.random()}) saturate(${1.5 + Math.random() * 2}) hue-rotate(${hue}deg)`,
      `invert(${Math.random() > 0.7 ? 1 : 0}) contrast(1.8) hue-rotate(${hue}deg)`,
      `blur(${Math.random() * 2}px) contrast(1.5) saturate(3) hue-rotate(${hue}deg)`,
      `sepia(0.6) hue-rotate(${hue}deg) contrast(1.4)`
    ];
    const canvasEl = document.getElementById('bg-canvas');
    if (canvasEl) canvasEl.style.filter = filters[Math.floor(Math.random() * filters.length)];
  }, 120);

  setTimeout(() => {
    clearInterval(crazyInterval);
    document.body.classList.remove('crazy-mode');
    document.body.style.filter = '';
    const canvasEl = document.getElementById('bg-canvas');
    if (canvasEl) canvasEl.style.filter = '';
    document.documentElement.style.setProperty('--hue', '0deg');
    pixelManOverlay.style.display = 'none';
    isPixelManTriggered = false;
    resetCamera();
  }, 10000);
}

function triggerErrorLag() {
  isErrorTriggered = true;
  card.classList.add('hidden-ui');
  
  const lagContainer = document.createElement('div');
  lagContainer.id = 'lag-container';
  lagContainer.style.cssText = 'position:fixed;inset:0;z-index:10000;pointer-events:none;overflow:hidden;';
  document.body.appendChild(lagContainer);

  for (let i = 0; i < 180; i++) {
    const c = document.createElement('canvas');
    c.width = 300 + Math.random() * 400;
    c.height = 200 + Math.random() * 300;
    c.style.cssText = `
      position: absolute;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      opacity: ${0.3 + Math.random() * 0.5};
      transform: rotate(${Math.random() * 360}deg) scale(${0.5 + Math.random()});
      filter: hue-rotate(${Math.random() * 360}deg);
    `;
    const ctx = c.getContext('2d');
    ctx.fillStyle = `rgb(${Math.random()*255},${Math.random()*50},${Math.random()*50})`;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 40px monospace';
    ctx.fillText('ERRORR', 20, 80);
    ctx.fillText(Math.random().toString(36).substring(2, 12).toUpperCase(), 20, 140);
    lagContainer.appendChild(c);
  }

  let heavy = 0;
  const heavyInterval = setInterval(() => {
    for (let i = 0; i < 50000; i++) {
      heavy += Math.sin(i) * Math.cos(i * 1.1);
    }
  }, 16);

  setTimeout(() => {
    clearInterval(heavyInterval);
    lagContainer.remove();
    isErrorTriggered = false;
    resetCamera();
  }, 6000);
}

// Корабль — просто ускоряется (без надписи)
function triggerShipBoost() {
  shipBoost = true;
  shipBoostTimer = 0;
}

// Сбор артефактов + бонус за полный набор типа
function triggerArtifact(group) {
  if (group.userData.collected) return;
  
  group.userData.collected = true;
  const type = group.userData.type;
  collected[type]++;

  // Визуально "собираем" — уменьшаем и делаем полупрозрачным
  group.scale.set(0.3, 0.3, 0.3);
  group.children.forEach(c => {
    if (c.material) {
      c.material.transparent = true;
      c.material.opacity = 0.25;
    }
  });

  // Обычный эффект при сборе
  const effects = [
    () => { document.body.style.filter = `hue-rotate(${Math.random()*360}deg) contrast(1.4)`; setTimeout(() => document.body.style.filter = '', 700); },
    () => { document.body.classList.add('crazy-mode'); setTimeout(() => document.body.classList.remove('crazy-mode'), 500); },
    () => { document.body.style.filter = 'invert(1)'; setTimeout(() => document.body.style.filter = '', 400); },
    () => { group.scale.set(1.8, 1.8, 1.8); setTimeout(() => group.scale.set(0.3, 0.3, 0.3), 600); },
  ];
  effects[group.userData.index % effects.length]();

  // Проверяем, собраны ли ВСЕ фигуры этого типа
  if (collected[type] >= totalByType[type]) {
    // ОСОБЫЙ ЭФФЕКТ ЗА ПОЛНЫЙ НАБОР
    triggerFullSetBonus(type);
  } else {
    artifactOverlay.textContent = `${group.userData.name}: ${collected[type]}/${totalByType[type]}`;
    artifactOverlay.style.display = 'block';
    setTimeout(() => artifactOverlay.style.display = 'none', 1800);
  }
}

function triggerFullSetBonus(type) {
  const messages = {
    crystal: '✦ ВСЕ КРИСТАЛЛЫ СОБРАНЫ ✦',
    eye: 'ВСЕ ГЛАЗА ОТКРЫТЫ',
    cube: 'ВСЕ КУБЫ АКТИВИРОВАНЫ',
    ring: 'ВСЕ КОЛЬЦА ЗАМКНУТЫ',
    spike: 'ВСЕ ШИПЫ ВОССОЕДИНЕНЫ',
    orb: 'ВСЕ СФЕРЫ СЛИЛИСЬ',
    cross: 'ВСЕ КРЕСТЫ СОЕДИНЕНЫ',
    pyramid: 'ВСЕ ПИРАМИДЫ ВОЗНЕСЕНЫ'
  }

  artifactOverlay.textContent = messages[type] || 'НАБОР СОБРАН!';
  artifactOverlay.style.display = 'block';
  artifactOverlay.style.fontSize = '32px';
  artifactOverlay.style.color = '#ff0';

  // Мощный эффект
  document.body.classList.add('crazy-mode');
  let hue = 0;
  const bonusInterval = setInterval(() => {
    hue = (hue + 60) % 360;
    document.documentElement.style.setProperty('--hue', hue + 'deg');
    document.body.style.filter = `hue-rotate(${hue}deg) contrast(1.8) saturate(2.5)`;
  }, 80);

  // Все артефакты этого типа ярко вспыхивают
  artifacts.forEach(a => {
    if (a.userData.type === type) {
      a.scale.set(2.5, 2.5, 2.5);
      a.children.forEach(c => {
        if (c.material) {
          c.material.opacity = 1;
          c.material.color.setHex(0xffffff);
        }
      });
    }
  });

  setTimeout(() => {
    clearInterval(bonusInterval);
    document.body.classList.remove('crazy-mode');
    document.body.style.filter = '';
    document.documentElement.style.setProperty('--hue', '0deg');
    artifactOverlay.style.display = 'none';
    artifactOverlay.style.fontSize = '26px';
    artifactOverlay.style.color = '#fff';

    // Возвращаем собранные артефакты в "собранное" состояние
    artifacts.forEach(a => {
      if (a.userData.type === type && a.userData.collected) {
        a.scale.set(0.3, 0.3, 0.3);
        a.children.forEach(c => {
          if (c.material) {
            c.material.opacity = 0.25;
          }
        });
      }
    });
  }, 4500);
}

var bhAudio={ctx:null,gain:null,started:false};
var errAudio={ctx:null,gain:null};
var stAudioList=[];
function audioStart(){
  if(bhAudio.started)return; bhAudio.started=true;
  try{var AC=window.AudioContext||window.webkitAudioContext;
  bhAudio.ctx=new AC();var g=bhAudio.ctx.createGain();g.gain.value=0;g.connect(bhAudio.ctx.destination);bhAudio.gain=g;
  var o1=bhAudio.ctx.createOscillator();o1.type=sinT();var o2=bhAudio.ctx.createOscillator();o2.type=sinT();
  o1.frequency.value=38;o2.frequency.value=57.3;
  var og=bhAudio.ctx.createGain();og.gain.value=0.5;o1.connect(og);o2.connect(og);og.connect(g);o1.start();o2.start();
  var nb=bhAudio.ctx.createBuffer(1,bhAudio.ctx.sampleRate*2,bhAudio.ctx.sampleRate);
  var nd=nb.getChannelData(0);for(var i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
  var ns=bhAudio.ctx.createBufferSource();ns.buffer=nb;ns.loop=true;
  var nf=bhAudio.ctx.createBiquadFilter();nf.type=lowT();nf.frequency.value=220;
  var ng=bhAudio.ctx.createGain();ng.gain.value=0.4;ns.connect(nf);nf.connect(ng);ng.connect(g);ns.start();
  for(var si=0;si<stations.length;si++){
    var sc=new AC();var sg=sc.createGain();sg.gain.value=0;sg.connect(sc.destination);
    var so=sc.createOscillator();so.type=triT();so.frequency.value=82+((si*37)%46)+Math.abs(stations[si].position.x%23);
    var so2=sc.createOscillator();so2.type=sinT();so2.frequency.value=so.frequency.value*1.5;
    var sog=sc.createGain();sog.gain.value=0.35;so.connect(sog);so2.connect(sog);sog.connect(sg);so.start();so2.start();
    stAudioList.push({node:stations[si],gain:sg,ctx:sc});}
  var ec=new AC();var eg=ec.createGain();eg.gain.value=0;eg.connect(ec.destination);
  var eo=ec.createOscillator();eo.type=sawT();eo.frequency.value=110;
  var ef=ec.createBiquadFilter();ef.type=bandT();ef.frequency.value=400;ef.Q.value=2;
  eo.connect(ef);ef.connect(eg);eo.start();
  var el=ec.createOscillator();el.frequency.value=6;
  var elg=ec.createGain();elg.gain.value=60;el.connect(elg);elg.connect(eo.frequency);el.start();
  errAudio.ctx=ec;errAudio.gain=eg;}catch(e){}}
function sinT(){return "sine";}function triT(){return "triangle";}function sawT(){return "sawtooth";}function lowT(){return "lowpass";}function bandT(){return "bandpass";}
function audioResume(){
  try{if(bhAudio.ctx&&bhAudio.ctx.state==="suspended")bhAudio.ctx.resume();}catch(e){}
  try{if(errAudio.ctx&&errAudio.ctx.state==="suspended")errAudio.ctx.resume();}catch(e){}
  for(var i=0;i<stAudioList.length;i++){try{if(stAudioList[i].ctx.state==="suspended")stAudioList[i].ctx.resume();}catch(e){}}
}
document.addEventListener("click",audioResume);
document.addEventListener("touchstart",audioResume);
document.addEventListener("touchend",audioResume);
document.addEventListener("click",audioStart);document.addEventListener("touchstart",audioStart);
function animate() {
  requestAnimationFrame(animate);
  var _ckMute = document.getElementById('clicker-overlay');
  if (_ckMute && !_ckMute.classList.contains('hidden')) {
    try { if (bhAudio.gain) bhAudio.gain.gain.setTargetAtTime(0, bhAudio.ctx.currentTime, 0.05); } catch (e) {}
    try { if (errAudio.gain) errAudio.gain.gain.setTargetAtTime(0, errAudio.ctx.currentTime, 0.05); } catch (e) {}
    for (var _cksi = 0; _cksi < stAudioList.length; _cksi++) { try { stAudioList[_cksi].gain.gain.setTargetAtTime(0, stAudioList[_cksi].ctx.currentTime, 0.05); } catch (e) {} }
    return;
  }
  var _ckOv = document.getElementById('clicker-overlay');
  if (_ckOv && !_ckOv.classList.contains('hidden')) return;
  var _ckOv = document.getElementById('clicker-overlay');
  if (_ckOv && !_ckOv.classList.contains('hidden')) return;
  if (window.__uiPaused) {
    // Арена открыта: плавно глушим весь звук космоса (ЧД, ERRORR, станции).
    // Раньше return стоял до обновления громкости — gain застревал на последнем значении.
    try { if (bhAudio.gain) bhAudio.gain.gain.setTargetAtTime(0, bhAudio.ctx.currentTime, 0.08); } catch (e) {}
    try { if (errAudio.gain) errAudio.gain.gain.setTargetAtTime(0, errAudio.ctx.currentTime, 0.08); } catch (e) {}
    for (var _sa = 0; _sa < stAudioList.length; _sa++) {
      try { stAudioList[_sa].gain.gain.setTargetAtTime(0, stAudioList[_sa].ctx.currentTime, 0.08); } catch (e) {}
    }
    return;
  }
  
  planets.forEach(p => {
    p.pivot.rotation.y += p.speed;
    p.planet.rotation.y += 0.02;
  });

  if (typeof lensingBillboard !== 'undefined') lensingBillboard.lookAt(camera.position);
  if (typeof darkParallaxCloud !== 'undefined' && typeof darkPData !== 'undefined') {
    const pos = darkParallaxCloud.geometry.attributes.position.array;
    for (let i = 0; i < darkPData.length; i++) {
      darkPData[i].theta += darkPData[i].speed;
      pos[i * 3] = Math.cos(darkPData[i].theta) * darkPData[i].r;
      pos[i * 3 + 2] = Math.sin(darkPData[i].theta) * darkPData[i].r;
    }
    darkParallaxCloud.geometry.attributes.position.needsUpdate = true;
  }
  if (typeof earthClouds !== 'undefined') {
    earthClouds.forEach(c => c.rotation.y += 0.002);
  }
  
  starField.rotation.y -= 0.00004;
  milkyWayGroup.rotation.y += 0.0001;
  mainDisk.rotation.z += 0.004;
  if (typeof diskUniforms !== 'undefined') {
    diskUniforms.uTime.value += 0.012;
  }
  if (typeof sun !== 'undefined') {
    sun.rotation.y += 0.004;
  }
  if (typeof sunCorona !== 'undefined') {
    const pulse = 36 + Math.sin(Date.now() * 0.002) * 1.5;
    sunCorona.scale.set(pulse, pulse, 1);
  }

  // Расчет видимости Солнца и интенсивности оптических бликов с учетом дистанции
  if (typeof sunGroup !== 'undefined' && typeof flareCanvas !== 'undefined') {
    const camDist = camera.position.distanceTo(sunGroup.position);
    // Блики плавно затухают на дистанции и полностью исчезают дальше 450 единиц
    const maxGlareDist = 450;
    const distFade = Math.max(0, Math.min(1, 1 - (camDist - 80) / (maxGlareDist - 80)));

    if (distFade > 0.01 && !inDarkRoom) {
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const toSun = sunGroup.position.clone().sub(camera.position).normalize();
      const dot = camDir.dot(toSun);

      if (dot > 0.52) {
        const sunProj = sunGroup.position.clone().project(camera);
        if (sunProj.z < 1.0) {
          const sx = (sunProj.x * 0.5 + 0.5) * window.innerWidth;
          const sy = (-(sunProj.y * 0.5) + 0.5) * window.innerHeight;
          const baseIntensity = Math.pow((dot - 0.52) / 0.48, 2.0);
          renderSunGlare(sx, sy, baseIntensity * distFade);
        } else {
          flareCtx.clearRect(0, 0, flareCanvas.width, flareCanvas.height);
        }
      } else {
        flareCtx.clearRect(0, 0, flareCanvas.width, flareCanvas.height);
      }
    } else {
      flareCtx.clearRect(0, 0, flareCanvas.width, flareCanvas.height);
    }
  }
  
  if (inDarkRoom) {
    doorLight.intensity = 2 + Math.sin(Date.now() * 0.008) * 2;
  }

  angelGroup.position.y = -200 + Math.sin(Date.now() * 0.002) * 5;
  leftWing.rotation.y = Math.sin(Date.now() * 0.005) * 0.3;
  rightWing.rotation.y = -Math.sin(Date.now() * 0.005) * 0.3;

  leftWingGroup.rotation.z = Math.sin(Date.now() * 0.004) * 0.25;
  rightWingGroup.rotation.z = -Math.sin(Date.now() * 0.004) * 0.25;

  if (isPixelManTriggered) {
    pixelManShakeTimer += 0.1;
    pixelManGroup.position.x = 800 + Math.sin(pixelManShakeTimer * 12) * 3;
    pixelManGroup.position.y = 50 + Math.cos(pixelManShakeTimer * 9) * 2;
    pixelManGroup.rotation.z = Math.sin(pixelManShakeTimer * 7) * 0.15;
    head.rotation.y = Math.sin(pixelManShakeTimer * 15) * 0.4;
  }

  errorMesh.material.opacity = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
  errorMesh.lookAt(camera.position);

  dragonAngle += 0.0009;
  const dr = 4600;
  pixelDragonGroup.position.x = Math.cos(dragonAngle) * dr;
  pixelDragonGroup.position.z = Math.sin(dragonAngle) * dr;
  pixelDragonGroup.position.y = 120 + Math.sin(Date.now() * 0.0008) * 40;
  const dnx = Math.cos(dragonAngle + 0.03) * dr;
  const dnz = Math.sin(dragonAngle + 0.03) * dr;
  pixelDragonGroup.lookAt(dnx, pixelDragonGroup.position.y, dnz);
  pixelDragonGroup.rotation.y += Math.PI;
  dragonWingL.rotation.z = 0.25 + Math.sin(Date.now() * 0.0035) * 0.5;
  dragonWingR.rotation.z = -0.25 - Math.sin(Date.now() * 0.0035) * 0.5;
  dHead.rotation.y = Math.sin(Date.now() * 0.0012) * 0.25;

  statues.forEach(s => {
    s.group.rotation.y += 0.003;
  });

  // Плавная и ритмичная процедурная хореография танца Хацунэ Мику
  const mTime = Date.now() * 0.004;
  mikuGroup.position.y = 40 + Math.abs(Math.sin(mTime * 2)) * 2.2;
  mikuGroup.rotation.y += 0.002;
  
  // Танцевальный бит: ритмичное покачивание корпуса и головы
  if (typeof mikuUpperBody !== 'undefined') {
    mikuUpperBody.rotation.z = Math.sin(mTime) * 0.12;
    mikuUpperBody.rotation.x = 0.05 + Math.sin(mTime * 2) * 0.06;
    mHeadGroup.rotation.z = -Math.sin(mTime) * 0.08;
    mHeadGroup.rotation.y = Math.cos(mTime * 0.5) * 0.2;
    mTie.rotation.z = -Math.sin(mTime) * 0.25;
  }
  
  // Анимация рук в танце (плавные взмахи и сгибы в локтях)
  if (typeof armL !== 'undefined' && typeof armR !== 'undefined') {
    armL.shoulder.rotation.z = -0.4 + Math.sin(mTime) * 0.45;
    armL.shoulder.rotation.x = Math.cos(mTime * 1.5) * 0.35;
    armL.forearm.rotation.x = -0.5 - Math.sin(mTime * 2) * 0.4;
    
    armR.shoulder.rotation.z = 0.4 - Math.sin(mTime) * 0.45;
    armR.shoulder.rotation.x = -Math.cos(mTime * 1.5) * 0.35;
    armR.forearm.rotation.x = -0.5 + Math.sin(mTime * 2) * 0.4;
  }
  
  // Шаги ногами в такт
  if (typeof legL !== 'undefined' && typeof legR !== 'undefined') {
    legL.hip.rotation.x = Math.sin(mTime) * 0.35;
    legL.lowerLeg.rotation.x = Math.max(0, -Math.sin(mTime) * 0.45);
    
    legR.hip.rotation.x = -Math.sin(mTime) * 0.35;
    legR.lowerLeg.rotation.x = Math.max(0, Math.sin(mTime) * 0.45);
  }
  
  // Физика динамического покачивания хвостов Мику
  if (typeof mikuTailL !== 'undefined' && typeof mikuTailR !== 'undefined') {
    mikuTailL.rotation.z = -0.2 - Math.sin(mTime) * 0.2;
    mikuTailL.rotation.x = 0.15 + Math.cos(mTime * 1.8) * 0.18;
    mikuTailR.rotation.z = 0.2 - Math.sin(mTime) * 0.2;
    mikuTailR.rotation.x = 0.15 - Math.cos(mTime * 1.8) * 0.18;
    
    mikuTailL.userData.segs.forEach((seg, idx) => {
      seg.rotation.z = Math.sin(mTime - idx * 0.3) * 0.12;
    });
    mikuTailR.userData.segs.forEach((seg, idx) => {
      seg.rotation.z = -Math.sin(mTime - idx * 0.3) * 0.12;
    });
  }
  
  // Вращение неонового кольца сцены
  if (typeof stageRing !== 'undefined') {
    stageRing.rotation.z += 0.015;
  }

  // Анимация величественных Небесных Врат (Хроно-Колец и кристаллов)
  if (typeof celestialGateGroup !== 'undefined') {
    gateRing1.rotation.z += 0.0035;
    gateRing1.rotation.y += 0.0018;
    gateRing2.rotation.z -= 0.0045;
    gateRing2.rotation.x += 0.0022;
    gateRing3.rotation.y += 0.006;
    
    const gPulse = 210 + Math.sin(Date.now() * 0.0025) * 30;
    gateCoreSprite.scale.set(gPulse, gPulse, 1);
    if (typeof gatePortalMesh !== 'undefined') {
      gatePortalMesh.rotation.z += 0.012;
    }
    
    gateCrystals.forEach((cr, i) => {
      cr.userData.angle += cr.userData.speed;
      cr.position.x = Math.cos(cr.userData.angle) * cr.userData.radius;
      cr.position.y = Math.sin(cr.userData.angle) * cr.userData.radius * 0.7;
      cr.position.z = Math.sin(cr.userData.angle * 2) * 25;
      cr.rotation.x += 0.02;
      cr.rotation.y += 0.03;
    });
  }

  asteroids.forEach(a => {
    a.rotation.x += a.userData.spin.x;
    a.rotation.y += a.userData.spin.y;
    a.rotation.z += a.userData.spin.z;
  });

  debris.forEach(d => {
    d.rotation.x += d.userData.spin.x;
    d.rotation.y += d.userData.spin.y;
  });

  comets.forEach(c => {
    c.position.addScaledVector(c.userData.dir, c.userData.speed);
    if (Math.abs(c.position.x) > 9000 || Math.abs(c.position.y) > 5200 || Math.abs(c.position.z) > 9000) {
      c.position.set((Math.random() - 0.5) * 14000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 14000);
      c.userData.dir.set(Math.random() - 0.5, (Math.random() - 0.5) * 0.3, Math.random() - 0.5).normalize();
      c.lookAt(c.position.clone().add(c.userData.dir));
    }
  });

  stations.forEach(st => {
    st.rotation.y += 0.0012;
    const on = Math.sin(Date.now() * 0.005 + st.userData.beaconPhase) > 0.3;
    st.userData.beacons[0].material.color.setHex(on ? 0xff3b4f : 0x441014);
    st.userData.beacons[1].material.color.setHex(!on ? 0x4fff8f : 0x0f2e18);
  });

  starSystemGroup.rotation.y += 0.0004;
  starSystemGroup.userData.pa = (starSystemGroup.userData.pa || 0) + 0.0016;
  starSystemGroup.userData.planet.position.set(Math.cos(starSystemGroup.userData.pa) * 445, 30 + Math.sin(starSystemGroup.userData.pa * 2) * 20, Math.sin(starSystemGroup.userData.pa) * 445);

  // Корабль летит
  shipAngle += shipBoost ? 0.022 : 0.0035;
  const shipRadius = 480;
  shipGroup.position.x = Math.cos(shipAngle) * shipRadius;
  shipGroup.position.z = Math.sin(shipAngle) * shipRadius - 80;
  shipGroup.position.y = 70 + Math.sin(shipAngle * 1.8) * 35;
  shipGroup.lookAt(
    Math.cos(shipAngle + 0.1) * shipRadius,
    shipGroup.position.y,
    Math.sin(shipAngle + 0.1) * shipRadius - 80
  );

  if (shipBoost) {
    shipBoostTimer += 0.016;
    eng1.material.color.setHex(0xffff00);
    eng2.material.color.setHex(0xffff00);
    eng3.material.color.setHex(0xffff00);
    if (shipBoostTimer > 3.5) {
      shipBoost = false;
      eng1.material.color.setHex(0xff4400);
      eng2.material.color.setHex(0xff4400);
      eng3.material.color.setHex(0xff4400);
    }
  }

  // Артефакты
  artifacts.forEach(art => {
    if (art.userData.collected) return;
    const data = art.userData;
    art.position.y = data.baseY + Math.sin(Date.now() * 0.001 * data.speed) * 10;
    art.rotation.y += data.rotSpeed;
    art.rotation.x += data.rotSpeed * 0.4;
  });

  // Дождь
  rainDrops.forEach(drop => {
    drop.position.y -= drop.userData.speed;
    if (drop.position.y < -250) {
      drop.position.y = 30 + Math.random() * 40;
      drop.position.x = (Math.random() - 0.5) * 220;
      drop.position.z = (Math.random() - 0.5) * 140;
    }
  });

  // Облако слегка дышит
  rainCloudGroup.position.y = 800 + Math.sin(Date.now() * 0.0008) * 25;

  if (isConsuming) {
    consumeTimer += 0.016;
    const scaleFactor = 1 + Math.pow(consumeTimer * 0.8, 2.5);
    blackHoleGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
    camera.position.lerp(blackHoleGroup.position, 0.03);
    controls.target.lerp(blackHoleGroup.position, 0.03);
    
    if (consumeTimer >= 5.0) {
      flashOverlay.classList.add('active');
      setTimeout(() => {
        blackHoleGroup.scale.set(1, 1, 1);
        isConsuming = false;
        resetCamera();
        setTimeout(() => {
          flashOverlay.classList.remove('active');
        }, 1000);
      }, 1500);
    }
  }

  const distFromOrigin = camera.position.distanceTo(controls.target);
  // Лимит сердечка увеличен в 6 раз (2 280 000 единиц глубины космоса)
  if (distFromOrigin >= 2280000) {
    heartOverlay.classList.remove('hidden');
  } else {
    heartOverlay.classList.add('hidden');
    heartMsg.classList.add('hidden');
  }

  controls.update();
  if(bhAudio.gain){var dB=camera.position.distanceTo(blackHoleGroup.position);var vB=dB>=600?0:Math.pow(1-dB/600,1.4)*0.5;bhAudio.gain.gain.setTargetAtTime(vB,bhAudio.ctx.currentTime,0.15);}
  if(errAudio.gain){var vE=isErrorTriggered?0.25:0;errAudio.gain.gain.setTargetAtTime(vE,errAudio.ctx.currentTime,0.1);}
  for(var sa=0;sa<stAudioList.length;sa++){var dd=camera.position.distanceTo(stAudioList[sa].node.position);var vv=dd>=800?0:Math.pow(1-dd/800,1.4)*0.3;stAudioList[sa].gain.gain.setTargetAtTime(vv,stAudioList[sa].ctx.currentTime,0.2);}
  // ЧАСТЬ 1: новые объекты космоса (space_extras.js)
  if (window.__spaceExtras) window.__spaceExtras.update();

  renderer.render(scene, camera);
}

animate();

window.__spCam=controls;
window.__spRend=renderer;
window.__spStars=starField;
window.__spRain=rainCloudGroup;

// Settings loader
(function(){var s3=document.createElement("script");s3.src="settings.js?v=11";document.body.appendChild(s3);})();

// ==================== МЛЕЧНЫЙ ПУТЬ: ВХОД ТОЛЬКО ПО НАЖАТИЮ НА ГАЛАКТИКУ ====================
// Валидируется точка НАЖАТИЯ, а не отпускания.
// ПК: вход мгновенно по нажатию. Телефон: тап (нажал на галактике, палец почти не двигался).

let mwPressCandidate = null; // { x, y, time }
let lastTouchTime = 0;

function raycastMilkyWay(x, y) {
  mouse.x = (x / window.innerWidth) * 2 - 1;
  mouse.y = -(y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObject(mwHitbox).length > 0;
}

function handleMilkyWayPress(e) {
  if ((e.type === 'mousedown' || e.type === 'pointerdown') && e.button !== 0) return;
  if (document.body.classList.contains('battle-active')) return; // арена открыта
  if (isConsuming || isAngelTriggered || isPixelManTriggered || isErrorTriggered || isDragonTriggered || inDarkRoom) return;
  const t = e.target;
  if (t && typeof t.closest === 'function' && (t.closest('button') || t.closest('a') || t.closest('.card') || t.closest('.planet-modal') || t.closest('.clicker-ui'))) return;

  // Пинч / мульти-тач — это жест камеры, не тап по галактике
  if (e.touches && e.touches.length > 1) { mwPressCandidate = null; return; }

  const pos = getPointerPosition(e);
  const isTouch = e.type === 'touchstart' || e.pointerType === 'touch';

  // Валидация ИМЕННО точки нажатия
  if (!raycastMilkyWay(pos.x, pos.y)) { mwPressCandidate = null; return; }

  if (isTouch) {
    // Телефон: запоминаем точку нажатия, решение принимаем на touchend (детекция тапа)
    lastTouchTime = Date.now();
    mwPressCandidate = { x: pos.x, y: pos.y, time: lastTouchTime };
  } else {
    // ПК: мгновенный вход по нажатию
    // Отбрасываем эмулированные mouse-события после тача
    if (Date.now() - lastTouchTime < 800) return;
    mwPressCandidate = null;
    enterDarkRoom();
  }
}

function handleMilkyWayRelease(e) {
  if (!mwPressCandidate) return;
  const start = mwPressCandidate;
  mwPressCandidate = null;

  if (inDarkRoom || isConsuming || isAngelTriggered || isPixelManTriggered || isErrorTriggered || isDragonTriggered) return;
  if (e.type === 'pointerup' && e.pointerType === 'mouse') return; // мышь обработана на press

  const pos = getPointerPosition(e);
  const dx = pos.x - start.x;
  const dy = pos.y - start.y;
  const moved = Math.sqrt(dx * dx + dy * dy);
  const dt = Date.now() - start.time;

  // Тап: палец почти не сдвинулся, нажатие короткое, отпустили всё еще на галактике
  if (moved <= 12 && dt <= 600 && raycastMilkyWay(pos.x, pos.y)) {
    enterDarkRoom();
  }
}

window.addEventListener('pointerdown', handleMilkyWayPress);
window.addEventListener('mousedown', handleMilkyWayPress);
window.addEventListener('touchstart', handleMilkyWayPress, { passive: true });
window.addEventListener('touchend', handleMilkyWayRelease, { passive: true });
window.addEventListener('pointerup', handleMilkyWayRelease, { passive: true });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== УПРАВЛЕНИЕ ВИЗУАЛОМ И РЕЖИМАМИ (НОВЫЙ / СТАРЫЙ) ====================
window.__setRetroVisualMode = function(isRetro) {
  if (isRetro) {
    // Старый визуал: отключение тонмаппинга и PBR-света
    renderer.toneMapping = THREE.NoToneMapping;
    ambientLight.color.setHex(0xffffff);
    ambientLight.intensity = 0.5;
    sunLight.intensity = 3.0;
    if (typeof galaxyBackLight !== 'undefined') galaxyBackLight.visible = false;
    if (typeof rimSpaceLight !== 'undefined') rimSpaceLight.visible = false;
    if (typeof sunCorona !== 'undefined') sunCorona.visible = false;
    if (typeof sun !== 'undefined') {
      sun.material = new THREE.MeshBasicMaterial({ color: 0xffbb33 });
    }
    planets.forEach(p => {
      const pName = p.planet.userData.name || '';
      let c = 0x888888;
      if (pName.includes('Меркурий')) c = 10066329;
      else if (pName.includes('Венера')) c = 14924662;
      else if (pName.includes('Земля')) c = 2845872;
      else if (pName.includes('Марс')) c = 12922928;
      else if (pName.includes('Юпитер')) c = 13013524;
      else if (pName.includes('Сатурн')) c = 14065198;
      else if (pName.includes('Уран')) c = 3250069;
      else if (pName.includes('Нептун')) c = 2845872;
      p.planet.material = new THREE.MeshBasicMaterial({ color: c });
    });
  } else {
    // Новый детализированный PBR-визуал (по умолчанию)
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    ambientLight.color.setHex(0x141829);
    ambientLight.intensity = 0.8;
    sunLight.intensity = 4.5;
    if (typeof galaxyBackLight !== 'undefined') galaxyBackLight.visible = true;
    if (typeof rimSpaceLight !== 'undefined') rimSpaceLight.visible = true;
    if (typeof sunCorona !== 'undefined') sunCorona.visible = true;
    if (typeof sun !== 'undefined') {
      sun.material = new THREE.MeshBasicMaterial({ map: createSunPlasmaTexture(), color: 0xfffae0 });
    }
    planets.forEach(p => {
      const pName = p.planet.userData.name || '';
      if (pName.includes('Меркурий')) {
        p.planet.material = new THREE.MeshStandardMaterial({ color: 0xa8a59b, bumpMap: createCraterMap('#888', '#222', true), bumpScale: 0.08, roughness: 0.9, metalness: 0.12 });
      } else if (pName.includes('Венера')) {
        p.planet.material = new THREE.MeshStandardMaterial({ color: 0xe3bb76, roughness: 0.4, metalness: 0.05 });
      } else if (pName.includes('Земля')) {
        p.planet.material = new THREE.MeshStandardMaterial({ map: earthData.map, roughnessMap: earthData.roughnessMap, metalness: 0.15, roughness: 0.65 });
      } else if (pName.includes('Марс')) {
        p.planet.material = new THREE.MeshStandardMaterial({ color: 0xbf4b24, bumpMap: createCraterMap('#d14924', '#551505', true), bumpScale: 0.06, roughness: 0.88, metalness: 0.08 });
      } else if (pName.includes('Юпитер')) {
        p.planet.material = new THREE.MeshStandardMaterial({ map: createGasGiantTexture(['#4a2c16', '#87532a', '#d4a373', '#faedcd', '#bc6c25', '#dda15e']), roughness: 0.45, metalness: 0.05 });
      } else if (pName.includes('Сатурн')) {
        p.planet.material = new THREE.MeshStandardMaterial({ map: createGasGiantTexture(['#bfa378', '#dfcb9f', '#9f8558', '#ebd8aa', '#8c734b']), roughness: 0.48, metalness: 0.05 });
      } else if (pName.includes('Уран')) {
        p.planet.material = new THREE.MeshStandardMaterial({ color: 0x4b70dd, roughness: 0.4, metalness: 0.1 });
      } else if (pName.includes('Нептун')) {
        p.planet.material = new THREE.MeshStandardMaterial({ color: 0x2753a7, roughness: 0.35, metalness: 0.15 });
      }
    });
  }
};

// Инициализация визуального режима из localStorage (по умолчанию retroVisual = false)
(function () {
  var KEY = 'spaceSettings_v1';
  var S = { zoom: 0.8, horiz: 0.8, vert: 1, vertOn: true, smooth: 5, quality: 1, rot: true, rain: true, neb: true, land: false, retroVisual: false };
  try {
    var d = JSON.parse(localStorage.getItem(KEY));
    if (d) {
      for (var k in S) if (d[k] !== undefined) S[k] = d[k];
    }
  } catch (e) {}

  if (S.retroVisual) {
    setTimeout(function() { window.__setRetroVisualMode(true); }, 50);
  }
})();


// Clicker module loader (cache-busted)
(function () {
  var s = document.createElement('script');
  s.src = 'clicker.js?v=91';
  document.body.appendChild(s);
  var e = document.createElement('script');
  e.src = 'clicker_ext.js?v=91';
  var ps = document.createElement('script');
  ps.src = 'clicker_premium.js?v=91';
  document.body.appendChild(ps);
  document.body.appendChild(e);
})();

// Chat loader: photon.js SDK (root -> libs/ fallback) then chat.js (cache-busted)
(function () {
  function loadChat() {
    var c = document.createElement('script');
    c.src = 'chat.js?v=3';
    document.body.appendChild(c);
    // Батл-арена: отдельный компонент на Photon LoadBalancing (свой клиент, не чат)
    var b = document.createElement('script');
    b.src = 'battle.js?v=25';
    document.body.appendChild(b);
  }
  function tryPaths(paths) {
    if (!paths.length) { console.warn('photon.js не найден - чат отключен'); return; }
    var p = document.createElement('script');
    p.src = paths[0];
    p.onload = loadChat;
    p.onerror = function () { tryPaths(paths.slice(1)); };
    document.body.appendChild(p);
  }
  tryPaths(['photon.js', 'libs/photon.js']);
})();