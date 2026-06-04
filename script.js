// ============================================
// KMK2473 - Computer Graphics Assignment
// Author: Mohamad Faris Irsyad Bin Soble
// Matric No: 105004 | Group: GROUP 1
// Lecturer: Abdulrazak Yahya Saleh Al-Hababi
// ============================================

// --- 1. SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510); // Deep space background
scene.fog = new THREE.FogExp2(0x050510, 0.02); // Fog effect for depth

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 8); // Initial camera position

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
document.body.appendChild(renderer.domElement);

// --- 2. LIGHTING & EFFECTS ---
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Base lighting
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 100); // Sun-like light source
sunLight.position.set(5, 5, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0x00d2ff, 1); // Rim light for dramatic effect
rimLight.position.set(-5, 2, -5);
scene.add(rimLight);

// --- 3. CREATE SPACE MODEL (Planets & Stars) ---
const planets = [];
const starField = new THREE.Group();

// Helper function to create a planet with orbit
function createPlanet(size, color, distance, speed, name) {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: color, 
        roughness: 0.7,
        metalness: 0.2
    });
    const planet = new THREE.Mesh(geometry, material);
    
    // Pivot group for orbital rotation
    const pivot = new THREE.Object3D();
    pivot.rotation.y = Math.random() * Math.PI * 2;
    scene.add(pivot);

    // Translate planet from pivot (Translation concept)
    planet.position.x = distance;
    planet.castShadow = true;
    planet.receiveShadow = true;
    pivot.add(planet);

    // Orbit ring visual guide
    const ringGeo = new THREE.RingGeometry(distance - 0.05, distance + 0.05, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x555555, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Store animation data
    planets.push({ mesh: planet, pivot: pivot, speed: speed, selfSpeed: 0.01 + Math.random() * 0.02 });
}

// Create Sun (center)
const sunGeo = new THREE.SphereGeometry(1.5, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// Create Planets (Mercury to Jupiter)
createPlanet(0.6, 0x888888, 3, 0.02, "Mercury");
createPlanet(0.8, 0xff6600, 5, 0.015, "Venus");
createPlanet(0.9, 0x0066ff, 7, 0.01, "Earth");
createPlanet(1.2, 0xff0000, 9, 0.008, "Mars");
createPlanet(2.0, 0xd2b48c, 12, 0.005, "Jupiter");

// Starfield (procedural stars)
const starGeo = new THREE.BufferGeometry();
const starCount = 2000;
const posArray = new Float32Array(starCount * 3);
for(let i=0; i<starCount*3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const starMat = new THREE.PointsMaterial({size: 0.1, color: 0xffffff});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// --- 4. ANIMATION STATE VARIABLES ---
let isAnimating = true;
let camDirX = 0;
let camDirZ = 0;
let params = {
    rotationSpeed: 0.01,
    orbitSpeed: 1.0,
    autoRotate: true,
    showShadows: true,
    collisionColor: false
};

// --- 5. GUI INTERFACE (Multiple Panels via dat.GUI) ---
const gui = new dat.GUI();

const folderAnimation = gui.addFolder('Animation Control');
folderAnimation.add(params, 'rotationSpeed', 0, 0.1).name("Planet Spin Speed");
folderAnimation.add(params, 'orbitSpeed', 0.1, 3.0).name("Orbit Speed");
folderAnimation.add(params, 'autoRotate').name("Auto Rotate Camera");
folderAnimation.open();

const folderAppearance = gui.addFolder('Appearance & Lighting');
folderAppearance.add(params, 'lightIntensity', 0, 5).name("Sun Brightness").onChange(v => sunLight.intensity = v);
folderAppearance.add(params, 'showShadows').name("Enable Shadows").onChange(v => renderer.shadowMap.enabled = v);
folderAppearance.add(params, 'collisionColor').name("Collision Glow Effect");
folderAppearance.open();

// --- 6. INTERACTION HANDLERS ---

// Mouse click to toggle animation
document.addEventListener('mousedown', () => {
    isAnimating = !isAnimating;
    console.log("Animation State:", isAnimating ? "Active" : "Paused");
});

// Keyboard controls for camera direction
document.addEventListener('keydown', (e) => {
    if(e.key === "ArrowLeft") camDirX = -1;
    if(e.key === "ArrowRight") camDirX = 1;
    if(e.key === "ArrowUp") camDirZ = -1;
    if(e.key === "ArrowDown") camDirZ = 1;
});

document.addEventListener('keyup', (e) => {
    if((e.key === "ArrowLeft" && camDirX === -1) || (e.key === "ArrowRight" && camDirX === 1)) camDirX = 0;
    if((e.key === "ArrowUp" && camDirZ === -1) || (e.key === "ArrowDown" && camDirZ === 1)) camDirZ = 0;
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 7. MAIN ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);

    // Rotate planets (self-rotation + orbit)
    planets.forEach(p => {
        p.mesh.rotation.y += p.selfSpeed * params.rotationSpeed;
        p.pivot.rotation.y += p.speed * params.orbitSpeed;
        
        // Scaling effect (pulsing)
        const scale = 1 + Math.sin(Date.now() * 0.002) * 0.05;
        p.mesh.scale.set(scale, scale, scale);
    });

    // Camera movement logic
    if (params.autoRotate || isAnimating) {
        const time = Date.now() * 0.0005;
        camera.position.x = Math.sin(time) * 15;
        camera.position.z = Math.cos(time) * 15;
        camera.lookAt(0, 0, 0);
    } else {
        if (camDirX !== 0 || camDirZ !== 0) {
            camera.position.x += camDirX * 0.1;
            camera.position.z += camDirZ * 0.1;
            camera.lookAt(0, 0, 0);
        }
    }

    // Collision detection simulation (Earth vs Mars)
    if (params.collisionColor) {
        const earth = planets[2].mesh;
        const mars = planets[3].mesh;
        const dist = earth.position.distanceTo(mars.position);
        
        if (dist < 2.5) {
            earth.material.color.setHex(0xff0000);
            mars.material.color.setHex(0xff0000);
        } else {
            earth.material.color.setHex(0x0066ff);
            mars.material.color.setHex(0xff0000);
        }
    }

    renderer.render(scene, camera);
}

// Hide loading screen when ready
window.onload = function() {
    setTimeout(() => {
        document.getElementById('loading').style.opacity = 0;
        setTimeout(() => document.getElementById('loading').remove(), 1000);
        animate();
    }, 1000);
};