'use client';

import React from 'react';
import { Star, User, Calendar, MessageSquare, Award, ThumbsUp, Activity, Package } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import { useGetUserRatings } from '@/hooks/useRating';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function RetailerRatingsPage() {
    const { user } = useAuthStore();
    const { data: ratingsData, isLoading } = useGetUserRatings(user?._id);

    const ratings = ratingsData?.data?.ratings || [];

    // Calculate categorical averages
    const categoricalStats = {};
    let totalScore = 0;
    let totalRatingsCount = 0;

    ratings.forEach(rating => {
        rating.ratings.forEach(r => {
            if (!categoricalStats[r.label]) {
                categoricalStats[r.label] = { sum: 0, count: 0 };
            }
            categoricalStats[r.label].sum += r.rating;
            categoricalStats[r.label].count += 1;
            totalScore += r.rating;
            totalRatingsCount += 1;
        });
    });

    const overallAverage = totalRatingsCount > 0 ? (totalScore / totalRatingsCount).toFixed(1) : '0.0';

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-[#e09a74] animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <header className="mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#2d3142]">Ratings & Performance</h1>
                        <p className="text-gray-400 font-medium">Detailed feedback and insights from your architect network.</p>
                    </div>
                </div>
            </header>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <Star className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-3xl font-black text-gray-900">{overallAverage}</span>
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Overall Rating</p>
                    <p className="text-xs text-gray-400 mt-1">Weighted average score</p>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-2xl">
                            <Award className="w-6 h-6 text-green-500" />
                        </div>
                        <span className="text-3xl font-black text-gray-900">{ratings.length}</span>
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Total Feedbacks</p>
                    <p className="text-xs text-gray-400 mt-1">From project partners</p>
                </div>

                {Object.entries(categoricalStats).slice(0, 2).map(([label, stats]) => (
                    <div key={label} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-orange-50 rounded-2xl">
                                <Activity className="w-6 h-6 text-orange-500" />
                            </div>
                            <span className="text-3xl font-black text-gray-900">
                                {(stats.sum / stats.count).toFixed(1)}
                            </span>
                        </div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{label}</p>
                        <p className="text-xs text-gray-400 mt-1">Average metric score</p>
                    </div>
                ))}
            </div>

            {/* Detailed Feedbacks */}
            <div className="space-y-8">
                <h2 className="text-xl font-black text-[#2d3142] flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#e09a74]" />
                    All Performance Feedback
                </h2>

                {ratings.length === 0 ? (
                    <div className="bg-white rounded-[40px] border border-gray-100 p-12 text-center shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Star className="w-10 h-10 text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black text-[#2d3142] mb-2">No Ratings Yet</h3>
                        <p className="text-gray-400 font-medium max-w-xs mx-auto">Feedback from architects will appear here once projects are completed.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {ratings.map((rating) => {
                            const avg = (rating.ratings.reduce((acc, r) => acc + r.rating, 0) / rating.ratings.length).toFixed(1);
                            
                            return (
                                <div key={rating._id} className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300">
                                    <div className="p-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-center shadow-inner">
                                                    {rating.who_rates?.profile ? (
                                                        <img src={rating.who_rates.profile} alt="" className="w-full h-full rounded-3xl object-cover" />
                                                    ) : (
                                                        <User className="w-8 h-8 text-gray-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-xl font-black text-[#2d3142]">{rating.who_rates?.name || 'Architect'}</h3>
                                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black tracking-widest uppercase rounded-full border border-blue-100">
                                                            Reviewer
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-3xl border border-gray-100">
                                                <div className="flex items-center">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star 
                                                            key={star} 
                                                            className={`w-5 h-5 ${star <= Math.round(avg) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'}`} 
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-2xl font-black text-gray-900">{avg}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {rating.ratings.map((r, idx) => (
                                                <div key={idx} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{r.label}</span>
                                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#e09a74]/10 rounded-lg text-[#e09a74] font-black text-xs">
                                                                <Award className="w-3.5 h-3.5" />
                                                                {r.rating}/5
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <p className="text-sm text-gray-600 leading-relaxed font-medium italic">
                                                                "{r.message || 'No specific comment provided.'}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50/50 p-4 border-t border-gray-50 flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4" />
                                            Project: <span className="text-[#2d3142]">{rating.projectId?.projectName || 'Project Reference'}</span>
                                        </div>
                                        <div className="w-px h-4 bg-gray-200" />
                                        <div className="flex items-center gap-2">
                                            <ThumbsUp className="w-4 h-4" />
                                            Architect ID: <span className="text-[#2d3142] uppercase">{rating.who_rates?._id?.slice(-8) || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
