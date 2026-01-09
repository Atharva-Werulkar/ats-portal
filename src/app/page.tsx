import ResumeUploader from "@/components/ResumeUploader";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>
          Check Your <span className={styles.gradientText}>ATS Score</span>
        </h1>
        <p className={styles.subtitle}>
          Optimize your resume for Applicant Tracking Systems with our
          AI-powered analyzer.
        </p>

        <div className={styles.uploadContainer}>
          <ResumeUploader />
        </div>
      </div>
    </main>
  );
}
