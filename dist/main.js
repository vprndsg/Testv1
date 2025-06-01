import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// ----- FluidSolver -----
class FluidSolver {
  constructor(renderer, size = 512) {
    this.size = size;
    this.renderer = renderer;
    this.dye = this.createDoubleFBO(size, size);
    this.compileShaders();
  }

  createDoubleFBO(w, h) {
    const options = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false
    };
    const rt1 = new THREE.WebGLRenderTarget(w, h, options);
    const rt2 = new THREE.WebGLRenderTarget(w, h, options);
    return { read: rt1, write: rt2, swap() { const t = this.read; this.read = this.write; this.write = t; } };
  }

  compileShaders() {
    const baseVertex = `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = vec4(position,1.0);
      }
    `;
    this.splatMaterial = new THREE.ShaderMaterial({
      vertexShader: baseVertex,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform vec2 uPoint;
        uniform vec3 uColor;
        uniform float uRadius;
        void main(){
          vec2 p = vUv - uPoint;
          float d = exp(-dot(p,p) * uRadius);
          vec3 base = texture2D(uTarget,vUv).rgb;
          gl_FragColor = vec4(base + uColor * d, 1.0);
        }
      `,
      uniforms: {
        uTarget: { value: null },
        uPoint:  { value: new THREE.Vector2() },
        uColor:  { value: new THREE.Color() },
        uRadius: { value: 100 }
      }
    });
    this.copyMaterial = new THREE.ShaderMaterial({
      vertexShader: baseVertex,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uTexture;
        void main(){
          gl_FragColor = texture2D(uTexture,vUv);
        }
      `,
      uniforms: { uTexture: { value: null } }
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2,2), this.copyMaterial);
    this.scene = new THREE.Scene();
    this.scene.add(this.quad);
    this.camera = new THREE.Camera();
  }

  render(material, target){
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
  }

  splat(x, y, dx, dy, color){
    const point = new THREE.Vector2(x / this.size, y / this.size);
    this.splatMaterial.uniforms.uTarget.value = this.dye.read.texture;
    this.splatMaterial.uniforms.uPoint.value.copy(point);
    this.splatMaterial.uniforms.uColor.value.copy(color);
    this.render(this.splatMaterial, this.dye.write);
    this.dye.swap();
  }

  step(dt){
    this.copyMaterial.uniforms.uTexture.value = this.dye.read.texture;
    this.render(this.copyMaterial, this.dye.write);
    this.dye.swap();
  }
}

// ----- Shader -----
const chemFrag = `uniform sampler2D uMap;
void main(){
  vec4 c = texture2D(uMap, gl_FragCoord.xy / resolution.xy);
  gl_FragColor = vec4(c.rgb, 0.8 * length(c.rgb));
}`;

// ----- Main script -----
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 0, 5);
controls.update();

export const nodeGroup = new THREE.Group();
scene.add(nodeGroup);
const lineGroup = new THREE.Group();
scene.add(lineGroup);

function initNodes(){
  const geo = new THREE.SphereGeometry(0.1, 16, 16);
  for(let i=0;i<20;i++){
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5) });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1);
    mesh.userData.trailColor = mat.color.clone();
    nodeGroup.add(mesh);
  }
}

initNodes();
const solver = new FluidSolver(renderer);

const chemMaterial = new THREE.ShaderMaterial({
  uniforms: { uMap: { value: solver.dye.read.texture }, resolution: { value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height) } },
  fragmentShader: chemFrag,
  depthWrite: false,
  transparent: true
});
const chemPlane = new THREE.Mesh(new THREE.PlaneGeometry(2,2), chemMaterial);
chemPlane.frustumCulled = false;
scene.add(chemPlane);

const prevPos = new Map();
function emitTrails(dt){
  nodeGroup.children.forEach(m=>{
    const now = m.position.clone();
    const last= prevPos.get(m.uuid) || now;
    const vel = now.clone().sub(last);
    prevPos.set(m.uuid, now);
    if(vel.lengthSq() < 1e-4) return;
    const ndc = now.clone().project(camera);
    solver.splat(
      (ndc.x*0.5+0.5)*solver.size,
      (ndc.y*0.5+0.5)*solver.size,
      vel.x*30, vel.y*30,
      m.userData.trailColor
    );
  });
}

function physicsStep(dt){
  nodeGroup.children.forEach(m=>{
    m.position.multiplyScalar(0.99);
  });
}

function resize(){
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  chemMaterial.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
}
window.addEventListener('resize', resize);
resize();

renderer.setAnimationLoop(()=>{
  const dt = Math.min(0.016, renderer.info.render.frame*0 + 0.016);
  physicsStep(dt);
  emitTrails(dt);
  solver.step(dt);
  controls.update();
  renderer.autoClear = false;
  renderer.clear();
  renderer.render(scene, camera);
});
