"use client"

import { useState } from "react"

function FileUploader({ label, accept, onFileUpload, fileName, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileUpload(files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      onFileUpload(files[0])
    }
  }

  const uploaderStyles = {
    border: "2px dashed " + (isDragging ? "#3b82f6" : "#cbd5e1"),
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    backgroundColor: isDragging ? "rgba(59, 130, 246, 0.05)" : "transparent",
    opacity: disabled ? 0.5 : 1,
  }

  const iconStyles = {
    width: "40px",
    height: "40px",
    margin: "0 auto 16px",
    color: fileName ? "#22C55E" : "#94a3b8",
  }

  return (
    <div>
      <p style={{ fontSize: "0.875rem", fontWeight: "500", marginBottom: "8px" }}>{label}</p>
      <div
        style={uploaderStyles}
        onDragOver={!disabled ? handleDragOver : undefined}
        onDragLeave={!disabled ? handleDragLeave : undefined}
        onDrop={!disabled ? handleDrop : undefined}
      >
        <input
          type="file"
          id={`file-${label}`}
          style={{ display: "none" }}
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
        />
        <label htmlFor={`file-${label}`} style={{ display: "block", cursor: disabled ? "not-allowed" : "pointer" }}>
          {fileName ? (
            <div>
              <svg style={iconStyles} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M8 12L11 15L16 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                    stroke="#64748B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M14 2V8H20" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>{fileName}</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "8px" }}>File uploaded successfully</p>
            </div>
          ) : (
            <div>
              <svg style={iconStyles} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 8L12 3L7 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: "0.875rem", fontWeight: "500" }}>Drag and drop your file here</p>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>or click to browse files</p>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "8px" }}>
                Supports {accept.split(",").join(", ")} files
              </p>
            </div>
          )}
        </label>
      </div>
    </div>
  )
}

export default FileUploader

