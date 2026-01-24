export async function GET() {
  return Response.json({
    NEXT_PUBLIC_UI_VERSION: process.env.NEXT_PUBLIC_UI_VERSION ?? null,
    VITE_UI_VERSION: process.env.VITE_UI_VERSION ?? null,
  });
}
