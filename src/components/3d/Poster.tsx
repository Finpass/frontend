/** Static fallback for mobile / reduced-motion (SVG instead of PNG: no binary asset needed). */
export function Poster({ label }: { label: string }) {
  const h = [40, 70, 100, 130, 160];
  return (
    <svg viewBox="0 0 400 260" role="img" aria-label={label} className="h-full w-full">
      {h.map((v, i) => (
        <rect key={i} x={30 + i * 70} y={230 - v} width={62} height={v} rx={10} fill={i === 4 ? "#2a3a7a" : "#1f2b63"} />
      ))}
      <circle cx={330} cy={50} r={26} fill="#8ea2ff" opacity={0.55} />
      <circle cx={330} cy={50} r={14} fill="#8ea2ff" />
      <circle cx={190} cy={96} r={12} fill="#d9b46a" />
    </svg>
  );
}
