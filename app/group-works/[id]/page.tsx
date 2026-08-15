import { redirect } from 'next/navigation';

export default async function LegacyGroupWorkRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/works/${id}`);
}
