'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Volume2, VolumeX } from 'lucide-react';
import { NotificationType } from '@/types/notification.types';
import api from '@/lib/api';

interface NotificationPreferences {
  [key: string]: {
    enabled: boolean;
    email: boolean;
    push: boolean;
    sound: boolean;
  };
}

const notificationTypeLabels = {
  [NotificationType.NEW_APPLICATION]: 'New Applications',
  [NotificationType.STATUS_CHANGE]: 'Status Changes',
  [NotificationType.AI_ANALYSIS_COMPLETE]: 'AI Analysis Complete',
  [NotificationType.PROCESSING_FAILED]: 'Processing Failed',
  [NotificationType.CANDIDATE_SHORTLISTED]: 'Candidate Shortlisted',
  [NotificationType.BIAS_ALERT]: 'Bias Alerts',
  [NotificationType.DUPLICATE_CANDIDATE]: 'Duplicate Candidates',
  [NotificationType.BULK_PROCESSING_COMPLETE]: 'Bulk Processing Complete',
  [NotificationType.SYSTEM_ERROR]: 'System Errors',
  [NotificationType.SECURITY_ALERT]: 'Security Alerts',
  [NotificationType.HEALTH_METRICS_ALERT]: 'Health Metrics',
  [NotificationType.PERFORMANCE_DEGRADATION]: 'Performance Issues',
  [NotificationType.USER_MILESTONE_REACHED]: 'User Milestones',
  [NotificationType.PROCESSING_MILESTONE]: 'Processing Milestones',
  [NotificationType.MONTHLY_ANALYTICS_REPORT]: 'Monthly Reports',
};

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/api/notifications/preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      // Initialize with default preferences
      const defaultPreferences: NotificationPreferences = {};
      Object.values(NotificationType).forEach(type => {
        defaultPreferences[type] = {
          enabled: true,
          email: false,
          push: true,
          sound: true,
        };
      });
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (type: string, key: string, value: boolean) => {
    const updatedPreferences = {
      ...preferences,
      [type]: {
        ...preferences[type],
        [key]: value,
      },
    };
    setPreferences(updatedPreferences);

    try {
      setSaving(true);
      await api.patch('/api/notifications/preferences', {
        type,
        preferences: updatedPreferences[type],
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Revert on error
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  const toggleAllNotifications = async (enabled: boolean) => {
    const updatedPreferences = { ...preferences };
    Object.keys(updatedPreferences).forEach(type => {
      updatedPreferences[type] = {
        ...updatedPreferences[type],
        enabled,
      };
    });
    setPreferences(updatedPreferences);

    try {
      setSaving(true);
      await api.patch('/api/notifications/preferences/bulk', { enabled });
    } catch (error) {
      console.error('Failed to update bulk preferences:', error);
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
            <p className="text-sm text-gray-600 mt-1">
              Customize how you receive notifications for different events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleAllNotifications(false)}
              disabled={saving}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Disable All
            </button>
            <button
              onClick={() => toggleAllNotifications(true)}
              disabled={saving}
              className="px-3 py-2 text-sm bg-[#5680D7] text-white rounded-lg hover:bg-[#4a6bc5] disabled:opacity-50"
            >
              Enable All
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {Object.entries(notificationTypeLabels).map(([type, label]) => {
            const pref = preferences[type] || {
              enabled: true,
              email: false,
              push: true,
              sound: true,
            };

            return (
              <div key={type} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">{label}</h3>
                      <p className="text-sm text-gray-500">
                        {type.toLowerCase().replace(/_/g, ' ')} notifications
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pref.enabled}
                      onChange={(e) => updatePreference(type, 'enabled', e.target.checked)}
                      className="sr-only peer"
                      disabled={saving}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5680D7]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5680D7]"></div>
                  </label>
                </div>

                {pref.enabled && (
                  <div className="ml-8 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Email notifications</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pref.email}
                          onChange={(e) => updatePreference(type, 'email', e.target.checked)}
                          className="sr-only peer"
                          disabled={saving}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5680D7]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5680D7]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Push notifications</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pref.push}
                          onChange={(e) => updatePreference(type, 'push', e.target.checked)}
                          className="sr-only peer"
                          disabled={saving}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5680D7]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5680D7]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {pref.sound ? (
                          <Volume2 className="w-4 h-4 text-gray-400" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-700">Sound alerts</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pref.sound}
                          onChange={(e) => updatePreference(type, 'sound', e.target.checked)}
                          className="sr-only peer"
                          disabled={saving}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5680D7]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5680D7]"></div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {saving && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">Saving preferences...</p>
          </div>
        )}
      </div>
    </div>
  );
}