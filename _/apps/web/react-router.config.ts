import type { Config } from '@react-router/dev/config';

export default {
	appDirectory: './src/app',
	// Note: We use react-router-hono-server with runtime: 'vercel' instead of vercelPreset()
	// This allows our Hono API routes (including Auth.js) to work on Vercel
	ssr: true,
} satisfies Config;
