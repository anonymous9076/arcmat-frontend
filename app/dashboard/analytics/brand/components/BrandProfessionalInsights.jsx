'use client';

import { useState } from "react";
import { useBrandProfessionalInsights } from '@/hooks/useBrandAnalytics';
import { useAuth } from '@/hooks/useAuth';
import {
    Briefcase,
    Search,
    ChevronDown,
    ChevronUp,
    ShoppingBag,
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    FileText,
    Star,
    MessageSquare,
    Loader2
} from "lucide-react";

const STATUS_STYLES = {
    Delivered: "bg-green-100 text-green-700",
    Processing: "bg-yellow-100 text-yellow-700",
    Shipped: "bg-blue-100 text-blue-700",
    Cancelled: "bg-red-100 text-red-700",
};

const STAGE_COLORS = {
    "Concept Design": "bg-purple-50 text-purple-600 border-purple-100",
    "Design Development": "bg-indigo-50 text-indigo-600 border-indigo-100",
    "Material Specification": "bg-blue-50 text-blue-600 border-blue-100",
    "Construction": "bg-orange-50 text-orange-600 border-orange-100",
    "Completed": "bg-green-50 text-green-600 border-green-100",
};

const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
    </span>
);

const ProfessionalRow = ({ professional }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md mb-4">
            <div
                className="w-full flex flex-col md:flex-row items-start md:items-center justify-between p-5 text-left hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#e09a74] to-[#c87d55] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                        {professional.avatar}
                    </div>

                    <div className="text-left flex-1">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 text-base">{professional.name}</p>
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                                {professional.type}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" /> {professional.location}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" /> Joined {professional.joinedDate}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-8 mt-5 md:mt-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="flex flex-col items-center md:items-end">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Project Stage</span>
                        <span className={`mt-1 px-3 py-1 rounded-full text-xs font-bold border ${STAGE_COLORS[professional.projectStage] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
                            {professional.projectStage}
                        </span>
                    </div>

                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Engagement</span>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex flex-col items-center md:items-end">
                                <span className="text-sm font-bold text-gray-800">{professional.totalOrders} <span className="text-[10px] text-gray-400 font-medium lowercase">orders</span></span>
                            </div>
                            <div className="w-px h-6 bg-gray-100"></div>
                            <div className="flex flex-col items-center md:items-end">
                                <span className="text-sm font-bold text-[#e09a74]">{professional.totalSpend}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 rounded-lg bg-gray-50 text-gray-400">
                        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-gray-100 bg-gray-50/30">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                        {/* Statistics & Insights */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" /> Interaction Insights
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Contact Requests</span>
                                        <span className="font-bold text-gray-900">{professional.contactRequests}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Sample Requests</span>
                                        <span className="font-bold text-gray-900">{professional.sampleRequests || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Purchase Status</span>
                                        {professional.purchased ? (
                                            <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold">PURCHASED</span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-[10px] font-bold">NO PURCHASE</span>
                                        )}
                                    </div>
                                    <div className="pt-2 border-t border-gray-50 flex flex-col gap-1">
                                        <span className="text-xs text-gray-400">Contact Details</span>
                                        <div className="flex flex-col gap-1.5 mt-1">
                                            <a href={`mailto:${professional.email}`} className="text-xs text-[#e09a74] hover:underline flex items-center gap-1.5 font-medium">
                                                <Mail className="w-3 h-3" /> {professional.email}
                                            </a>
                                            <a href={`tel:${professional.phone}`} className="text-xs text-gray-600 flex items-center gap-1.5">
                                                <Phone className="w-3 h-3" /> {professional.phone}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Star className="w-3.5 h-3.5" /> Professional Reviews
                                </h3>
                                {professional.reviews?.length > 0 ? (
                                    professional.reviews.map((rev, idx) => (
                                        <div key={idx} className="flex flex-col gap-2 mb-3 last:mb-0">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3 h-3 ${i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-600 italic">"{rev.comment}"</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-2">No reviews yet</p>
                                )}
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="lg:col-span-2">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-full">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <ShoppingBag className="w-3.5 h-3.5" /> Recent Orders
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-[10px] text-gray-400 font-bold uppercase border-b border-gray-100">
                                                <th className="pb-3 pr-4">Order ID</th>
                                                <th className="pb-3 pr-4">Product</th>
                                                <th className="pb-3 pr-4">Date</th>
                                                <th className="pb-3 pr-4">Status</th>
                                                <th className="pb-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {professional.orders?.map(order => (
                                                <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="py-3.5 pr-4 font-mono text-[10px] text-gray-400">{order.id}</td>
                                                    <td className="py-3.5 pr-4 text-gray-800 font-semibold max-w-[180px] truncate">{order.product}</td>
                                                    <td className="py-3.5 pr-4 text-gray-500 whitespace-nowrap text-xs">{order.date}</td>
                                                    <td className="py-3.5 pr-4"><StatusBadge status={order.status} /></td>
                                                    <td className="py-3.5 text-right font-bold text-gray-900">{order.amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {(professional.orders?.length === 0 || !professional.orders) && (
                                    <div className="text-center py-8 text-gray-400 text-sm">No orders found</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function BrandProfessionalInsights() {
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("All");

    const brandId = user?.selectedBrands?.[0] || user?.brandId || user?.id;
    const { data: analytics, isLoading } = useBrandProfessionalInsights({ brandId });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="w-10 h-10 text-[#E09A74] animate-spin" />
                <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Loading professional insights...</p>
            </div>
        );
    }

    const professionals = analytics?.professionals || [];
    const metrics = analytics?.metrics || {
        total: 0,
        architects: 0,
        designers: 0,
        contractors: 0,
        inquiries: 0
    };

    const filtered = professionals.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.location.toLowerCase().includes(search.toLowerCase()) ||
            p.type.toLowerCase().includes(search.toLowerCase());

        const matchesType = filterType === "All" || p.type.toLowerCase().includes(filterType.toLowerCase());

        return matchesSearch && matchesType;
    });

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-[#e09a74]/10 flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-[#e09a74]" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Professional Insights</h1>
                                <p className="text-sm text-gray-500 font-medium">Comprehensive view of professionals interacting with your brand</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {["All", "Architect", "Designer", "Contractor"].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === type
                                    ? "bg-gray-900 text-white shadow-lg shadow-gray-200"
                                    : "bg-white text-gray-500 border border-gray-100 hover:border-gray-200"
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Professionals</p>
                            <p className="text-2xl font-black text-gray-900">{metrics.total}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Architects</p>
                            <p className="text-2xl font-black text-gray-900">{metrics.architects}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Inquiries</p>
                            <p className="text-2xl font-black text-gray-900">{metrics.inquiries}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Direct Engagement</p>
                            <p className="text-2xl font-black text-gray-900">{professionals.filter(p => p.purchased).length}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by professional name, type, location..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-100 bg-white text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[#e09a74]/10 focus:border-[#e09a74] transition-all"
                />
            </div>

            <div className="space-y-4">
                {filtered.length > 0 ? (
                    filtered.map(professional => (
                        <ProfessionalRow key={professional.id} professional={professional} />
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                        <p className="font-bold text-gray-900">No professionals found</p>
                        <p className="text-sm text-gray-500 mt-1">Try expanding your search or filter</p>
                    </div>
                )}
            </div>
        </div>
    );
}
