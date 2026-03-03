'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import { useAuthStore } from '@/store/useAuthStore';
import Container from '@/components/ui/Container';
import { useGetProducts } from '@/hooks/useProduct';
import { useGetOrders } from '@/hooks/useOrder';
import { useGetVariants } from '@/hooks/useVariant';
import { useGetUsers } from '@/hooks/useAuth';
import { useGetVendors } from '@/hooks/useVendor';
import { useGetCategories } from '@/hooks/useCategory';
import { getProductImageUrl } from '@/lib/productUtils';
import { Package, Layout, IndianRupee, ArrowRight, User, FolderPlus } from 'lucide-react';
import { useGetProjects } from '@/hooks/useProject';
import { useGetAllMoodboards } from '@/hooks/useMoodboard';
import useProjectStore from '@/store/useProjectStore';

const SEARCH_CATEGORIES = [
    { id: 'tiles', label: 'Tiles' },
    { id: 'paints', label: 'Paints' },
    { id: 'textiles', label: 'Textiles' },
    { id: 'wallpaper', label: 'Wallpaper' },
    { id: 'flooring', label: 'Flooring' },
    { id: 'laminate', label: 'Laminate' },
    { id: 'paneling', label: 'Paneling' },
    { id: 'acoustics', label: 'Acoustics' },
    { id: 'leathers', label: 'Leathers' },
];

// Thumbnail helper for moodboards
const getBoardThumbnail = (board) => {
    if (!board?.canvasState?.length) return null;
    const firstMaterial = board.canvasState.find(item => item.type === 'material');
    if (!firstMaterial?.material) return null;

    const m = firstMaterial.material;
    if (m.images?.length) return getProductImageUrl(m.images[0]);
    if (m.variant_images?.length) return getProductImageUrl(m.variant_images[0]);
    if (typeof m.productId === 'object' && m.productId?.product_images?.length)
        return getProductImageUrl(m.productId.product_images[0]);

    return null;
};

