import React from "react";

export default function ResetButton({ resetProcess, disabled }) {
  return (
    <button
      className="button button-outline flex align-center justify-center"
      onClick={resetProcess}
      disabled={disabled}
    >
      <svg
        style={{ marginRight: "8px", width: "16px", height: "16px" }}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M16 12L8 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 9L16 12L13 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Start Over
    </button>
  );
}
