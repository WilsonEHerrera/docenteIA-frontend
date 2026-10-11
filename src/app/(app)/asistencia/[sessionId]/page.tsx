import { SessionView } from "@/components/features/attendance/SessionView";

export default async function Page({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <SessionView sessionId={sessionId} />;
}
