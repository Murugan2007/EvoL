const P: Record<string, string> = {
  play: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10.500 8.800l4.500 3.200-4.500 3.200z",
  doc: "M7 3h7l4 4v14H7zM14 3v4h4M9.500 12h5M9.500 15.500h5",
  flag: "M6 21V4M6 5h11l-2 3.500 2 3.500H6",
  award: "M12 14a5.500 5.500 0 1 0 0-11 5.500 5.500 0 0 0 0 11zM8.500 13.500L7.500 21l4.500-2.500 4.500 2.500-1-7.500",
  bolt: "M13 3L5 13.500h6L10 21l8-10.500h-6z",
  chip: "M7 7h10v10H7zM10 10h4v4h-4zM9.500 3v4M14.500 3v4M9.500 17v4M14.500 17v4M3 9.500h4M3 14.500h4M17 9.500h4M17 14.500h4",
  tool: "M14.700 6.300a4 4 0 0 0-5.200 5.200L3.500 17.500a1.800 1.800 0 0 0 2.500 2.500l6-6a4 4 0 0 0 5.200-5.200l-2.700 2.700-2.300-.5-.5-2.300z",
  bag: "M5.500 8h13l-1 12h-11zM9 8V6.500a3 3 0 0 1 6 0V8",
  shield: "M12 3l7 3v5.500c0 4.500-3 8-7 9.500-4-1.500-7-5-7-9.500V6zM9 12l2.200 2.200L15.500 10",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4",
  chat: "M4 5h16v11H9l-5 4zM12 8v5M9.500 10.500h5",
  check: "M5 12.500l4.500 4.500L19 7.500",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 17h.01",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  chevron: "M9 6l6 6-6 6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.500-6 8-6s8 2 8 6",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  admin: "M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6zM9 12l2 2 4-4",
};

export function Icon({ name, className = "h-5 w-5" }: { name: keyof typeof P | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] ?? P.help} />
    </svg>
  );
}
