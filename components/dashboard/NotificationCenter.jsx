import React, { useState, useRef, useEffect } from 'react';
import { useGetNotifications, useMarkNotificationRead, useNotificationAction } from '@/hooks/useNotification';
import { Bell, Check, X, Info, ExternalLink, Package, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { data: notificationsData, isLoading } = useGetNotifications();
    const { mutate: markAsRead } = useMarkNotificationRead();
    const { mutate: handleAction } = useNotificationAction();
    const dropdownRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const notifications = notificationsData?.data || [];
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'RETAILER_CONTACT_REQUEST': return <Package className="w-4 h-4 text-[#e09a74]" />;
            case 'CONTACT_SHARE_CONFIRMED': return <Check className="w-4 h-4 text-green-500" />;
            default: return <Info className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all relative group"
            >
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-[#e09a74] animate-pulse' : 'text-gray-600'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="text-[10px] bg-[#e09a74] text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                    {unreadCount} NEW
                                </span>
                            )}
                        </h3>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                        {isLoading ? (
                            <div className="p-10 text-center text-gray-400">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-10 text-center">
                                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-500">All caught up!</p>
                                <p className="text-xs text-gray-400 mt-1">No new notifications yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((n) => (
                                    <div
                                        key={n._id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group/item ${!n.isRead ? 'bg-[#fffbf9]' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                                    {getTypeIcon(n.type)}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="text-[10px] font-bold text-[#e09a74] uppercase tracking-widest truncate">
                                                        {n.type.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
                                                        <Clock className="w-3 h-3" />
                                                        {mounted ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : '...'}
                                                    </span>
                                                </div>
                                                <p className={`text-sm leading-relaxed ${!n.isRead ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                                                    {n.message || 'No message content'}
                                                </p>

                                                {n.relatedData?.city && (
                                                    <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500 font-medium">
                                                        <MapPin className="w-3 h-3" />
                                                        Project Location: {n.relatedData.city}
                                                    </div>
                                                )}

                                                {n.type === 'CONTACT_SHARE_CONFIRMED' && n.sender && (
                                                    <div className="mt-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-2">
                                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-400 uppercase font-bold">Email</span>
                                                                <span className="text-gray-700 truncate">{n.sender.retailerProfile?.email || n.sender.email || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-400 uppercase font-bold">Phone</span>
                                                                <span className="text-gray-700">{n.sender.retailerProfile?.mobile || n.sender.mobile || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-400 uppercase font-bold">Preferred</span>
                                                                <span className="text-[#e09a74] font-bold">{n.sender.retailerProfile?.preferredContactMethod || 'Phone'}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-400 uppercase font-bold">Hours</span>
                                                                <span className="text-gray-700 truncate">{n.sender.retailerProfile?.callingHours || 'Not specified'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 pt-1">
                                                            {(n.sender.retailerProfile?.mobile || n.sender.mobile) && (
                                                                <a
                                                                    href={`tel:${n.sender.retailerProfile?.mobile || n.sender.mobile}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="flex-1 text-center py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-bold hover:bg-gray-800 transition-all"
                                                                >
                                                                    Call Now
                                                                </a>
                                                            )}
                                                            {(n.sender.retailerProfile?.preferredContactMethod === 'WhatsApp' || (!n.sender.retailerProfile?.preferredContactMethod && n.sender.mobile)) && (
                                                                <a
                                                                    href={`https://wa.me/${(n.sender.retailerProfile?.mobile || n.sender.mobile || '').replace(/\+/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="flex-1 text-center py-1.5 bg-green-500 text-white rounded-lg text-[10px] font-bold hover:bg-green-600 transition-all"
                                                                >
                                                                    WhatsApp
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                {n.actionStatus === 'pending' && n.type === 'RETAILER_CONTACT_REQUEST' && (
                                                    <div className="flex items-center gap-2 mt-4 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAction({ id: n._id, status: 'confirmed' });
                                                            }}
                                                            className="flex-1 bg-black text-white py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-1"
                                                        >
                                                            <Check className="w-4 h-4" /> Accept 
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAction({ id: n._id, status: 'declined' });
                                                            }}
                                                            className="flex-1 bg-white text-gray-500 py-1.5 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-1"
                                                        >
                                                            <X className="w-3 h-3" /> Decline
                                                        </button>
                                                    </div>
                                                )}

                                                {n.actionStatus !== 'pending' && n.actionStatus !== 'none' && (
                                                    <div className={`mt-3 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-center border-dashed border ${n.actionStatus === 'confirmed' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                                        Request {n.actionStatus}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-50 bg-gray-50/30">
                        <Link
                            href="/dashboard/notifications"
                            className="text-[11px] font-bold text-gray-400 hover:text-[#e09a74] transition-colors flex items-center justify-center gap-1 uppercase tracking-widest"
                        >
                            View All Notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
