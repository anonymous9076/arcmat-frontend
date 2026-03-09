import { useMemo, useState } from 'react';
import { Pencil, Trash2, ChevronRight, ChevronDown, FolderTree, Folder, Tag } from 'lucide-react';
import clsx from 'clsx';
import { buildCategoryTree } from '@/lib/categoryUtils';

const CategoryItem = ({ category, level, onEdit, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = category.children && category.children.length > 0;

    const isL1 = level === 1;
    const isL2 = level === 2;
    const isL3 = level === 3;

    return (
        <div className={clsx(
            "relative",
            isL1 && "mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden",
            isL2 && "mt-2 ml-4 md:ml-10 bg-gray-50/50 rounded-xl border border-gray-200/60 p-1",
            isL3 && "mt-1.5 ml-4 md:ml-8 flex items-center gap-3 py-2 px-3 border-l-2 border-gray-200 hover:border-[#e09a74] transition-colors"
        )}>
            {/* Context Line for L2/L3 relationship visualization */}
            {(isL2 || isL3) && (
                <div className="absolute -left-4 top-4 w-4 h-px bg-gray-300 md:-left-6"></div>
            )}

            {/* Header / Content Row */}
            <div className={clsx(
                "flex items-center justify-between gap-2 md:gap-4",
                isL1 && "p-4 md:p-5 bg-white",
                isL2 && "p-2.5",
                isL3 && "w-full"
            )}>
                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                    {hasChildren && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-[#e09a74] cursor-pointer"
                        >
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                    )}
                    {!hasChildren && (isL1 || isL2) && <div className="w-7 h-7" />}

                    {/* Icon Box */}
                    <div className={clsx(
                        "shrink-0 flex items-center justify-center rounded-lg font-bold border",
                        isL1 && "w-10 h-10 md:w-12 md:h-12 bg-orange-50 text-orange-600 border-orange-100",
                        isL2 && "w-8 h-8 md:w-9 md:h-9 bg-white text-blue-600 border-gray-200 shadow-sm",
                        isL3 && "w-6 h-6 bg-transparent text-gray-500 border-transparent"
                    )}>
                        {isL1 && <FolderTree className="w-5 h-5 md:w-6 md:h-6" />}
                        {isL2 && <Folder className="w-4 h-4 md:w-5 md:h-5" />}
                        {isL3 && <Tag className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={clsx(
                                "font-bold text-gray-900 truncate",
                                isL1 && "text-base md:text-lg",
                                isL2 && "text-sm",
                                isL3 && "text-sm"
                            )}>
                                {category.name}
                            </span>

                            {/* Status Badge */}
                            <span className={clsx(
                                "px-1.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap",
                                (category.isActive === 0 || category.isActive === false)
                                    ? "bg-red-50 text-red-600 border-red-100"
                                    : "bg-green-50 text-green-600 border-green-100"
                            )}>
                                {(category.isActive === 0 || category.isActive === false) ? 'Inactive' : 'Active'}
                            </span>

                            {/* Showcase Tags - ONLY for L1 */}
                            {isL1 && category.showcase?.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                    {category.showcase.map(loc => (
                                        <span
                                            key={loc}
                                            className={clsx(
                                                "px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                                loc === 'Header' && "bg-blue-50 text-blue-600 border-blue-100",
                                                loc === 'Gallery' && "bg-purple-50 text-purple-600 border-purple-100",
                                                loc === 'Carousel' && "bg-amber-50 text-amber-600 border-amber-100"
                                            )}
                                        >
                                            {loc}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
                            <span className="text-[9px] md:text-[10px] font-mono text-gray-400 bg-gray-50 px-1 rounded truncate">{category.slug}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                    <button
                        onClick={() => onEdit(category)}
                        className="p-1.5 md:p-2 text-gray-400 hover:text-[#e09a74] hover:bg-orange-50 rounded-lg transition-all cursor-pointer"
                        title="Edit Category"
                    >
                        <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(category)}
                        className="p-1.5 md:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Delete Category"
                    >
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className={clsx(
                    "animate-in fade-in slide-in-from-top-1 duration-200",
                    isL1 && "border-t border-gray-100 bg-gray-50/20 p-3 md:p-4 pt-1", // L1 Container Body
                )}>
                    {category.children.map(child => (
                        <CategoryItem
                            key={child._id}
                            category={child}
                            level={level + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function CategoryTable({ categories, onEdit, onDelete }) {
    // Transform flat list to tree
    const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

    if (!categories || categories.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-gray-500 font-medium">No categories found matching your search.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Header Helper (Optional, user wanted hierarchy so headers might be less relevant, but maybe a total count?) */}
            <div className="flex items-center justify-between px-2 mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Structure & Hierarchy ({categories.length} items)
                </span>
            </div>

            {categoryTree.map(root => (
                <CategoryItem
                    key={root._id}
                    category={root}
                    level={1}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
