import React, { useState } from 'react';
import {
  useAllNotificationsQuery,
  useNotificationMutation,
  useExamenMutation
} from '../../src/hooks/useExamens';
import { NotificationAdmin } from '../../types';

interface ManualExamNotificationsProps {
  onExamenValidated?: () => void;
}

export function ManualExamNotifications({ onExamenValidated }: ManualExamNotificationsProps) {
  const [showArchived, setShowArchived] = useState(false);
  const { data: notifications, isLoading } = useAllNotificationsQuery(showArchived);
  const { markAsRead, archive } = useNotificationMutation();
  const { validate, delete: deleteExamen } = useExamenMutation();

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead.mutateAsync(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      alert('Erreur lors du marquage de la notification');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archive.mutateAsync(id);
    } catch (error) {
      console.error('Error archiving notification:', error);
      alert('Erreur lors de l\'archivage de la notification');
    }
  };

  const handleValidateExamen = async (notification: NotificationAdmin) => {
    if (!notification.reference_id) return;

    if (!confirm('Voulez-vous valider cet examen saisi manuellement ?')) {
      return;
    }

    try {
      await validate.mutateAsync({ id: notification.reference_id });
      await handleArchive(notification.id);
      
      if (onExamenValidated) {
        onExamenValidated();
      }
      
      alert('Examen validé avec succès !');
    } catch (error) {
      console.error('Error validating exam:', error);
      alert('Erreur lors de la validation de l\'examen');
    }
  };

  const handleDeleteExamen = async (notification: NotificationAdmin) => {
    if (!notification.reference_id) return;

    if (!confirm('Voulez-vous supprimer cet examen ? Cette action est irréversible.')) {
      return;
    }

    try {
      await deleteExamen.mutateAsync(notification.reference_id);
      await handleArchive(notification.id);
      alert('Examen supprimé avec succès');
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Erreur lors de la suppression de l\'examen');
    }
  };

  const unreadCount = notifications?.filter(n => !n.lu && !n.archive).length || 0;
  const activeNotifications = notifications?.filter(n => !n.archive) || [];

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
            />
            Afficher les archivées
          </label>
        </div>
      </div>

      {/* Notifications list */}
      <div className="divide-y divide-gray-200">
        {activeNotifications.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">Aucune notification</p>
          </div>
        ) : (
          activeNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-6 py-4 ${!notification.lu ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-50 transition-colors`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!notification.lu && (
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                    <h4 className="text-sm font-medium text-gray-900">
                      {notification.titre}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      notification.type === 'examen_manuel'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {notification.type === 'examen_manuel' ? 'Examen manuel' : notification.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>

                <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                  {/* Mark as read */}
                  {!notification.lu && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={markAsRead.isPending}
                      className="p-2 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded disabled:opacity-50"
                      title="Marquer comme lu"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}

                  {/* Validate exam (for manual exams) */}
                  {notification.type === 'examen_manuel' && notification.reference_id && (
                    <button
                      onClick={() => handleValidateExamen(notification)}
                      disabled={validate.isPending}
                      className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      Valider
                    </button>
                  )}

                  {/* Delete exam (for manual exams) */}
                  {notification.type === 'examen_manuel' && notification.reference_id && (
                    <button
                      onClick={() => handleDeleteExamen(notification)}
                      disabled={deleteExamen.isPending}
                      className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  )}

                  {/* Archive */}
                  <button
                    onClick={() => handleArchive(notification.id)}
                    disabled={archive.isPending}
                    className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded disabled:opacity-50"
                    title="Archiver"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Notification Badge Component for Header
 * Shows unread notification count
 */
export function NotificationBadge() {
  const { data: notifications } = useAllNotificationsQuery(false);
  const unreadCount = notifications?.filter(n => !n.lu && !n.archive).length || 0;

  if (unreadCount === 0) return null;

  return (
    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
