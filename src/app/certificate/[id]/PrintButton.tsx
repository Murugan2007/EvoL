"use client";

export function PrintButton() {
  return <button onClick={() => window.print()} className="btn btn-sm">Download / Print PDF</button>;
}
