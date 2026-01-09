"use client";

import { useCallback, useState } from "react";
import ResultsDashboard from "./ResultsDashboard";
import styles from "./ResumeUploader.module.css";

export default function ResumeUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null); // TODO: Define type

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        alert("Please upload a PDF file.");
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
      } else {
        alert("Please upload a PDF file.");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Something went wrong during analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (result) {
    return (
      <ResultsDashboard
        data={result}
        onReset={() => {
          setFile(null);
          setResult(null);
        }}
      />
    );
  }

  return (
    <div className={styles.container}>
      {!file ? (
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className={styles.iconWrapper}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h3 className={styles.dropTitle}>Drop your resume here</h3>
          <p className={styles.dropSubtitle}>Supports PDF only</p>
          <label className={styles.browseButton}>
            Browse Files
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className={styles.hiddenInput}
            />
          </label>
        </div>
      ) : (
        <div className={styles.fileCard}>
          <div className={styles.fileInfo}>
            <span className={styles.fileName}>{file.name}</span>
            <button
              className={styles.removeButton}
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
            >
              ×
            </button>
          </div>

          <button
            className={styles.analyzeButton}
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? "Analyzing..." : "Analyze Resume"}
          </button>
        </div>
      )}
    </div>
  );
}
