"use client";

import { useState } from "react";
import { HardHat, Search, ChevronDown, ChevronUp, ShoppingBag, User, Phone, Mail, MapPin, Calendar } from "lucide-react";
import RoleGuard from '@/components/auth/RoleGuard';

const STATIC_ARCHITECTS = [
    {
        id: 1,
        name: "Arjun Mehta",
        email: "arjun.mehta@archstudio.in",
        phone: "+91 98765 43210",
        location: "Mumbai, Maharashtra",
        joinedDate: "Jan 2024",
        avatar: "AM",
        totalOrders: 12,
        totalSpend: "₹4,82,000",
        orders: [
            { id: "ORD-1001", product: "Modular Sofa Set – Charcoal Grey", date: "10 Feb 2025", status: "Delivered", amount: "₹68,000" },
            { id: "ORD-1002", product: "Walnut Dining Table (6-seater)", date: "22 Jan 2025", status: "Processing", amount: "₹1,12,000" },
            { id: "ORD-1003", product: "Pendant Light – Brass Finish", date: "05 Jan 2025", status: "Delivered", amount: "₹18,500" },
        ],
    },
    {
        id: 2,
        name: "Priya Sharma",
        email: "priya.sharma@designhaus.co",
        phone: "+91 91234 56789",
        location: "Bengaluru, Karnataka",
        joinedDate: "Mar 2024",
        avatar: "PS",
        totalOrders: 8,
        totalSpend: "₹2,95,500",
        orders: [
            { id: "ORD-2001", product: "Terrazzo Coffee Table", date: "14 Feb 2025", status: "Shipped", amount: "₹42,000" },
            { id: "ORD-2002", product: "Linen Curtains – Ivory (Set of 4)", date: "30 Jan 2025", status: "Delivered", amount: "₹22,000" },
        ],
    },
    {
        id: 3,
        name: "Rohan Kapoor",
        email: "rohan.k@kapoorinteriors.com",
        phone: "+91 87654 32109",
        location: "Delhi, NCR",
        joinedDate: "Nov 2023",
        avatar: "RK",
        totalOrders: 21,
        totalSpend: "₹9,14,200",
        orders: [
            { id: "ORD-3001", product: "Marble Console Table", date: "16 Feb 2025", status: "Delivered", amount: "₹85,000" },
            { id: "ORD-3002", product: "Rattan Lounge Chair", date: "08 Feb 2025", status: "Delivered", amount: "₹34,500" },
            { id: "ORD-3003", product: "Geometric Rug – 8x10 ft", date: "01 Feb 2025", status: "Processing", amount: "₹28,000" },
            { id: "ORD-3004", product: "Brass Floor Lamp", date: "20 Jan 2025", status: "Delivered", amount: "₹19,800" },
        ],
    },
    {
        id: 4,
        name: "Sneha Nair",
        email: "sneha.nair@nairdesigns.in",
        phone: "+91 99887 76655",
        location: "Kochi, Kerala",
        joinedDate: "Jun 2024",
        avatar: "SN",
        totalOrders: 5,
        totalSpend: "₹1,38,000",
        orders: [
            { id: "ORD-4001", product: "Teak Wood Bookshelf", date: "12 Feb 2025", status: "Shipped", amount: "₹56,000" },
            { id: "ORD-4002", product: "Handwoven Jute Basket Set", date: "03 Feb 2025", status: "Delivered", amount: "₹8,500" },
        ],
    },
    {
        id: 5,
        name: "Vikram Joshi",
        email: "vikram@joshiarch.com",
        phone: "+91 77665 54433",
        location: "Pune, Maharashtra",
        joinedDate: "Sep 2023",
        avatar: "VJ",
        totalOrders: 17,
        totalSpend: "₹6,72,300",
        orders: [
            { id: "ORD-5001", product: "Velvet Accent Chair – Emerald", date: "17 Feb 2025", status: "Processing", amount: "₹31,000" },
            { id: "ORD-5002", product: "Ceramic Table Lamp (Pair)", date: "10 Feb 2025", status: "Delivered", amount: "₹14,200" },
            { id: "ORD-5003", product: "Solid Oak Bed Frame – King", date: "28 Jan 2025", status: "Delivered", amount: "₹1,24,000" },
        ],
    },
];

