import styles from "./cover-hover.module.css";

export function CoverFocusFrame() {
  return (
    <div className={styles.frame} aria-hidden="true">
      <i /><i /><i /><i /><span />
    </div>
  );
}
