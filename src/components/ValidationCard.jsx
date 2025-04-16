import React from "react";

export default function ValidationCard({validationResults}) {
  return (
    <>
      <div className="alert alert-success">
        <svg
          className="alert-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="#22C55E" strokeWidth="2" />
          <path
            d="M8 12L11 15L16 9"
            stroke="#22C55E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <div className="alert-title">Validation Complete</div>
          <p>Your files have been processed successfully.</p>
        </div>
      </div>

      <div className="card mt-4">
        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: "500",
            marginBottom: "16px",
          }}
        >
          Validation Results
        </h3>

        <div className="stats-grid">
          <div className="stats-card stats-card-total">
            <p>Total Rows</p>
            <p>{validationResults.totalRows}</p>
          </div>
          <div className="stats-card stats-card-valid">
            <p style={{ color: "#16A34A" }}>Valid Rows</p>
            <p style={{ color: "#15803D" }}>{validationResults.validRows}</p>
          </div>
          <div className="stats-card stats-card-invalid">
            <p style={{ color: "#EA580C" }}>Invalid Rows</p>
            <p style={{ color: "#C2410C" }}>{validationResults.invalidRows}</p>
          </div>
        </div>
      </div>
    </>
  );
}
