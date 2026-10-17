/**
 * Drapeau de la RDC dessiné en SVG. On n'utilise pas l'emoji drapeau : Windows ne sait pas
 * l'afficher (il montre les lettres « CD »), et les maquettes en ont justement un rendu cassé.
 * Décoratif : le nom du pays est déjà écrit à côté (aria-hidden).
 */
export function FlagCD() {
  return (
    <svg viewBox="0 0 30 20" width="24" height="16" aria-hidden="true" focusable="false">
      <clipPath id="flag-cd-clip">
        <rect width="30" height="20" rx="3" />
      </clipPath>
      <g clipPath="url(#flag-cd-clip)">
        <rect width="30" height="20" fill="#007FFF" />
        <path d="M-3 22 L33 -2" stroke="#F7D618" strokeWidth="7.4" />
        <path d="M-3 22 L33 -2" stroke="#CE1021" strokeWidth="4.8" />
        <polygon points="5.60,2.10 6.39,4.31 8.74,4.38 6.88,5.82 7.54,8.07 5.60,6.75 3.66,8.07 4.32,5.82 2.46,4.38 4.81,4.31" fill="#F7D618" />
      </g>
    </svg>
  );
}
