'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { intelApi } from '@/lib/api';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    ShieldCheck, Plus, Users, FileText, Radio, Target, Moon, Sun, LogOut,
    User, Lock, Send, Eye, Clock, AlertTriangle, Loader2, Briefcase,
    Rocket, AlertCircle, Check, Crown
} from 'lucide-react';

export default function CODashboard() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [directives, setDirectives] = useState<any[]>([]);
    const [operations, setOperations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showOperationDialog, setShowOperationDialog] = useState(false);
    const [operationData, setOperationData] = useState({ operative_name: '', budget_amount: '' });
    const [operationSubmitting, setOperationSubmitting] = useState(false);
    const [operationMessage, setOperationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const u = JSON.parse(stored);
        if (u.role !== 'co') {
            router.push('/');
            return;
        }
        setUser(u);
        loadDirectives();
        loadOperations();
    }, [router]);

    const loadDirectives = async () => {
        try {
            const data = await intelApi.getAll();
            setDirectives(data.intel || []);
        } catch (err) {
            console.error('Failed to load directives:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadOperations = async () => {
        try {
            const data = await intelApi.getOperations();
            setOperations(data.operations || []);
        } catch (err) {
            console.error('Failed to load operations:', err);
        }
    };

    const handleInitiateOperation = async (e: React.FormEvent) => {
        e.preventDefault();
        setOperationMessage(null);
        setOperationSubmitting(true);

        try {
            await intelApi.createOperation({
                operative_name: operationData.operative_name,
                budget_amount: parseFloat(operationData.budget_amount),
            });
            setOperationMessage({ type: 'success', text: 'Operation submitted for HQ approval!' });
            setOperationData({ operative_name: '', budget_amount: '' });
            loadOperations();
            setTimeout(() => {
                setShowOperationDialog(false);
                setOperationMessage(null);
            }, 2000);
        } catch (err) {
            setOperationMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to initiate operation' });
        } finally {
            setOperationSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

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
                            <Link href="/co/dashboard" className="text-amber-400 font-mono text-sm uppercase tracking-wider">
                                Command
                            </Link>
                            <Link href="/co/directives" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Directives
                            </Link>
                            <Link href="/co/documents" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Documents
                            </Link>
                            <Link href="/profile" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Profile
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 hover:text-white">
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                                <Briefcase className="h-4 w-4 text-amber-400" />
                                <span className="text-sm font-mono text-amber-400">{user?.username}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-400">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                            <Radio className="h-8 w-8 text-amber-400" />
                            Command Center
                        </h1>
                        <p className="text-slate-500 font-mono mt-1">Commanding Officer Operations</p>
                    </div>

                    <div className="flex gap-3">
                        <Dialog open={showOperationDialog} onOpenChange={setShowOperationDialog}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 font-mono uppercase tracking-wider">
                                    <Rocket className="h-4 w-4 mr-2" />
                                    Initiate Operation
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-white font-mono uppercase tracking-wider flex items-center gap-2">
                                        <Rocket className="h-5 w-5 text-purple-400" />
                                        Request HQ Approval
                                    </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleInitiateOperation} className="space-y-4 mt-4">
                                    {operationMessage && (
                                        <Alert className={operationMessage.type === 'success' 
                                            ? 'bg-emerald-500/10 border-emerald-500/30' 
                                            : 'bg-red-500/10 border-red-500/30'}>
                                            {operationMessage.type === 'success' ? (
                                                <Check className="h-4 w-4 text-emerald-400" />
                                            ) : (
                                                <AlertCircle className="h-4 w-4 text-red-400" />
                                            )}
                                            <AlertDescription className={operationMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                                                {operationMessage.text}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 font-mono text-xs uppercase tracking-wider">Operation Codename</Label>
                                        <Input
                                            value={operationData.operative_name}
                                            onChange={(e) => setOperationData({ ...operationData, operative_name: e.target.value })}
                                            placeholder="e.g., Operation Thunder"
                                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 font-mono"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 font-mono text-xs uppercase tracking-wider">Budget Amount ($)</Label>
                                        <Input
                                            type="number"
                                            value={operationData.budget_amount}
                                            onChange={(e) => setOperationData({ ...operationData, budget_amount: e.target.value })}
                                            placeholder="50000"
                                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 font-mono"
                                            required
                                        />
                                    </div>
                                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                                        <p className="text-xs text-purple-400 font-mono flex items-center gap-2">
                                            <Crown className="h-4 w-4" />
                                            This operation will be digitally signed and sent to HQ for approval
                                        </p>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            onClick={() => setShowOperationDialog(false)}
                                            className="flex-1 text-slate-400"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={operationSubmitting}
                                            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 font-mono uppercase"
                                        >
                                            {operationSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Link href="/co/directives">
                            <Button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 font-mono uppercase tracking-wider">
                                <Plus className="h-4 w-4 mr-2" />
                                Issue Directive
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{directives.length}</p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Active Directives</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Users className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">--</p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Operatives</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Target className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">--</p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Active Missions</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <Lock className="h-6 w-6 text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">AES-256</p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Encryption</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Directives */}
                <Card className="bg-slate-900/50 border-slate-800 mb-6">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <Send className="h-5 w-5 text-amber-400" />
                            Recent Directives
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                            </div>
                        ) : directives.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">No Directives</h3>
                                <p className="text-slate-500 font-mono mb-6">Issue your first directive to operatives</p>
                                <Link href="/co/directives">
                                    <Button className="bg-gradient-to-r from-amber-600 to-amber-700 font-mono uppercase">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Issue Directive
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {directives.slice(0, 5).map((directive: any) => (
                                    <div key={directive.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-amber-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white uppercase">{directive.strategy_name || directive.title}</h4>
                                                <p className="text-xs font-mono text-slate-500">
                                                    {new Date(directive.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                            Active
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pending Operations */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-purple-400" />
                            Operations (Awaiting HQ Approval)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {operations.length === 0 ? (
                            <div className="text-center py-8">
                                <Rocket className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">No Pending Operations</h3>
                                <p className="text-slate-500 font-mono text-sm">Initiate an operation to request HQ approval</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {operations.map((op: any) => (
                                    <div key={op.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                <Rocket className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white">{op.operative_name}</h4>
                                                <p className="text-xs font-mono text-slate-500">
                                                    Budget: ${op.budget_amount?.toLocaleString()} • {new Date(op.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {op.has_signature && (
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    Signed
                                                </Badge>
                                            )}
                                            <Badge className={
                                                op.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                op.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                            }>
                                                {op.status?.charAt(0).toUpperCase() + op.status?.slice(1) || 'Pending'}
                                            </Badge>
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
