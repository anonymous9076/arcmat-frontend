'use client';

import { useState } from 'react';
import { useRetailerSelectionAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { useGetBrands } from '@/hooks/useBrand';
import Container from '@/components/ui/Container';
import {
    BarChart3,
    PieChart,
    MapPin,
    Calendar,
    Filter,
    Download,
    TrendingUp,
    Users,
    Building2,
    Loader2
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import clsx from 'clsx';

const COLORS = ['#E09A74', '#2C2D35', '#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

export default function AnalyticsDashboard() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const { data: brandsResponse } = useGetBrands({ enabled: isAdmin });
    const brands = brandsResponse?.data?.data || brandsResponse?.data || [];

    const [filters, setFilters] = useState({
        brandId: '',
        city: '',
        startDate: '',
        endDate: ''
    });

    const { data: analytics, isLoading } = useRetailerSelectionAnalytics(filters);

    if (!isAdmin) {
        return (
            <div className="p-20 text-center">
                <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-widest">Unauthorized Access</h2>
                <p className="mt-4 text-gray-400">You do not have permission to view this page.</p>
            </div>
        );
    }

    const { brandWiseStats = [], locationWiseStats = [], topCities = [] } = analytics || {};

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <Container>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-[#E09A74]" />
                            Retailer Analytics
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">Track brand demand and regional expansion</p>
                    </div>

                    {/* <div className="flex items-center gap-3">
                        <button className="h-12 px-6 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm font-bold text-gray-700 flex items-center gap-2 hover:border-gray-300 transition-all">
                            <Download className="w-4 h-4" />
                            Export Report
                        </button>
                    </div> */}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <Filter className="w-5 h-5 text-[#E09A74]" />
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Global Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filter by Brand</label>
                            <select
                                value={filters.brandId}
                                onChange={(e) => setFilters(prev => ({ ...prev, brandId: e.target.value }))}
                                className="w-full h-12 bg-gray-50 border-none rounded-2xl px-4 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#E09A74]/20"
                            >
                                <option value="">All Brands</option>
                                {brands.map(brand => (
                                    <option key={brand._id} value={brand._id}>{brand.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">City</label>
                            <input
                                type="text"
                                placeholder="Enter city name..."
                                value={filters.city}
                                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                                className="w-full h-12 bg-gray-50 border-none rounded-2xl px-4 text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:ring-2 focus:ring-[#E09A74]/20"
                            />
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
                        <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Analysing demand patterns...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Top Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                                <div className="w-12 h-12 rounded-2xl bg-[#E09A74]/10 flex items-center justify-center mb-6">
                                    <Users className="w-6 h-6 text-[#E09A74]" />
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Brand Selections</p>
                                <h3 className="text-4xl font-black text-gray-900 mt-2">{brandWiseStats.reduce((acc, curr) => acc + curr.count, 0)}</h3>
                            </div>

                            <div className="bg-[#2C2D35] p-8 rounded-[40px] shadow-2xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Most Popular Brand</p>
                                <h3 className="text-4xl font-black text-white mt-2">{brandWiseStats[0]?.brandName || 'N/A'}</h3>
                            </div>

                            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                                    <MapPin className="w-6 h-6 text-blue-600" />
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Top Performing City</p>
                                <h3 className="text-4xl font-black text-gray-900 mt-2">{topCities[0]?._id || 'N/A'}</h3>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Brand Distribution (Pie Chart) */}
                            <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">Brand Distribution</h3>
                                        <p className="text-sm font-medium text-gray-400">Retailer share by brand</p>
                                    </div>
                                    <PieChart className="w-6 h-6 text-gray-300" />
                                </div>
                                <div className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={brandWiseStats}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={140}
                                                paddingAngle={8}
                                                dataKey="count"
                                                nameKey="brandName"
                                            >
                                                {brandWiseStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px' }}
                                                itemStyle={{ fontWeight: '900', fontSize: '12px', textTransform: 'uppercase' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Cities (Bar Chart) */}
                            <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">Regional Demand</h3>
                                        <p className="text-sm font-medium text-gray-400">Top 10 cities by activity</p>
                                    </div>
                                    <BarChart3 className="w-6 h-6 text-gray-300" />
                                </div>
                                <div className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topCities}>
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
                        </div>

                        {/* Detailed Demand Table */}
                        <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-10 border-b border-gray-50">
                                <h3 className="text-xl font-black text-gray-900">Location-wise Demand</h3>
                                <p className="text-sm font-medium text-gray-400">Granular view of which brands are popular where</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Brand</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">City</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Retailers</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Market Share</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {locationWiseStats.map((stat, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-10 py-6 text-sm font-black text-gray-900">{stat.brandName}</td>
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-3 h-3 text-gray-300" />
                                                        <span className="text-sm font-bold text-gray-600">{stat.city}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-600">
                                                        {stat.count} Retailers
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#E09A74]"
                                                            style={{ width: `${(stat.count / brandWiseStats.find(b => b.brandName === stat.brandName)?.count * 100) || 0}%` }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </Container>
        </div>
    );
}
