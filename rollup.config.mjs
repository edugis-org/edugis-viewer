// Import rollup plugins
import { rollupPluginHTML as html } from "@web/rollup-plugin-html";
import copy from 'rollup-plugin-copy';
import resolve from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import { minifyTemplateLiterals } from "rollup-plugin-minify-template-literals";
import summary from 'rollup-plugin-summary';
import del from 'rollup-plugin-delete'
import sourcemaps from 'rollup-plugin-sourcemaps';
import typescript from '@rollup/plugin-typescript';

export default {
  plugins: [
    del({ targets: 'build/**/*'}),
    // Entry point for application build; can specify a glob to build multiple
    // HTML files for non-SPA app
    html({
      input: ['index.html', 'demo.html', 'mapbox.html','cgstromen.html'],
    }),
    // Handle TypeScript files
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      inlineSources: true,
      noEmitOnError: false,
      include: ["src/**/*.ts"]
    }),
    // Resolve bare module specifiers to relative paths
    resolve({
      exportConditions: ['production'],
      extensions: ['.js', '.ts']
    }),
    // Minify HTML template literals
    minifyTemplateLiterals(),
    // Minify JS
    terser({
      ecma: 2022,
      module: true,
      warnings: true,
    }),
    // Print bundle summary
    summary(),
    // Optional: copy any static assets to build directory
    // note: glob patterns work different, see https://github.com/vladshcherbin/rollup-plugin-copy/issues/32
    copy({
      targets: [
        {src: "images/*", dest: "build/images/", flatten: false}, // deep recursive copy
        {src: "maps/*", dest: "build/maps/", flatten: false},
        {src: "styles/*", dest: "build/styles/", flatten: false},
        {src: "notosans-*woff2", dest: "build/", flatten: false},
        {src: "node_modules/hopscotch/dist/img/sprite-*.png", dest: "build/img/", flatten: true},
        {src: "images/manifest/*", dest: "build/assets/images/manifest/", flatten: false},
        {src: "course/*", dest: "build/course/", flatten: false},
        {src: "src/workers/*", dest: "build/src/workers/", flatten: false},
        {src: "src/locales/*", dest: "build/src/locales/", flatten: false},
      ]
    }),
    sourcemaps(),
  ],
  output: {
    sourcemap: true,
    dir: 'build',
  },
  preserveEntrySignatures: 'strict',
};