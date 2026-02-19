import { describe, it, expect } from 'vitest';
import { parseSettingsForm } from './safe-json';

describe('parseSettingsForm', () => {
  it('parses valid form data correctly', () => {
    const formData = new FormData();
    formData.append('ollamaModel', 'mistral');
    formData.append('enableStoryGen', 'on');
    formData.append('autoBackup', 'on');
    formData.append('backupCount', '5');

    const result = parseSettingsForm(formData);
    expect(result).toEqual({
      ollamaModel: 'mistral',
      enableStoryGen: true,
      autoBackup: true,
      backupCount: 5,
    });
  });

  it('handles missing checkbox values as false', () => {
    const formData = new FormData();
    formData.append('ollamaModel', 'llama3');
    // enableStoryGen missing
    formData.append('autoBackup', 'on');
    formData.append('backupCount', '10');

    const result = parseSettingsForm(formData);
    expect(result.enableStoryGen).toBe(false);
    expect(result.autoBackup).toBe(true);
  });

  it('uses default values for missing fields', () => {
    const formData = new FormData();
    // Empty form data means unchecked boxes, so booleans become false.
    // Numbers/Strings missing might trigger defaults if not set in rawData.

    const result = parseSettingsForm(formData);
    expect(result.ollamaModel).toBe('llama3'); // Default from Schema
    expect(result.enableStoryGen).toBe(false); // Parsed as false
    expect(result.autoBackup).toBe(false); // Parsed as false
  });

  it('handles invalid numbers gracefully', () => {
    const formData = new FormData();
    formData.append('backupCount', 'invalid');

    const result = parseSettingsForm(formData);
    expect(result.backupCount).toBe(10); // Default from schema because we skipped setting it in rawData
  });

  it('handles empty string number gracefully', () => {
    const formData = new FormData();
    formData.append('backupCount', ''); // parseInt("") is NaN

    const result = parseSettingsForm(formData);
    expect(result.backupCount).toBe(10); // Default
  });
});
