import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  nodeResolve: true,
  open: true,
  watch: true,
  plugins: [
    esbuildPlugin({ 
      ts: true,
      target: 'es2022'
    })
  ],
  mimeTypes: {
    '**/*.js': 'js',
    '**/*.ts': 'js'
  }
};