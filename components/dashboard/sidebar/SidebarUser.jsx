'use client';

import { useState, memo, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, User, LogOut } from 'lucide-react';
import clsx from 'clsx';
import useAuthStore from '@/store/useAuthStore';

const SidebarUser = memo(({ isCollapsed, mounted }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    // Use a selector to ensure proper reactivity
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    // Debug logging
    useEffect(() => {
    }, [user]);

    const getUserRoleLabel = () => {
        if (!user?.role) {
            return 'Guest';
        }
        switch (user.role) {
            case 'vendor':
            case 'brand':
                return 'Brand';
            case 'customer':
                return 'Customer';
            case 'retailer':
                return 'Retailer';
            case 'architect':
                return 'Architect';
            case 'admin':
                return 'Admin';
            default:
                return user.role.charAt(0).toUpperCase() + user.role.slice(1);
        }
    };

    const getUserInitials = () => {
        const name = user?.name || user?.fullName;
        if (name) {
            const names = name.split(' ');
            if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase();
            return name.substring(0, 2).toUpperCase();
        }
        return "VT";
    };

    return (
        <div className={clsx("relative mb-8 transition-all", isCollapsed ? "flex justify-center" : "")}>
            <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={clsx(
                    "flex items-center gap-2 w-full transition-all outline-none text-left overflow-hidden whitespace-nowrap",
                )}
            >
                <div className="w-8 h-8 rounded-full bg-[#d9a88a] flex items-center justify-center shrink-0 text-white font-semibold text-xs shadow-sm">
                    {mounted ? getUserInitials() : 'VT'}
                </div>

                <div className={clsx(
                    "flex flex-col items-start flex-1 overflow-hidden transition-all duration-300",
                    isCollapsed ? "max-w-0 opacity-0 translate-x-[-10px]" : "max-w-[200px] opacity-100 translate-x-0"
                )}>
                    <span className="font-semibold text-gray-900 truncate text-sm">
                        {mounted ? (user?.name || user?.fullName || 'Guest User') : 'Loading...'}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide truncate bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">
                        {mounted ? getUserRoleLabel() : '...'}
                    </span>
                </div>
                <ChevronDown className={clsx(
                    "w-4 h-4 text-gray-500 transition-all duration-300 shrink-0",
                    showUserMenu && "rotate-180",
                    isCollapsed ? "max-w-0 opacity-0" : "max-w-4 opacity-100"
                )} />
            </button>

            {showUserMenu && !isCollapsed && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-1 animate-in fade-in zoom-in-95 duration-200">
                    <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => setShowUserMenu(false)}
                    >
                        <User className="w-4 h-4" />
                        Profile
                    </Link>
                    <button
                        onClick={() => {
                            logout();
                            window.location.href = '/';
                        }}
                        className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
});

SidebarUser.displayName = 'SidebarUser';

export default SidebarUser;