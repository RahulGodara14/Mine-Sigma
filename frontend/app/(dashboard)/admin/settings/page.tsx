"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Settings, Bell, Lock, Users, Database, Shield, Eye, EyeOff, Save, RotateCcw, Mail, Phone, MapPin, Globe } from "lucide-react"

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("general")
    const [showPassword, setShowPassword] = useState(false)
    const [settings, setSettings] = useState({
        organizationName: "Ministry of Mines",
        email: "admin@mine-sigma.gov.in",
        phone: "+91-11-2306-2000",
        location: "New Delhi, India",
        website: "www.mines.gov.in",
        notificationsEnabled: true,
        emailAlerts: true,
        smsAlerts: false,
        dailyReport: true,
        ndviThreshold: 0.3,
        confidenceThreshold: 85,
        analysisTimeout: 300,
        backupFrequency: "daily",
    })

    const handleSave = () => {
        console.log("Settings saved:", settings)
    }

    const handleReset = () => {
        console.log("Settings reset to defaults")
    }

    const SettingItem = ({ icon: Icon, label, value, onChange, type = "text" }: any) => (
        <div className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-emerald-400" />
                <label className="text-white font-medium">{label}</label>
            </div>
            {type === "toggle" ? (
                <button
                    onClick={() => onChange(!value)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        value ? "bg-emerald-600" : "bg-slate-700"
                    }`}
                >
                    <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            value ? "translate-x-7" : "translate-x-1"
                        }`}
                    />
                </button>
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg w-48 focus:border-emerald-500 outline-none"
                />
            )}
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                    Settings & Configuration
                </h1>
                <p className="text-slate-400 text-lg">Manage system settings, notifications, and security preferences</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-slate-700">
                {[
                    { id: "general", label: "General", icon: Settings },
                    { id: "notifications", label: "Notifications", icon: Bell },
                    { id: "security", label: "Security", icon: Lock },
                    { id: "analysis", label: "Analysis", icon: Database },
                    { id: "system", label: "System", icon: Shield },
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-2 ${
                            activeTab === id
                                ? "text-emerald-400 border-emerald-500"
                                : "text-slate-400 border-transparent hover:text-slate-300"
                        }`}
                    >
                        <Icon className="w-5 h-5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* General Settings */}
            {activeTab === "general" && (
                <div className="space-y-6 max-w-2xl">
                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-emerald-500/20 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6">Organization Information</h3>
                        <div className="space-y-4">
                            <SettingItem
                                icon={Globe}
                                label="Organization Name"
                                value={settings.organizationName}
                                onChange={(v: string) => setSettings({ ...settings, organizationName: v })}
                            />
                            <SettingItem
                                icon={Mail}
                                label="Email"
                                value={settings.email}
                                onChange={(v: string) => setSettings({ ...settings, email: v })}
                                type="email"
                            />
                            <SettingItem
                                icon={Phone}
                                label="Phone"
                                value={settings.phone}
                                onChange={(v: string) => setSettings({ ...settings, phone: v })}
                            />
                            <SettingItem
                                icon={MapPin}
                                label="Location"
                                value={settings.location}
                                onChange={(v: string) => setSettings({ ...settings, location: v })}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
                <div className="space-y-6 max-w-2xl">
                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-emerald-500/20 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>
                        <div className="space-y-4">
                            <SettingItem
                                icon={Bell}
                                label="Enable Notifications"
                                value={settings.notificationsEnabled}
                                onChange={(v: boolean) => setSettings({ ...settings, notificationsEnabled: v })}
                                type="toggle"
                            />
                            <SettingItem
                                icon={Mail}
                                label="Email Alerts"
                                value={settings.emailAlerts}
                                onChange={(v: boolean) => setSettings({ ...settings, emailAlerts: v })}
                                type="toggle"
                            />
                            <SettingItem
                                icon={Phone}
                                label="SMS Alerts"
                                value={settings.smsAlerts}
                                onChange={(v: boolean) => setSettings({ ...settings, smsAlerts: v })}
                                type="toggle"
                            />
                            <SettingItem
                                icon={Bell}
                                label="Daily Report"
                                value={settings.dailyReport}
                                onChange={(v: boolean) => setSettings({ ...settings, dailyReport: v })}
                                type="toggle"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
                <div className="space-y-6 max-w-2xl">
                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-emerald-500/20 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6">Security Settings</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                                <label className="text-white font-medium block mb-3">Change Password</label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Current Password"
                                            className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="New Password"
                                            className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:border-emerald-500 outline-none"
                                        />
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-300"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                <p className="text-emerald-300 text-sm">
                                    ✓ Two-Factor Authentication is enabled
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Analysis Settings */}
            {activeTab === "analysis" && (
                <div className="space-y-6 max-w-2xl">
                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-emerald-500/20 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6">Analysis Configuration</h3>
                        <div className="space-y-4">
                            <SettingItem
                                icon={Database}
                                label="NDVI Threshold"
                                value={settings.ndviThreshold}
                                onChange={(v: string) => setSettings({ ...settings, ndviThreshold: parseFloat(v) })}
                                type="number"
                            />
                            <SettingItem
                                icon={Shield}
                                label="Confidence Threshold (%)"
                                value={settings.confidenceThreshold}
                                onChange={(v: string) => setSettings({ ...settings, confidenceThreshold: parseInt(v) })}
                                type="number"
                            />
                            <SettingItem
                                icon={Bell}
                                label="Analysis Timeout (seconds)"
                                value={settings.analysisTimeout}
                                onChange={(v: string) => setSettings({ ...settings, analysisTimeout: parseInt(v) })}
                                type="number"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* System Settings */}
            {activeTab === "system" && (
                <div className="space-y-6 max-w-2xl">
                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-emerald-500/20 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6">System Configuration</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                                <label className="text-white font-medium block mb-3">Backup Frequency</label>
                                <select
                                    value={settings.backupFrequency}
                                    onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:border-emerald-500 outline-none"
                                >
                                    <option value="hourly">Hourly</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                                <p className="text-white font-medium mb-3">System Status</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Database</span>
                                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 border">Healthy</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">API Server</span>
                                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 border">Running</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Earth Engine</span>
                                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 border">Connected</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 max-w-2xl">
                <Button
                    onClick={handleSave}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </Button>
                <Button
                    onClick={handleReset}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 flex-1"
                >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                </Button>
            </div>
        </div>
    )
}
