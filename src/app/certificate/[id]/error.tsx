"use client";

export default function CertificateError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-lg font-bold">We couldn’t open this certificate</p>
      <p className="max-w-sm text-sm text-muted">Please try again. If it keeps happening, send the certificate ID to Evol and we’ll fix it.</p>
      <button onClick={reset} className="btn btn-sm">Try again</button>
    </main>
  );
}
