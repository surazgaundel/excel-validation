import { useState } from "react"

function Tabs({ tabs, defaultTab, content }) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <div className="tabs">
      <div className="tabs-list">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div className="tab-panel">{content[activeTab]}</div>
    </div>
  )
}

export default Tabs

