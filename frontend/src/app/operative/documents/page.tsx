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
    Lock, AlertCircle, Check, Loader2, Download,
    Shield, AlertTriangle, Binary, Key, User
} from 'lucide-react';

export default function OperativeDocumentsPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [verificationResults, setVerificationResults] = useState<{[key: number]: { valid: boolean; message: string } | null}>({});
    const [verifying, setVerifying] = useState<{[key: number]: boolean}>({});
    const [expandedTokens, setExpandedTokens] = useState<{[key: number]: boolean}>({});

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const u = JSON.parse(stored);
        if (u.role !== 'operative') {
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

    const handleDownload = async (docId: number) => {
        const token = localStorage.getItem('token');
        const url = documentsApi.getDownloadUrl(docId);
        
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'document.pdf';
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to download document' });
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const getClassificationColor = (classification: string) => {
        switch (classification) {
            case 'TOP SECRET': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'SECRET': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'CONFIDENTIAL': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center border border-emerald-500/30">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-wider uppercase text-white">
                                Iron<span className="text-emerald-400">Vault</span>
                            </span>
                        </div>

                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/operative/vault" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Vault
                            </Link>
                            <Link href="/operative/intel" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Intel
                            </Link>
                            <Link href="/operative/documents" className="text-emerald-400 font-mono text-sm uppercase tracking-wider">
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
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                                <User className="h-4 w-4 text-emerald-400" />
                                <span className="text-sm font-mono text-emerald-400">{user?.username}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-400">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                            <FileText className="h-8 w-8 text-emerald-400" />
                            Classified Documents
                        </h1>
                        <p className="text-slate-500 font-mono mt-1">View encrypted documents and verify signatures</p>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <Alert className={message.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-red-500/10 border-red-500/30'}>
                        {message.type === 'success' ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                        <AlertDescription className={message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                            {message.text}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Token Format Info */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <Lock className="h-5 w-5 text-cyan-400 mt-0.5" />
                            <div>
                                <h3 className="text-cyan-400 font-mono text-sm uppercase tracking-wider mb-1">Encrypted Token Format</h3>
                                <p className="text-slate-400 text-sm font-mono">
                                    Base64( <span className="text-blue-400">IV[16 bytes]</span> + <span className="text-amber-400">Signature[256 bytes]</span> + <span className="text-purple-400">Ciphertext</span> )
                                </p>
                                <p className="text-slate-500 text-xs mt-1">
                                    All documents are encrypted with AES-256-CBC and signed with RSA-2048-PSS for integrity verification.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents List */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <FileText className="h-5 w-5 text-emerald-400" />
                            Available Documents ({documents.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">No Documents</h3>
                                <p className="text-slate-500 font-mono">No classified documents available</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {documents.map((doc: any) => (
                                    <div key={doc.id} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="h-6 w-6 text-emerald-400" />
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
                                                        : '❌ TAMPERED - RSA-2048-PSS signature INVALID! Document has been modified.'}
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
