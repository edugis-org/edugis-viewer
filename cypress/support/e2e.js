import { addCompareSnapshotCommand } from 'cypress-visual-regression/dist/command';
addCompareSnapshotCommand({
  errorThreshold: 0.01,
  pixelMatchOptions: {
    threshold: 0
  }
})
