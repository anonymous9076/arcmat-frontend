'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    Search,
    Trash2,
    User as UserIcon,
    CheckCircle2,
    XCircle,
    Eye,
    Lock,
    Unlock,
    ShieldCheck,
    ShieldAlert,
    PackageSearch,
    HardHat
} from 'lucide-react';
import { useAuth, useGetUsers, useDeleteUser, useUpdateUser } from '@/hooks/useAuth';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import clsx from 'clsx';

const ROLES = [
    { label: 'All Users', value: 'all' },
    { label: 'Customers', value: 'customer' },
    { label: 'Brands', value: 'vendor' },
    { label: 'Retailers', value: 'retailer' },
    { label: 'Architects', value: 'architect' },
];

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const { data: usersData, isLoading } = useGetUsers({
        enabled: isAdmin,
        page: currentPage,
        limit: pageSize,
        role: roleFilter === 'all' ? undefined : roleFilter,
        name: searchTerm || undefined
    });

    const users = usersData?.users || [];
    const pagination = usersData?.pagination || {};
    const totalItems = pagination.totalRecords || 0;
    const totalPages = pagination.totalPages || 1;

    const deleteUserMutation = useDeleteUser();
    const updateUserMutation = useUpdateUser();

    const handleDeleteClick = (user) => {
        if (user._id === currentUser?._id) {
            toast.error("You cannot delete your own admin account.");
            return;
        }
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await deleteUserMutation.mutateAsync(userToDelete._id);
            toast.success(`User ${userToDelete.name} deleted successfully`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete user");
        } finally {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
        }
    };

    const handleToggleStatus = async (user) => {
        if (user._id === currentUser?._id) {
            toast.error("You cannot deactivate your own admin account.");
            return;
        }
        const newStatus = user.isActive === 1 ? 0 : 1;
        try {
            await updateUserMutation.mutateAsync({
                id: user._id,
                data: { isActive: newStatus }
            });
            toast.success(`User ${user.name} is now ${newStatus === 1 ? 'Active' : 'Inactive'}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update user status");
        }
    };

    if (!isAdmin && currentUser) {
        return (
            <Container className="py-20 text-center">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
                <Link href="/dashboard" className="text-[#e09a74] mt-4 inline-block hover:underline">Back to Dashboard</Link>
            </Container>
        );
    }

    return (
        <Container className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage all roles, statuses, and permissions across the platform.</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#e09a74] transition-colors"
                        />
                    </div>

                    <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 w-full md:w-auto overflow-x-auto">
                        {ROLES.map((role) => (
                            <button
                                key={role.value}
                                onClick={() => { setRoleFilter(role.value); setCurrentPage(1); }}
                                className={clsx(
                                    "px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                                    roleFilter === role.value
                                        ? "bg-white text-[#e09a74] shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {role.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic font-medium">No users found matching your criteria.</td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#e09a74]">
                                                    <UserIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{u.name}</p>
                                                    <p className="text-xs text-gray-400">ID: {u._id.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm text-gray-600 font-medium">{u.email}</p>
                                            <p className="text-xs text-gray-400">{u.mobile || 'No mobile'}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "px-2.5 py-1 text-[10px] font-bold rounded-full uppercase",
                                                u.role === 'admin' ? "bg-purple-50 text-purple-700 border border-purple-100" :
                                                    (u.role === 'brand' || u.role === 'vendor') ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                                        u.role === 'architect' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                                            u.role === 'retailer' ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                                                "bg-gray-50 text-gray-700 border border-gray-100"
                                            )}>
                                                {u.role === 'customer' ? 'Professional' : (u.role === 'vendor' || u.role === 'brand' ? 'Brand' : u.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    {u.isActive === 1 ? (
                                                        <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-xs text-emerald-600">Active</span></>
                                                    ) : (
                                                        <><XCircle className="w-3.5 h-3.5 text-red-500" /> <span className="text-xs text-red-600">Inactive</span></>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    {u.isEmailVerified === 1 ? (
                                                        <><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-[10px] text-emerald-600">Verified</span></>
                                                    ) : (
                                                        <><ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> <span className="text-[10px] text-amber-600">Unverified</span></>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end items-center gap-1.5">
                                                {(u.role === 'brand' || u.role === 'vendor') && (
                                                    <Link
                                                        href={`/dashboard/products-list/${u._id}`}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="View Product List"
                                                    >
                                                        <PackageSearch className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                {u.role === 'architect' && (
                                                    <Link
                                                        href={`/dashboard/users/architects/${u._id}/projects`}
                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                        title="View Projects"
                                                    >
                                                        <HardHat className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                {u.role === 'retailer' && (
                                                    <Link
                                                        href={`/dashboard/retailer/inventory/${u._id}`}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                        title="View Inventory"
                                                    >
                                                        <PackageSearch className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleToggleStatus(u)}
                                                    className={clsx(
                                                        "p-1.5 rounded-lg transition-all",
                                                        u.isActive === 1 ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                                                    )}
                                                    title={u.isActive === 1 ? "Deactivate User" : "Activate User"}
                                                >
                                                    {u.isActive === 1 ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(u)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalItems > 0 && (
                    <div className="border-t border-gray-100">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalItems={totalItems}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                        />
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete User"
                message={`Are you sure you want to delete user "${userToDelete?.name}"? This action cannot be undone and will remove all their data.`}
                confirmText="Yes, Delete"
                type="danger"
            />
        </Container>
    );
}
