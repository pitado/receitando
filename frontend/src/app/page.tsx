import { HomeWorkspace } from "@/components/home/HomeWorkspace";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <HomeWorkspace />
    </div>
  );
}
