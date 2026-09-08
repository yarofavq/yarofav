const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 60000);
camera.position.set(0, 30, 70);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2));

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.8;
controls.zoomSpeed = 0.8;
controls.maxDistance = 25000;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Определение устройства
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const sunLight = new THREE.PointLight(0xfff5ea, 3, 500);
scene.add(sunLight);

// Enormous Deep Space Stars Field
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 15000;
const starPositions = new Float32Array(starsCount * 3);
for (let i = 0; i < starsCount * 3; i++) {
  starPositions[i] = (Math.random() - 0.5) * 20000;
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0.85 });
const starField = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starField);

// Massive Milky Way Galaxy
const milkyWayGroup = new THREE.Group();
const particlesCount = 40000;
const mwGeometry = new THREE.BufferGeometry();
const mwPositions = new Float32Array(particlesCount * 3);
const mwColors = new Float32Array(particlesCount * 3);

const cCore = new THREE.Color(0xffeaad);
const cInner = new THREE.Color(0xff2a8d);
const cOuter = new THREE.Color(0x7b2cbf);
const cDust = new THREE.Color(0x3a86ff);

for (let i = 0; i < particlesCount; i++) {
  const distRatio = Math.random();
  const r = distRatio * 1500;
  const arms = 4;
  const armAngle = (i % arms) * ((Math.PI * 2) / arms);
  const theta = armAngle + (r * 0.002) + (Math.random() - 0.5) * 0.3;
  
  const x = Math.cos(theta) * r + (Math.random() - 0.5) * (50 + r * 0.1);
  const y = (Math.random() - 0.5) * (40 + r * 0.05);
  const z = Math.sin(theta) * r + (Math.random() - 0.5) * (50 + r * 0.1);

  mwPositions[i * 3] = x;
  mwPositions[i * 3 + 1] = y;
  mwPositions[i * 3 + 2] = z;

  let color;
  if (r < 200) color = cCore;
  else if (r < 550) color = cInner;
  else if (r < 1000) color = cOuter;
  else color = cDust;

  mwColors[i * 3] = color.r;
  mwColors[i * 3 + 1] = color.g;
  mwColors[i * 3 + 2] = color.b;
}

mwGeometry.setAttribute('position', new THREE.BufferAttribute(mwPositions, 3));
mwGeometry.setAttribute('color', new THREE.BufferAttribute(mwColors, 3));

const mwMaterial = new THREE.PointsMaterial({
  size: 2.5,
  vertexColors: true,
  transparent: true,
  opacity: 0.85,
  blending: THREE.AdditiveBlending
});

