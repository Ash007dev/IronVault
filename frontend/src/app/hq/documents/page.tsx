'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { documentsApi } from '@/lib/api';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ShieldCheck, FileText, Moon, Sun, LogOut, ArrowLeft,
    Lock, AlertCircle, Check, Loader2, Crown, Download,
    Eye, Shield, AlertTriangle, FileKey, Binary, Key
} from 'lucide-react';

export default function HQDocumentsPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [verificationResults, setVerificationResults] = useState<{[key: number]: { valid: boolean; message: string } | null}>({});
    const [verifying, setVerifying] = useState<{[key: number]: boolean}>({});
    const [tampering, setTampering] = useState<{[key: number]: boolean}>({});
    const [resetting, setResetting] = useState<{[key: number]: boolean}>({});
    const [expandedTokens, setExpandedTokens] = useState<{[key: number]: boolean}>({});

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
        loadDocuments();
    }, [router]);

    const loadDocuments = async () => {
        try {
            const data = await documentsApi.getAll();
            setDocuments(data.documents || []);
        } catch (err) {
            console.error('Failed to load documents:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (docId: number) => {
        setVerifying(v => ({ ...v, [docId]: true }));
        try {
            const result = await documentsApi.verify(docId);
            setVerificationResults(r => ({
                ...r,
                [docId]: {
                    valid: result.signature_valid,
                    message: result.message
                }
            }));
        } catch (err) {
            setVerificationResults(r => ({
                ...r,
                [docId]: {
                    valid: false,
                    message: 'Verification failed'
                }
            }));
        } finally {
            setVerifying(v => ({ ...v, [docId]: false }));
        }
    };

    const handleTamper = async (docId: number) => {
        setTampering(t => ({ ...t, [docId]: true }));
        setVerificationResults(r => ({ ...r, [docId]: null })); // Clear previous result
        try {
            await documentsApi.tamper(docId);
            setMessage({ type: 'success', text: 'Document tampered! Click Verify to detect.' });
            // Reload to show updated data
            loadDocuments();
        } catch (err) {
            setMessage({ type: 'error', text: 'Tamper failed' });
        } finally {
            setTampering(t => ({ ...t, [docId]: false }));
        }
    };

    const handleReset = async (docId: number) => {
        setResetting(r => ({ ...r, [docId]: true }));
        setVerificationResults(r => ({ ...r, [docId]: null })); // Clear previous result
        try {
            await documentsApi.reset(docId);
            setMessage({ type: 'success', text: 'Document reset to original! Click Verify to confirm.' });
            // Reload to show updated data
            loadDocuments();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Reset failed' });
        } finally {
            setResetting(r => ({ ...r, [docId]: false }));
        }
    };

    const handleDownload = async (docId: number) => {
        const token = localStorage.getItem('token');
        const url = documentsApi.getDownloadUrl(docId);
        
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = documents.find(d => d.id === docId)?.filename || 'document.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            setMessage({ type: 'error', text: 'Download failed' });
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const getClassificationColor = (cls: string) => {
        switch (cls) {
            case 'TOP SECRET': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'SECRET': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'CONFIDENTIAL': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
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
                            <Link href="/hq/dashboard" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                HQ
                            </Link>
                            <Link href="/hq/personnel" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Personnel
                            </Link>
                            <Link href="/hq/documents" className="text-red-400 font-mono text-sm uppercase tracking-wider">
                                Documents
                            </Link>
                            <Link href="/hq/warroom" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                War Room
                            </Link>
                            <Link href="/profile" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Profile
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 hover:text-white">
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
                                <Crown className="h-4 w-4 text-red-400" />
                                <span className="text-sm font-mono text-red-400">COMMAND</span>
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
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/hq/dashboard">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                            <FileKey className="h-8 w-8 text-red-400" />
                            Document Vault
                        </h1>
                        <p className="text-slate-500 font-mono mt-1">Tamper detection & signature verification</p>
                    </div>
                </div>

                {/* Alerts */}
                {message && (
                    <Alert className={`mb-6 ${message.type === 'success' 
                        ? 'bg-amber-500/10 border-amber-500/30' 
                        : 'bg-red-500/10 border-red-500/30'}`}>
                        {message.type === 'success' ? (
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                        <AlertDescription className={message.type === 'success' ? 'text-amber-400' : 'text-red-400'}>
                            {message.text}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Encryption Format Info */}
                <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 mb-6">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <Key className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Encrypted Token Format</h3>
                                <div className="font-mono text-sm bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                                    <code className="text-emerald-400">Base64( </code>
                                    <code className="text-blue-400">IV[16 bytes]</code>
                                    <code className="text-slate-500"> + </code>
                                    <code className="text-amber-400">Signature[256 bytes]</code>
                                    <code className="text-slate-500"> + </code>
                                    <code className="text-purple-400">Ciphertext</code>
                                    <code className="text-emerald-400"> )</code>
                                </div>
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                    <p className="text-red-400 text-sm font-mono flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        TAMPER button modifies ciphertext WITHOUT updating the RSA signature - simulating an attack!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents List */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <FileText className="h-5 w-5 text-red-400" />
                            All Encrypted Documents ({documents.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">No Documents</h3>
                                <p className="text-slate-500 font-mono">COs have not uploaded any documents yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {documents.map((doc: any) => (
                                    <div key={doc.id} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="h-6 w-6 text-red-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <h3 className="font-bold text-white">{doc.title}</h3>
                                                        <Badge className={getClassificationColor(doc.classification)}>
                                                            {doc.classification}
                                                        </Badge>
                                                        {doc.is_tampered && (
                                                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                                                ⚠️ TAMPERED
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-500 text-sm font-mono mb-2">{doc.filename}</p>
                                                    {doc.description && (
                                                        <p className="text-slate-400 text-sm mb-2">{doc.description}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-500">
                                                        <span>Original: {doc.original_size} bytes</span>
                                                        <span className="text-blue-400">IV: {doc.encryption_info.iv_bytes}B</span>
                                                        <span className="text-amber-400">Sig: {doc.encryption_info.signature_bytes}B</span>
                                                        <span className="text-purple-400">CT: {doc.encryption_info.ciphertext_bytes}B</span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-1">
                                                        Uploaded by {doc.uploaded_by} • {new Date(doc.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex gap-2">
                                                    {doc.is_tampered ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleReset(doc.id)}
                                                            disabled={resetting[doc.id]}
                                                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase"
                                                        >
                                                            {resetting[doc.id] ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Check className="h-3 w-3 mr-1" />
                                                                    Reset
                                                                </>
                                                            )}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleTamper(doc.id)}
                                                            disabled={tampering[doc.id]}
                                                            className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs uppercase"
                                                        >
                                                            {tampering[doc.id] ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                                    Tamper
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleVerify(doc.id)}
                                                        disabled={verifying[doc.id]}
                                                        className="bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs uppercase"
                                                    >
                                                        {verifying[doc.id] ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Shield className="h-3 w-3 mr-1" />
                                                                Verify
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDownload(doc.id)}
                                                    className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                                                >
                                                    <Download className="h-3 w-3 mr-1" />
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        {/* Verification Result */}
                                        {verificationResults[doc.id] && (
                                            <Alert className={`mt-4 ${verificationResults[doc.id]?.valid 
                                                ? 'bg-emerald-500/10 border-emerald-500/30' 
                                                : 'bg-red-500/10 border-red-500/30'}`}>
                                                {verificationResults[doc.id]?.valid ? (
                                                    <Check className="h-4 w-4 text-emerald-400" />
                                                ) : (
                                                    <AlertTriangle className="h-4 w-4 text-red-400" />
                                                )}
                                                <AlertDescription className={verificationResults[doc.id]?.valid ? 'text-emerald-400' : 'text-red-400'}>
                                                    {verificationResults[doc.id]?.valid 
                                                        ? '✅ AUTHENTIC - RSA-2048-PSS signature verified. Document integrity confirmed.' 
                                                        : '❌ TAMPERED - RSA-2048-PSS signature INVALID! Ciphertext has been modified without authorization.'}
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {/* Show Token Button */}
                                        <div className="mt-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setExpandedTokens(prev => ({ ...prev, [doc.id]: !prev[doc.id] }))}
                                                className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 font-mono text-xs"
                                            >
                                                <Binary className="h-3 w-3 mr-2" />
                                                {expandedTokens[doc.id] ? 'Hide Token' : 'View Encrypted Token'}
                                            </Button>
                                            
                                            {expandedTokens[doc.id] && doc.encrypted_token && (
                                                <div className="mt-3 p-4 bg-slate-950 rounded-lg border border-cyan-500/20">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Key className="h-4 w-4 text-cyan-400" />
                                                        <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider">
                                                            Encrypted Token Format: Base64( IV[16] + Signature[256] + Ciphertext )
                                                        </span>
                                                    </div>
                                                    <div className="p-3 bg-slate-900/80 rounded font-mono text-xs break-all max-h-48 overflow-y-auto leading-relaxed">
                                                        <span className="text-blue-400">{doc.encrypted_token.substring(0, 24)}</span>
                                                        <span className="text-amber-400">{doc.encrypted_token.substring(24, 364)}</span>
                                                        <span className="text-purple-400">{doc.encrypted_token.substring(364)}</span>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-mono">
                                                        <span className="text-blue-400">🔵 IV: Bytes 0-15 (24 chars)</span>
                                                        <span className="text-amber-400">🟡 Signature: Bytes 16-271 (340 chars)</span>
                                                        <span className="text-purple-400">🟣 Ciphertext: Bytes 272+ (rest)</span>
                                                    </div>
                                                </div>
                                            )}
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
