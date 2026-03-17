import { useState, useEffect } from 'react';
import { useGetComments, usePostComment, useDeleteComment } from '@/hooks/useDiscussion';
import { useMarkNotificationsRead } from '@/hooks/useProject';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Send, Trash2, UserCircle2, X } from 'lucide-react';

export default function MaterialDiscussionModal({ isOpen, onClose, projectId, spaceId, materialId, materialName }) {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const isArchitect = user?.role === 'architect';

    const { data, isLoading } = useGetComments(projectId, spaceId, { enabled: isOpen });
    const postMutation = usePostComment(projectId);
    const deleteMutation = useDeleteComment(projectId);
    const { mutate: markNotificationsRead } = useMarkNotificationsRead();

    // Mark as read when the modal closes
    useEffect(() => {
        return () => {
            if (isOpen && materialId && projectId && user) {
                markNotificationsRead({ id: projectId, spaceId, materialId });
            }
        };
    }, [isOpen, materialId, projectId, spaceId, user, markNotificationsRead]);

    if (!isOpen || !materialId) return null;

    // Filter comments for this specific material
    const allComments = data?.data || [];
    const materialComments = allComments.filter(c => c.referencedMaterialId === materialId);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        postMutation.mutate({
            message: message.trim(),
            spaceId: spaceId,
            referencedMaterialId: materialId,
            referencedMaterialName: materialName,
            isInternal: isInternal
        }, {
            onSuccess: () => {
                setMessage('');
                setIsInternal(false);
            }
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200 cursor-default"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#fef7f2] shrink-0 rounded-t-3xl">
                    <div>
                        <h2 className="text-xl font-black text-[#2d3142]">Material Discussion</h2>
                        <p className="text-sm font-medium text-gray-500 mt-1 truncate max-w-[300px]">
                            <span className="text-[#d9a88a] font-bold">{materialName || 'Unknown Material'}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 text-[#d9a88a] animate-spin mb-3" />
                        </div>
                    ) : materialComments.length === 0 ? (
                        <div className="text-center py-20">
                            <UserCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-600">No comments yet</h3>
                            <p className="text-gray-400 text-sm">Start the discussion about this material below.</p>
                        </div>
                    ) : (
                        materialComments.map(comment => {
                            const isMe = comment.authorId?._id === user?._id;
                            const authorName = comment.authorId?.name || 'Unknown User';
                            const authorRole = comment.authorId?.role || 'User';

                            return (
                                <div key={comment._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-gray-500">{authorName}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${authorRole === 'architect' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                            {authorRole}
                                        </span>
                                        {comment.isInternal && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-amber-100 text-amber-700">
                                                Private Note
                                            </span>
                                        )}
                                    </div>
                                    <div className="group relative flex items-start flex-col gap-1 max-w-[85%]">
                                        <div className={`px-4 py-3 rounded-2xl text-sm ${isMe ? 'bg-[#1a1a2e] text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-700 rounded-tl-sm shadow-sm'}`}>
                                            <p className="whitespace-pre-wrap">{comment.message}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1">
                                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100 shrink-0 rounded-b-3xl">
                    <form onSubmit={handleSend} className="flex flex-col gap-3">
                        {isArchitect && (
                            <div className="flex items-center gap-2 ml-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isInternal}
                                        onChange={(e) => setIsInternal(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 accent-[#d9a88a]"
                                    />
                                    <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 transition-colors">
                                        Send as Private Note (Architect Only)
                                    </span>
                                </label>
                            </div>
                        )}
                        <div className="flex items-end gap-3">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={isInternal ? "Type a private note..." : "Add a comment..."}
                                className={`flex-1 resize-none min-h-[50px] max-h-[120px] p-3 border rounded-2xl focus:ring-1 outline-none text-sm transition-all ${isInternal
                                    ? 'bg-amber-50/30 border-amber-200 focus:border-amber-400 focus:ring-amber-400'
                                    : 'bg-gray-50 border-gray-200 focus:border-[#d9a88a] focus:ring-[#d9a88a]'
                                    }`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!message.trim() || postMutation.isPending}
                                className={`${isInternal ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#d9a88a] hover:bg-[#c29377]'} text-white p-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed h-[50px] w-[50px] flex items-center justify-center shrink-0 transition-colors`}
                            >
                                {postMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
