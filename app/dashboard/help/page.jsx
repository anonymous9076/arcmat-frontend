'use client';

import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import AdminHelp from './AdminHelp';
import VendorHelp from './VendorHelp';

export default function HelpDashboard() {
    const { user, isLoading } = useAuth();
    const isAdmin = user?.role === 'admin';

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="w-10 h-10 text-[#E09A74] animate-spin" />
                <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Loading help center...</p>
            </div>
        );
    }

    if (isAdmin) {
        return <AdminHelp isAdmin={isAdmin} />;
    }

    // Default to Vendor/Architect help guide
    return <VendorHelp />;
}
