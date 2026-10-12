import { SubmissionsScreen } from "@/components/features/submissions/SubmissionsScreen";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ activityId: string }>;
  searchParams: Promise<{ name?: string | string[]; course?: string | string[] }>;
}) {
  const { activityId } = await params;
  const { name, course } = await searchParams;
  const activityName = typeof name === "string" ? name.slice(0, 120) : "";
  // The course is needed to match uploaded files to enrolled students; GET /activities/:id does not exist.
  const courseId = typeof course === "string" ? course.slice(0, 64) : "";
  return <SubmissionsScreen activityId={activityId} activityName={activityName} courseId={courseId} />;
}
