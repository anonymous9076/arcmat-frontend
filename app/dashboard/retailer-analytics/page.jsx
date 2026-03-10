'use client';

import { useState } from 'react';
import { useBrandRetailerAnalytics } from '@/hooks/useBrandAnalytics';
import { useAuth } from '@/hooks/useAuth';
import Container from '@/components/ui/Container';
import {
    BarChart3,
    MapPin,
    Filter,
    Users,
    Store,
    Loader2,
    TrendingUp,
    ChevronRight,
    Search,
    UserCheck,
    Briefcase
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import clsx from 'clsx';
import RoleGuard from '@/components/auth/RoleGuard';

export default function BrandRetailerAnalytics() {
    const { user } = useAuth();
    const [filters, setFilters] = useState({
        city: '',
        startDate: '',
        endDate: ''
    });

    const { data: analytics, isLoading } = useBrandRetailerAnalytics({
        ...filters,
        brandId: user?.selectedBrands?.[0] || user?.brandId || user?.id
    });

    const retailers = analytics?.retailers || [];
    const regionalStats = analytics?.regionalStats || [];
    const totalRetailers = analytics?.totalRetailers || 0;
    const totalArchitects = analytics?.totalArchitects || 0;

    return (
        <RoleGuard allowedRoles={['brand', 'vendor']}>
            <div className="p-8 bg-gray-50 min-h-screen">
                <Container>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <Store className="w-8 h-8 text-[#E09A74]" />
                                Retailer Network
                            </h1>
                            <p className="text-gray-500 font-medium mt-1">Monitor retailers selling your products and regional professional connections</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-[#E09A74]/10 flex items-center justify-center mb-6">
                                <Store className="w-6 h-6 text-[#E09A74]" />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Retailers</p>
                            <h3 className="text-4xl font-black text-gray-900 mt-2">{totalRetailers}</h3>
                        </div>

                        <div className="bg-[#2C2D35] p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                                <Briefcase className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#E09A74]">Regional Professionals</p>
                            <h3 className="text-4xl font-black text-white mt-2">{totalArchitects}</h3>
                            <p className="text-[10px] text-gray-400 mt-2">Architects in your retailer cities</p>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                                <MapPin className="w-6 h-6 text-blue-600" />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Top Market</p>
                            <h3 className="text-4xl font-black text-gray-900 mt-2">{regionalStats[0]?._id || 'N/A'}</h3>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm mb-12">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Search City</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input
                                        type="text"
                                        placeholder="Filter by city name..."
                                        value={filters.city}
                                        onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                                        className="w-full h-12 bg-gray-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:ring-2 focus:ring-[#E09A74]/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">From Date</label>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full h-12 bg-gray-50 border-none rounded-2xl px-4 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#E09A74]/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To Date</label>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full h-12 bg-gray-50 border-none rounded-2xl px-4 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#E09A74]/20"
                                />
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <Loader2 className="w-10 h-10 text-[#E09A74] animate-spin" />
                            <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Loading network insights...</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Regional Demand Chart */}
                            <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">Regional Distribution</h3>
                                        <p className="text-sm font-medium text-gray-400">Retailer density by city</p>
                                    </div>
                                    <BarChart3 className="w-6 h-6 text-gray-300" />
                                </div>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={regionalStats}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                            <XAxis
                                                dataKey="_id"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 900 }}
                                                dy={10}
                                            />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 900 }} />
                                            <Tooltip
                                                cursor={{ fill: '#F9FAFB' }}
                                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px' }}
                                                itemStyle={{ fontWeight: '900', fontSize: '12px', textTransform: 'uppercase' }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                fill="#E09A74"
                                                radius={[12, 12, 0, 0]}
                                                barSize={40}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Detailed Retailer Table */}
                            <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">Retailer Directory</h3>
                                        <p className="text-sm font-medium text-gray-400">Verified retailers selling your brand</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Retailer</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Connected Professionals</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Selection Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {retailers.map((retailer, i) => (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-[#E09A74]/10 flex items-center justify-center text-[#E09A74] font-black text-xs">
                                                                {retailer.retailerName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900">{retailer.retailerName}</p>
                                                                <p className="text-[10px] text-gray-400 font-medium">{retailer.retailerEmail}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-3.5 h-3.5 text-[#E09A74]" />
                                                            <span className="text-sm font-bold text-gray-700">{retailer.city}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <div className="flex -space-x-2 overflow-hidden mb-2">
                                                            {retailer.architects.slice(0, 3).map((arch, idx) => (
                                                                <div key={idx} className="h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500" title={arch.name}>
                                                                    {arch.name.charAt(0)}
                                                                </div>
                                                            ))}
                                                            {retailer.architects.length > 3 && (
                                                                <div className="h-6 w-6 rounded-full ring-2 ring-white bg-gray-900 flex items-center justify-center text-[8px] font-bold text-white">
                                                                    +{retailer.architects.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                            {retailer.architects.length} Professionals in City
                                                        </p>
                                                    </td>
                                                    <td className="px-10 py-6 text-right">
                                                        <span className="text-xs font-bold text-gray-500">
                                                            {new Date(retailer.selectedAt).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {retailers.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-10 py-20 text-center text-gray-400 italic">No retailers found for your brand yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </Container>
            </div>
        </RoleGuard>
    );
}
