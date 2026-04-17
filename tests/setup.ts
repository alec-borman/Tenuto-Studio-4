if (typeof document !== 'undefined') {
  document.queryCommandSupported = () => true;
}
if (typeof window !== 'undefined') {
  if (typeof window.CSS === 'undefined') {
    window.CSS = { escape: (v: string) => v } as any;
  }
  if (typeof window.matchMedia === 'undefined') {
    window.matchMedia = () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as any;
  }
}

