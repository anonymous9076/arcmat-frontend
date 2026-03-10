'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Container from '@/components/ui/Container';
import RoleGuard from '@/components/auth/RoleGuard';
import {
    BarChart3,
    TrendingUp,
    Users,
    Store,
    LayoutDashboard,
    Loader2,
    Eye,
    Heart,
    FileText,
    MessageSquare,
    ChevronRight,
    Search,
    MapPin,
    Briefcase
} from 'lucide-react';
import clsx from 'clsx';

// Import sub-components (I will extract these later or define internal components for now)
import BrandProductAnalytics from './components/BrandProductAnalytics';
import BrandProfessionalInsights from './components/BrandProfessionalInsights'; // I'll adapt the existing code
import BrandRetailerAnalyticsView from './components/BrandRetailerAnalyticsView'; // I'll adapt the existing code

export default function UnifiedBrandAnalytics() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('products');

    const tabs = [
        { id: 'products', label: 'Product Analytics', icon: BarChart3 },
        { id: 'professionals', label: 'Professional Insights', icon: Briefcase },
        { id: 'retailers', label: 'Retailer Network', icon: Store },
    ];

    return (
        <RoleGuard allowedRoles={['brand', 'vendor', 'admin']}>
            <div className="p-8 bg-gray-50 min-h-screen">
                <Container>
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-[#E09A74]" />
                            Brand Analytics
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">Comprehensive insights into your brand performance, professional reach, and retail network.</p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm mb-12 w-fit">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        "flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-black transition-all",
                                        activeTab === tab.id
                                            ? "bg-[#2C2D35] text-white shadow-xl"
                                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    <Icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-[#E09A74]" : "")} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="transition-all duration-300">
                        {activeTab === 'products' && <BrandProductAnalytics />}
                        {activeTab === 'professionals' && <BrandProfessionalInsights />}
                        {activeTab === 'retailers' && <BrandRetailerAnalyticsView />}
                    </div>
                </Container>
            </div>
        </RoleGuard>
    );
}
