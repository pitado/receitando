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
              <filter id="plate-shadow" x="-30%" y="-30%" width="160%" height="180%">
                <feDropShadow dx="0" dy="18" floodColor="#6f4d3c" floodOpacity="0.14" stdDeviation="16" />
              </filter>
              <filter id="fork-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="7" floodColor="#5a3d30" floodOpacity="0.16" stdDeviation="5" />
              </filter>
              <linearGradient id="fork-metal" x1="0" x2="1">
                <stop offset="0" stopColor="#725143" />
                <stop offset="0.48" stopColor="#b08a73" />
                <stop offset="1" stopColor="#68493c" />
              </linearGradient>
              <linearGradient id="plate-glow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.96" />
                <stop offset="0.62" stopColor="#fffaf3" stopOpacity="0.9" />
                <stop offset="1" stopColor="#f3e5d8" stopOpacity="0.78" />
              </linearGradient>
            </defs>

            <g filter="url(#plate-shadow)" transform="rotate(-3 278 280)">
              <path
                d="M296 76C374 74 441 111 474 178C510 251 494 340 439 399C385 457 291 479 211 448C132 418 84 344 88 263C91 188 133 121 203 91C230 80 263 75 296 76Z"
                fill="url(#plate-glow)"
                stroke="#E4CFC0"
                strokeWidth="2"
              />
              <path
                d="M290 103C358 102 416 134 445 190C477 251 464 326 417 376C370 426 293 444 227 419C159 393 117 330 120 263C123 199 159 145 216 119C238 109 264 103 290 103Z"
                fill="#FFFCF7"
                stroke="#EDDED3"
                strokeWidth="2"
              />
              <path
                d="M222 131C183 151 150 188 138 230"
                fill="none"
                opacity="0.75"
                stroke="#FFFFFF"
                strokeLinecap="round"
                strokeWidth="9"
              />
              <path
                d="M392 385C365 408 333 421 300 425"
                fill="none"
                opacity="0.65"
                stroke="#E9D9CD"
                strokeLinecap="round"
                strokeWidth="5"
              />
            </g>

            <g>
              <ellipse cx="243" cy="301" fill="#C85A3D" rx="7" ry="6" transform="rotate(-20 243 301)" />
              <ellipse cx="198" cy="266" fill="#7C9A6E" rx="5" ry="9" transform="rotate(-38 198 266)" />
              <circle cx="278" cy="344" fill="#84A873" r="4.5" />
              <ellipse cx="233" cy="371" fill="#E2BC86" rx="6.5" ry="4.5" transform="rotate(16 233 371)" />
              <circle cx="323" cy="316" fill="#D9A26A" opacity="0.6" r="2.6" />
            </g>

            <g filter="url(#fork-shadow)" transform="rotate(20 505 350)">
              <path d="M510 211V412" stroke="url(#fork-metal)" strokeLinecap="round" strokeWidth="11" />
              <path d="M488 207L488 258" stroke="url(#fork-metal)" strokeLinecap="round" strokeWidth="6" />
              <path d="M501 204L501 258" stroke="url(#fork-metal)" strokeLinecap="round" strokeWidth="6" />
              <path d="M514 204L514 258" stroke="url(#fork-metal)" strokeLinecap="round" strokeWidth="6" />
              <path d="M527 207L527 258" stroke="url(#fork-metal)" strokeLinecap="round" strokeWidth="6" />
              <path d="M488 257C493 267 522 267 527 257" fill="none" stroke="url(#fork-metal)" strokeLinecap="round" strokeWidth="8" />
            </g>

            <g fill="none" stroke="#6F8E5F" strokeLinecap="round">
              <path d="M424 431C448 417 470 398 488 374" strokeWidth="3" />
              <path d="M438 421C431 407 433 397 443 393C451 401 449 411 438 421Z" fill="#7C9A6E" stroke="none" />
              <path d="M456 407C451 392 456 382 467 381C473 390 469 399 456 407Z" fill="#88A879" stroke="none" />
              <path d="M472 391C468 378 473 368 484 368C489 377 485 385 472 391Z" fill="#7C9A6E" stroke="none" />
              <path d="M445 417C452 421 459 421 464 416" strokeWidth="2" />
            </g>

            <g stroke="#E7B58E" strokeLinecap="round" strokeWidth="2.2">
              <path d="M106 400V426" />
              <path d="M93 413H119" />
            </g>
          </svg>

          <div className={styles.note}>
            <span>404</span>
            <strong>pedido não encontrado</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
