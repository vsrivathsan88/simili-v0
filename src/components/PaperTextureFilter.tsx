// SVG filter for paper texture effect - proper React component
export const PaperTextureFilter = () => (
  <defs>
    <filter id="rough-paper-texture" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence 
        baseFrequency="0.04" 
        numOctaves={3} 
        result="noise"
        seed={2}
      />
      <feDisplacementMap 
        in="SourceGraphic" 
        in2="noise" 
        scale="1.5"
      />
      <feGaussianBlur stdDeviation="0.3" result="softened"/>
    </filter>
  </defs>
)
