import type { Config } from '@react-router/dev/config';

export default {
	appDirectory: './src/app',
	// Using react-router-hono-server with runtime: 'vercel' instead of vercelPreset()
	// This allows Hono API routes (including Auth.js) to work on Vercel
	ssr: true,
} satisfies Config;
