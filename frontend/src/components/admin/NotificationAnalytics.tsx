'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Users, Bell, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

interface AnalyticsData {
  totalNotifications: number;
  unreadCount: number;
  notificationsByType: { type: string; count: number; color: string }[];
  dailyStats: { date: string; sent: number; read: number }[];
  userEngagement: { activeUsers: number; totalUsers: number; engagementRate: number };
  systemHealth: { deliveryRate: number; avgResponseTime: number; errorRate: number };
}

const COLORS = ['#5680D7', '#0EBDC4', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];

export default function NotificationAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/notifications/analytics?range=${dateRange}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Notification Analytics</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5680D7] focus:border-transparent"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalNotifications.toLocaleString()}</p>
            </div>
            <Bell className="w-8 h-8 text-[#5680D7]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unread Count</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.unreadCount.toLocaleString()}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.userEngagement.activeUsers}</p>
            </div>
            <Users className="w-8 h-8 text-[#0EBDC4]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.systemHealth.deliveryRate}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-[#10B981]" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Stats Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sent" fill="#5680D7" name="Sent" />
              <Bar dataKey="read" fill="#0EBDC4" name="Read" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Notification Types Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.notificationsByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.notificationsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#10B981] mb-2">
              {analytics.systemHealth.deliveryRate}%
            </div>
            <p className="text-sm text-gray-600">Delivery Success Rate</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#5680D7] mb-2">
              {analytics.systemHealth.avgResponseTime}ms
            </div>
            <p className="text-sm text-gray-600">Avg Response Time</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#EF4444] mb-2">
              {analytics.systemHealth.errorRate}%
            </div>
            <p className="text-sm text-gray-600">Error Rate</p>
          </div>
        </div>
      </div>

      {/* User Engagement */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Engagement Rate</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.userEngagement.engagementRate}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Active vs Total Users</p>
            <p className="text-lg font-semibold text-gray-900">
              {analytics.userEngagement.activeUsers} / {analytics.userEngagement.totalUsers}
            </p>
          </div>
        </div>
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#5680D7] h-2 rounded-full"
            style={{ width: `${analytics.userEngagement.engagementRate}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}