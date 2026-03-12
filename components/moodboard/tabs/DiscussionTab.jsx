import { useState, useEffect, useRef } from 'react';
import { useGetComments, usePostComment, useDeleteComment } from '@/hooks/useDiscussion';
import { useMarkNotificationsRead } from '@/hooks/useProject';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Send, Trash2, UserCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';

export default function DiscussionTab({ projectId, spaceId }) {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const isArchitect = user?.role === 'architect';

    const scrollContainerRef = useRef(null);

    const { data, isLoading } = useGetComments(projectId, spaceId);
    const postMutation = usePostComment(projectId);
    const deleteMutation = useDeleteComment(projectId);
    const { mutate: markNotificationsRead } = useMarkNotificationsRead();

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    };

    // Mark general discussions as read when the tab is opened or new messages arrive
    useEffect(() => {
        if (projectId && spaceId && user) {
            markNotificationsRead({ id: projectId, spaceId, type: 'general' });
        }
    }, [projectId, spaceId, user, markNotificationsRead, data]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (!isLoading) {
            scrollToBottom();
        }
    }, [data, isLoading]);

    const comments = data?.data || [];

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        postMutation.mutate({
            message: message.trim(),
            spaceId: spaceId,
            isInternal: isInternal
        }, {
            onSuccess: () => {
                setMessage('');
                setIsInternal(false);
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-[#d9a88a] animate-spin mb-3" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px] max-w-4xl mx-auto bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white shrink-0">
                <h2 className="text-xl font-bold text-[#1a1a2e]">Project Discussion</h2>
                <p className="text-sm text-gray-500">Communicate directly with your architect/client.</p>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 custom-scrollbar"
            >
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <UserCircle2 className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-600">No messages yet</h3>
                        <p className="text-gray-400">Start the conversation by sending a message below.</p>
                    </div>
                ) : (
                    <>
                        {comments.map(comment => {
                            const isMe = comment.authorId?._id === user?._id || comment.authorId === user?._id;
                            const authorName = comment.authorId?.name || (isMe ? user?.name : 'User');
                            const authorRole = comment.authorId?.role || (isMe ? user?.role : 'User');

                            return (
                                <div key={comment._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isMe ? 'You' : authorName}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${authorRole === 'architect' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                                            {authorRole}
                                        </span>
                                        {comment.isInternal && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-amber-50 text-amber-600">
                                                Private Note
                                            </span>
                                        )}
                                        {comment.referencedMaterialName && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-[#fef7f2] text-[#e09a74] border border-[#e09a74]/20 truncate max-w-[150px]" title={comment.referencedMaterialName}>
                                                {comment.referencedMaterialName}
                                            </span>
                                        )}
                                    </div>
                                    <div className="group relative flex items-start gap-2 max-w-[85%]">
                                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-[#1a1a2e] text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm'}`}>
                                            <p className="whitespace-pre-wrap">{comment.message}</p>
                                        </div>
                                        {(isMe || user?.role === 'architect') && (
                                            <button
                                                onClick={() => deleteMutation.mutate(comment._id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0 mt-1"
                                                title="Delete message"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 font-medium">
                                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
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
                            placeholder={isInternal ? "Type a private note..." : "Type a message..."}
                            className={`flex-1 resize-none min-h-[50px] max-h-[150px] p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-1 focus:ring-[#e09a74] focus:border-[#e09a74] outline-none text-sm transition-all leading-relaxed ${isInternal ? 'bg-amber-50/50 border-amber-100' : ''}`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            disabled={!message.trim() || postMutation.isPending}
                            className={`${isInternal ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#d9a88a] hover:bg-[#c29377]'} text-white p-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed h-[50px] w-[50px] flex items-center justify-center shrink-0 transition-colors`}
                        >
                            {postMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}