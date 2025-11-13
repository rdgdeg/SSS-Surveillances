import React from 'react';
import { useExamenDashboard } from '../../src/hooks/useExamenDashboard';

interface ExamDashboardProps {
  sessionId: string;
  onMetricClick?: (filter: string, value: string) => void;
}

export function ExamDashboard({ sessionId, onMetricClick }: ExamDashboardProps) {
  const { stats, loading } = useExamenDashboard(sessionId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500 text-center">Aucune donnée disponible</p>
      </div>
    );
  }

  const completionPercentage = stats.completion_percentage || 0;
  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Exams */}
        <MetricCard
          title="Total des examens"
          value={stats.total_examens}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          color="blue"
          onClick={() => onMetricClick?.('all', '')}
        />

        {/* Exams with Declarations */}
        <MetricCard
          title="Présences déclarées"
          value={stats.examens_with_declarations}
          subtitle={`sur ${stats.total_examens}`}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
          onClick={() => onMetricClick?.('responseStatus', 'declared')}
        />

        {/* Pending Declarations */}
        <MetricCard
          title="En attente de déclaration"
          value={stats.examens_pending_declarations}
          subtitle={`sur ${stats.total_examens}`}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="yellow"
          onClick={() => onMetricClick?.('responseStatus', 'pending')}
        />

        {/* Total Supervisors Required */}
        <MetricCard
          title="Surveillants requis"
          value={stats.total_supervisors_required}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color="purple"
        />

        {/* Exams Without Course */}
        <MetricCard
          title="Sans cours lié"
          value={stats.examens_without_course}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          color="orange"
          onClick={() => onMetricClick?.('hasCoursLinked', 'false')}
        />

        {/* Exams Without Supervisor Requirement */}
        <MetricCard
          title="Sans nb. surveillants"
          value={stats.examens_without_supervisor_requirement}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="red"
          onClick={() => onMetricClick?.('hasSupervisorRequirement', 'false')}
        />
      </div>

      {/* Completion Percentage */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Taux de complétion</h3>
          <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${getCompletionColor(completionPercentage)}`}>
            {completionPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${getProgressBarColor(completionPercentage)}`}
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Examens avec cours lié, nb. surveillants défini et présence déclarée
        </p>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'red';
  onClick?: () => void;
}

function MetricCard({ title, value, subtitle, icon, color, onClick }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100',
    red: 'text-red-600 bg-red-100'
  };

  const hoverClasses = onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '';

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${hoverClasses}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
