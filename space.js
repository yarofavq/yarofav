const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 60000);
camera.position.set(0, 30, 70);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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

const mwHitboxGeo = new THREE.SphereGeometry(1600, 16, 16);
const mwHitboxMat = new THREE.MeshBasicMaterial({ visible: false });
const mwHitbox = new THREE.Mesh(mwHitboxGeo, mwHitboxMat);
milkyWayGroup.add(mwHitbox);

milkyWayGroup.position.set(-3000, 1200, -4000);
milkyWayGroup.rotation.x = Math.PI / 3;
milkyWayGroup.rotation.z = Math.PI / 6;
scene.add(milkyWayGroup);

// REALISTIC BLACK HOLE
const blackHoleGroup = new THREE.Group();
const bhCoreGeo = new THREE.SphereGeometry(18, 64, 64);
const bhCoreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const bhCore = new THREE.Mesh(bhCoreGeo, bhCoreMat);
blackHoleGroup.add(bhCore);

const photonSphereGeo = new THREE.SphereGeometry(20.5, 64, 64);
const photonSphereMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, side: THREE.BackSide, transparent: true, opacity: 0.4 });
const photonSphere = new THREE.Mesh(photonSphereGeo, photonSphereMat);
blackHoleGroup.add(photonSphere);

const diskGeo = new THREE.RingGeometry(21, 65, 128);
const diskMat = new THREE.MeshBasicMaterial({ color: 0xff4500, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
const mainDisk = new THREE.Mesh(diskGeo, diskMat);
mainDisk.rotation.x = Math.PI / 2.3;
blackHoleGroup.add(mainDisk);

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

  const pGeo = new THREE.SphereGeometry(cfg.radius, 32, 32);
  const pMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.6, metalness: 0.1 });
  const planet = new THREE.Mesh(pGeo, pMat);
  planet.userData = { name: cfg.name, desc: cfg.desc };
  
  const pivot = new THREE.Group();
  scene.add(pivot);
  pivot.add(planet);
  planet.position.x = cfg.dist;

  if (cfg.ring) {
    const ringGeo = new THREE.RingGeometry(cfg.radius + 0.6, cfg.radius + 2.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd69e2e, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
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
  inDarkRoom = false;
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
  if (isConsuming || isAngelTriggered || isPixelManTriggered || isErrorTriggered) return;

  // Не реагируем на кнопки и карточку
  if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.card') || e.target.closest('.planet-modal')) {
    return;
  }

  const pos = getPointerPosition(e);

  mouse.x = (pos.x / window.innerWidth) * 2 - 1;
  mouse.y = -(pos.y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (inDarkRoom) {
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

  // Млечный Путь
  const mwHits = raycaster.intersectObject(mwHitbox);
  if (mwHits.length > 0) {
    enterDarkRoom();
    return;
  }

  // Планеты
  const planetHits = raycaster.intersectObjects(planetMeshes);
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
  
  planets.forEach(p => {
    p.pivot.rotation.y += p.speed;
    p.planet.rotation.y += 0.02;
  });
  
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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
