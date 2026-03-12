import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionService } from '@/services/discussionService';
import { X, Send, User, MessageSquare, Loader2, Paperclip, Image as ImageIcon, FileX } from 'lucide-react';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import { useMarkNotificationsRead } from '@/hooks/useProject';
import clsx from 'clsx';
import { toast } from 'sonner';

export default function MessageModal({ isOpen, onClose, projectId, materialName, materialId, retailerId }) {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState([]);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const { mutate: markRead } = useMarkNotificationsRead();

    const { data: commentsData, isLoading } = useQuery({
        queryKey: ['project-comments', projectId, materialId, retailerId, 'internal'],
        queryFn: () => discussionService.getComments(projectId, null, retailerId, materialId, 'true'),
        enabled: isOpen && !!projectId
    });

    const sendMutation = useMutation({
        mutationFn: (formData) => discussionService.postComment(projectId, formData),
        onSuccess: () => {
            setMessage('');
            setAttachments([]);
            queryClient.invalidateQueries(['project-comments', projectId, materialId, retailerId]);
        },
        onError: (err) => {
            toast.error("Failed to send message: " + (err.response?.data?.message || err.message));
        }
    });

    // Mark as read when opened
    useEffect(() => {
        if (isOpen && projectId) {
            markRead({ id: projectId, materialId });
        }
    }, [isOpen, projectId, materialId, markRead]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [commentsData]);

    if (!isOpen) return null;

    const comments = (commentsData?.data || []).filter(c => 
        // Show all if architect/admin, or show only internal if retailer
        user.role === 'retailer' ? c.isInternal : true
    );

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + attachments.length > 5) {
            toast.warning("Maximum 5 attachments allowed.");
            return;
        }
        setAttachments(prev => [...prev, ...files]);
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim() && attachments.length === 0) return;

        const formData = new FormData();
        formData.append('message', message.trim());
        formData.append('referencedMaterialId', materialId || '');
        formData.append('referencedMaterialName', materialName || '');
        formData.append('isInternal', 'true');
        formData.append('type', 'comment');
        if (retailerId) formData.append('retailerId', retailerId);

        attachments.forEach(file => {
            formData.append('attachments', file);
        });

        sendMutation.mutate(formData);
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[40px] w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
                    <div>
                        <h3 className="text-xl font-black text-[#2d3142]">Message for {materialName}</h3>
                        <p className="text-xs font-medium text-gray-400">Direct conversation with {user.role === 'architect' ? 'Retailer' : 'Architect'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 text-[#d9a88a] animate-spin" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <MessageSquare className="w-8 h-8 text-gray-200" />
                            </div>
                            <p className="text-gray-400 font-medium italic">No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        comments.map((c) => {
                            const isMe = c.authorId?._id === user?._id;
                            return (
                                <div key={c._id} className={clsx("flex flex-col", isMe ? "items-end" : "items-start")}>
                                    <div className={clsx(
                                        "max-w-[85%] p-4 rounded-3xl text-sm font-medium shadow-sm",
                                        isMe ? "bg-[#2d3142] text-white rounded-tr-none" : "bg-white text-[#2d3142] rounded-tl-none border border-gray-100"
                                    )}>
                                        {!isMe && (
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#d9a88a] mb-2">
                                                {c.authorId?.name} • {c.authorId?.role}
                                            </p>
                                        )}
                                        
                                        {/* Attachments */}
                                        {c.attachments && c.attachments.length > 0 && (
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                {c.attachments.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                                                        <img src={url} alt="attachment" className="w-full h-32 object-cover hover:scale-105 transition-transform" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <p className="whitespace-pre-wrap">{c.message}</p>
                                    </div>
                                    <p className="text-[9px] font-black text-gray-300 mt-1 uppercase tracking-tighter">
                                        {format(new Date(c.createdAt), 'hh:mm a')}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Attachment Preview */}
                {attachments.length > 0 && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex gap-3 overflow-x-auto">
                        {attachments.map((file, i) => (
                            <div key={i} className="relative w-20 h-20 bg-white rounded-2xl border border-gray-200 shrink-0 group">
                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded-2xl" />
                                <button 
                                    onClick={() => removeAttachment(i)}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-6 border-t border-gray-100 bg-white">
                    <div className="relative flex items-center gap-3">
                        <input 
                            type="file"
                            multiple
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-all border border-gray-100"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                        
                        <input 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 font-bold text-[#2d3142] focus:outline-none focus:ring-2 focus:ring-[#d9a88a]/20 transition-all"
                        />
                        
                        <button 
                            type="submit"
                            disabled={(!message.trim() && attachments.length === 0) || sendMutation.isPending}
                            className="w-12 h-12 bg-[#d9a88a] text-white rounded-2xl flex items-center justify-center hover:bg-[#c59678] transition-all shadow-lg shadow-orange-50 disabled:opacity-50"
                        >
                            {sendMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
