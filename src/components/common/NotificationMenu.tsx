import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../types';

interface NotificationMenuProps {
  onNavigate?: (section: string) => void;
}

export const NotificationMenu: React.FC<NotificationMenuProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { currentUser } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    const list = storageService.getNotifications();
    // Filter for current user or their role
    const filtered = list.filter(n => {
      if (n.userId && n.userId === currentUser?.id) return true;
      if (n.targetRole && n.targetRole === currentUser?.role) return true;
      if (!n.userId && !n.targetRole) return true;
      return false;
    });
    setNotifications(filtered);
  };

  useEffect(() => {
    loadNotifications();
    const unsubscribe = subscribeToStore(() => {
      loadNotifications();
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    storageService.markAllNotificationsAsRead();
  };

  const handleNotificationClick = (item: NotificationItem) => {
    storageService.markNotificationAsRead(item.id);
    if (item.linkAction && onNavigate) {
      onNavigate(item.linkAction);
      setIsOpen(false);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'urgent': return <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      default: return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in duration-150">
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-serif font-bold tracking-wide">NOTIFICATIONS</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-medium">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-slate-300 hover:text-amber-400 flex items-center space-x-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No active notifications at this time.
              </div>
            ) : (
              notifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start space-x-3 ${
                    !item.isRead ? 'bg-amber-50/40' : ''
                  }`}
                >
                  {getIcon(item.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!item.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
