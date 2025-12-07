import React from 'react'
import './AdminTabs.css'

interface Tab {
  id: string
  label: string
  icon?: string
  badge?: number
}

interface AdminTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

const AdminTabs: React.FC<AdminTabsProps> = ({ tabs, activeTab, onTabChange, className = '' }) => (
  <div className={`admin-tabs ${className}`}>
    <div className="tabs-container">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          <span className="tab-label">{tab.label}</span>
          {tab.badge !== undefined && <span className="tab-badge">{tab.badge}</span>}
        </button>
      ))}
    </div>
  </div>
)

export default AdminTabs