export default function DashboardPage() {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedProjectName, setSelectedProjectName] = useState('Select Project');
    const [showProjectMenu, setShowProjectMenu] = useState(false);

    // ZUSTAND INTEGRATION
    const { user } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    // Handle Redirection based on user role
    useEffect(() => {
        setMounted(true);
        if (user?.role === 'retailer') {
            router.push('/dashboard/retailer');
        }
    }, [user, router]);

    // Helper to get First Name safely
    const getFirstName = () => {
        if (!user?.fullName) return 'User';
        return user.fullName.split(' ')[0];
    };

    const { data: allProductsData, isLoading: isLoadingAll } = useGetProducts({
        userId: user?.role === 'brand' ? user?._id : undefined,
        page: 1,
        limit: 50,
        status: 'all',
        enabled: mounted && (user?.role === 'brand' || user?.role === 'admin')
    });

    const allProducts = allProductsData?.data?.data || allProductsData?.data || [];
    const stats = allProductsData?.data?.stats || allProductsData?.stats;
    const pagination = allProductsData?.data?.pagination || allProductsData?.pagination;

    const totalProductsCount = stats?.totalCount || pagination?.totalItems || allProducts.length;
    const activeProductsCount = stats?.activeCount || allProducts.filter(p => p.status === 1 || p.status === '1').length;
    const inactiveProductsCount = stats?.inactiveCount || allProducts.filter(p => p.status === 0 || p.status === '0').length;

    const recentProducts = [...allProducts]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const { data: ordersData, isLoading: isLoadingOrders } = useGetOrders({
        limit: 5,
        enabled: mounted && (user?.role === 'brand' || user?.role === 'admin')
    });
    const recentOrders = ordersData?.data?.data || ordersData?.data || [];

    const isAdmin = mounted && user?.role === 'admin';

    const { data: usersData } = useGetUsers({
        enabled: isAdmin,
        limit: 1
    });
    const totalUsers = usersData?.pagination?.totalRecords || usersData?.users?.length || 0;

    const { data: brandsData } = useGetVendors({
        enabled: isAdmin,
        limit: 1
    });
    const totalVendors = brandsData?.pagination?.total || brandsData?.data?.length || 0;

    const { data: categoriesData } = useGetCategories({
        enabled: isAdmin,
        limit: 1
    });
    const totalCategories = categoriesData?.pagination?.total || categoriesData?.data?.length || 0;

    const allVariants = allProducts.reduce((acc, p) => {
        if (p.variants && Array.isArray(p.variants)) {
            return [...acc, ...p.variants.map(v => ({ ...v, productName: p.product_name }))];
        }
        return acc;
    }, []);

    const lowStockVariants = [...allVariants]
        .sort((a, b) => (a.stock || 0) - (b.stock || 0))
        .slice(0, 10);

    // PROJECTS & MOODBOARDS
    const { data: projectsData, isLoading: projectsLoading } = useGetProjects({
        enabled: mounted && !!user
    });
    const { data: boardsData, isLoading: boardsLoading } = useGetAllMoodboards();

    const projects = projectsData?.data || [];
    const boards = boardsData?.data || [];

    // Set initial project
    useEffect(() => {
        if (projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projects[0]._id);
            setSelectedProjectName(projects[0].projectName);
        }
    }, [projects, selectedProjectId]);

    const recentBoards = boards.slice(0, 4);

    if (!mounted || (user && !user.role)) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d9a88a]"></div>
            </div>
        );
    }

    if (user?.role === 'brand' || user?.role === 'admin') {
        return (
            <Container className="py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Welcome back, {getFirstName()}! Here's what's happening today.</p>
                </div>

                <div className={clsx("grid gap-6 mb-8", isAdmin ? "grid-cols-1 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3")}>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Products</p>
                        <h3 className="text-3xl font-bold text-gray-900">{totalProductsCount}</h3>
                        <div className="mt-2 text-xs text-gray-400">{isAdmin ? "Total items in system" : "Total items in your inventory"}</div>
                    </div>

                    {isAdmin ? (
                        <>
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                                <p className="text-sm font-medium text-blue-600 mb-1">Total Users</p>
                                <h3 className="text-3xl font-bold text-blue-700">{totalUsers}</h3>
                                <div className="mt-2 text-xs text-blue-600/70">Registered customers & pros</div>
                            </div>
                            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 shadow-sm">
                                <p className="text-sm font-medium text-purple-600 mb-1">Total Brands</p>
                                <h3 className="text-3xl font-bold text-purple-700">{totalVendors}</h3>
                                <div className="mt-2 text-xs text-purple-600/70">Active brands & sellers</div>
                            </div>
                            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
                                <p className="text-sm font-medium text-indigo-600 mb-1">Total Categories</p>
                                <h3 className="text-3xl font-bold text-indigo-700">{totalCategories}</h3>
                                <div className="mt-2 text-xs text-indigo-600/70">Product classifications</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm">
                                <p className="text-sm font-medium text-green-600 mb-1">Active Products</p>
                                <h3 className="text-3xl font-bold text-green-700">{activeProductsCount}</h3>
                                <div className="mt-2 text-xs text-green-600/70">Currently visible to customers</div>
                            </div>
                            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm">
                                <p className="text-sm font-medium text-orange-600 mb-1">Inactive Products</p>
                                <h3 className="text-3xl font-bold text-orange-700">{inactiveProductsCount}</h3>
                                <div className="mt-2 text-xs text-orange-600/70">Drafts or hidden products</div>
                            </div>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Latest Products</h2>
                            <Link href={user.role === 'admin' ? '/dashboard/products-list' : `/dashboard/products-list/${user?._id}`} className="text-sm text-[#d9a88a] hover:underline">View All</Link>
                        </div>
                        <div className="space-y-4">
                            {isLoadingAll ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d9a88a]"></div>
                                </div>
                            ) : recentProducts.length > 0 ? (
                                recentProducts.map((product) => (
                                    <div key={product._id} className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0 pb-3">
                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                            {product.product_images?.[0] ? (
                                                <Image src={getProductImageUrl(product.product_images[0])} alt={product.product_name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">{product.product_name}</h4>
                                            <p className="text-xs text-gray-500">ID: {product.skucode || product._id?.substring(0, 8)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                product.status === 1 || product.status === '1' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                            )}>
                                                {product.status === 1 || product.status === '1' ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No products found.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
                            <Link href="/dashboard/orders" className="text-sm text-[#d9a88a] hover:underline">View All</Link>
                        </div>
                        <div className="space-y-4">
                            {isLoadingOrders ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d9a88a]"></div>
                                </div>
                            ) : recentOrders.length > 0 ? (
                                recentOrders.map((order) => (
                                    <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">Order #{order._id?.substring(order._id.length - 6).toUpperCase()}</h4>
                                            <p className="text-xs text-gray-500">{order.user_id?.name || `${order.user_id?.first_name || ''} ${order.user_id?.last_name || ''}`.trim() || 'Unknown User'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">₹{order.total_amount || 0}</p>
                                            <span className="text-[10px] text-gray-400 capitalize">{order.order_status || 'Pending'}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No recent orders.</p>
                            )}
                        </div>
                    </div>
                </div>

                {isAdmin && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Inactive Products (Needs Attention)</h2>
                            <span className="text-xs text-gray-400">{inactiveProductsCount} products found</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allProducts.filter(p => p.status === 0 || p.status === '0').length > 0 ? (
                                allProducts.filter(p => p.status === 0 || p.status === '0').slice(0, 6).map((product) => (
                                    <div key={product._id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                            {product.product_images?.[0] ? (
                                                <Image src={getProductImageUrl(product.product_images[0])} alt={product.product_name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Package className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">{product.product_name}</h4>
                                            <p className="text-xs text-gray-500">Brand: {product.createdBy?.name || 'N/A'}</p>
                                        </div>
                                        <Link href={`/dashboard/products-list/${product.createdBy?._id || ''}/edit/${product._id}`} className="text-xs text-[#d9a88a] font-semibold hover:underline">
                                            Edit
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <p className="col-span-full text-center py-4 text-gray-500 text-sm">No inactive products found.</p>
                            )}
                        </div>
                        {inactiveProductsCount > 6 && (
                            <div className="mt-4 text-center">
                                <Link href="/dashboard/products-list" className="text-sm text-[#d9a88a] font-medium hover:underline">View all inactive products</Link>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mt-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        Stock Monitoring
                        <span className="text-xs font-normal text-gray-400">(Low stock prioritised)</span>
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg border-b-0">Product & Variant</th>
                                    <th className="px-4 py-3 border-b-0">SKU</th>
                                    <th className="px-4 py-3 border-b-0">Current Stock</th>
                                    <th className="px-4 py-3 rounded-r-lg border-b-0 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {lowStockVariants.length > 0 ? (
                                    lowStockVariants.map((variant, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">{variant.productName}</span>
                                                    <span className="text-xs text-gray-500">{variant.color} / {variant.size} {variant.weight}{variant.weight_type}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{variant.skucode || 'N/A'}</td>
                                            <td className="px-4 py-3">
                                                <span className={clsx(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                    (variant.stock || 0) <= 5 ? "bg-red-100 text-red-800" : (variant.stock || 0) <= 20 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                                                )}>
                                                    {variant.stock || 0} in stock
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link href={`/dashboard/products-list/${user?._id}/edit/${variant?.productId}`} className="text-[#d9a88a] hover:text-[#c89675] text-xs font-semibold">Update</Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-gray-500">No stock data available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Container>
        );
    }


    return (
        <Container className="py-8">

            {/* Welcome Header */}
            <div className="text-center mb-12">

                {/* Filter Buttons */}
                <div className="flex w-full sm:w-auto items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={clsx(
                            'flex-1 sm:flex-none px-4 py-2.5 sm:px-10 sm:py-3 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap',
                            activeFilter === 'all'
                                ? 'bg-[#d9a88a] text-white shadow-md hover:shadow-lg'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300'
                        )}
                    >
                        See All
                    </button>

                    <button
                        onClick={() => setActiveFilter('new')}
                        className={clsx(
                            'flex-1 sm:flex-none px-4 py-2.5 sm:px-10 sm:py-3 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap',
                            activeFilter === 'new'
                                ? 'bg-[#d9a88a] text-white shadow-md hover:bg-[#c89675] hover:shadow-lg'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                        )}
                    >
                        See New
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT COLUMN: Current Project & Search */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 h-full flex flex-col">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                        Current Project
                    </h2>

                    {/* Project Selector */}
                    <div className="mb-6 relative">
                        {projectsLoading ? (
                            <div className="h-6 w-32 animate-pulse bg-gray-100 rounded" />
                        ) : projects.length > 0 ? (
                            <>
                                <button
                                    onClick={() => setShowProjectMenu(!showProjectMenu)}
                                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                    <span className="font-bold text-lg text-[#2d3142]">{selectedProjectName}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showProjectMenu && (
                                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-10 min-w-[240px] overflow-hidden">
                                        {projects.map(p => (
                                            <button
                                                key={p._id}
                                                onClick={() => {
                                                    setSelectedProjectId(p._id);
                                                    setSelectedProjectName(p.projectName);
                                                    setShowProjectMenu(false);
                                                }}
                                                className={clsx(
                                                    "w-full text-left px-4 py-3 text-sm font-semibold transition-colors",
                                                    selectedProjectId === p._id ? "bg-[#fef7f2] text-[#d9a88a]" : "text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                {p.projectName}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-gray-400 italic text-sm">
                                <FolderPlus className="w-4 h-4" />
                                No projects created yet
                            </div>
                        )}
                    </div>

                    {/* Search Categories */}
                    <div className="space-y-4 mt-auto">
                        <p className="text-sm text-gray-500">Search For :</p>
                        <div className="grid grid-cols-2 gap-3">
                            {SEARCH_CATEGORIES.map((category) => (
                                <button
                                    key={category.id}
                                    className="group gap-1 px-2 py-2 text-[#d9a88a] rounded-full text-sm font-medium hover:bg-[#d9a88a] transition-colors inline-flex items-center justify-center border border-[#d9a88a]/30"
                                >
                                    <svg className="w-4 h-4 text-[#d9a88a] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span className="text-sm text-gray-700 font-medium group-hover:text-white">
                                        {category.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Recent Boards */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">
                            Recent Boards
                        </h2>
                        <Link
                            href="/dashboard/boards"
                            className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
                        >
                            All Boards
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {/* Boards Grid */}
                    {boardsLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d9a88a]"></div>
                        </div>
                    ) : recentBoards.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {recentBoards.map((board) => {
                                const thumb = getBoardThumbnail(board);
                                return (
                                    <Link
                                        key={board._id}
                                        href="/dashboard/visualizer"
                                        onClick={() => useProjectStore.getState().setActiveMoodboard(board._id, board.moodboard_name, board.projectId?._id, board.projectId?.projectName)}
                                        className="group"
                                    >
                                        {/* Board Thumbnail Image */}
                                        <div className="relative aspect-4/3 bg-[#f8f7f5] rounded-2xl border border-gray-100 overflow-hidden mb-3">
                                            {thumb ? (
                                                <Image
                                                    src={thumb}
                                                    alt={board.moodboard_name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                                    <Layout className="w-8 h-8 text-gray-200" />
                                                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">No Preview</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Board Details */}
                                        <div className="px-1">
                                            <h3 className="text-sm font-bold text-[#2d3142] group-hover:text-[#d9a88a] transition-colors truncate">
                                                {board.moodboard_name}
                                            </h3>
                                            <div className="flex items-center justify-between gap-2 mt-1">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex items-center gap-1 truncate max-w-[100px]">
                                                    <Layout className="w-2.5 h-2.5" />
                                                    {board.projectId?.projectName || 'No Project'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex items-center gap-1">
                                                    <User className="w-2.5 h-2.5" />
                                                    {user?.fullName?.split(' ')[0] || 'Architect'}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-[#fef7f2] rounded-2xl flex items-center justify-center mb-4">
                                <Layout className="w-8 h-8 text-[#d9a88a]" />
                            </div>
                            <p className="text-sm text-gray-400 font-medium">No moodboards yet.</p>
                            <Link href="/dashboard/projects" className="mt-4 text-xs font-bold text-[#d9a88a] hover:underline uppercase tracking-wider">Start Creating</Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 bg-[#d9a88a]/10 rounded-2xl p-6 border border-[#d9a88a]/20 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center md:text-left">
                    <div className="w-12 h-12 bg-[#d9a88a] rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
                        <p className="text-sm text-gray-600">Our support team is here to assist you with any questions or issues.</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/help"
                    className="px-6 py-2.5 bg-white text-[#d9a88a] border border-[#d9a88a] rounded-full text-sm font-semibold hover:bg-[#d9a88a] hover:text-white transition-all shadow-sm"
                >
                    Contact Support
                </Link>
            </div>
        </Container >
    );
}