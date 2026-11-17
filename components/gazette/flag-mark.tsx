/**
 * A quietly 3D Indian flag — drawn as SVG cloth with fold shading, the
 * 24-spoke Ashoka Chakra, and a perspective tilt applied by the caller.
 * Purely decorative: aria-hidden, no interaction.
 */

/* Cloth pinned at the right edge (the text margin), billowing toward its
   free end on the left: the wave amplitude grows leftwards, and the left
   edge dissolves into the paper via the page overlay. */
const WAVE =
  "M640,12 C590,8 550,30 500,30 C450,30 420,12 370,16 C320,20 300,42 250,42 C200,42 180,20 130,24 C90,27 60,50 20,44 C10,42 4,34 0,32 L0,368 C16,374 40,360 80,372 C130,388 160,364 210,372 C260,380 280,358 330,366 C380,374 400,352 450,362 C500,372 520,354 560,364 C590,372 615,378 640,378 Z";

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
        cx="350"
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
