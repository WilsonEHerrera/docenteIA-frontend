import { GradebookScreen } from "@/components/features/gradebook/GradebookScreen";

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <GradebookScreen courseId={courseId} />;
}
