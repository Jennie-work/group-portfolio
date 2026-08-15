'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#f5f4f0] text-black">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-16 md:px-10">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Temporary deployment diagnostic</p>
          <h1 className="display mt-5 text-5xl font-semibold md:text-7xl">页面加载失败</h1>
          <p className="mt-6 text-neutral-600">请把下方错误信息保留给开发排查。</p>
          <pre className="mt-8 overflow-auto border border-black/15 bg-white p-5 text-sm leading-relaxed">
            {error.message || 'Unknown client error'}
            {error.digest ? `\nDigest: ${error.digest}` : ''}
          </pre>
          <button
            type="button"
            onClick={reset}
            className="mt-8 w-fit border border-black bg-black px-5 py-3 text-white"
          >
            重新加载
          </button>
        </main>
      </body>
    </html>
  );
}
