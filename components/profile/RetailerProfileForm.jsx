import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/Button';
import { Loader2, Plus, X } from 'lucide-react';

const RetailerProfileForm = ({ user, brands, onSubmit, onCancel, isSubmitting }) => {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm({
        defaultValues: {
            companyName: user?.retailerProfile?.companyName || '',
            contactPerson: user?.retailerProfile?.contactPerson || user?.name || '',
            businessAddress: user?.retailerProfile?.businessAddress || '',
            cityRegion: user?.retailerProfile?.cityRegion || '',
            email: user?.retailerProfile?.email || user?.email || '',
            mobile: user?.mobile || '',
            cities: user?.retailerProfile?.cities || [],
            preferredContactMethod: user?.retailerProfile?.preferredContactMethod || 'Phone',
            callingHours: user?.retailerProfile?.callingHours || '',
            selectedBrands: Array.from(new Set(user?.selectedBrands?.map(b => (typeof b === 'object' ? b._id : b)?.toString()))) || []
        }
    });

    const [cityInput, setCityInput] = useState('');
    const cities = watch('cities');

    const currentSelectedBrands = watch('selectedBrands');

    useEffect(() => {
        if (user) {
            reset({
                companyName: user.retailerProfile?.companyName || '',
                contactPerson: user.retailerProfile?.contactPerson || user.name || '',
                businessAddress: user.retailerProfile?.businessAddress || '',
                cityRegion: user.retailerProfile?.cityRegion || '',
                email: user.retailerProfile?.email || user.email || '',
                mobile: user.mobile || '',
                cities: user.retailerProfile?.cities || [],
                preferredContactMethod: user.retailerProfile?.preferredContactMethod || 'Phone',
                callingHours: user.retailerProfile?.callingHours || '',
                selectedBrands: Array.from(new Set(user.selectedBrands?.map(b => (typeof b === 'object' ? b._id : b)?.toString()))) || []
            });
        }
    }, [user, reset]);

    const handleAddCity = () => {
        if (!cityInput.trim()) return;
        if (!cities.includes(cityInput.trim())) {
            setValue('cities', [...cities, cityInput.trim()], { shouldDirty: true });
        }
        setCityInput('');
    };

    const handleRemoveCity = (cityToRemove) => {
        setValue('cities', cities.filter(c => c !== cityToRemove), { shouldDirty: true });
    };

    const handleCityKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCity();
        }
    };

    const handleToggleBrand = (brandId) => {
        const idStr = String(brandId);
        const exists = currentSelectedBrands.some(id => String(id) === idStr);

        let updatedBrands;
        if (exists) {
            updatedBrands = currentSelectedBrands.filter(id => String(id) !== idStr);
        } else {
            updatedBrands = [...currentSelectedBrands, brandId];
        }

        setValue('selectedBrands', updatedBrands, { shouldDirty: true });
    };

    const handleFormSubmit = (data) => {
        const payload = {
            retailerProfile: {
                companyName: data.companyName,
                contactPerson: data.contactPerson,
                businessAddress: data.businessAddress,
                cityRegion: data.cityRegion,
                email: data.email,
                cities: data.cities,
                preferredContactMethod: data.preferredContactMethod,
                callingHours: data.callingHours
            },
            mobile: data.mobile,
            selectedBrands: data.selectedBrands
        };
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                        {...register('companyName', { required: 'Company name is required' })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all"
                        placeholder="e.g. Acme Supplies"
                    />
                    {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                        {...register('contactPerson', { required: 'Contact person is required' })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all"
                        placeholder="e.g. John Doe"
                    />
                    {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                        {...register('email', {
                            required: 'Email is required',
                            pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                        })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all"
                        placeholder="e.g. contact@company.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                        {...register('mobile', { required: 'Phone number is required' })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all"
                        placeholder="e.g. +91 9876543210"
                    />
                    {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base City / Region</label>
                    <input
                        {...register('cityRegion', { required: 'City / Region is required' })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all"
                        placeholder="e.g. Delhi"
                    />
                    {errors.cityRegion && <p className="text-red-500 text-xs mt-1">{errors.cityRegion.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Contact Method</label>
                    <select
                        {...register('preferredContactMethod', { required: 'Please select a contact method' })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all bg-white"
                    >
                        <option value="Phone">Phone</option>
                        <option value="Email">Email</option>
                        <option value="WhatsApp">WhatsApp</option>
                    </select>
                    {errors.preferredContactMethod && <p className="text-red-500 text-xs mt-1">{errors.preferredContactMethod.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calling Hours</label>
                    <input
                        {...register('callingHours')}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all"
                        placeholder="e.g. Mon – Sat, 9:00 AM – 5:00 PM"
                    />
                    <p className="mt-1 text-[10px] text-gray-400">Architects will see this before calling.</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cities Served (Service Areas)</label>
                <div className="flex gap-2 mb-3">
                    <input
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        onKeyDown={handleCityKeyDown}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all"
                        placeholder="Type a city and press Enter (e.g. Noida)"
                    />
                    <button
                        type="button"
                        onClick={handleAddCity}
                        className="px-4 py-2 bg-[#e09a74] text-white rounded-lg hover:opacity-90 transition-all font-medium"
                    >
                        Add
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 min-h-[50px]">
                    {cities.length > 0 ? (
                        cities.map((city, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e09a74]/30 text-[#e09a74] text-sm font-semibold rounded-lg shadow-sm animate-in fade-in zoom-in duration-200"
                            >
                                {city}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveCity(city)}
                                    className="hover:bg-red-50 hover:text-red-500 rounded-full p-0.5 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))
                    ) : (
                        <p className="text-gray-400 text-sm italic py-1">No cities added yet. Retailers must define service areas.</p>
                    )}
                </div>
                <p className="mt-2 text-[11px] text-gray-500 font-medium uppercase tracking-wider">Example: Delhi, Gurgaon, Noida</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                <textarea
                    {...register('businessAddress', { required: 'Business address is required' })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all resize-none"
                    placeholder="Enter full business address"
                />
                {errors.businessAddress && <p className="text-red-500 text-xs mt-1">{errors.businessAddress.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brands Supplied</label>
                <div className="mt-2 bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {brands?.map((brand) => (
                            <button
                                key={brand._id}
                                type="button"
                                onClick={() => handleToggleBrand(brand._id)}
                                className={`
                                    flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
                                    ${currentSelectedBrands.includes(brand._id)
                                        ? 'bg-[#e09a74] text-white shadow-sm'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-[#e09a74] hover:text-[#e09a74]'}
                                `}
                            >
                                <span className="truncate">{brand.name}</span>
                                {currentSelectedBrands.includes(brand._id) ? <X size={12} /> : <Plus size={12} />}
                            </button>
                        ))}
                    </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">Select the brands you are authorized to supply.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                    type="button"
                    onClick={onCancel}
                    className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#e09a74] hover:text-[#e09a74] px-3 cursor-pointer"
                    text="Cancel"
                />
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#e09a74] text-white cursor-pointer hover:opacity-90 min-w-[120px] py-2 px-4 border border-[#e09a74]"
                    text={isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={16} />
                            <span>Saving...</span>
                        </div>
                    ) : 'Save Profile'}
                />
            </div>
        </form>
    );
};

export default RetailerProfileForm;
