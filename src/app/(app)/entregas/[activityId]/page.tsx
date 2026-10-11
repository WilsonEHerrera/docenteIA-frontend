import { SubmissionsScreen } from "@/components/features/submissions/SubmissionsScreen";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ activityId: string }>;
  searchParams: Promise<{ name?: string | string[] }>;
}) {
  const { activityId } = await params;
  const { name } = await searchParams;
  const activityName = typeof name === "string" ? name.slice(0, 120) : "";
  return <SubmissionsScreen activityId={activityId} activityName={activityName} />;
}
