import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import glsl from '@rollup/plugin-glsl';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'main.js',
  output: {
    file: 'dist/main.js',
    format: 'esm',
  },
  plugins: [
    glsl(),
    nodeResolve(),
    commonjs(),
    terser()
  ],
};
