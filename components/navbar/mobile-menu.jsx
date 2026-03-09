"use client";

import { useSidebarStore } from "@/store/useSidebarStore";
import { X, ChevronDown, ChevronRight, Search, LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "./utils";
import { useAuth } from "@/hooks/useAuth";
import Logo from "../ui/logo.jsx";
import { useGetCategoryTree } from "@/hooks/useCategory";
import { getCategoryImageUrl } from "@/lib/productUtils";

export const MobileMenu = () => {
    const { isMobileOpen, setMobileOpen } = useSidebarStore();
    const { user, isAuthenticated, logout } = useAuth();
    const [openIndex, setOpenIndex] = useState(null);
    const [openSubIndex, setOpenSubIndex] = useState(null);
    const pathname = usePathname();

    const { data: categoryTree } = useGetCategoryTree();

    const navItems = useMemo(() => {
        const categories = categoryTree?.data || categoryTree;
        if (!categories || !Array.isArray(categories)) return [];

        const dynamicItems = categories
            .filter(cat => cat.showcase?.includes('Header'))
            .map(cat => {
                return {
                    name: cat.name,
                    id: cat._id || cat.id,
                    isSpecial: false,
                    hasDropdown: cat.children && cat.children.length > 0,
                    // categoryData: cat,
                    categories: cat.children ? cat.children.map(subCat => {
                        const l3Links = subCat.children ? subCat.children.map(c => c.name) : [];
                        const columns = [];
                        // Keep the column structure to be consistent with data structure, though we flat() it in render
                        for (let i = 0; i < l3Links.length; i += 4) {
                            columns.push(l3Links.slice(i, i + 4));
                        }

                        return {
                            name: subCat.name,
                            id: subCat._id || subCat.id,
                            hasSubmenu: subCat.children && subCat.children.length > 0,
                            links: columns,
                            children: subCat.children
                        };
                    }) : []
                };
            });

        return dynamicItems;
    }, [categoryTree]);

    // Close menu when clicking outside or on escape
    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMobileOpen]);

    const toggleItem = (index) => {
        setOpenIndex(openIndex === index ? null : index);
        setOpenSubIndex(null); // Reset sub-level when main level changes
    };

    const toggleSubItem = (e, subIndex) => {
        e.stopPropagation();
        setOpenSubIndex(openSubIndex === subIndex ? null : subIndex);
    };

    if (!isMobileOpen || pathname?.startsWith('/dashboard') || pathname?.startsWith('/profile')) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-200 lg:hidden h-dvh">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMobileOpen(false)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Menu Drawer */}
                <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute top-0 left-0 bottom-0 w-[85%] max-w-[400px] bg-white shadow-2xl flex flex-col h-full"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <div onClick={() => setMobileOpen(false)}>
                                <Logo className="h-222 w-auto" />
                            </div>
                        </div>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto py-2 no-scrollbar px-4">
                        {/* Search in Menu */}
                        <div className="mb-6 mt-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="w-full bg-gray-50 border border-gray-100 rounded-3xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#e09a74]/20"
                                />
                            </div>
                        </div>

                        <ul className="space-y-1">
                            {navItems.map((item, index) => {
                                const isOpen = openIndex === index;
                                return (
                                    <li key={item.name} className="border-b border-gray-50 last:border-none">
                                        <button
                                            onClick={() => toggleItem(index)}
                                            className={cn(
                                                "w-full flex items-center justify-between py-4 text-left transition-colors",
                                                item.isSpecial ? "text-[hsl(15,80%,65%)]" : "text-[hsl(20,10%,15%)]",
                                                isOpen ? "font-bold" : "font-medium"
                                            )}
                                        >
                                            <span className="text-[17px]">{item.name}</span>
                                            {item.hasDropdown && (
                                                <ChevronDown
                                                    className={cn(
                                                        "w-5 h-5 transition-transform duration-300",
                                                        isOpen ? "rotate-180" : ""
                                                    )}
                                                />
                                            )}
                                        </button>

                                        {/* Level 2: Categories */}
                                        <AnimatePresence>
                                            {isOpen && item.hasDropdown && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-[#fafafa] rounded-xl mb-4"
                                                >
                                                    <ul className="py-2">
                                                        {item.categories?.map((category, subIndex) => {
                                                            const isSubOpen = openSubIndex === subIndex;
                                                            return (
                                                                <li key={category.name} className="px-2">
                                                                    <button
                                                                        onClick={(e) => toggleSubItem(e, subIndex)}
                                                                        className={cn(
                                                                            "w-full flex items-center justify-between p-3 rounded-lg transition-colors",
                                                                            isSubOpen ? "bg-[#ead4ce]/40 text-[hsl(20,10%,15%)] font-semibold" : "text-gray-600 hover:bg-gray-100"
                                                                        )}
                                                                    >
                                                                        <span className="text-[15px]">{category.name}</span>
                                                                        {category.hasSubmenu && (
                                                                            <ChevronRight
                                                                                className={cn(
                                                                                    "w-4 h-4 transition-transform",
                                                                                    isSubOpen ? "rotate-90" : ""
                                                                                )}
                                                                            />
                                                                        )}
                                                                    </button>

                                                                    {/* Level 3: Links */}
                                                                    <AnimatePresence>
                                                                        {isSubOpen && category.links && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: "auto", opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                className="overflow-hidden"
                                                                            >
                                                                                <div className="pl-4 pr-2 py-2 grid grid-cols-1 gap-1">
                                                                                    {category.links.flat().map((link) => {
                                                                                        const linkCategoryData = category.children?.find(child => child.name === link);
                                                                                        const categoryId = linkCategoryData?._id || linkCategoryData?.id || '';
                                                                                        const href = categoryId ? `/productlist?category=${categoryId}` : "/productlist";

                                                                                        return (
                                                                                            <Link
                                                                                                key={link}
                                                                                                href={href}
                                                                                                onClick={() => setMobileOpen(false)}
                                                                                                className="block py-2 px-3 text-sm text-gray-500 hover:text-[#e09a74] hover:bg-[#e09a74]/5 rounded-md transition-all"
                                                                                            >
                                                                                                {link}
                                                                                            </Link>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto">
                        {isAuthenticated && user ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 px-2 mb-1">
                                    <div className="w-10 h-10 rounded-full bg-[#e09a74] text-white flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-white shadow-sm">
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            (user.name || user.fullName || user.email || 'U').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-[hsl(20,10%,15%)] truncate">
                                            {user.name || user.fullName || 'User'}
                                        </span>
                                        <span className="text-xs text-gray-500 truncate">
                                            {user.email}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-3xl text-sm font-semibold transition-colors hover:bg-gray-100"
                                    >
                                        <LayoutDashboard size={16} />
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setMobileOpen(false);
                                        }}
                                        className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 rounded-3xl text-sm font-semibold transition-colors hover:bg-red-100"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link
                                href="/auth/login"
                                onClick={() => setMobileOpen(false)}
                                className="w-full bg-[#e09a74] text-white py-3 rounded-xl font-bold text-center block transition-transform hover:scale-[0.98] active:scale-[0.96]"
                            >
                                Sign in / Join
                            </Link>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};