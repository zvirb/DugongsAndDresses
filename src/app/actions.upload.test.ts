import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadAvatar } from '@/app/actions';
import { prisma } from '@/lib/prisma';
import { Readable } from 'stream';
import { mkdir, unlink } from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { join } from 'path';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    character: {
      update: vi.fn(),
    },
    logEntry: {
      create: vi.fn(),
    },
    settings: {
        findFirst: vi.fn(),
    }
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/backup', () => ({
  checkAutoBackup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/ai', () => ({
  generateStory: vi.fn().mockResolvedValue(undefined),
}));

// We attempt to mock fs modules, but if environment uses real fs, we rely on result success.
// The primary verification of optimization is the benchmark and the code logic itself.
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    mkdir: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    createWriteStream: vi.fn().mockReturnValue({
      on: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    }),
  };
});

vi.mock('stream/promises', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    pipeline: vi.fn().mockResolvedValue(undefined),
  };
});

describe('uploadAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads a file successfully', async () => {
    const formData = new FormData();
    const fileContent = new Uint8Array([1, 2, 3]);
    const file = new File([fileContent], 'test.png', { type: 'image/png' });

    // Mock stream() to return an AsyncIterable which Readable.from accepts
    (file as any).stream = function () {
        return {
            [Symbol.asyncIterator]: async function* () {
                yield fileContent;
            }
        };
    };

    formData.append('file', file);
    formData.append('characterId', 'char-123');

    // Mock prisma update for updateCharacterImage
    vi.mocked(prisma.character.update).mockResolvedValue({
      id: 'char-123',
      name: 'Test Char',
      campaignId: 'camp-1',
    } as any);

    const result = await uploadAvatar(formData);

    // Verify success
    expect(result).toEqual({ success: true, data: { imageUrl: expect.stringMatching(/^\/avatars\/char-123-.*-test.png$/) } });

    // Cleanup
    if (result.success && result.data?.imageUrl) {
        const filePath = join(process.cwd(), 'public', result.data.imageUrl);
        try {
            await unlink(filePath);
        } catch (e) {
            console.error('Failed to cleanup test file:', e);
        }
    }
  });

  it('fails with invalid file type', async () => {
    const formData = new FormData();
    const file = new File(['text'], 'test.txt', { type: 'text/plain' });
    formData.append('file', file);
    formData.append('characterId', 'char-123');

    const result = await uploadAvatar(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid file type');
  });

  it('fails with too large file', async () => {
    const formData = new FormData();
    const largeBuffer = new Uint8Array(6 * 1024 * 1024);
    const file = new File([largeBuffer], 'large.png', { type: 'image/png' });
    formData.append('file', file);
    formData.append('characterId', 'char-123');

    const result = await uploadAvatar(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('File size too large');
  });
});
