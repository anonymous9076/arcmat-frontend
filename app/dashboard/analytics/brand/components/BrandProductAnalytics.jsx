'use client';

import { useBrandProductAnalytics } from '@/hooks/useBrandAnalytics';
import { useAuth } from '@/hooks/useAuth';
import {
    Eye,
    Heart,
    FileText,
    MessageSquare,
    Loader2,
    TrendingUp,
    Store,
    ArrowUpRight
} from 'lucide-react';

export default function BrandProductAnalytics() {
    const { user } = useAuth();
    const { data: analytics, isLoading } = useBrandProductAnalytics({
        brandId: (user?.selectedBrands?.[0]?._id || user?.selectedBrands?.[0]) || user?.brandId || user?.id
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="w-10 h-10 text-[#E09A74] animate-spin" />
                <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Aggregating product performance...</p>
            </div>
        );
    }

    const stats = analytics?.stats || {};
    const topViewedProducts = analytics?.topViewedProducts || [];

    const statCards = [
        { label: 'Total Product Views', value: stats.totalProductViews, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Shortlisted Products', value: stats.shortlistedProducts, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Sample Requests', value: stats.sampleRequests, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Vendor Contact Requests', value: stats.vendorContactRequests, icon: MessageSquare, color: 'text-[#E09A74]', bg: 'bg-[#E09A74]/10' },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-4xl font-black text-gray-900 mt-2">{stat.value || 0}</h3>
                    </div>
                ))}
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Top Viewed Products */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Most Viewed Products</h3>
                            <p className="text-sm font-medium text-gray-400">Products gaining the most attention</p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-[#E09A74]" />
                    </div>

                    <div className="space-y-6 relative z-10">
                        {topViewedProducts.map((product, i) => (
                            <div key={i} className="flex items-center justify-between p-6 rounded-[32px] bg-gray-50/50 hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white p-2 border border-gray-100 overflow-hidden">
                                        <img
                                            src={product.product_images?.[0]?.secure_url || '/placeholder.png'}
                                            alt={product.product_name}
                                            className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900">{product.product_name}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">ID: {product.product_unique_id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-[#E09A74]">{product.views || 0}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Unique Views</p>
                                </div>
                            </div>
                        ))}
                        {topViewedProducts.length === 0 && (
                            <div className="py-20 text-center text-gray-400 italic">No view data available yet.</div>
                        )}
                    </div>
                </div>

                {/* Conversion Tips / Next Steps */}
                <div className="bg-[#2C2D35] p-10 rounded-[48px] shadow-2xl text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-[#E09A74] flex items-center justify-center mb-8 shadow-2xl">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-black mb-4">Growth Tips</h3>
                        <p className="text-gray-400 font-medium leading-relaxed mb-8">
                            High view counts but low requests? Consider updating your product imagery or providing more technical specifications to help architects make decisions.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                <ArrowUpRight className="w-5 h-5 text-[#E09A74] shrink-0" />
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest leading-loose">Reach out to professionals who've shortlisted your products.</p>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                <ArrowUpRight className="w-5 h-5 text-[#E09A74] shrink-0" />
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest leading-loose">Update stock info for high-demand regions.</p>
                            </div>
                        </div>
                    </div>

                    <button className="mt-12 w-full py-4 bg-[#E09A74] rounded-2xl text-sm font-black text-white hover:bg-[#d88963] transition-all shadow-xl shadow-[#E09A74]/20 relative z-10">
                        View Marketing Resources
                    </button>
                </div>
            </div>
        </div>
    );
}
