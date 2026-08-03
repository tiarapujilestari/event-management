import "@testing-library/jest-dom";

// jsdom doesn't implement IntersectionObserver, which Framer Motion's
// `whileInView` relies on. Provide a minimal stub for tests.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
// @ts-expect-error
global.IntersectionObserver = IntersectionObserverStub;