const STATUS_STYLES = {
    Delivered: "bg-green-100 text-green-700",
    Processing: "bg-yellow-100 text-yellow-700",
    Shipped: "bg-blue-100 text-blue-700",
    Cancelled: "bg-red-100 text-red-700",
};

const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
    </span>
);

const ArchitectRow = ({ architect }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e09a74] to-[#c87d55] flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {architect.avatar}
                    </div>

                    <div className="text-left">
                        <p className="font-semibold text-gray-900 text-[15px]">{architect.name}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Mail className="w-3 h-3" /> {architect.email}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="w-3 h-3" /> {architect.location}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" /> Joined {architect.joinedDate}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs text-gray-400 font-medium">Total Orders</span>
                        <span className="text-[15px] font-bold text-gray-800">{architect.totalOrders}</span>
                    </div>
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs text-gray-400 font-medium">Total Spend</span>
                        <span className="text-[15px] font-bold text-[#e09a74]">{architect.totalSpend}</span>
                    </div>
                    {expanded
                        ? <ChevronUp className="w-5 h-5 text-gray-400" />
                        : <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                </div>
            </button>

            {expanded && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Orders</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 font-semibold border-b border-gray-100">
                                    <th className="pb-2 pr-4">Order ID</th>
                                    <th className="pb-2 pr-4">Product</th>
                                    <th className="pb-2 pr-4">Date</th>
                                    <th className="pb-2 pr-4">Status</th>
                                    <th className="pb-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {architect.orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 pr-4 font-mono text-xs text-gray-500">{order.id}</td>
                                        <td className="py-3 pr-4 text-gray-800 font-medium max-w-[200px] truncate">{order.product}</td>
                                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{order.date}</td>
                                        <td className="py-3 pr-4"><StatusBadge status={order.status} /></td>
                                        <td className="py-3 text-right font-semibold text-gray-800">{order.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function ArchitectsPage() {
    const [search, setSearch] = useState("");

    const filtered = STATIC_ARCHITECTS.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase()) ||
        a.location.toLowerCase().includes(search.toLowerCase())
    );

    const totalOrders = STATIC_ARCHITECTS.reduce((sum, a) => sum + a.totalOrders, 0);
    const totalArchitects = STATIC_ARCHITECTS.length;

    return (
        <RoleGuard allowedRoles={['brand']}>
            <div className="p-6 max-w-5xl mx-auto">

                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#e09a74]/10 flex items-center justify-center">
                        <HardHat className="w-5 h-5 text-[#e09a74]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Architect Notifications</h1>
                        <p className="text-sm text-gray-500">View architect users and their orders from your store</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 mb-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#e09a74]/10 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-[#e09a74]" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">Total Architects</p>
                            <p className="text-xl font-bold text-gray-900">{totalArchitects}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">Total Orders</p>
                            <p className="text-xl font-bold text-gray-900">{totalOrders}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
                        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                            <HardHat className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">Active This Month</p>
                            <p className="text-xl font-bold text-gray-900">4</p>
                        </div>
                    </div>
                </div>

                <div className="relative mb-5">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email or location..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e09a74]/30 focus:border-[#e09a74] transition"
                    />
                </div>

                <div className="flex flex-col gap-3">
                    {filtered.length > 0
                        ? filtered.map(architect => (
                            <ArchitectRow key={architect.id} architect={architect} />
                        ))
                        : (
                            <div className="text-center py-16 text-gray-400">
                                <HardHat className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No architects found</p>
                                <p className="text-sm mt-1">Try adjusting your search</p>
                            </div>
                        )
                    }
                </div>
            </div>
        </RoleGuard>
    );
}
