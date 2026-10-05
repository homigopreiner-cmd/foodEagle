// Vitest setup for Ionic/Angular unit tests.
// jsdom lacks a few browser APIs Ionic's web components expect,
// so we provide safe stubs before any test runs.

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
