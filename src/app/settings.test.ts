
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSettings, updateSettings } from '@/app/actions';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    settings: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Settings Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSettings returns existing settings', async () => {
    const mockSettings = {
        id: '1',
        ollamaModel: 'llama3',
        enableStoryGen: true,
        autoBackup: false,
        backupCount: 5
    };
    vi.mocked(prisma.settings.findFirst).mockResolvedValue(mockSettings as any);

    const result = await getSettings();

    expect(prisma.settings.findFirst).toHaveBeenCalled();
    expect(result.data).toEqual(mockSettings);
  });

  it('getSettings creates default settings if none exist', async () => {
    vi.mocked(prisma.settings.findFirst).mockResolvedValue(null);
    const defaultSettings = {
        id: '1',
        ollamaModel: 'llama3',
        enableStoryGen: false,
        autoBackup: true,
        backupCount: 10
    };
    vi.mocked(prisma.settings.create).mockResolvedValue(defaultSettings as any);

    const result = await getSettings();

    expect(prisma.settings.findFirst).toHaveBeenCalled();
    expect(prisma.settings.create).toHaveBeenCalledWith({
        data: {
            ollamaModel: "llama3",
            enableStoryGen: false,
            autoBackup: true,
            backupCount: 10
        }
    });
    expect(result.data).toEqual(defaultSettings);
  });

  it('updateSettings updates existing settings', async () => {
    const existingSettings = {
        id: '1',
        ollamaModel: 'llama3',
        enableStoryGen: false,
        autoBackup: true,
        backupCount: 10
    };
    vi.mocked(prisma.settings.findFirst).mockResolvedValue(existingSettings as any);

    const updatedSettings = {
        ...existingSettings,
        ollamaModel: 'mistral',
        enableStoryGen: true
    };
    vi.mocked(prisma.settings.update).mockResolvedValue(updatedSettings as any);

    const formData = new FormData();
    formData.append('ollamaModel', 'mistral');
    formData.append('enableStoryGen', 'on');
    formData.append('autoBackup', 'on');
    formData.append('backupCount', '10');

    const result = await updateSettings(formData);

    expect(prisma.settings.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
            ollamaModel: 'mistral',
            enableStoryGen: true,
            autoBackup: true,
            backupCount: 10
        }
    });
    expect(result.data).toEqual(updatedSettings);
  });
});
