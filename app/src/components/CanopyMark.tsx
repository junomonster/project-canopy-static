interface CanopyMarkProps {
  size?: number;
  className?: string;
  stroke?: string;
  ariaLabel?: string;
}

export default function CanopyMark({
  size = 28,
  className,
  stroke = '#54db98',
  ariaLabel,
}: CanopyMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
    >
      <circle cx="26" cy="26" r="25" stroke={stroke} strokeWidth="1" />
      <path
        d="M8 34 Q26 8 44 34"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 34 Q26 16 40 34"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <line x1="8" y1="34" x2="44" y2="34" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}
