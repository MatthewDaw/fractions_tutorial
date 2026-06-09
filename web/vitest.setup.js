import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Unmount any React trees mounted via Testing Library after EVERY test. Vitest's
// `globals: true` does not auto-register Testing Library's cleanup the way Jest's
// auto-cleanup does, so without this an un-unmounted tree from one test leaks its
// DOM into the next — e.g. two "Read aloud" buttons → getByText() "Multiple
// elements found", and extra heavy trees slow first render to a timeout under
// parallel load. Registering it here makes the playability net a trustworthy
// regression guard regardless of whether an individual test calls unmount().
afterEach(() => {
  cleanup();
});

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
