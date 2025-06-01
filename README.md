# Fluid Node Universe

This project showcases a simple experiment combining a force-directed node layout with a 2‑D fluid simulation. Each node leaves a coloured trail that swirls in a fluid slab behind the 3‑D scene.

## Building

The source is bundled with Rollup. Install the dev dependencies and run the build script:

```bash
npm install
npm run build
```

This produces `dist/main.js`, which is referenced by `index.html`. Open that file in a modern browser to see the demo. The implementation uses [THREE.js](https://threejs.org) for rendering.

The core fluid logic is adapted from Pavel Dobryakov's WebGL fluid solver and wrapped in `src/FluidSolver.js`. Trails are rendered via a custom fragment shader found at `src/shaders/chemDisplay.frag`.

This is only a lightweight prototype meant for experimentation.
