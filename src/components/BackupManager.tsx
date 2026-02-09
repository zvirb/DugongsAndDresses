'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createBackupAction, listBackupsAction, restoreBackupAction } from '@/app/actions';

export default function BackupManager() {
    const [backups, setBackups] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const loadBackups = async () => {
        try {
            const res = await listBackupsAction();
            if (res.success && Array.isArray(res.data)) {
                setBackups(res.data);
            }
        } catch (e) {
            console.error("Failed to load backups", e);
        }
    };

    useEffect(() => {
        loadBackups();
    }, []);

    const handleCreate = async () => {
        setLoading(true);
        setStatus('Creating backup...');
        try {
            const res = await createBackupAction();
            if (res.success) {
                await loadBackups();
                setStatus('Backup created successfully.');
            } else {
                setStatus('Backup failed.');
                console.error(res.error);
            }
        } catch (e) {
            setStatus('Backup failed.');
            console.error(e);
        } finally {
            setLoading(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    const handleRestore = async (filename: string) => {
        if (!confirm(`Are you sure you want to restore ${filename}? This will DELETE ALL CURRENT DATA apart from the backup file.`)) {
            return;
        }

        setLoading(true);
        setStatus(`Restoring ${filename}...`);
        try {
            const res = await restoreBackupAction(filename);
            if (res.success) {
                setStatus('Restore complete! Reloading...');
                setTimeout(() => window.location.assign('/'), 1500);
            } else {
                setStatus('Restore failed.');
                console.error(res.error);
                setLoading(false);
            }
        } catch (e) {
            setStatus('Restore failed.');
            console.error(e);
            setLoading(false);
        }
    };

    return (
        <Card variant="agent" className="w-full">
            <CardHeader>
                <CardTitle>Data Backup & Restore</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-neutral-400">
                        Backups are saved to the project folder on your host machine (<code className="bg-neutral-800 px-1 rounded">./backups</code>),
                        keeping them safe even if Docker containers are reset.
                    </p>

                    <div className="flex items-center justify-between">
                        <Button
                            onClick={handleCreate}
                            disabled={loading}
                            className="bg-agent-blue hover:bg-blue-600 text-white"
                        >
                            {loading && status?.includes('Creating') ? 'Backing up...' : 'Create New Backup'}
                        </Button>
                        {status && <span className="text-sm text-agent-act">{status}</span>}
                    </div>

                    <div className="border border-neutral-700 rounded-lg overflow-hidden">
                        <div className="bg-neutral-900 px-4 py-2 border-b border-neutral-700 font-semibold text-sm text-neutral-300">
                            Available Backups
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {backups.length === 0 ? (
                                <div className="p-4 text-center text-neutral-500 text-sm">No backups found.</div>
                            ) : (
                                <ul className="divide-y divide-neutral-800">
                                    {backups.map(file => (
                                        <li key={file} className="flex items-center justify-between p-3 hover:bg-neutral-800/50 transition-colors">
                                            <span className="text-sm font-mono text-neutral-300">{file}</span>
                                            <Button
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                size="sm"
                                                onClick={() => handleRestore(file)}
                                                disabled={loading}
                                            >
                                                Restore
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
