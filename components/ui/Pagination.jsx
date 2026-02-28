'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    pageSize = 12,
    onPageChange,
    onPageSizeChange,
    totalItems = 0
}) => {
    const pageSizes = [12, 20, 50];

    const safeCurrentPage = Number(currentPage) || 1;
    const safePageSize = Number(pageSize) || 12;
    const safeTotalItems = Number(totalItems) || 0;

    const startItem = safeTotalItems === 0 ? 0 : (safeCurrentPage - 1) * safePageSize + 1;
    const endItem = Math.min(safeCurrentPage * safePageSize, safeTotalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Rows per page:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#e09a74] transition-colors cursor-pointer"
                    >
                        {pageSizes.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="text-sm text-gray-500">
                    <span className="font-medium text-gray-900">{startItem}</span>
                    {' - '}
                    <span className="font-medium text-gray-900">{endItem}</span>
                    {' of '}
                    <span className="font-medium text-gray-900">{totalItems}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={clsx(
                        "p-2 rounded-lg border border-gray-200 transition-all",
                        currentPage === 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-600 hover:bg-gray-50 hover:border-[#e09a74] hover:text-[#e09a74]"
                    )}
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={clsx(
                                        "w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all",
                                        currentPage === pageNum
                                            ? "bg-[#e09a74] text-white shadow-sm"
                                            : "text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                                    )}
                                >
                                    {pageNum}
                                </button>
                            );
                        } else if (
                            (pageNum === currentPage - 2 && pageNum > 1) ||
                            (pageNum === currentPage + 2 && pageNum < totalPages)
                        ) {
                            return <span key={pageNum} className="text-gray-400">...</span>;
                        }
                        return null;
                    })}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={clsx(
                        "p-2 rounded-lg border border-gray-200 transition-all",
                        currentPage === totalPages
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-600 hover:bg-gray-50 hover:border-[#e09a74] hover:text-[#e09a74]"
                    )}
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
