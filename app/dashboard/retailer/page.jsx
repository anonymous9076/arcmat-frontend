'use client';
import { Package, ShoppingBag, TrendingUp, Store, ChevronRight, Star, UserPlus, Briefcase, Check, MapPin, Activity, User } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import Link from 'next/link';
import { useGetRetailerBrands, useGetRetailerProducts } from '@/hooks/useRetailer';
import { useGetRetailerAssignedRequests } from '@/hooks/useRetailerRequest';
import { useGetOrders } from '@/hooks/useOrder';
import { useGetNotifications, useNotificationAction } from '@/hooks/useNotification';
import { getBrandImageUrl } from '@/lib/productUtils';
import clsx from 'clsx';


export default function RetailerDashboardPage() {
    const { user } = useAuthStore();
    const { mutate: performAction, isLoading: isActionLoading } = useNotificationAction();

    const { data: brandsData, isLoading: brandsLoading } = useGetRetailerBrands();
    const { data: productsData, isLoading: productsLoading } = useGetRetailerProducts({ limit: 1 });
    const { data: requestsData, isLoading: requestsLoading } = useGetRetailerAssignedRequests();
    const { data: notificationsData, isLoading: notificationsLoading } = useGetNotifications();

    const handleAction = (id, status) => {
        performAction({ id, status });
    };

    const brandsList = Array.isArray(brandsData?.data) ? brandsData.data : Array.isArray(brandsData?.data?.data) ? brandsData.data.data : [];
    const productsPagination = productsData?.data?.pagination || productsData?.data?.data?.pagination;
    const requests = requestsData?.data || [];
    const notifications = notificationsData?.data || [];
    const contactRequests = notifications.filter(n => n.type === 'RETAILER_CONTACT_REQUEST');
    const uniqueProjects = new Set(requests.map(r => r.projectId?._id).filter(Boolean));

    const stats = [
        {
            label: 'Products Supplied',
            value: productsPagination?.totalItems || 0,
            loading: productsLoading,
            icon: Package,
            color: 'bg-blue-50 text-blue-600',
            href: '/dashboard/retailer/inventory',
        },
        {
            label: 'Architect Requests',
            value: requests.length,
            loading: requestsLoading,
            icon: UserPlus,
            color: 'bg-purple-50 text-purple-600',
            href: '/dashboard/retailer/requests',
        },
        {
            label: 'Active Projects',
            value: uniqueProjects.size,
            loading: requestsLoading,
            icon: Briefcase,
            color: 'bg-orange-50 text-orange-600',
            href: '/dashboard/retailer/requests',
        },
        {
            label: 'Supply Rating',
            value: '4.8/5.0',
            loading: false,
            icon: Star,
            color: 'bg-green-50 text-green-600',
            href: '#',
        },
        {
            label: 'Delivery Rating',
            value: '4.5/5.0',
            loading: false,
            icon: TrendingUp,
            color: 'bg-emerald-50 text-emerald-600',
            href: '#',
        },
    ];

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Welcome back, {user?.name?.split(' ')[0] || 'Retailer'} 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Here&apos;s a look at your store performance and architect engagement.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/retailer/inventory"
                        className="px-4 py-2 bg-[#e09a74] text-white rounded-xl text-sm font-semibold hover:bg-[#d08a64] transition-all shadow-sm"
                    >
                        Manage Inventory
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.map((stat) => (
                    <Link
                        key={stat.label}
                        href={stat.href}
                        className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 group"
                    >
                        <div className="flex items-center justify-between">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color} transition-transform group-hover:scale-110`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                            {stat.loading ? (
                                <div className="h-6 w-12 bg-gray-100 animate-pulse rounded mt-1" />
                            ) : (
                                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Architect Connection Requests */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Architect Connection Requests</h2>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">Manage your professional network</p>
                        </div>
                    </div>
                    <Link href="/dashboard/notifications" className="text-sm font-bold text-[#e09a74] hover:underline uppercase tracking-widest">
                        View All
                    </Link>
                </div>

                {notificationsLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-2xl" />)}
                    </div>
                ) : contactRequests.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {contactRequests.slice(0, 5).map((req) => (
                            <div key={req._id} className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:shadow-md transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                                        <User className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900">{req.sender?.fullName || req.sender?.name || 'Architect'}</h3>
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-full">Architect</span>
                                            {req.actionStatus !== 'pending' && (
                                                <span className={clsx(
                                                    "px-2 py-0.5 text-[10px] font-black uppercase rounded-full",
                                                    req.actionStatus === 'confirmed' ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                                                )}>
                                                    {req.actionStatus}
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-6">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="truncate">{req.relatedData?.city || req.relatedData?.projectId?.location?.city || 'Not specified'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Package className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="font-medium text-gray-700 truncate">{req.relatedData?.productId?.product_name || 'Generic Inquiry'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Activity className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[10px] font-bold">
                                                    {req.relatedData?.projectId?.phase || 'Concept Design'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {req.actionStatus === 'pending' && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleAction(req._id, 'confirmed')}
                                            disabled={isActionLoading}
                                            className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                        >
                                            <Check className="w-3.5 h-3.5" /> Accept
                                        </button>
                                        <button
                                            onClick={() => handleAction(req._id, 'declined')}
                                            disabled={isActionLoading}
                                            className="px-4 py-2 bg-white text-gray-500 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                                        >
                                            Ignore
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="w-8 h-8 text-gray-200" />
                        </div>
                        <h3 className="text-gray-900 font-bold">No Connection Requests</h3>
                        <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">When architects are interested in your materials, their requests will appear here.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity / Brands */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Brands You Deal With</h2>
                            <Link href="/dashboard/retailer/brands" className="text-sm font-medium text-[#e09a74] hover:underline">
                                View all
                            </Link>
                        </div>

                        {brandsLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />)}
                            </div>
                        ) : brandsList.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {brandsList.slice(0, 4).map((brand) => (
                                    <div key={brand._id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 bg-gray-50/30">
                                        <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                            {brand.logo ? (
                                                <img src={getBrandImageUrl(brand.logo)} alt={brand.name} className="w-full h-full object-contain p-1" />
                                            ) : (

                                                <Store className="w-6 h-6 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{brand.name}</p>
                                            <p className="text-xs text-gray-500">{brand.productsCount || 0} Products</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <Store className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">No brands linked yet.</p>
                                <Link href="/dashboard/retailer/brands" className="text-[#e09a74] text-sm font-medium mt-2 inline-block">
                                    Browse Brands
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-[#1a202c] rounded-2xl p-6 shadow-lg text-white">
                        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard/retailer/inventory"
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#e09a74] flex items-center justify-center">
                                        <Package className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-sm font-medium">Browse Materials</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
                            </Link>
                            <Link
                                href="/dashboard/retailer/orders"
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                        <ShoppingBag className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-sm font-medium">My Orders</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
