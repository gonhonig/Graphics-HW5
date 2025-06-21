import {OrbitControls} from './OrbitControls.js'
import * as THREE from "three";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const gameData = {
  'score': '32 - 54'
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// Set background color
scene.background = new THREE.Color(0x000000);

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

const spotLight1 = new THREE.SpotLight(0xffffff, 0.5);
spotLight1.position.set(-15, 30, 0);
spotLight1.castShadow = true;
scene.add(spotLight1);
const spotLight2 = new THREE.SpotLight(0xffffff, 0.5);
spotLight2.position.set(15, 30, 0);
spotLight2.castShadow = true;
scene.add(spotLight2);

// Enable shadows
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi/180);
}

const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const courtX = 14, courtZ = 7, courtY = 0.1;

// Create basketball court
function createBasketballCourt() {
  // Court floor - just a simple brown surface
  const courtGeometry = new THREE.BoxGeometry(2*(courtX+1), 2*courtY, 2*(courtZ+1))
  courtGeometry.translate(0, -courtY-0.01, 0);
  const texture = new THREE.TextureLoader().load('textures/wood.jpg');
  const courtMaterial = new THREE.MeshPhongMaterial({ map: texture });

  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;
  scene.add(court);

  // Bounds
  const boundsGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(courtX, 0, courtZ),
    new THREE.Vector3(courtX, 0, - courtZ),
    new THREE.Vector3(- courtX, 0, - courtZ),
    new THREE.Vector3(- courtX, 0, courtZ),
    new THREE.Vector3(courtX, 0, courtZ)
  ]);
  scene.add(new THREE.Line(boundsGeo, lineMaterial));

  // Center line
  const centerLineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, -courtZ), new THREE.Vector3(0, 0, courtZ)
  ]);
  scene.add(new THREE.Line(centerLineGeo, lineMaterial));

  // Center circle
  const circle = (radius) => {
    const pts = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(
          new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius)
      );
    }
    const circleGeo = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.LineLoop(circleGeo, lineMaterial);
  }
  scene.add(circle(2));

  // Three-point arcs
  const arc = (x) => {
    const radius = 5.5;
    const arcOffset = 5;
    const pts = [];
    pts.push(new THREE.Vector3(x, 0, radius));
    for (let i = -90; i <= 90; i++) {
      const theta = degrees_to_radians(-i);
      pts.push(new THREE.Vector3(Math.cos(theta) * radius + x + arcOffset, 0, Math.sin(theta) * radius));
    }
    pts.push(new THREE.Vector3(x, 0, -radius));
    return new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        lineMaterial
    );
  };

  scene.add(arc(-courtX));
  scene.add(arc(-courtX).rotateY(degrees_to_radians(180)));

  // Free throw lines
  const rectWidth = 4, rectHeight = 5, freeThrowRadius = 1.8;

  function drawRect(z, x) {
    const shape = [
      new THREE.Vector3(x, 0, -rectWidth / 2 + z),
      new THREE.Vector3(x, 0, rectWidth / 2 + z),
      new THREE.Vector3(x + rectHeight, 0, rectWidth / 2 + z),
      new THREE.Vector3(x + rectHeight, 0, -rectWidth / 2 + z),
      new THREE.Vector3(x, 0, -rectWidth / 2 + z)
    ];
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(shape), lineMaterial);
  }

  scene.add(drawRect(0, -courtX));
  scene.add(drawRect(0, -courtX).rotateY(degrees_to_radians(180)));
  scene.add(scene.add(circle(1.6).translateX(-courtX+rectHeight)));
  scene.add(scene.add(circle(1.6).translateX(courtX-rectHeight)));
}


function createHoop(x) {
  const hoopHeight = 3.05;

  // Backboard
  const backboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1, 1.8),
      new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
  );
  backboard.position.set(x + (x > 0 ? -0.4 : 0.4), hoopHeight, 0);
  scene.add(backboard);

  // Rim
  const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.03, 16, 100),
      new THREE.MeshPhongMaterial({ color: 0xff4500 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(x + (x > 0 ? -0.9 : 0.9), hoopHeight - 0.3, 0);
  rim.castShadow = true;
  scene.add(rim);

  // Net
  const netPoints = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * 2 * Math.PI;
    const r1 = 0.45
    const r2 = 0.38
    const x1 = Math.cos(angle) * r1 + rim.position.x;
    const z1 = Math.sin(angle) * r1;
    const x2 = Math.cos(angle) * r2 + rim.position.x;
    const z2 = Math.sin(angle) * r2;
    netPoints.push(new THREE.Vector3(x1, hoopHeight - 0.3, z1));
    netPoints.push(new THREE.Vector3(x2, hoopHeight - 0.9, z2));
  }
  const netGeo = new THREE.BufferGeometry().setFromPoints(netPoints);
  scene.add(new THREE.LineSegments(netGeo, lineMaterial));

  // Support pole
  const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 4),
      new THREE.MeshPhongMaterial({ color: 0x888888 })
  );
  pole.position.set(x + (x > 0 ? 0.8 : -0.8), 1.8, 0);
  scene.add(pole);

  const arm = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.1, 0.1),
      new THREE.MeshPhongMaterial({ color: 0x888888 })
  );
  arm.position.set((x + (x > 0 ? 0.2 : -0.2)), hoopHeight, 0);
  scene.add(arm);
}

