import { Header } from "./header"
import { Save } from "lucide-react"
import "./styles/pages.css"

const SettingsPage = () => {
  return (
    <div className="page-container">
      <Header title="Settings" />

      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Account Settings</div>
          <div className="card-description">Manage your account settings and preferences</div>
        </div>
        <div className="card-content">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" className="form-input" defaultValue="Anthony" />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" defaultValue="anthony@example.com" />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <input type="text" className="form-input" defaultValue="Manager" disabled />
          </div>

          <button className="button button-primary">
            <Save size={16} className="button-icon" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header">
          <div className="card-title">Notification Settings</div>
          <div className="card-description">Configure how you receive notifications</div>
        </div>
        <div className="card-content">
          <div className="form-group">
            <label className="form-label">Email Notifications</label>
            <div className="checkbox-group">
              <div className="checkbox-item">
                <input type="checkbox" id="email-reports" defaultChecked />
                <label htmlFor="email-reports">Send me report summaries</label>
              </div>
              <div className="checkbox-item">
                <input type="checkbox" id="email-uploads" defaultChecked />
                <label htmlFor="email-uploads">Notify me about new uploads</label>
              </div>
              <div className="checkbox-item">
                <input type="checkbox" id="email-system" defaultChecked />
                <label htmlFor="email-system">System alerts and notifications</label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dashboard Notifications</label>
            <div className="checkbox-group">
              <div className="checkbox-item">
                <input type="checkbox" id="dashboard-alerts" defaultChecked />
                <label htmlFor="dashboard-alerts">Show alerts in dashboard</label>
              </div>
              <div className="checkbox-item">
                <input type="checkbox" id="dashboard-updates" defaultChecked />
                <label htmlFor="dashboard-updates">Show system updates</label>
              </div>
            </div>
          </div>

          <button className="button button-primary">
            <Save size={16} className="button-icon" />
            Save Preferences
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header">
          <div className="card-title">Security</div>
          <div className="card-description">Manage your security settings</div>
        </div>
        <div className="card-content">
          <div className="form-group">
            <label className="form-label">Change Password</label>
            <input type="password" className="form-input" placeholder="Current password" />
          </div>

          <div className="form-group">
            <input type="password" className="form-input" placeholder="New password" />
          </div>

          <div className="form-group">
            <input type="password" className="form-input" placeholder="Confirm new password" />
          </div>

          <button className="button button-primary">
            <Save size={16} className="button-icon" />
            Update Password
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
