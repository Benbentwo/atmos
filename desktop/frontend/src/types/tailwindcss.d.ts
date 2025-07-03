// Type definitions for TailwindCSS 4.x

// This tells TypeScript to look for type definitions in the tailwindcss package itself
// rather than expecting separate @types/tailwindcss package
declare module 'tailwindcss' {
  const tailwindcss: any;
  export default tailwindcss;
}

declare module '@tailwindcss/oxide' {
  const oxide: any;
  export default oxide;
}

declare module '@tailwindcss/vite' {
  const vite: any;
  export default vite;
}

declare module '@tailwindcss/postcss' {
  const postcss: any;
  export default postcss;
}
