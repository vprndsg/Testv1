export class FluidSimulation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * (window.devicePixelRatio || 1);
    this.canvas.height = this.height * (window.devicePixelRatio || 1);
    this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalCompositeOperation = 'lighter';
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width * (window.devicePixelRatio || 1);
    this.canvas.height = height * (window.devicePixelRatio || 1);
    this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.globalCompositeOperation = 'lighter';
  }

  updateTrails(nodes, camera) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, this.width, this.height);

    for (const node of nodes) {
      const pos = node.position.clone().project(camera);
      const x = (pos.x * 0.5 + 0.5) * this.width;
      const y = (-pos.y * 0.5 + 0.5) * this.height;
      const radius = 5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      const color = node.mesh.material.color;
      ctx.fillStyle = `rgba(${Math.floor(color.r*255)}, ${Math.floor(color.g*255)}, ${Math.floor(color.b*255)}, 0.7)`;
      ctx.fill();
    }
  }
}
