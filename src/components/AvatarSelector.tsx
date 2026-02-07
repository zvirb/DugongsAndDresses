'use client';

import { uploadAvatar, updateCharacterImage } from "@/app/actions";
import { useState, useTransition } from "react";

const PRESETS = [
    '/avatars/barbarian_archer_female_1770268298470.png',
    '/avatars/barbarian_archer_male_1770268280543.png',
    '/avatars/bard_female_1770267498918.png',
    '/avatars/bard_male_1770267480087.png',
    '/avatars/cleric_female_1770266235967.png',
    '/avatars/cleric_male_1770266221119.png',
    '/avatars/dwarf_archer_female_1770268683214.png',
    '/avatars/dwarf_archer_male_1770268667839.png',
    '/avatars/dwarf_fighter_male_1770268439402.png',
    '/avatars/dwarf_mage_male_1770268698293.png',
    '/avatars/elf_archer_female_1770268263008.png',
    '/avatars/elf_archer_male_1770268242137.png',
    '/avatars/elf_female_1770267651052.png',
    '/avatars/elf_female_1770267798836.png',
    '/avatars/elf_fighter_female_1770268107753.png',
    '/avatars/elf_fighter_male_1770268090822.png',
    '/avatars/elf_male_1770267634807.png',
    '/avatars/elf_male_1770267781103.png',
    '/avatars/fairy_female_1770267946577.png',
    '/avatars/fantasy_barbarian_female_1770266826511.png',
    '/avatars/fantasy_barbarian_male_1770266807624.png',
    '/avatars/fantasy_wizard_male_1770266844095.png',
    '/avatars/fighter_female_1770266152007.png',
    '/avatars/fighter_male_1770266139273.png',
    '/avatars/fighter_male_1770266261627.png',
    '/avatars/fighter_male_1770266290109.png',
    '/avatars/hobbit_female_1770268009102.png',
    '/avatars/hobbit_male_1770267994027.png',
    '/avatars/hobbit_male_1770268037843.png',
    '/avatars/human_archer_female_1770268333890.png',
    '/avatars/human_archer_male_1770268315511.png',
    '/avatars/jester_female_1770267550485.png',
    '/avatars/jester_male_1770267240604.png',
    '/avatars/nymph_female_1770267925456.png',
    '/avatars/nymph_male_1770267906487.png',
    '/avatars/rogue_female_1770266208126.png',
    '/avatars/rogue_male_1770266194878.png',
    '/avatars/thief_female_1770267766244.png',
    '/avatars/thief_female_1770267844778.png',
    '/avatars/thief_male_1770267752047.png',
    '/avatars/thief_male_1770267828895.png',
    '/avatars/wizard_female_1770266180583.png',
    '/avatars/wizard_male_1770266164795.png',
];

import * as Popover from '@radix-ui/react-popover';

// ... (PRESETS array remains the same)

export default function AvatarSelector({
    characterId,
    isOpen: controlledIsOpen,
    onOpenChange
}: {
    characterId: string,
    isOpen?: boolean,
    onOpenChange?: (open: boolean) => void
}) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const isOpen = controlledIsOpen ?? internalIsOpen;
    const setIsOpen = (open: boolean) => {
        if (onOpenChange) {
            onOpenChange(open);
        } else {
            setInternalIsOpen(open);
        }
    };

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
        <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
            <Popover.Trigger asChild>
                <button
                    className="mt-2 text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 px-2 py-1 rounded text-neutral-300 flex items-center gap-2"
                    disabled={isPending}
                >
                    {isPending ? 'Updating...' : 'Change Avatar'}
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    className="z-50 w-64 bg-neutral-800 border-2 border-neutral-600 rounded-lg shadow-xl p-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                    sideOffset={5}
                >
                    <h4 className="text-sm font-bold text-white mb-2">Choose Avatar</h4>

                    {/* Presets */}
                    <div className="grid grid-cols-4 gap-2 mb-4 max-h-60 overflow-y-auto pr-1">
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

                    <Popover.Close asChild>
                        <button
                            className="mt-3 w-full text-xs text-center text-neutral-500 hover:text-neutral-300"
                            aria-label="Close"
                        >
                            Cancel
                        </button>
                    </Popover.Close>
                    <Popover.Arrow className="fill-neutral-600" />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
