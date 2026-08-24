import Link from "next/link";

import styles from "./not-found.module.css";

export default function NotFoundPage() {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.layout}`}>
        <div className={styles.copy}>
          <span className={styles.code}>404</span>
          <p className={styles.eyebrow}>FORA DO CARDÁPIO</p>
          <h1>Essa página não entrou no menu.</h1>
          <p className={styles.description}>
            Mas ainda dá para voltar e encontrar alguma coisa boa por aqui.
          </p>

          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/">
              Voltar para o início <span aria-hidden="true">→</span>
            </Link>
            <Link className={styles.secondaryAction} href="/receitas">
              Ver receitas
            </Link>
          </div>
        </div>

        <div aria-hidden="true" className={styles.visual}>
          <svg
            className={styles.plateScene}
            viewBox="0 0 620 540"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="plate-shadow-v3" x="-40%" y="-40%" width="180%" height="200%">
                <feDropShadow dx="0" dy="20" floodColor="#8a5f4b" floodOpacity="0.18" stdDeviation="18" />
              </filter>
              <filter id="paper-shadow-v3" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="10" floodColor="#8a5f4b" floodOpacity="0.18" stdDeviation="10" />
              </filter>
              <linearGradient id="plate-fill-v3" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fffefa" />
                <stop offset="0.65" stopColor="#fff9f2" />
                <stop offset="1" stopColor="#f1dfd1" />
              </linearGradient>
              <linearGradient id="fork-fill-v3" x1="0" x2="1">
                <stop offset="0" stopColor="#6f4f41" />
                <stop offset="0.45" stopColor="#b08b76" />
                <stop offset="0.65" stopColor="#d0b19f" />
                <stop offset="1" stopColor="#6d4d40" />
              </linearGradient>
            </defs>

            <g filter="url(#plate-shadow-v3)" transform="rotate(-2 300 280)">
              <path
                d="M300 93C382 91 451 136 477 207C504 279 480 366 419 417C356 470 254 478 180 431C110 387 79 307 99 232C119 157 197 96 300 93Z"
                fill="url(#plate-fill-v3)"
                stroke="#DCC4B3"
                strokeWidth="2.4"
              />
              <path
                d="M300 126C366 123 421 157 444 216C466 274 447 340 398 380C349 421 271 428 212 392C158 358 134 297 149 240C165 181 225 129 300 126Z"
                fill="#fffdf9"
                stroke="#E8D8CD"
                strokeWidth="2"
              />
              <path
                d="M189 187C212 161 245 145 282 139"
                fill="none"
                opacity="0.75"
                stroke="#fff"
                strokeLinecap="round"
                strokeWidth="14"
              />
              <path
                d="M390 373C361 397 328 407 294 408"
                fill="none"
                opacity="0.75"
                stroke="#E7D3C5"
                strokeLinecap="round"
                strokeWidth="5"
              />
            </g>

            <g opacity="0.95">
              <ellipse cx="249" cy="321" fill="#C85A3D" rx="7" ry="6" transform="rotate(-17 249 321)" />
              <ellipse cx="213" cy="286" fill="#7C9A6E" rx="5" ry="9" transform="rotate(-32 213 286)" />
              <circle cx="287" cy="347" fill="#8CAA7A" r="5" />
              <ellipse cx="235" cy="370" fill="#E2BC86" rx="7" ry="5" transform="rotate(14 235 370)" />
              <circle cx="326" cy="307" fill="#D69A64" opacity="0.7" r="3" />
            </g>

            <g filter="url(#paper-shadow-v3)" transform="rotate(3 330 205)">
              <rect x="245" y="155" width="184" height="118" rx="2" fill="#FFF8F0" stroke="#DCC2B1" />
              <rect x="309" y="145" width="62" height="14" rx="1" fill="#F2B07D" opacity="0.8" />
              <text x="267" y="183" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="800" fill="#B44B33" letterSpacing="1">
                404
              </text>
              <text x="267" y="214" fontFamily="Georgia, serif" fontSize="27" fontWeight="700" fill="#321E17">
                pedido não
              </text>
              <text x="267" y="243" fontFamily="Georgia, serif" fontSize="27" fontWeight="700" fill="#321E17">
                encontrado
              </text>
            </g>

            <g filter="url(#plate-shadow-v3)" transform="rotate(17 501 337)">
              <path d="M507 246V442" stroke="url(#fork-fill-v3)" strokeWidth="11" strokeLinecap="round" />
              <path d="M484 232V287M497 228V287M510 228V287M523 232V287" stroke="url(#fork-fill-v3)" strokeWidth="6" strokeLinecap="round" />
              <path d="M484 286C491 299 517 299 523 286" fill="none" stroke="url(#fork-fill-v3)" strokeWidth="9" strokeLinecap="round" />
            </g>

            <g>
              <path d="M432 434C459 418 478 398 494 374" fill="none" stroke="#688A59" strokeWidth="3" strokeLinecap="round" />
              <ellipse cx="445" cy="424" rx="7" ry="14" fill="#7C9A6E" transform="rotate(-48 445 424)" />
              <ellipse cx="462" cy="409" rx="7" ry="14" fill="#88A879" transform="rotate(-38 462 409)" />
              <ellipse cx="479" cy="391" rx="7" ry="14" fill="#769664" transform="rotate(-30 479 391)" />
            </g>

            <g stroke="#E4A779" strokeWidth="2.2" strokeLinecap="round" opacity="0.8">
              <path d="M106 404V432" />
              <path d="M92 418H120" />
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
