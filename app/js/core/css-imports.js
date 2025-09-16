// Dynamic CSS imports for component-specific styles
// These allow Vite to properly chunk CSS for lazy loading

export const loadTableCSS = () => import('../css/components/tables-lazy.css');
export const loadFormCSS = () => import('../css/components/forms-lazy.css');

// Re-export for direct use
export { default as tableStyles } from '../css/components/tables-lazy.css?inline';
export { default as formStyles } from '../css/components/forms-lazy.css?inline';
