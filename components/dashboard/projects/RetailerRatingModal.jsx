'use client';

import { useState } from 'react';
import { X, Star, CheckCircle2, Loader2, Package, Clock, MessageSquare } from 'lucide-react';
import { useSubmitRating } from '@/hooks/useRating';

const RATING_CRITERIA = [
    {
        key: 'supply_reliability',
        label: 'Supply Reliability',
        description: 'Were materials delivered as promised and in the right quantity?',
        icon: Package,
        color: 'text-orange-500',
        bg: 'bg-orange-50',
    },
    {
        key: 'communication',
        label: 'Communication',
        description: 'Was the retailer responsive and easy to communicate with?',
        icon: MessageSquare,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
    },
    {
        key: 'delivery_time',
        label: 'Delivery Time',
        description: 'Were materials delivered on time and within the agreed schedule?',
        icon: Clock,
        color: 'text-green-500',
        bg: 'bg-green-50',
    },
];

function StarRating({ value, onChange }) {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                >
                    <Star
                        className={`w-8 h-8 transition-colors ${
                            star <= (hovered || value)
                                ? 'text-[#e09a74] fill-[#e09a74]'
                                : 'text-gray-200 fill-gray-200'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

const LABEL_MAP = {
    1: 'Poor',
    2: 'Below Average',
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
};

export default function RetailerRatingModal({ isOpen, onClose, project, retailerId }) {
    const [ratings, setRatings] = useState({
        supply_reliability: 0,
        communication: 0,
        delivery_time: 0,
    });
    const [notes, setNotes] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const { mutate: submitRating, isPending } = useSubmitRating();

    if (!isOpen) return null;

    const allRated = Object.values(ratings).every((r) => r > 0);

    const handleSubmit = () => {
        if (!allRated) return;

        submitRating(
            {
                projectId: project._id,
                ratings: [
                    {
                        rates_to: retailerId,
                        data: RATING_CRITERIA.map((c) => ({
                            label: c.label,
                            rating: ratings[c.key],
                            message: notes,
                        })),
                    },
                ],
            },
            {
                onSuccess: () => {
                    setSubmitted(true);
                    setTimeout(() => {
                        setSubmitted(false);
                        setRatings({ supply_reliability: 0, communication: 0, delivery_time: 0 });
                        setNotes('');
                        onClose();
                    }, 2000);
                },
            }
        );
    };

    const avgRating = allRated
        ? Math.round(Object.values(ratings).reduce((a, b) => a + b, 0) / 3)
        : 0;

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-7 pb-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-[#2d3142]">Rate Your Retailer</h2>
                        <p className="text-sm text-gray-400 mt-1 font-medium">
                            Project: <span className="text-[#2d3142] font-semibold">{project?.projectName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors mt-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {submitted ? (
                    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-xl font-black text-[#2d3142] mb-2">Thank You!</h3>
                        <p className="text-sm text-gray-400 font-medium">
                            Your rating helps build a trusted supplier network.
                        </p>
                    </div>
                ) : !retailerId ? (
                    <div className="flex flex-col items-center justify-center py-16 px-8 text-center flex-1">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5">
                            <Package className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black text-[#2d3142] mb-2">No Retailer Found</h3>
                        <p className="text-sm text-gray-400 font-medium max-w-[280px]">
                            There are no retailers associated with this project to rate yet.
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-8 py-3 px-8 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="px-7 py-4 overflow-y-auto flex-1 space-y-6">
                            {/* Average preview */}
                            {allRated && (
                                <div className="flex items-center gap-3 bg-[#fef7f2] rounded-2xl p-4 border border-[#f0ddd0]">
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className={`w-5 h-5 ${s <= avgRating ? 'text-[#e09a74] fill-[#e09a74]' : 'text-gray-200 fill-gray-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-[#2d3142]">
                                        Overall: {LABEL_MAP[avgRating]}
                                    </span>
                                </div>
                            )}

                            {/* Criteria */}
                            {RATING_CRITERIA.map((criterion) => {
                                const Icon = criterion.icon;
                                const val = ratings[criterion.key];
                                return (
                                    <div key={criterion.key} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-xl ${criterion.bg} flex items-center justify-center shrink-0`}>
                                                <Icon className={`w-4 h-4 ${criterion.color}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-[#2d3142]">{criterion.label}</p>
                                                <p className="text-xs text-gray-400">{criterion.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pl-10">
                                            <StarRating
                                                value={val}
                                                onChange={(v) => setRatings((prev) => ({ ...prev, [criterion.key]: v }))}
                                            />
                                            {val > 0 && (
                                                <span className="text-xs font-bold text-[#e09a74]">
                                                    {LABEL_MAP[val]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                                    Additional Comments <span className="normal-case font-medium">(optional)</span>
                                </label>
                                <textarea
                                    placeholder="Share anything specific about your experience with this retailer..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-white text-sm font-medium text-[#2d3142] focus:border-[#d9a88a] outline-none transition-all placeholder:text-gray-300 resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-4 flex gap-3 border-t border-gray-50">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3.5 px-6 border-2 border-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm"
                            >
                                Skip for now
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!allRated || isPending}
                                className="flex-2 py-3.5 px-6 bg-[#d9a88a] text-white font-black rounded-2xl hover:bg-[#c59678] shadow-lg shadow-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm min-w-[140px]"
                            >
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Star className="w-4 h-4 fill-white" />
                                        Submit Rating
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
