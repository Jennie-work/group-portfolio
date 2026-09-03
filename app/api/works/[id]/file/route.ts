import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type FileWorkRow = {
  id: string;
  owner_id: string;
  type: 'link' | 'file' | 'pdf' | 'ppt';
  file_url: string | null;
  preview_url: string | null;
  published: boolean;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStoreHeaders = { 'Cache-Control': 'private, no-store, max-age=0' };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kind = request.nextUrl.searchParams.get('kind');
  const download = request.nextUrl.searchParams.get('download') === '1';

  if (!uuidPattern.test(id)) {
    return jsonError('Invalid work id.', 400);
  }

  if (kind !== 'file' && kind !== 'preview') {
    return jsonError('Invalid file kind.', 400);
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: work } = await supabase
    .from('works')
    .select('id, owner_id, type, file_url, preview_url, published')
    .eq('id', id)
    .maybeSingle<FileWorkRow>();

  if (!work || (!work.published && work.owner_id !== user?.id)) {
    return jsonError('Work not found.', 404);
  }

  const path = kind === 'preview' ? work.preview_url : work.file_url;
  const expectedPath = getExpectedPath(work, kind);

  if (!path || !expectedPath || !expectedPath.includes(path)) {
    return jsonError('File not found.', 404);
  }

  const filename = path.split('/').pop() ?? 'download';
  const { data, error } = await supabase.storage
    .from('works')
    .createSignedUrl(path, 60, download ? { download: filename } : undefined);

  if (error || !data?.signedUrl) {
    return jsonError('Could not create file link.', 403);
  }

  return NextResponse.redirect(data.signedUrl, { status: 307, headers: noStoreHeaders });
}

function getExpectedPath(work: FileWorkRow, kind: 'file' | 'preview') {
  const prefix = `${work.owner_id}/${work.id}/`;

  if (kind === 'preview') {
    return work.type === 'ppt' ? [`${prefix}preview.pdf`] : null;
  }

  if (work.type === 'file') return work.file_url?.startsWith(prefix) ? [work.file_url] : null;
  if (work.type === 'pdf') return [`${prefix}document.pdf`];
  if (work.type === 'ppt') return [`${prefix}presentation.ppt`, `${prefix}presentation.pptx`];
  return null;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: noStoreHeaders });
}
