import React from 'react';
import { Edit, Building2, User, Phone, MapPin, Tag, Mail } from 'lucide-react';

const RetailerProfileDetails = ({ user, brands, onEdit }) => {
    if (!user) return null;

    const retailerProfile = user.retailerProfile || {};
    const selectedBrands = user.selectedBrands || [];

    // Extract IDs if brands are populated as objects
    const selectedBrandIds = selectedBrands.map(b => (typeof b === 'object' && b !== null) ? (b._id || b.id) : b);

    // Filter brands to show names of selected brands
    const suppliedBrands = brands?.filter(b => selectedBrandIds.includes(b._id))?.map(b => b.name) || [];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div className="flex-1 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#e09a74]/10 flex items-center justify-center text-[#e09a74] shrink-0">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{retailerProfile.companyName || 'No Company Name'}</h2>
                            <p className="text-gray-500 text-sm">Retailer Profile</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Contact Person</p>
                                <p className="text-gray-900 font-medium">{retailerProfile.contactPerson || user.name}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Phone Number</p>
                                <p className="text-gray-900 font-medium">{user.mobile || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                <Mail size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Contact Email</p>
                                <p className="text-gray-900 font-medium">{retailerProfile.email || user.email || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">City / Region</p>
                                <p className="text-gray-900 font-medium">{retailerProfile.cityRegion || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onEdit}
                    className="flex items-center gap-2 text-[#e09a74] hover:text-[#d08963] font-medium transition-colors shrink-0"
                >
                    <Edit size={18} />
                    <span className="hidden sm:inline cursor-pointer">Edit Profile</span>
                </button>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-gray-400" />
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Business Address</h4>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {retailerProfile.businessAddress || 'No business address provided.'}
                </p>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                    <Tag size={16} className="text-gray-400" />
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Brands Supplied</h4>
                </div>
                {suppliedBrands.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {suppliedBrands.map((brandName, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-full shadow-sm"
                            >
                                {brandName}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm italic">No brands selected.</p>
                )}
            </div>
        </div>
    );
};

export default RetailerProfileDetails;
