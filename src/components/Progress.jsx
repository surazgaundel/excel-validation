function Progress({ value }) {
  return (
    <div className="progress-container">
      <div
        className="progress-bar"
        style={{ width: `${value}%` }}
        role="progressbar"
        aria-label="Progress"
        aria-valuenow={value}
        aria-valuemin="0"
        aria-valuemax="100"
      />
    </div>
  )
}

export default Progress;

