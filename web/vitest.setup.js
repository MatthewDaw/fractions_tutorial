import '@testing-library/jest-dom';

// jsdom lacks ResizeObserver / IntersectionObserver, which ScratchCanvas and a
// few layout-aware components observe on mount. Minimal no-op stubs so the
// playability smoke tests can mount the real components.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}
