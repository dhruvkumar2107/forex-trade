export async function GET() {
  return Response.json(
    { success: false, error: 'Sync jobs belong in the copytrading service' },
    { status: 410 },
  );
}
