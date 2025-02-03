// Import rollup plugins
import { rollupPluginHTML as html } from "@web/rollup-plugin-html";
import copy from 'rollup-plugin-copy';
import resolve from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import { minifyTemplateLiterals } from "rollup-plugin-minify-template-literals";import summary from 'rollup-plugin-summary';
import del from 'rollup-plugin-delete'
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
  plugins: [
    sourcemaps(),
    del({ targets: 'build/**/*'}),
    // Entry point for application build; can specify a glob to build multiple
    // HTML files for non-SPA app
    html({
      input: ['index.html', 'demo.html', 'mapbox.html','cgstromen.html'],
    }),
    // Resolve bare module specifiers to relative paths
    resolve({
      exportConditions: ['production']
    }),
    // Minify HTML template literals
    minifyTemplateLiterals(),
    // Minify JS
    terser({
      ecma: 2020,
      module: true,
      warnings: true,
    }),
    // Print bundle summary
    summary(),
    // Optional: copy any static assets to build directory
    copy({
      targets: [
        {src: "images/**/*", dest: "build/images"},
        {src: "maps/**/*", dest: "build/maps"},
        {src: "styles/**/*", dest: "build/styles"},
        {src: "notosans-*woff2", dest: "build"},
        {src: "node_modules/hopscotch/dist/img/sprite-*.png", dest: "build/img"},
        {src: "images/manifest/*", dest: "build/assets/images"},
        {src: "course/**/*", dest: "build/course"},
        {src: "src/workers/*", dest: "build/src"},
        {src: "src/locales/**/*", dest: "build/src"}
      ],
      flatten: false
    }),
  ],
  output: {
    sourcemap: true,
    dir: 'build',
  },
  preserveEntrySignatures: 'strict',
};