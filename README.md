# Fluid Node Universe

This project showcases a simple experiment combining a force-directed node layout with a 2‑D fluid simulation. Each node leaves a coloured trail that swirls in a fluid slab behind the 3‑D scene.

Open `index.html` in a modern browser to see the demo. The implementation uses [THREE.js](https://threejs.org) for rendering. No build step is required—everything loads as ES modules.

The core fluid logic is adapted from Pavel Dobryakov's WebGL fluid solver and wrapped in `src/FluidSolver.js`. Trails are rendered via a custom fragment shader found at `src/shaders/chemDisplay.frag`.

This is only a lightweight prototype meant for experimentation.
