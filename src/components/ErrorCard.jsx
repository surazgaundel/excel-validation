import React from "react";

export default function ErrorCard({ errorMessage }) {
  return (
    <div className="alert alert-error mt-4">
      <svg
        className="alert-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" />
        <path
          d="M12 8V12"
          stroke="#EF4444"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="16" r="1" fill="#EF4444" />
      </svg>
      <div>
        <div className="alert-title">Error</div>
        {errorMessage ? (
          errorMessage
        ) : (
          <p>
            There was an error processing your files. Please check the file
            formats and try again.
          </p>
        )}
      </div>
    </div>
  );
}
