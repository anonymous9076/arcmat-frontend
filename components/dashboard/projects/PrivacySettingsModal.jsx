import { useState, useEffect } from 'react';
import { useUpdateProject } from '@/hooks/useProject';
import { Loader2, X, Shield, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';

export default function PrivacySettingsModal({ isOpen, onClose, project }) {
    const updateMutation = useUpdateProject();

    const [controls, setControls] = useState({
        showPriceToClient: false,
        showMaterials: true,
        showRenders: true,
        showMoodboards: true
    });

    useEffect(() => {
        if (project?.privacyControls) {
            setControls(project.privacyControls);
        }
    }, [project]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!project?._id) return;

        updateMutation.mutate(
            { id: project._id, data: { privacyControls: controls } },
            {
                onSuccess: () => {
                    toast.success('Privacy settings updated');
                    onClose();
                }
            }
        );
    };

    const Toggle = ({ label, description, checked, onChange }) => (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="pr-4">
                <p className="text-sm font-bold text-gray-800">{label}</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5 leading-relaxed">{description}</p>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-[#d9a88a]' : 'bg-gray-300'}`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
                />
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="relative p-8">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>

                    <div className="flex flex-col mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black text-[#2d3142] mb-1">Client View Settings</h2>
                        <p className="text-gray-500 font-medium text-sm">
                            Control what information clients can see when they log into this project.
                        </p>
                    </div>

                    <div className="space-y-3 mb-8">
                        <Toggle
                            label="Show Material Pricing"
                            description="Allow clients to see individual material costs and total budgets."
                            checked={controls.showPriceToClient}
                            onChange={(val) => setControls({ ...controls, showPriceToClient: val })}
                        />
                        <Toggle
                            label="Show Materials/Spaces"
                            description="Clients can view the assigned materials for each space."
                            checked={controls.showMaterials}
                            onChange={(val) => setControls({ ...controls, showMaterials: val })}
                        />
                        <Toggle
                            label="Show 3D Renders"
                            description="Make 3D visualization renders visible to clients."
                            checked={controls.showRenders}
                            onChange={(val) => setControls({ ...controls, showRenders: val })}
                        />
                        <Toggle
                            label="Show Moodboards"
                            description="Allow clients to view moodboards and concept designs."
                            checked={controls.showMoodboards}
                            onChange={(val) => setControls({ ...controls, showMoodboards: val })}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={onClose}
                            className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="flex-1 bg-[#3c4153] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#2d3142] transition-colors"
                        >
                            {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Settings'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
