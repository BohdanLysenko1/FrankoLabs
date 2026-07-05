/**
 * The Franko Labs "F" mark as an inline SVG — vectorized 1:1 from
 * public/logos/FrankoLabsLogo.png so it renders crisp at any size
 * with real transparency.
 */
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 722 930"
      role="img"
      aria-label="Franko Labs"
      className={className}
    >
      <rect x="1" y="0" width="228" height="236" rx="45" fill="#6de7cb" />
      <rect x="267" y="0" width="454" height="236" rx="45" fill="#fdfdfd" />
      <rect x="1" y="276" width="228" height="238" rx="45" fill="#fdfdfd" />
      <rect x="267" y="276" width="366" height="238" rx="45" fill="#6de7cb" />
      <rect x="0" y="551" width="230" height="378" rx="45" fill="#3f3d3e" />
    </svg>
  );
}
