'use client';

import { uploadAvatar, updateCharacterImage } from "@/app/actions";
import { useState, useTransition } from "react";

const PRESETS = [
    '/avatars/barbarian_male.png', '/avatars/barbarian_female.png',
    '/avatars/wizard_male.png', '/avatars/wizard_female.png',
    '/avatars/rogue_male.png', '/avatars/rogue_female.png',
    '/avatars/cleric_male.png', '/avatars/cleric_female.png',
    '/avatars/jester_male.png', '/avatars/jester_female.png',
    '/avatars/bard_male.png', '/avatars/bard_female.png',
    '/avatars/watchman_male.png', '/avatars/watchman_female.png',
    '/avatars/thief_male.png', '/avatars/thief_female.png',
    '/avatars/elf_male.png', '/avatars/elf_female.png',
    '/avatars/nymph_male.png', '/avatars/nymph_female.png',
    '/avatars/fairy_male.png', '/avatars/fairy_female.png',
    '/avatars/hobbit_male.png', '/avatars/hobbit_female.png',
    '/avatars/elf_fighter_male.png', '/avatars/elf_fighter_female.png',
    '/avatars/elf_archer_male.png', '/avatars/elf_archer_female.png',
    '/avatars/elf_wizard_male.png', '/avatars/elf_wizard_female.png',
    '/avatars/elf_mage_male.png', '/avatars/elf_mage_female.png',
];

export default function AvatarSelector({ characterId, currentUrl }: { characterId: string, currentUrl: string | null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handlePresetSelect = (url: string) => {
        startTransition(async () => {
            await updateCharacterImage(characterId, url);
            setIsOpen(false);
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('characterId', characterId);

        startTransition(async () => {
            await uploadAvatar(formData);
            setIsOpen(false);
        });
    };

    return (
        <div className="relative inline-block mt-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 px-2 py-1 rounded text-neutral-300 flex items-center gap-2"
                disabled={isPending}
            >
                {isPending ? 'Updating...' : 'Change Avatar'}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 z-50 mt-2 w-64 bg-neutral-800 border-2 border-neutral-600 rounded-lg shadow-xl p-4">
                    <h4 className="text-sm font-bold text-white mb-2">Choose Avatar</h4>

                    {/* Presets */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {PRESETS.map((src, i) => (
                            <button
                                key={i}
                                onClick={() => handlePresetSelect(src)}
                                className="w-10 h-10 rounded-full bg-neutral-700 hover:bg-neutral-600 border border-neutral-500 overflow-hidden"
                                title={src.split('/').pop()}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt="preset" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-neutral-600 pt-3">
                        <label className="block text-xs text-neutral-400 mb-1">Upload Custom</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="block w-full text-xs text-neutral-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-neutral-700 file:text-neutral-300 hover:file:bg-neutral-600"
                        />
                    </div>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="mt-3 w-full text-xs text-center text-neutral-500 hover:text-neutral-300"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
