import { CourseDetailAdmin } from "@/components/features/admin/CourseDetailAdmin";

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CourseDetailAdmin courseId={courseId} />;
}
