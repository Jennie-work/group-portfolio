import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { fontFamily: { sans: ['var(--font-inter)'], display: ['var(--font-space-grotesk)'] }, colors: { ink: '#111111', paper: '#f5f4f0', line: '#d9d8d2', lime: '#d9f99d' } } }, plugins: [] } satisfies Config;