const milkyWay = new THREE.Points(mwGeometry, mwMaterial);
milkyWayGroup.add(milkyWay);

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
      float rPhoton = 0.245;
      
      if (dist < rEvent) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }
      
      // Тонкое сверхъяркое фотонное кольцо Эйнштейна
      float photonRing = 0.0;
      if (dist >= rEvent && dist <= rPhoton) {
        float t = (dist - rEvent) / (rPhoton - rEvent);
        photonRing = sin(t * 3.14159265);
      }
      
      // Оптическое гало и преломление
      float halo = pow(clamp(1.0 - (dist - rPhoton) * 1.5, 0.0, 1.0), 3.5);
      vec3 ringColor = vec3(1.0, 0.95, 0.8) * photonRing * 2.5;
      vec3 haloColor = vec3(1.0, 0.5, 0.15) * halo * 0.45;
      
      float alpha = clamp(photonRing + halo * 0.4, 0.0, 1.0);
      gl_FragColor = vec4(ringColor + haloColor, alpha);
    }
  `
});
const lensingBillboard = new THREE.Mesh(lensingGeo, lensingMat);
blackHoleGroup.add(lensingBillboard);

// 3. Реалистичный аккреционный диск с релятивистским градиентом Доплера
function createAccretionDiskTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(0.05, 'rgba(255, 255, 240, 1.0)');
  grad.addColorStop(0.18, 'rgba(255, 170, 40, 0.95)');
  grad.addColorStop(0.45, 'rgba(220, 60, 10, 0.8)');
  grad.addColorStop(0.75, 'rgba(90, 15, 5, 0.4)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 128);
  
  // Добавление динамических волокон плазмы
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 800 + 40;
    const y = Math.random() * 128;
    ctx.fillStyle = Math.random() > 0.4 ? 'rgba(255,200,80,0.15)' : 'rgba(20,0,0,0.3)';
    ctx.fillRect(x, y, Math.random() * 20 + 5, 2);
  }
  return new THREE.CanvasTexture(canvas);
}

const diskGeo = new THREE.RingGeometry(18.5, 82, 128);
const diskMat = new THREE.MeshBasicMaterial({
  map: createAccretionDiskTexture(),
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.96,
  blending: THREE.AdditiveBlending
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

  ctx.font = 'bold 70px Courier New';
  ctx.fillStyle = '#aa0000';
  ctx.fillText('НЕТ ВЫХОДА', 280, 200);
  ctx.fillText('ОНИ СМОТРЯТ', 250, 850);

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

// ==================== HATSUNE MIKU ====================
const mikuGroup = new THREE.Group();
let isMikuTriggered = false;
const mHairMat = new THREE.MeshBasicMaterial({ color: 0x39c5bb });
const mSkinMat = new THREE.MeshBasicMaterial({ color: 0xffe0c2 });
const mShirtMat = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });
const mDarkMat = new THREE.MeshBasicMaterial({ color: 0x1a1a2e });
const mHead = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), mSkinMat);
mHead.position.y = 10;
mikuGroup.add(mHead);
const mBang = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.1, 3.3), mHairMat);
mBang.position.set(0, 11.3, 0);
mikuGroup.add(mBang);
const mTailL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 9, 0.9), mHairMat);
mTailL.position.set(-2.4, 7.5, -1.2);
mTailL.rotation.x = 0.35;
mikuGroup.add(mTailL);
const mTailR = mTailL.clone();
mTailR.position.x = 2.4;
mikuGroup.add(mTailR);
const mBody = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 2.2), mShirtMat);
mBody.position.y = 5.8;
mikuGroup.add(mBody);
const mTie = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.4, 0.3), mHairMat);
mTie.position.set(0, 6.2, 1.25);
mikuGroup.add(mTie);
const mSkirt = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2, 2.6), mDarkMat);
mSkirt.position.y = 2.6;
mikuGroup.add(mSkirt);
const mLegL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.6, 0.9), mDarkMat);
mLegL.position.set(-1, -2.3, 0);
mikuGroup.add(mLegL);
const mLegR = mLegL.clone();
mLegR.position.x = 1;
mikuGroup.add(mLegR);
const mArmL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4, 0.8), mShirtMat);
mArmL.position.set(-2.6, 6, 0);
mArmL.rotation.z = 0.25;
mikuGroup.add(mArmL);
const mArmR = mArmL.clone();
mArmR.position.x = 2.6;
mArmR.rotation.z = -0.25;
mikuGroup.add(mArmR);
const mikuHitbox = new THREE.Mesh(new THREE.SphereGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ visible: false }));
mikuGroup.add(mikuHitbox);
mikuGroup.position.set(1500, 40, -1200);
mikuGroup.scale.set(1.4, 1.4, 1.4);
scene.add(mikuGroup);

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

// ==================== НАСТОЯЩИЙ КОСМИЧЕСКИЙ КОРАБЛЬ (не ракета) ====================
const shipGroup = new THREE.Group();

// Основной диск (тарелка)
const saucerGeo = new THREE.CylinderGeometry(5, 5, 1.2, 32);
const saucerMat = new THREE.MeshBasicMaterial({ color: 0x8899aa });
const saucer = new THREE.Mesh(saucerGeo, saucerMat);
shipGroup.add(saucer);

// Верхний купол
const domeGeo = new THREE.SphereGeometry(2.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
const domeMat = new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.7 });
const dome = new THREE.Mesh(domeGeo, domeMat);
dome.position.y = 0.6;
shipGroup.add(dome);

// Нижний купол
const bottomDome = new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({ color: 0x445566 }));
bottomDome.rotation.x = Math.PI;
bottomDome.position.y = -0.6;
shipGroup.add(bottomDome);

// Центральный корпус
const coreGeo = new THREE.CylinderGeometry(1.5, 1.5, 2.5, 16);
const coreMat = new THREE.MeshBasicMaterial({ color: 0xaabbcc });
const core = new THREE.Mesh(coreGeo, coreMat);
shipGroup.add(core);

// Кольцо вокруг
const ringGeo = new THREE.TorusGeometry(5.5, 0.25, 8, 48);
const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
shipGroup.add(ring);

// Двигатели (сзади)
const engGeo = new THREE.CylinderGeometry(0.5, 0.7, 1.8, 8);
const engMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
const eng1 = new THREE.Mesh(engGeo, engMat);
eng1.position.set(-2.5, -0.3, -4);
eng1.rotation.x = Math.PI / 2;
const eng2 = new THREE.Mesh(engGeo, engMat);
eng2.position.set(2.5, -0.3, -4);
eng2.rotation.x = Math.PI / 2;
const eng3 = new THREE.Mesh(engGeo, engMat);
eng3.position.set(0, -0.3, -4.5);
eng3.rotation.x = Math.PI / 2;
shipGroup.add(eng1, eng2, eng3);

// Антенны
const antGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 6);
const antMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
const ant1 = new THREE.Mesh(antGeo, antMat);
ant1.position.set(-1.5, 2.5, 0);
const ant2 = new THREE.Mesh(antGeo, antMat);
ant2.position.set(1.5, 2.5, 0);
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

// Sun & Planets
const sunGeo = new THREE.SphereGeometry(4.5, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffbb33 });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

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
  { name: 'Меркурий', radius: 0.5, dist: 9, color: 0x999999, speed: 0.025, desc: 'Самая близкая к Солнцу планета. Температура колеблется от -180°C до +430°C!' },
  { name: 'Венера', radius: 0.9, dist: 14, color: 0xe3bb76, speed: 0.018, desc: 'Самая горячая планета Солнечной системы с плотной атмосферой из углекислого газа.' },
  { name: 'Земля', radius: 1.0, dist: 20, color: 0x2b6cb0, speed: 0.012, desc: 'Наш родной дом! Единственное известное место во Вселенной с жизнью.' },
  { name: 'Марс', radius: 0.6, dist: 26, color: 0xc53030, speed: 0.009, desc: 'Красная планета. Здесь находится гигантский вулкан Олимп и древние русла рек.' },
  { name: 'Юпитер', radius: 2.4, dist: 35, color: 0xc69214, speed: 0.005, desc: 'Крупнейший газовый гигант. Его Большое Красное Пятно — это ураган, бушующий века.' },
  { name: 'Сатурн', radius: 1.9, dist: 46, color: 0xd69e2e, speed: 0.003, ring: true, desc: 'Властелин колец! Его ледяные кольца простираются на тысячи километров.' },
  { name: 'Уран', radius: 1.3, dist: 55, color: 0x319795, speed: 0.002, desc: 'Ледяной гигант, который вращается на боку с наклоном оси почти в 98 градусов.' },
  { name: 'Нептун', radius: 1.2, dist: 63, color: 0x2b6cb0, speed: 0.001, desc: 'Самая дальняя планета. Здесь дуют самые быстрые ветра в Солнечной системе.' }
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
      color: 0xaaaaaa,
      bumpMap: createCraterMap('#888', '#222', true),
      bumpScale: 0.06,
      roughness: 0.9,
      metalness: 0.1
    });
  } else if (pName.includes('Марс')) {
    pMat = new THREE.MeshStandardMaterial({
      color: 0xd14924,
      bumpMap: createCraterMap('#d14924', '#551505', true),
      bumpScale: 0.04,
      roughness: 0.85,
      metalness: 0.05
    });
  } else if (pName.includes('Земля')) {
    pMat = new THREE.MeshStandardMaterial({
      map: earthData.map,
      roughnessMap: earthData.roughnessMap,
      metalness: 0.1,
      roughness: 0.7
    });
  } else if (pName.includes('Юпитер')) {
    pMat = new THREE.MeshStandardMaterial({
      map: createGasGiantTexture(['#3f2010', '#8b5a2b', '#d2b48c', '#deb887', '#f4a460', '#a0522d']),
      roughness: 0.5
    });
  } else if (pName.includes('Сатурн')) {
    pMat = new THREE.MeshStandardMaterial({
      map: createGasGiantTexture(['#cbb17b', '#e6d3a3', '#b39860', '#f1e2b8']),
      roughness: 0.5
    });
  } else {
    pMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.5, metalness: 0.1 });
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
    flyHint.textContent = 'Управление: Вращение пальцем | Зажмите для перемещения';
  } else {
    flyHint.textContent = 'Управление: Вращение мышью | Зажмите ЛКМ / Колесико для перемещения';
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
  controls.maxDistance = 25000;
});

function resetCamera() {
  card.classList.remove('hidden-ui');
  telescopeOverlay.classList.add('hidden');
  flyOverlay.classList.add('hidden');
  angelDialog.classList.add('hidden');
  planetModal.classList.add('hidden');
  darkRoomOverlay.classList.add('hidden');
  pixelManOverlay.style.display = 'none';
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
  camera.position.set(0, 30, 70);
  controls.target.set(0, 0, 0);
  controls.update();
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

function handleInteraction(e) {
  if (isConsuming || isAngelTriggered || isPixelManTriggered || isErrorTriggered || isDragonTriggered) return;

  // Не реагируем на кнопки и карточку
  if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.card') || e.target.closest('.planet-modal') || e.target.closest('.clicker-ui')) {
    return;
  }

  const pos = getPointerPosition(e);

  mouse.x = (pos.x / window.innerWidth) * 2 - 1;
  mouse.y = -(pos.y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

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
  card.classList.add('hidden-ui');
  telescopeOverlay.classList.add('hidden');
  flyOverlay.classList.add('hidden');
  controls.autoRotate = false;
  controls.enableZoom = false;
  
  darkRoomOverlay.classList.remove('hidden');
  camera.position.set(15000, 15000, 15040);
  controls.target.set(15000, 15000, 15000);
  controls.update();
}

function triggerBlackHoleEvent() {
  isConsuming = true;
  consumeTimer = 0;
  card.classList.add('hidden-ui');
  telescopeOverlay.classList.add('hidden');
  flyOverlay.classList.add('hidden');
  controls.autoRotate = false;
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
    eye: '👁 ВСЕ ГЛАЗА ОТКРЫТЫ 👁',
    cube: '■ ВСЕ КУБЫ АКТИВИРОВАНЫ ■',
    ring: '◎ ВСЕ КОЛЬЦА ЗАМКНУТЫ ◎',
    spike: '▲ ВСЕ ШИПЫ ВОССОЕДИНЕНЫ ▲',
    orb: '● ВСЕ СФЕРЫ СЛИЛИСЬ ●',
    cross: '✚ ВСЕ КРЕСТЫ СОЕДИНЕНЫ ✚',
    pyramid: '▲ ВСЕ ПИРАМИДЫ ВОЗНЕСЕНЫ ▲'
  };

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

function animate() {
  requestAnimationFrame(animate);
  if (window.__uiPaused) return;
  
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
  
  starField.rotation.y -= 0.00005;
  milkyWayGroup.rotation.y += 0.0001;
  mainDisk.rotation.z += 0.02;
  
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

  mikuGroup.position.y = 40 + Math.sin(Date.now() * 0.0011) * 6;
  mikuGroup.rotation.y += 0.002;

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
  if (distFromOrigin >= 24500) {
    heartOverlay.classList.remove('hidden');
  } else {
    heartOverlay.classList.add('hidden');
    heartMsg.classList.add('hidden');
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

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

// Clicker module loader
(function () {
  var s = document.createElement('script');
  s.src = 'clicker.js';
  document.body.appendChild(s);
})();
