"use client"
import Image from 'next/image'
import React, { useState, useRef, useEffect } from 'react'
import Button from '../ui/Button'
import Container from '../ui/Container'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth';
import Cookies from 'js-cookie';
import { LogOut, User, ChevronDown, Heart, Folder, ShoppingCart, LayoutDashboard, Menu, Search, Camera, Loader2 } from 'lucide-react';
import { useSidebarStore } from '@/store/useSidebarStore';
import { getProductImageUrl } from '@/lib/productUtils';
import { useGetProducts } from '@/hooks/useProduct';
import { useGetWishlist } from '@/hooks/useWishlist';
import { useCartStore } from '@/store/useCartStore';
import { useGetCartCount } from '@/hooks/useCart';

const Header = ({ variant = 'default' }) => {

    const isDashboard = variant === 'dashboard';

    const [searchText, setSearchText] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [showResults, setShowResults] = useState(false)
    const [isOpen, setIsOpen] = React.useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [projectsOpen, setProjectsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const { toggleMobileSidebar } = useSidebarStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchText])
    const { data: searchResults, isLoading: isSearching } = useGetProducts({
        search: debouncedSearch,
        limit: 5,
        enabled: !!debouncedSearch
    });
    const products = searchResults?.data?.data || searchResults?.data?.products || searchResults?.data || [];


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.group')) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                desktopProfileRef.current &&
                desktopProfileRef.current.contains(event.target)
            ) return;

            if (
                mobileProfileRef.current &&
                mobileProfileRef.current.contains(event.target)
            ) return;

            if (
                projectsRef.current &&
                projectsRef.current.contains(event.target)
            ) return;

            setProfileOpen(false);
            setProjectsOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const { user, isAuthenticated, logout, loading } = useAuth();
    const { data: wishlistData } = useGetWishlist(isAuthenticated);
    const wishlistCount = wishlistData?.data?.data?.length || 0;

    const { data: backendCartCount } = useGetCartCount(isAuthenticated);
    const localCartCount = useCartStore(state => state.getTotalItems());
    const cartCount = isAuthenticated ? (backendCartCount?.totalItems || 0) : localCartCount;

    const handleChange = (e) => {
        setSearchText(e.target.value)
    }

    const desktopProfileRef = useRef(null);
    const mobileProfileRef = useRef(null);
    const projectsRef = useRef(null);

    return (
        <header className='w-full border-b border-gray-200 bg-white sticky top-0 z-50'>
            <Container className="h-16 flex items-center justify-between gap-4">
                <div className='flex items-center gap-2'>

                    <button
                        suppressHydrationWarning
                        onClick={toggleMobileSidebar}
                        className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                        aria-label="Toggle Menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className='shrink-0'>
                        <Link href="/"
                            className='flex items-center gap-2'>
                            <Image
                                src="/Icons/arcmatlogo.svg"
                                alt="ArcMat Logo"
                                width={30}
                                height={30}
                                className="object-contain h-8 w-auto"
                                priority
                            />

                        </Link>
                    </div>
                </div>

                {/* <div className="flex items-center gap-2 lg:gap-6 flex-shrink-0"></div> */}
                {(!isDashboard || user?.role !== 'brand') && (
                    <div className='hidden md:flex flex-1 max-w-2xl mx-4 relative'>
                        <div className="relative w-full group">
                            <div className="flex items-center w-full bg-gray-100/80 hover:bg-gray-100 transition-colors rounded-full px-4 h-11 border border-transparent focus-within:border-gray-300 focus-within:bg-white focus-within:shadow-sm">
                                <div className='shrink-0 mr-3 opacity-50'>
                                    <Search size={18} />
                                </div>

                                <input
                                    type="text"
                                    onChange={handleChange}
                                    value={searchText}
                                    className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-[15px] w-full"
                                    placeholder="Search materials, products, brands and more"
                                    onFocus={() => setShowResults(true)}
                                />

                                {isSearching && <Loader2 className="animate-spin text-gray-400 w-4 h-4 mr-2" />}

                                <div className='shrink-0 ml-3 cursor-pointer hover:opacity-80 transition-opacity'>
                                    <Camera size={22} className="opacity-60" />
                                </div>
                            </div>

                            {showResults && debouncedSearch && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-101">
                                    {isSearching ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
                                    ) : products.length > 0 ? (
                                        <div className="max-h-[400px] overflow-y-auto py-2">
                                            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                Products
                                            </div>
                                            {products.map((product) => (
                                                <Link
                                                    key={product.id || product._id}
                                                    href={`/productdetails/${product.id || product._id}`}
                                                    onClick={() => {
                                                        setShowResults(false);
                                                        setSearchText("");
                                                    }}
                                                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-none"
                                                >
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                                                        {(product.images?.[0] || product.product_images?.[0]) ? (
                                                            <Image
                                                                src={getProductImageUrl(product.images?.[0] || product.product_images?.[0])}
                                                                alt={product.name || product.product_name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                <Folder size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                                            {product.name || product.product_name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs font-semibold text-[#e09a74]">
                                                                ₹{product.minPrice}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Search className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <p className="text-gray-900 font-medium text-sm">No results found</p>
                                            <p className="text-gray-500 text-xs mt-1">
                                                We couldn't find any products matching "{debouncedSearch}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 lg:gap-6 shrink-0">
                    {(!isDashboard || user?.role !== 'brand') && (
                        <>
                            <button className='p-2 hover:bg-gray-50 rounded-full transition-colors hidden sm:flex shrink-0'>
                                <Image src="/Icons/ai_icon.png" alt="AI Tools" width={28} height={28} />
                            </button>

                            {isAuthenticated && user?.invitedProjects?.length > 0 && (
                                <div ref={projectsRef} className="relative">
                                    <button
                                        onClick={() => setProjectsOpen(!projectsOpen)}
                                        className='p-2 hover:bg-gray-50 rounded-full transition-colors hidden sm:flex shrink-0'
                                    >
                                        <Folder size={22} className={`${projectsOpen ? 'text-[#e09a74]' : 'text-gray-600'} transition-colors`} />
                                    </button>

                                    {projectsOpen && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-100 overflow-hidden animate-fade-in">
                                            <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Projects</p>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {user.invitedProjects.map((project, idx) => {
                                                    const projectId = project._id || project.id || project;
                                                    const projectName = project.projectName || `Project ${idx + 1}`;

                                                    return (
                                                        <Link
                                                            key={projectId}
                                                            href={`/dashboard/projects/${projectId}/moodboards`}
                                                            onClick={() => setProjectsOpen(false)}
                                                            className="flex flex-col gap-0.5 px-4 py-3 hover:bg-[#fcf6f3] transition-colors border-b border-gray-50 last:border-none group"
                                                        >
                                                            <span className="text-sm font-semibold text-[#4D4E58] group-hover:text-[#e09a74] transition-colors">
                                                                {projectName}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 uppercase tracking-tight">View Moodboards</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className='h-6 w-px bg-gray-200 hidden sm:block'></div>
                        </>
                    )}

                    <div className='flex md:flex items-center sm:gap-4'>
                        {(!user || user.role !== 'brand') && (
                            <>
                                <Link href="/wishlist">
                                    <button className='p-2 hover:bg-gray-50 rounded-full transition-colors relative group/wishlist'>
                                        <Heart size={22} className="text-gray-600 group-hover/wishlist:text-[#e09a74] transition-colors" />
                                        {mounted && wishlistCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 bg-[#e09a74] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-transform duration-300 scale-110">
                                                {wishlistCount > 99 ? '99+' : wishlistCount}
                                            </span>
                                        )}
                                    </button>
                                </Link>
                            </>
                        )}
                        {(!user || user.role !== 'brand') && (
                            <Link href="/cart">
                                <button className='p-2 hover:bg-gray-50 rounded-full transition-colors relative group/cart'>
                                    <ShoppingCart size={22} className="text-gray-600 group-hover/cart:text-[#e09a74] transition-colors" />
                                    {mounted && cartCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 bg-[#e09a74] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-transform duration-300 scale-110">
                                            {cartCount > 99 ? '99+' : cartCount}
                                        </span>
                                    )}
                                </button>
                            </Link>
                        )}
                    </div>

                    <div className='hidden lg:flex items-center gap-2 min-w-[100px] justify-end'>
                        {loading ? (
                            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                        ) : isAuthenticated && user ? (
                            <div ref={desktopProfileRef} className="relative">
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-2 border border-gray-200 rounded-full py-1.5 px-4 hover:shadow-sm transition-all bg-white"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#e09a74] text-white flex items-center justify-center font-bold text-sm overflow-hidden border-2 border-gray-100 shadow-sm">
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            (user.name || user.fullName || Cookies.get('name') || user.email || 'U').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <span className="font-medium text-[#4D4E58] text-[15px] truncate max-w-[120px]">
                                        {user.name || user.fullName || Cookies.get('name') || user.email?.split('@')[0] || 'User'}
                                    </span>
                                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {profileOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                            <p className="text-sm font-semibold text-[#4D4E58] truncate">{user.name || user.fullName}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        </div>

                                        <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-[#fcf6f3] hover:text-[#e09a74] transition-colors">
                                            <User size={16} />
                                            Profile
                                        </Link>

                                        {!pathname?.startsWith('/dashboard') && (
                                            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-[#fcf6f3] hover:text-[#e09a74] transition-colors">
                                                <LayoutDashboard size={16} />
                                                Dashboard
                                            </Link>
                                        )}

                                        <button
                                            onClick={() => {
                                                logout();
                                                setProfileOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Button
                                href="/auth/login"
                                className="border border-[#e09a74] font-semibold bg-white text-[#4D4E58] hover:bg-[#e09a74] hover:text-white px-6 py-2 h-auto text-[15px]"
                                text="Sign In"
                            />
                        )}
                    </div>


                    <div ref={mobileProfileRef} className="relative lg:hidden">
                        {isAuthenticated && user ? (
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="p-1 hover:bg-gray-50 rounded-full transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-[#e09a74] text-white flex items-center justify-center font-bold text-sm overflow-hidden border border-gray-200">
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        (user.name || user.fullName || Cookies.get('name') || user.email || 'U').charAt(0).toUpperCase()
                                    )}
                                </div>
                            </button>
                        ) : (
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                            >
                                <User size={24} className="text-gray-600" />
                            </button>
                        )}

                        {profileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                                {isAuthenticated && user ? (
                                    <>
                                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                            <p className="text-sm font-semibold text-[#4D4E58] truncate">
                                                {user.name || user.fullName}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        </div>

                                        <Link
                                            href="/profile"
                                            onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-[#fcf6f3] hover:text-[#e09a74]"
                                        >
                                            <User size={16} />
                                            Profile
                                        </Link>

                                        {(!user || user.role !== 'brand') && (
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setProfileOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-[#fcf6f3] hover:text-[#e09a74]"
                                            >
                                                <Folder size={16} />
                                                Projects
                                            </Link>
                                        )}

                                        {!pathname?.startsWith('/dashboard') && (
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setProfileOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-[#fcf6f3] hover:text-[#e09a74]"
                                            >
                                                <LayoutDashboard size={16} />
                                                Dashboard
                                            </Link>
                                        )}

                                        <button
                                            onClick={() => {
                                                logout();
                                                setProfileOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left"
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/auth/login"
                                        onClick={() => setProfileOpen(false)}
                                        className="block px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </Container>
        </header>
    )
}

export default Header
