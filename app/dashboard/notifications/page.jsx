'use client';
import React from 'react';
import Container from '@/components/ui/Container';
import { useGetNotifications, useMarkNotificationRead, useNotificationAction } from '@/hooks/useNotification';
import { Bell, Check, X, Info, Clock, MapPin, Package, Filter, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/components/ui/Toast';

export default function NotificationsPage() {
    const { data: notificationsData, isLoading } = useGetNotifications();
    const { mutate: markAsRead } = useMarkNotificationRead();
    const { mutate: handleAction } = useNotificationAction();

    const notifications = notificationsData?.data || [];
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const [filter, setFilter] = React.useState('all');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === 'all' || (filter === 'unread' && !n.isRead) || (filter === 'pending' && n.actionStatus === 'pending');
        const message = n.message || '';
        const type = n.type || '';
        const matchesSearch = message.toLowerCase().includes(searchTerm.toLowerCase()) || type.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getTypeIcon = (type) => {
        switch (type) {
            case 'RETAILER_CONTACT_REQUEST': return <Package className="w-5 h-5 text-blue-500" />;
            case 'CONTACT_SHARE_CONFIRMED': return <Check className="w-5 h-5 text-green-500" />;
            default: return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <Container className="py-10 max-w-4xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                        Notifications
                        {unreadCount > 0 && (
                            <span className="bg-[#e09a74] text-white text-[12px] px-3 py-1 rounded-full font-bold">
                                {unreadCount} NEW
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-500">Stay updated with requests and system alerts.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            const unread = notifications.filter(n => !n.isRead);
                            unread.forEach(n => markAsRead(n._id));
                            toast.success("All notifications marked as read");
                        }}
                        disabled={unreadCount === 0}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        Mark all as read
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e09a74] transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-[#e09a74] transition-all"
                        >
                            <option value="all">All</option>
                            <option value="unread">Unread</option>
                            <option value="pending">Action Required</option>
                        </select>
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {isLoading ? (
                        <div className="p-20 text-center text-gray-400">Loading your notifications...</div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-8 h-8 text-gray-200" />
                            </div>
                            <h3 className="text-gray-900 font-bold">No notifications found</h3>
                            <p className="text-gray-500 text-sm mt-1">Try changing your filters or check back later.</p>
                        </div>
                    ) : (
                        filteredNotifications.map((n) => (
                            <div
                                key={n._id}
                                className={`p-6 hover:bg-gray-50/50 transition-colors flex gap-6 ${!n.isRead ? 'bg-[#fffbf9]' : ''}`}
                            >
                                <div className="shrink-0 pt-1">
                                    <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center">
                                        {getTypeIcon(n.type)}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-[#e09a74] uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded">
                                                {n.type.replace(/_/g, ' ')}
                                            </span>
                                            {!n.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-[#e09a74] shadow-[0_0_8px_rgba(224,154,116,0.6)]"></span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {mounted ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : '...'}
                                        </span>
                                    </div>
                                    <h4 className={`text-base leading-relaxed ${!n.isRead ? 'text-gray-900 font-bold' : 'text-gray-700 font-medium'}`}>
                                        {n.message || 'No message content'}
                                    </h4>

                                    {n.relatedData?.city && (
                                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                            <MapPin className="w-4 h-4" />
                                            Project Location: {n.relatedData.city}
                                        </div>
                                    )}

                                    {n.type === 'CONTACT_SHARE_CONFIRMED' && n.sender?.retailerProfile && (
                                        <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3 max-w-sm">
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-400 uppercase font-bold tracking-tighter">Email</span>
                                                    <span className="text-gray-700 truncate">{n.sender.retailerProfile.email || n.sender.email}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-400 uppercase font-bold tracking-tighter">Phone</span>
                                                    <span className="text-gray-700">{n.sender.mobile}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-400 uppercase font-bold tracking-tighter">Preferred Contact</span>
                                                    <span className="text-[#e09a74] font-bold">{n.sender.retailerProfile.preferredContactMethod || 'Phone'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-400 uppercase font-bold tracking-tighter">Calling Hours</span>
                                                    <span className="text-gray-700 truncate">{n.sender.retailerProfile.callingHours || 'Not specified'}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <a
                                                    href={`tel:${n.sender.mobile}`}
                                                    className="flex-1 text-center py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <Phone className="w-3 h-3" /> Call Retailer
                                                </a>
                                                {n.sender.retailerProfile.preferredContactMethod === 'WhatsApp' && (
                                                    <a
                                                        href={`https://wa.me/${n.sender.mobile.replace(/\+/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 text-center py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        <MessageSquare size={12} /> WhatsApp
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {n.actionStatus === 'pending' && n.type === 'RETAILER_CONTACT_REQUEST' && (
                                        <div className="mt-5 flex flex-wrap gap-3">
                                            <button
                                                onClick={() => handleAction({ id: n._id, status: 'confirmed' })}
                                                className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-md flex items-center gap-2"
                                            >
                                                <Check className="w-4 h-4" /> Accept & Share Contact
                                            </button>
                                            <button
                                                onClick={() => handleAction({ id: n._id, status: 'declined' })}
                                                className="bg-white text-gray-600 px-6 py-2.5 rounded-xl text-sm font-bold border border-gray-200 hover:bg-gray-50 transition-all"
                                            >
                                                <X className="w-4 h-4" /> Decline
                                            </button>
                                        </div>
                                    )}

                                    {n.actionStatus !== 'pending' && n.actionStatus !== 'none' && (
                                        <div className={`mt-4 w-fit px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 border ${n.actionStatus === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {n.actionStatus === 'confirmed' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                            Request {n.actionStatus}
                                        </div>
                                    )}

                                    <div className="mt-4 flex items-center justify-end">
                                        {!n.isRead && (
                                            <button
                                                onClick={() => markAsRead(n._id)}
                                                className="text-[11px] font-bold text-gray-400 hover:text-[#e09a74] transition-colors"
                                            >
                                                MARK AS READ
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Container>
    );
}
