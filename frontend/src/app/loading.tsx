import { LoadingState } from "@/components/ui/LoadingState";

import styles from "./system.module.css";

export default function AppLoading() {
  return (
    <div className={`container ${styles.statePage}`}>
      <LoadingState label="Preparando a cozinha…" />
    </div>
  );
}
