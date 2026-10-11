import { QuizEditor } from "@/components/features/quizzes/QuizEditor";

export default async function Page({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  return <QuizEditor quizId={quizId} />;
}
