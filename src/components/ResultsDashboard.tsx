"use client";

import { useEffect, useState } from "react";
import styles from "./ResultsDashboard.module.css";

interface ResultsProps {
  data: {
    score: number;
    suggestions: string[];
    keywordsFound: string[];
    details: {
      wordCount: number;
      sectionsFound: number;
    };
  };
  onReset: () => void;
}

export default function ResultsDashboard({ data, onReset }: ResultsProps) {
  const [displayedScore, setDisplayedScore] = useState(0);

  useEffect(() => {
    // Animate score
    let start = 0;
    const duration = 1500;
    const increment = data.score / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= data.score) {
        setDisplayedScore(data.score);
        clearInterval(timer);
      } else {
        setDisplayedScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [data.score]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#4ade80"; // Green
    if (score >= 60) return "#facc15"; // Yellow
    return "#f87171"; // Red
  };

  const circumference = 2 * Math.PI * 45; // Radius 45
  const strokeDashoffset =
    circumference - (displayedScore / 100) * circumference;

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2 className={styles.title}>Analysis Result</h2>
        <button onClick={onReset} className={styles.backButton}>
          Analyze Another
        </button>
      </div>

      <div className={styles.grid}>
        {/* Score Card */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>ATS Score</h3>
          <div className={styles.gaugeContainer}>
            <svg className={styles.gauge} viewBox="0 0 100 100">
              <circle
                className={styles.gaugeBackground}
                cx="50"
                cy="50"
                r="45"
              />
              <circle
                className={styles.gaugeValue}
                cx="50"
                cy="50"
                r="45"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  stroke: getScoreColor(displayedScore),
                }}
              />
            </svg>
            <div className={styles.scoreText}>
              <span className={styles.scoreNumber}>{displayedScore}</span>
              <span className={styles.scoreLabel}>/100</span>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Quick Stats</h3>
          <div className={styles.statsList}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Word Count</span>
              <span className={styles.statValue}>{data.details.wordCount}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Key Sections</span>
              <span className={styles.statValue}>
                {data.details.sectionsFound}/6
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Action Verbs</span>
              <span className={styles.statValue}>
                {data.keywordsFound.length} Detected
              </span>
            </div>
          </div>
        </div>

        {/* Suggestions Card */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <h3 className={styles.cardTitle}>Improvements Needed</h3>
          {data.suggestions.length > 0 ? (
            <ul className={styles.suggestionList}>
              {data.suggestions.map((s, i) => (
                <li key={i} className={styles.suggestionItem}>
                  <span className={styles.warningIcon}>⚠</span>
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.perfectMessage}>
              <span className={styles.checkIcon}>✓</span>
              Great job! No major issues found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
