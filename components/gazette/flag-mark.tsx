/**
 * A quietly 3D Indian flag — drawn as SVG cloth with fold shading, the
 * 24-spoke Ashoka Chakra, and a perspective tilt applied by the caller.
 * Purely decorative: aria-hidden, no interaction.
 */

const WAVE =
  "M60,70 C160,45 260,95 360,68 C440,48 520,80 600,58 L600,352 C520,372 440,340 360,362 C260,388 160,340 60,352 Z";

/** 24 chakra spokes, generated once at module scope. */
const SPOKES = Array.from({ length: 24 }, (_, i) => (i * 360) / 24);

export function FlagMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 400"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <clipPath id="flag-cloth">
          <path d={WAVE} />
        </clipPath>

        {/* Soft fold shading — light and shadow bands that give the cloth
            its ripple without any WebGL. */}
        <filter id="flag-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>

        <linearGradient id="flag-sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.22" />
        </linearGradient>
      </defs>

      {/* Contact shadow under the cloth. */}
      <ellipse
        cx="330"
        cy="382"
        rx="270"
        ry="16"
        fill="#1c1914"
        opacity="0.10"
        filter="url(#flag-soft)"
      />

      <g clipPath="url(#flag-cloth)">
        {/* Saffron */}
        <rect x="0" y="0" width="640" height="134" fill="#e8873f" />
        {/* White — transparent in dark mode so the plate's paper shows
            through instead of a grey slab. */}
        <rect
          x="0"
          y="134"
          width="640"
          height="132"
          className="fill-[#fbf8f1] dark:fill-transparent"
        />
        {/* Green */}
        <rect x="0" y="266" width="640" height="140" fill="#3f7d4a" />

        {/* Ashoka Chakra */}
        <g
          transform="translate(330 200)"
          stroke="#26307d"
          strokeWidth="3"
          opacity="0.9"
          strokeLinecap="round"
        >
          <circle r="57" fill="none" />
          <circle r="9" fill="none" />
          {SPOKES.map((angle) => (
            <line
              key={angle}
              x1="0"
              y1="-10"
              x2="0"
              y2="-55"
              transform={`rotate(${angle})`}
            />
          ))}
        </g>

        {/* Fold shadows */}
        <g filter="url(#flag-soft)">
          <path
            d="M150,20 C128,150 172,268 148,392"
            stroke="#1c1914"
            strokeWidth="46"
            opacity="0.13"
          />
          <path
            d="M318,20 C300,150 336,262 316,392"
            stroke="#1c1914"
            strokeWidth="34"
            opacity="0.09"
          />
          <path
            d="M470,20 C452,150 486,268 464,392"
            stroke="#1c1914"
            strokeWidth="40"
            opacity="0.12"
          />
          {/* Highlights on the crests */}
          <path
            d="M232,16 C214,150 252,266 230,394"
            stroke="#ffffff"
            strokeWidth="34"
            opacity="0.28"
          />
          <path
            d="M392,16 C376,150 410,268 390,394"
            stroke="#ffffff"
            strokeWidth="28"
            opacity="0.22"
          />
        </g>

        {/* Overall sheen across the cloth */}
        <rect
          x="0"
          y="0"
          width="640"
          height="400"
          fill="url(#flag-sheen)"
          className="dark:opacity-20"
        />
      </g>

      {/* Cloth edge */}
      <path d={WAVE} stroke="#1c1914" strokeOpacity="0.10" strokeWidth="1.5" />
    </svg>
  );
}
