import { cn } from "@/lib/utils";

/**
 * Nepal as a field of blueprint grid: Natural Earth 50m boundary (same source
 * as the globe's land mask), equirectangular with a cos(lat) width
 * correction. Hairline cells are masked by a Gaussian-blurred copy of the
 * shape, so the grid dissolves before it reaches the border — no outline.
 * Scales to cover its box (`preserveAspectRatio: slice`); colour is
 * `currentColor`; strokes stay 1px at any size.
 */
function NepalMap({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 880 497"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable="false"
      className={cn("block h-full w-full", className)}
    >
      <defs>
        <pattern id="nepal-map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path
            d="M32 0H0V32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </pattern>
        <filter
          id="nepal-map-feather"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <mask id="nepal-map-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="880" height="497">
          <path
            d="M874.1 310.4L878.4 313.8L879.2 319.2L878.4 325.4L873.8 338.4L869.8 347.9L864.8 367.3L860.5 401.2L861.6 407.2L874.5 426.6L879.2 441.4L880.0 451.7L874.5 468.8L868.3 488.1L865.2 492.4L861.6 493.9L846.0 487.2L835.1 488.1L822.6 491.9L809.3 491.1L798.8 488.9L785.1 496.6L771.8 492.4L763.6 487.6L757.7 474.2L755.4 472.4L728.1 486.6L721.4 487.4L704.2 479.9L690.2 472.4L685.1 470.3L671.4 467.3L659.3 465.6L646.0 460.9L629.6 467.1L623.0 466.5L616.7 462.2L613.6 453.2L612.8 444.6L607.0 438.8L598.4 437.6L586.3 442.7L568.7 449.8L562.8 448.5L557.8 446.5L555.8 444.6L553.1 436.7L550.3 434.8L546.4 434.6L539.0 432.6L530.0 426.8L502.7 412.7L499.2 406.5L499.2 392.6L498.0 386.8L494.5 380.8L480.4 374.8L453.1 365.0L438.2 357.1L430.8 360.7L417.2 364.1L409.7 371.2L400.7 368.8L379.7 361.6L368.3 360.3L361.3 362.8L359.7 367.1L351.1 372.0L342.9 368.2L326.9 362.8L312.5 360.1L291.0 353.6L288.6 344.2L284.7 334.6L279.7 333.1L260.1 334.8L242.6 324.5L223.4 311.0L215.2 306.8L210.1 305.0L205.5 306.8L200.0 310.0L195.3 310.8L185.1 305.0L171.9 296.9L155.5 286.8L136.7 272.7L128.9 264.8L125.4 258.8L121.1 253.0L104.7 243.8L91.4 236.5L75.8 227.8L73.0 226.1L67.2 220.9L58.2 214.3L50.4 212.4L48.0 216.0L46.5 219.8L39.8 219.0L29.7 212.1L18.7 205.3L10.5 198.7L2.0 192.0L0.0 187.1L3.5 171.9L8.6 158.6L12.9 155.8L19.5 147.1L22.3 131.9L21.9 118.8L28.9 100.6L37.9 81.1L53.9 60.2L60.9 53.3L68.7 48.6L83.2 33.2L86.3 30.6L93.0 26.5L99.2 25.7L103.9 27.6L109.0 35.5L114.8 43.2L121.9 42.8L130.5 36.4L148.0 6.2L172.6 0.0L195.7 3.2L216.0 7.5L222.2 17.6L226.2 28.3L228.5 33.6L235.1 39.8L264.0 55.0L280.8 68.7L303.9 86.9L321.5 94.8L336.7 95.5L345.3 102.8L358.2 116.9L369.5 133.4L383.2 148.6L392.5 147.9L405.4 143.0L421.4 136.6L430.8 139.8L439.4 144.1L442.1 151.8L447.2 166.5L453.1 182.0L462.1 187.3L473.0 195.2L478.9 201.7L498.8 213.0L501.9 217.7L505.8 220.9L510.9 223.1L514.8 225.4L521.0 226.1L544.5 219.2L550.3 220.1L554.2 221.3L554.2 223.9L550.0 234.6L546.4 248.5L550.0 255.4L559.7 258.4L581.2 260.3L610.5 260.3L619.1 267.2L628.1 277.6L636.7 295.6L640.2 303.3L644.9 305.5L652.3 302.5L653.5 295.0L653.8 284.1L660.1 280.2L664.4 283.2L669.1 291.8L680.8 299.5L689.8 303.1L698.0 301.8L701.5 298.8L705.4 283.9L712.0 281.7L720.2 282.8L723.4 285.8L726.9 291.8L736.7 294.6L746.8 298.4L756.2 303.1L769.1 314.2L785.5 316.4L804.2 316.2L814.0 316.4L821.4 317.2L828.1 316.4L847.2 308.5L855.0 307.8L864.8 308.9L874.1 310.4Z"
            fill="white"
            filter="url(#nepal-map-feather)"
          />
        </mask>
      </defs>
      <rect width="880" height="497" fill="url(#nepal-map-grid)" mask="url(#nepal-map-mask)" />
    </svg>
  );
}

export { NepalMap };
