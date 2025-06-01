# 3D Nodes with Fluid Trails

This project is a small demo built with **Three.js**. Randomized nodes drift in space and repel each other while leaving behind colorful vapor trails. Trails are drawn on a 2‑D canvas using additive blending and fade slowly over time.

## Running

Use any static server or Vite during development:

```bash
npm install
npx vite
```

Open the provided `index.html` and the simulation will start. The source files live in `src/` and are written as ES modules so they work with modern bundlers.

You can click and drag nodes to fling them around. Their trails update each frame giving a smooth chem‑trail effect.
