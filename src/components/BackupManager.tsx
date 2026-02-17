'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createBackupAction, listBackupsAction, restoreBackupAction, deleteBackupAction } from '@/app/actions';

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

    const handleDelete = async (filename: string) => {
        if (!confirm(`Are you sure you want to delete ${filename}?`)) {
            return;
        }

        setLoading(true);
        setStatus(`Deleting ${filename}...`);
        try {
            const res = await deleteBackupAction(filename);
            if (res.success) {
                await loadBackups();
                setStatus('Backup deleted.');
            } else {
                setStatus('Delete failed.');
                console.error(res.error);
            }
        } catch (e) {
            setStatus('Delete failed.');
            console.error(e);
        } finally {
            setLoading(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    return (
        <Card variant="agent" className="w-full">
            <CardHeader>
                <CardTitle>Data Backup & Restore</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-agent-blue/60">
                        Backups are saved to the project folder on your host machine (<code className="bg-black/50 border border-agent-blue/20 px-1 rounded">./backups</code>),
                        keeping them safe even if Docker containers are reset.
                    </p>

                    <div className="flex items-center justify-between">
                        <Button
                            onClick={handleCreate}
                            disabled={loading}
                            variant="agent"
                            className="shadow-[0_0_15px_rgba(43,43,238,0.3)]"
                        >
                            {loading && status?.includes('Creating') ? 'Backing up...' : 'Create New Backup'}
                        </Button>
                        {status && <span className="text-sm text-white animate-pulse">{status}</span>}
                    </div>

                    <div className="border border-agent-blue/20 rounded-lg overflow-hidden bg-black/20">
                        <div className="bg-agent-navy/80 px-4 py-2 border-b border-agent-blue/20 font-bold text-sm text-agent-blue uppercase tracking-wider">
                            Available Backups
                        </div>
                        <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-agent-blue/30 scrollbar-track-transparent">
                            {backups.length === 0 ? (
                                <div className="p-4 text-center text-agent-blue/40 text-sm">No backups found.</div>
                            ) : (
                                <ul className="divide-y divide-agent-blue/10">
                                    {backups.map(file => (
                                        <li key={file} className="flex items-center justify-between p-3 hover:bg-agent-blue/10 transition-colors">
                                            <span className="text-sm font-mono text-agent-blue/80">{file}</span>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleRestore(file)}
                                                    disabled={loading}
                                                >
                                                    Restore
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="text-agent-blue/60 hover:text-red-400 hover:bg-red-900/20"
                                                    size="sm"
                                                    onClick={() => handleDelete(file)}
                                                    disabled={loading}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
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