function createBasketball() {
  const ballRadius = 0.3;
  const ball = new THREE.Mesh(
      new THREE.SphereGeometry(ballRadius, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0xff8c00 })
  );
  ball.position.set(0, 0.45, 0);
  ball.castShadow = true;
  scene.add(ball);

  // Seams
  const seamMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  const segments = 64;
  const seamOffset = 0.001;
  const seamRadius = ballRadius + seamOffset;

  // Latitude seam
  const latPoints = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    latPoints.push(new THREE.Vector3(Math.cos(theta) * seamRadius, 0, Math.sin(theta) * seamRadius));
  }
  const latLine = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(latPoints), seamMaterial);
  latLine.position.copy(ball.position);
  scene.add(latLine);

  // Two vertical seams (longitude)
  for (let j = 0; j < 2; j++) {
    const lonPoints = [];
    for (let i = 0; i <= segments; i++) {
      const phi = (i / segments) * Math.PI;
      lonPoints.push(new THREE.Vector3(
          Math.cos(j * Math.PI) * Math.sin(phi) * seamRadius,
          Math.cos(phi) * seamRadius,
          Math.sin(j * Math.PI) * Math.sin(phi) * seamRadius
      ));
    }
    const lonLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(lonPoints), seamMaterial);
    lonLine.position.copy(ball.position);
    scene.add(lonLine);
  }
}

// Stadium environment (bleachers + scoreboard)
function createStadium() {
  const bleacherMaterial = new THREE.MeshPhongMaterial({ color: 0xb6cacc });

  const width = 40;
  const height = 1;
  const depth = 6;
  const geometry = new THREE.BoxGeometry(width, height, 2*(courtX)+depth);
  const mesh = new THREE.Mesh(geometry, bleacherMaterial);
  mesh.position.set(0, -height/2-courtY, 0);
  scene.add(mesh);

  for (let i = 0; i < 5; i++) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, bleacherMaterial);
    mesh.position.set(0, i * height, -courtX - i * 1.5);
    scene.add(mesh);

    const mesh2 = mesh.clone();
    mesh2.position.z = -mesh.position.z;
    scene.add(mesh2);
  }

  const scoreboardGeometry = new THREE.BoxGeometry(6, 3, 0.5);
  const scoreboardMaterial = new THREE.MeshBasicMaterial({ color: 0x2222ff });
  const scoreboard = new THREE.Mesh(scoreboardGeometry, scoreboardMaterial);
  scoreboard.position.set(0, 12, -1);
  scene.add(scoreboard);

  // Score text
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2222ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '48px sans-serif';
  ctx.fillText(gameData.score, 128, 64);
  const texture = new THREE.CanvasTexture(canvas);
  const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.8, 2.8),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true })
  );
  textPlane.position.copy(scoreboard.position);
  textPlane.position.z += 0.3;
  scene.add(textPlane);

  const textPlaneBack = textPlane.clone();
  textPlaneBack.position.copy(scoreboard.position);
  textPlaneBack.position.z -= 0.3;
  textPlaneBack.rotation.y = Math.PI;
  scene.add(textPlaneBack);
}

function createUI() {
  const score = document.createElement('div');
  score.id = 'score';
  score.style.position = 'absolute';
  score.style.top = '20px';
  score.style.left = '20px';
  score.style.color = 'white';
  score.style.fontSize = '16px';
  score.style.fontFamily = 'Arial, sans-serif';
  score.style.textAlign = 'left';
  score.innerHTML = `<h2>Score</h2><p>${gameData.score}</p>`;
  document.body.appendChild(score);

  const controlsBox = document.createElement('div');
  controlsBox.id = 'controls';
  controlsBox.style.position = 'absolute';
  controlsBox.style.bottom = '20px';
  controlsBox.style.left = '20px';
  controlsBox.style.color = 'white';
  controlsBox.style.fontSize = '16px';
  controlsBox.style.fontFamily = 'Arial, sans-serif';
  controlsBox.style.textAlign = 'left';
  controlsBox.innerHTML = '<h3>Controls</h3><p>O - Toggle orbit camera</p>';
  document.body.appendChild(controlsBox);
}

// Create all elements
createBasketballCourt();
createHoop(courtX);
createHoop(-courtX);
createBasketball();
createStadium();
createUI();

// Set camera position for better view
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

// Camera preset positions
function setCameraPreset(preset) {
  if (preset === 1) {
    camera.position.set(0, 15, 30);
  } else if (preset === 2) {
    camera.position.set(0, 30, 0);
  } else if (preset === 3) {
    camera.position.set(20, 10, 0);
  }
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  controls.update();
}

// Keyboard shortcut for resetting camera
function resetCamera() {
  setCameraPreset(1);
}

// Handle key events
function handleKeyDown(e) {
  if (e.key === "o") {
    isOrbitEnabled = !isOrbitEnabled;
  }
  if (e.key === 'r') resetCamera();
  if (e.key === '1') setCameraPreset(1);
  if (e.key === '2') setCameraPreset(2);
  if (e.key === '3') setCameraPreset(3);
}

document.addEventListener('keydown', handleKeyDown);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation function
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.enabled = isOrbitEnabled;
  controls.update();
  
  renderer.render(scene, camera);
}

animate();