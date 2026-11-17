/**
 * A quietly 3D Indian flag — drawn as SVG cloth with fold shading, the
 * 24-spoke Ashoka Chakra, and a perspective tilt applied by the caller.
 * Purely decorative: aria-hidden, no interaction.
 */

/* Cloth pinned at the left edge (the text margin), billowing toward its
   free end on the right: the wave amplitude grows rightwards, and the
   right edge dissolves into the paper via the page overlay. */
const WAVE =
  "M0,12 C50,8 90,30 140,30 C190,30 220,12 270,16 C320,20 340,42 390,42 C440,42 460,20 510,24 C550,27 580,50 620,44 C630,42 636,34 640,32 L640,368 C624,374 600,360 560,372 C510,388 480,364 430,372 C380,380 360,358 310,366 C260,374 240,352 190,362 C140,372 120,354 80,364 C50,372 25,378 0,378 Z";

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
        cx="290"
        cy="388"
        rx="270"
        ry="14"
        fill="#1c1914"
        opacity="0.10"
        filter="url(#flag-soft)"
      />

      <g clipPath="url(#flag-cloth)">
        {/* Saffron */}
        <rect x="0" y="0" width="640" height="134" fill="#e8873f" />
        {/* White — a faint warm tint in dark mode so the cloth still
            reads as one piece instead of a hollow middle. */}
        <rect
          x="0"
          y="134"
          width="640"
          height="132"
          className="fill-[#fbf8f1] dark:fill-[#cfc9bd]"
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
