import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement HTMLMediaElement.prototype.play() as a Promise.
// Patch it so components calling video.play().catch() don't crash.
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: () => Promise.resolve(),
})
