'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    ShieldCheck, Moon, Sun, LogOut, Search, ArrowLeft, Loader2,
    History, Shield, AlertTriangle, FileText, Activity, Clock,
    Filter, Download, Eye
} from 'lucide-react';

export default function WarRoomPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const u = JSON.parse(stored);
        if (u.role !== 'hq') {
            router.push('/');
            return;
        }
        setUser(u);
        loadLogs();
    }, [router]);

    const loadLogs = async () => {
        try {
            const data = await adminApi.getAuditLogs();
            setLogs(data.logs || []);
        } catch (err) {
            console.error('Failed to load logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const getEventIcon = (action: string) => {
        if (action.includes('LOGIN_SUCCESS')) return <Shield className="h-4 w-4 text-emerald-400" />;
        if (action.includes('FAIL') || action.includes('ERROR') || action.includes('RATE_LIMIT')) return <AlertTriangle className="h-4 w-4 text-red-400" />;
        if (action.includes('CREATE') || action.includes('REGISTER') || action.includes('UPLOAD')) return <FileText className="h-4 w-4 text-blue-400" />;
        if (action.includes('DELETE') || action.includes('REMOVE')) return <AlertTriangle className="h-4 w-4 text-amber-400" />;
        if (action.includes('PASSWORD') || action.includes('RESET')) return <Shield className="h-4 w-4 text-purple-400" />;
        if (action.includes('WEBAUTHN') || action.includes('PASSKEY')) return <Shield className="h-4 w-4 text-cyan-400" />;
        if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('CHANGE')) return <Activity className="h-4 w-4 text-yellow-400" />;
        return <Activity className="h-4 w-4 text-slate-400" />;
    };

    const getEventBadge = (action: string) => {
        if (action.includes('LOGIN_SUCCESS')) return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">AUTH</Badge>;
        if (action.includes('FAIL') || action.includes('ERROR') || action.includes('RATE_LIMIT')) return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">ALERT</Badge>;
        if (action.includes('CREATE') || action.includes('REGISTER') || action.includes('UPLOAD')) return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">CREATE</Badge>;
        if (action.includes('DELETE') || action.includes('REMOVE')) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">DELETE</Badge>;
        if (action.includes('PASSWORD') || action.includes('RESET')) return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">SECURITY</Badge>;
        if (action.includes('WEBAUTHN') || action.includes('PASSKEY')) return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">PASSKEY</Badge>;
        if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('CHANGE')) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">UPDATE</Badge>;
        if (action.includes('INTEL') || action.includes('DIRECTIVE')) return <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">INTEL</Badge>;
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">EVENT</Badge>;
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.details?.toLowerCase().includes(searchQuery.toLowerCase());

        if (filterType === 'ALL') return matchesSearch;
        if (filterType === 'AUTH') return matchesSearch && (log.action.includes('LOGIN') || log.action.includes('LOGOUT'));
        if (filterType === 'ALERT') return matchesSearch && (log.action.includes('FAIL') || log.action.includes('ERROR') || log.action.includes('RATE_LIMIT'));
        if (filterType === 'CREATE') return matchesSearch && (log.action.includes('CREATE') || log.action.includes('REGISTER') || log.action.includes('UPLOAD'));
        if (filterType === 'DELETE') return matchesSearch && (log.action.includes('DELETE') || log.action.includes('REMOVE'));
        if (filterType === 'SECURITY') return matchesSearch && (log.action.includes('PASSWORD') || log.action.includes('RESET') || log.action.includes('OTP'));
        if (filterType === 'PASSKEY') return matchesSearch && (log.action.includes('WEBAUTHN') || log.action.includes('PASSKEY'));
        if (filterType === 'UPDATE') return matchesSearch && (log.action.includes('UPDATE') || log.action.includes('EDIT') || log.action.includes('CHANGE'));
        if (filterType === 'INTEL') return matchesSearch && (log.action.includes('INTEL') || log.action.includes('DIRECTIVE'));
        return matchesSearch;
    });

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-wider uppercase text-white">
                                Iron<span className="text-emerald-400">Vault</span>
                            </span>
                        </div>

                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/hq/dashboard" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                HQ
                            </Link>
                            <Link href="/hq/personnel" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Personnel
                            </Link>
                            <Link href="/hq/warroom" className="text-amber-400 font-mono text-sm uppercase tracking-wider">
                                War Room
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 hover:text-white">
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-400">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Back Button */}
                <Link href="/hq/dashboard">
                    <Button variant="ghost" className="mb-6 text-slate-400 hover:text-white font-mono uppercase tracking-wider">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to HQ
                    </Button>
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                            <History className="h-8 w-8 text-amber-400" />
                            War Room
                        </h1>
                        <p className="text-slate-500 font-mono mt-1">Complete audit trail (Black Box)</p>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-800/50 border-slate-700 text-white font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {['ALL', 'AUTH', 'ALERT', 'CREATE', 'DELETE', 'SECURITY', 'PASSKEY', 'UPDATE', 'INTEL'].map((type) => (
                        <Button
                            key={type}
                            variant="outline"
                            size="sm"
                            onClick={() => setFilterType(type)}
                            className={`font-mono uppercase whitespace-nowrap ${filterType === type
                                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                    : 'border-slate-700 text-slate-400'
                                }`}
                        >
                            {type}
                        </Button>
                    ))}
                </div>

                {/* Logs Table */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <Activity className="h-5 w-5 text-amber-400" />
                            Security Events ({filteredLogs.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="text-center py-12">
                                <History className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 font-mono">No events found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800/50">
                                {filteredLogs.map((log, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors">
                                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                                            {getEventIcon(log.action)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-sm text-white font-bold">{log.action}</span>
                                                {getEventBadge(log.action)}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                                                <span>User: {log.username || 'Unknown'}</span>
                                                <span>IP: {log.ip_address || '-'}</span>
                                                {log.details && <span className="truncate">{log.details}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="flex items-center gap-1 text-xs font-mono text-slate-500">
                                                <Clock className="h-3 w-3" />
                                                {new Date(log.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
