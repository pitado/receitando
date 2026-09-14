import styles from "./system.module.css";

export default function AppLoading() {
  return (
    <div aria-busy="true" aria-label="Carregando" className={`container ${styles.statePage}`} role="status">
      <span className="sr-only">Carregando.</span>
      <div aria-hidden="true" className={styles.pageSkeleton}>
        <span className={styles.skeletonTitle} />
        <span className={styles.skeletonCopy} />
        <div className={styles.skeletonCards}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
