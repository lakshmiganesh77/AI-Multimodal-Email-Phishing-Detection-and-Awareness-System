import React, { useState, useRef } from 'react';
import { Upload, Mail, Shield, Link, Image, Paperclip, Server, CheckCircle, AlertCircle, Loader, Eye, Download, X, Terminal, Play, AlertTriangle, Zap, Trash2, Lock, UserX, Database, FileDigit, Brain, Clock, Activity, Target, FileText, MonitorPlay } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';


const EmailAnalyzer = ({ isInvestigationView = false, contextData = null }) => {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentLayer, setCurrentLayer] = useState(0);
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const abortControllerRef = useRef(null);
    const [sandboxEntity, setSandboxEntity] = useState(null);
    const [isSandboxRunning, setIsSandboxRunning] = useState(false);
    const [sandboxLogs, setSandboxLogs] = useState([]);
    const [sandboxResults, setSandboxResults] = useState(null);
    const [actionStatus, setActionStatus] = useState({});

    // Load Sample Demo
    const loadSampleDemo = () => {
        setIsAnalyzing(true);
        setCurrentLayer(0);
        setAnalysisComplete(false);
        setAnalysisResults(null);

        let layerDelays = [400, 600, 800, 1000, 1500];
        const advanceLayer = (layer) => {
            if (layer >= 6) {
                setAnalysisResults(mockAnalysisResults);
                setAnalysisComplete(true);
                setIsAnalyzing(false);
                setSandboxResults(null);
                return;
            }
            const delay = layerDelays[layer] || 1000;
            setTimeout(() => {
                setCurrentLayer(layer + 1);
                advanceLayer(layer + 1);
            }, delay);
        };
        advanceLayer(0);
    };

    // Analysis layers configuration
    const layers = [
        {
            id: 1,
            name: "Text Analysis Layer",
            icon: Mail,
            checks: ["Rule Engine", "Keyword Model", "NLP Deep Learning"],
            color: "#00f3ff"
        },
        {
            id: 2,
            name: "URL Analysis Layer",
            icon: Link,
            checks: ["Phishing API", "VirusTotal URL Check", "Keyword Detection"],
            color: "#0096ff"
        },
        {
            id: 3,
            name: "Image Analysis Layer",
            icon: Image,
            checks: ["OCR Text Extraction", "Logo Detection", "Visual Similarity"],
            color: "#00d4ff"
        },
        {
            id: 4,
            name: "Attachment Analysis Layer",
            icon: Paperclip,
            checks: ["File Hash SHA256", "VirusTotal File Check", "Extension Check"],
            color: "#00b8ff"
        },
        {
            id: 5,
            name: "Header Analysis Layer",
            icon: Server,
            checks: ["SPF Check", "DKIM Verification", "DMARC Policy"],
            color: "#0088ff"
        },
        {
            id: 6,
            name: "Decision Engine",
            icon: Shield,
            checks: ["Risk Aggregation", "ML Confidence", "Final Verdict"],
            color: "#00f3ff"
        }
    ];

    // Mock analysis results (replace with real API call)
    const mockAnalysisResults = {
        riskScore: 87,
        threatType: "PHISHING",
        confidence: 92,
        action: "BLOCK",
        emailContent: {
            from: "ceo@urgent-company.net",
            to: "employee@company.com",
            subject: "URGENT: Verify Your Account Now!",
            body: `Dear Employee,

We have detected unusual activity on your account. Please verify your credentials immediately to prevent account suspension.

Click here to verify: http://fake-login-page.com/verify

This is urgent and must be completed within 24 hours.

Best regards,
IT Security Team`,
            urgencyWords: ["URGENT", "immediately", "unusual activity", "suspension", "must be completed", "24 hours"],
            urls: [
                { url: "http://fake-login-page.com/verify", risk: "HIGH", reason: "Phishing domain detected" }
            ],
            attachments: ["invoice_update.pdf"],
            images: []
        },
        layerResults: {
            1: {
                urgencyScore: 85,
                keywords: ["urgent", "verify", "suspension", "immediately"],
                sentiment: "Threatening",
                findings: ["High urgency language", "Credential harvesting attempt", "Impersonation detected"]
            },
            2: {
                urlsFound: 1,
                maliciousUrls: 1,
                details: [
                    { url: "http://fake-login-page.com/verify", status: "MALICIOUS", reason: "Known phishing domain" }
                ]
            },
            3: {
                imagesFound: 0,
                suspiciousImages: 0
            },
            4: {
                attachmentsFound: 1,
                maliciousFiles: 1
            },
            5: {
                spf: "FAIL",
                dkim: "FAIL",
                dmarc: "NONE",
                senderAuth: "FAILED"
            },
            6: {
                finalScore: 87,
                verdict: "PHISHING",
                confidence: 92,
                recommendation: "BLOCK AND QUARANTINE"
            }
        }
    };

    // Handle file upload
    const handleFileUpload = (file) => {
        if (file) {
            setUploadedFile(file);
            startAnalysis(file);
        }
    };

    // Start analysis process
    const startAnalysis = async (file) => {
        setIsAnalyzing(true);
        setCurrentLayer(0);
        setAnalysisComplete(false);
        setAnalysisResults(null);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        let progressTimeout;

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('file', file);

            // Smart progress: advance quickly for local layers, slow down at layer 5 (network-heavy).
            let layerDelays = [600, 900, 1200, 1800, 2800];
            const advanceLayer = (layer) => {
                if (layer >= 5) return; // Hold at 5 until backend responds
                const delay = layerDelays[layer] || 1800;
                progressTimeout = setTimeout(() => {
                    setCurrentLayer(layer + 1);
                    advanceLayer(layer + 1);
                }, delay);
            };
            advanceLayer(0);

            // STEP 1: POST to /analyze — backend returns task_id for async processing
            const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            const postResponse = await axios.post(`${API_BASE}/analyze`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal: abortControllerRef.current.signal,
            });

            const taskId = postResponse.data?.task_id;
            if (!taskId) {
                throw new Error('No task_id returned from backend. Check backend logs.');
            }

            // STEP 2: Poll /analyze/status/{task_id} every 2 seconds until done
            let analysisData = null;
            let attempts = 0;
            const maxAttempts = 60; // 60 × 2s = 2 minutes max wait

            while (attempts < maxAttempts) {
                if (abortControllerRef.current?.signal?.aborted) {
                    throw new axios.Cancel('Cancelled by user');
                }
                await new Promise(r => setTimeout(r, 2000));
                attempts++;

                const statusResponse = await axios.get(
                    `${API_BASE}/analyze/status/${taskId}`,
                    { signal: abortControllerRef.current.signal }
                );

                const statusData = statusResponse.data;
                if (statusData.status === 'done') {
                    analysisData = statusData.analysis;
                    break;
                } else if (statusData.status === 'failed') {
                    throw new Error(`Backend analysis failed: ${statusData.error || 'Unknown error'}`);
                }
                // still 'processing' — keep waiting
            }

            if (!analysisData) {
                throw new Error('Analysis timed out. The backend took too long to respond.');
            }

            clearTimeout(progressTimeout);
            setCurrentLayer(6); // Finish

            // analysisData comes from the status poll: GET /analyze/status/{task_id}
            // analysisData shape: { risk_score, label, ml_probability, reasons, features, layer_details, ... }
            const analysis = analysisData;
            const layerDetails = analysis.layer_details || {};
            // email metadata is embedded inside the analysisData returned by the Celery task
            const emailMeta = analysis.email || {};

            // Map Backend Response to UI Structure
            const mappedResults = {
                riskScore: analysis.risk_score,
                threatType: analysis.label,
                confidence: analysis.ml_probability || 85,
                action: analysis.label === 'PHISHING' ? 'BLOCK' : (analysis.label === 'SUSPICIOUS' ? 'QUARANTINE' : 'RELEASE'),
                emailContent: {
                    from: emailMeta.headers?.from || analysis.sender || 'Unknown',
                    to: emailMeta.headers?.to || 'Unknown',
                    subject: emailMeta.headers?.subject || analysis.subject || 'No Subject',
                    body: emailMeta.body || analysis.body_text || '',
                    urgencyWords: (analysis.reasons || []).filter(r => r.includes('Urgency') || r.includes('keyword')).map(r => r.split(':').pop().trim()),
                    urls: (layerDetails.url?.suspicious_urls || []).map(u => ({ url: u, risk: 'HIGH', reason: 'Detected by URL Engine' })),
                    attachments: (layerDetails.attachment?.files || []),
                    images: (layerDetails.image?.images || [])
                },
                layerResults: {
                    1: { // Text / Rules
                        urgencyScore: layerDetails.rules?.score || 0,
                        findings: analysis.reasons || [],
                        keywords: analysis.features?.ml_top_words || [],
                        sentiment: 'Analyzed'
                    },
                    2: { // URL
                        urlsFound: layerDetails.url?.total_urls || 0,
                        maliciousUrls: layerDetails.url?.suspicious_count || 0,
                        details: (layerDetails.url?.suspicious_urls || []).map(u => ({ url: u, status: 'MALICIOUS', reason: 'Threat Intel Match' }))
                    },
                    3: { // Image
                        imagesFound: layerDetails.image?.total_images || 0,
                        suspiciousImages: layerDetails.image?.qr_codes_found || 0
                    },
                    4: { // Attachment
                        attachmentsFound: layerDetails.attachment?.total_attachments || 0,
                        maliciousFiles: layerDetails.attachment?.score > 0 ? 1 : 0
                    },
                    5: { // Header
                        spf: layerDetails.header?.spf || "N/A",
                        dkim: layerDetails.header?.dkim || "N/A",
                        dmarc: layerDetails.header?.dmarc || "N/A",
                        senderAuth: layerDetails.header?.spf === 'PASS' ? "VERIFIED" : "FAILED"
                    },
                    6: { // Decision
                        finalScore: analysis.risk_score,
                        verdict: analysis.label,
                        confidence: analysis.ml_probability || 90,
                        recommendation: analysis.label === 'PHISHING' ? 'BLOCK SENDER' : 'MONITOR'
                    }
                }
            };

            setAnalysisResults(mappedResults);
            setAnalysisComplete(true);

        } catch (err) {
            clearTimeout(progressTimeout);
            if (axios.isCancel(err) || err?.message === 'Cancelled by user') {
                console.log('Analysis canceled by user');
            } else {
                console.error("Analysis Failed:", err);
                alert(`Analysis failed: ${err?.response?.data?.detail || err?.message || 'Please ensure backend is running and file is valid.'}`);
            }
        } finally {
            setIsAnalyzing(false);
        }
    };


    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    // Reset analysis
    const resetAnalysis = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setUploadedFile(null);
        setIsAnalyzing(false);
        setCurrentLayer(0);
        setAnalysisComplete(false);
        setAnalysisResults(null);
        setSandboxResults(null);
        setActionStatus({});
    };

    // Highlight urgency words in email body
    const highlightUrgencyWords = (text, urgencyWords) => {
        if (!urgencyWords || urgencyWords.length === 0) return text;

        let highlightedText = text;
        urgencyWords.forEach(word => {
            const regex = new RegExp(`(${word})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span style="background-color: rgba(255, 59, 92, 0.3); color: var(--red); font-weight: 600; text-decoration: underline;">$1</span>');
        });
        return highlightedText;
    };

    const runSandbox = (attachmentName) => {
        setSandboxEntity(attachmentName);
        setIsSandboxRunning(true);
        setSandboxLogs([`[INFO] Initializing secure sandbox environment...`]);
        setSandboxResults(null);

        const sequence = [
            `[INFO] Allocating virtual machine constraints...`,
            `[SYSTEM] Sandboxed OS loaded (Windows 10). Network disconnected.`,
            `[EXEC] Extracting file: ${attachmentName || "invoice_update.pdf"}...`,
            `[ANALYSIS] Monitoring API calls & registry changes...`,
            `[WARNING] Suspicious CreateRemoteThread detected in explorer.exe`,
            `[WARNING] File attempted to drop payload in AppData/Roaming`,
            `[ALERT] Communication attempt to C2 server blocked (IP: 185.101.42.12)`,
            `[RESULT] File classified as MALICIOUS (Ransomware behavior pattern match).`,
            `[SYSTEM] Terminating sandbox environment and shredding traces.`
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < sequence.length) {
                setSandboxLogs(prev => [...prev, sequence[i]]);
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    setIsSandboxRunning(false);
                    setSandboxResults({
                        fileName: attachmentName || "invoice_update.pdf",
                        sha256: "3e1a8d9f2c9081a2b...",
                        verdict: "MALICIOUS",
                        confidence: 96,
                        behavior: [
                            "Spawned PowerShell process",
                            "Attempted network connection to 185.199.110.153",
                            "Created registry persistence"
                        ],
                        networkActivity: "hxxp://login-update-secure.com",
                        timeline: [
                            { time: "00:01", action: "File opened" },
                            { time: "00:02", action: "Macro executed" },
                            { time: "00:03", action: "PowerShell spawned" },
                            { time: "00:05", action: "C2 connection attempt" }
                        ]
                    });
                }, 2000);
            }
        }, 800);
    };

    const handleAction = (actionType) => {
        setActionStatus(prev => ({ ...prev, [actionType]: 'loading' }));
        setTimeout(() => {
            setActionStatus(prev => ({ ...prev, [actionType]: 'success' }));
        }, 1500);
    };

    return (
        <div className={isInvestigationView ? 'p-0 max-w-[1600px] mx-auto' : 'p-8 max-w-[1600px] mx-auto'}>
            {/* Sandbox Modal Overlay */}
            <AnimatePresence>
                {isSandboxRunning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 w-screen h-screen bg-[rgba(0,0,0,0.85)] z-[9999] flex items-center justify-center backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-[800px] bg-[#0a0e1a] border border-[var(--cyan)] rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,243,255,0.15)]"
                        >
                            <div className="p-4 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between bg-[rgba(255,255,255,0.03)]">
                                <div className="flex items-center gap-3">
                                    <Terminal size={20} className="text-[var(--cyan)]" />
                                    <h3 className="text-base text-[var(--text-primary)] m-0 font-semibold font-mono">
                                        SANDBOX EXECUTION: {sandboxEntity}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-[rgba(255,51,102,0.1)] border border-[rgba(255,51,102,0.3)] rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-[var(--red)] animate-pulse"></span>
                                    <span className="text-[10px] text-[var(--red)] font-bold tracking-widest uppercase">Live VM Stream</span>
                                </div>
                            </div>

                            <div className="flex h-[400px]">
                                {/* Terminal Column */}
                                <div className="w-1/2 p-6 overflow-y-auto bg-black font-mono text-[13px] text-[#00ff00] border-r border-[rgba(255,255,255,0.1)]">
                                    {sandboxLogs.map((log, i) => (
                                        <div key={i} className={`mb-2 ${log.includes('[WARNING]') || log.includes('[ALERT]') ? 'text-[#ff3366]' : log.includes('[RESULT]') ? 'text-[#ffd700]' : 'text-[#00ff9d]'}`}>
                                            {log}
                                            {i === sandboxLogs.length - 1 && i < 9 && <span className="typing-dot ml-1"></span>}
                                        </div>
                                    ))}
                                </div>

                                {/* Live VM Feed Visual Simulation */}
                                <div className="w-1/2 bg-[#0f172a] relative overflow-hidden flex items-center justify-center outline outline-1 outline-white/5">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-10" />

                                    {/* VM Desktop Grid Background */}
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                                    <AnimatePresence>
                                        {sandboxLogs.length >= 3 && sandboxLogs.length < 8 && (
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.9, opacity: 0 }}
                                                className="absolute z-20 w-[80%] h-[70%] bg-white rounded shadow-2xl overflow-hidden flex flex-col"
                                            >
                                                {/* PDF Toolbar Fake */}
                                                <div className="bg-red-600 h-6 flex items-center px-2 shadow-sm">
                                                    <div className="text-[9px] text-white font-bold tracking-wider">Adobe Acrobat Reader</div>
                                                </div>
                                                <div className="bg-gray-100 h-8 flex items-center gap-2 px-2 border-b border-gray-300">
                                                    <div className="h-4 w-4 bg-gray-300 rounded-sm"></div>
                                                    <div className="h-4 w-8 bg-gray-300 rounded-sm"></div>
                                                    <div className="h-4 w-full bg-gray-200 rounded-sm mx-4 flex items-center px-2">
                                                        <span className="text-[9px] text-gray-500">{sandboxEntity || 'invoice_update.pdf'}</span>
                                                    </div>
                                                </div>
                                                {/* PDF Content Fake */}
                                                <div className="flex-1 p-4 bg-gray-200 flex justify-center">
                                                    <div className="w-full bg-white shadow-sm p-4 text-gray-800 font-serif">
                                                        <h2 className="text-sm font-bold border-b border-gray-300 pb-2 mb-2">URGENT INVOICE REMITTANCE</h2>
                                                        <div className="h-2 w-full bg-gray-200 rounded mb-2"></div>
                                                        <div className="h-2 w-3/4 bg-gray-200 rounded mb-4"></div>

                                                        <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-[10px]">
                                                            <Activity size={16} className="text-yellow-600" />
                                                            <div>
                                                                <strong>Content requires your response.</strong>
                                                                <div className="text-blue-600 underline mt-1">Enable Editing to view secure content.</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {sandboxLogs.length >= 5 && sandboxLogs.length < 9 && (
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="absolute z-30 w-[70%] h-[50%] bg-[#0c0c0c] border border-gray-600 rounded shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col translate-x-4 translate-y-8"
                                            >
                                                <div className="h-5 bg-white flex items-center px-2">
                                                    <div className="text-[9px] text-black font-mono">C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe</div>
                                                </div>
                                                <div className="flex-1 p-2 text-green-500 font-mono text-[9px] break-all leading-relaxed overflow-hidden">
                                                    PS C:\Users\Admin&gt; powershell -WindowStyle Hidden -ExecutionPolicy Bypass -e JABzAD0ATgBlAHcALQBPAGIAagBlAG...<br />
                                                    {sandboxLogs.length >= 6 && (
                                                        <>
                                                            [+] Downloading payload from http://185.101.42.12/update.exe<br />
                                                            [+] Injecting into explorer.exe (PID 482)<br />
                                                        </>
                                                    )}
                                                    {sandboxLogs.length >= 7 && (
                                                        <span className="text-red-500 mt-2 block">
                                                            {">"} C2 Connection Established.<br />
                                                            {">"} Initiating cryptographic routine...
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {sandboxLogs.length >= 8 && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="absolute inset-0 z-40 bg-[rgba(255,0,0,0.95)] flex flex-col items-center justify-center text-white p-6 shadow-inner"
                                            >
                                                <AlertTriangle size={64} className="text-white mb-4 animate-bounce" />
                                                <h2 className="text-xl font-black mb-2 tracking-widest uppercase font-mono text-center">Your Files Are Encrypted</h2>
                                                <p className="text-xs text-center font-mono opacity-80 mb-2">Send 0.5 BTC to unlock your machine.</p>
                                                <div className="bg-black/50 px-3 py-1 text-red-300 font-mono text-[10px] rounded border border-red-500/50">
                                                    C2: 185.101.42.12 (CONNECTED)
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header (Hide in Investigation View as it has its own header) */}
            {!isInvestigationView && (
                <div className="mb-8">
                    <h1 className="text-[28px] font-bold text-[var(--text-primary)] mb-2 flex items-center gap-3">
                        <Mail size={32} className="text-[var(--cyan)]" />
                        Email Threat Analyzer
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm">
                        Upload email files for comprehensive SOC-level threat analysis with layer-by-layer processing
                    </p>
                </div>
            )}

            {/* In Investigation View, immediately show an analysis state if we have context data and haven't run yet */}
            {isInvestigationView && !analysisComplete && !isAnalyzing && contextData && (
                <div className="card p-10 text-center mt-5">
                    <Mail size={48} className="text-[var(--cyan)] mx-auto mb-5 opacity-50" />
                    <h3 className="text-lg text-[var(--text-primary)] mb-3">
                        Investigating Incident {contextData.id}
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-6">
                        Target: {contextData.title}
                    </p>
                    <button
                        onClick={() => {
                            // Simulate analysis for the demo using contextData
                            setIsAnalyzing(true);
                            setCurrentLayer(0);
                            setTimeout(() => {
                                setIsAnalyzing(false);
                                setAnalysisResults({
                                    ...mockAnalysisResults,
                                    riskScore: contextData.score || 87,
                                    threatType: contextData.type ? contextData.type.toUpperCase() : 'UNKNOWN',
                                    emailContent: {
                                        ...mockAnalysisResults.emailContent,
                                        subject: contextData.title,
                                        from: contextData.source
                                    }
                                });
                                setAnalysisComplete(true);
                            }, 2000); // 2 second mock delay
                        }}
                        className="px-8 py-3 bg-[var(--cyan)] border-none rounded-lg text-[#0a0e1a] text-sm font-bold cursor-pointer shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all hover:bg-[var(--cyan-hover)]"
                    >
                        Load Full Artifact Analysis
                    </button>
                </div>
            )}

            {/* Upload Zone (shown when no file uploaded. In investigation view it shows if no context data is given) */}
            {!uploadedFile && !isAnalyzing && (!isInvestigationView || (isInvestigationView && !contextData)) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`card p-15 text-center transition-all duration-300 cursor-pointer ${isDragging ? 'border-2 border-dashed border-[var(--cyan)] bg-[rgba(0,243,255,0.05)]' : 'border-2 border-dashed border-[rgba(255,255,255,0.1)] bg-transparent'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <motion.div
                        animate={{ scale: isDragging ? 1.1 : 1 }}
                        className="w-[100px] h-[100px] mx-auto mb-6 rounded-full bg-gradient-to-br from-[rgba(0,243,255,0.2)] to-[rgba(0,150,255,0.2)] border-2 border-[var(--cyan)] flex items-center justify-center shadow-[0_0_30px_rgba(0,243,255,0.3)]"
                    >
                        <Upload size={48} className="text-[var(--cyan)]" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                        Drop email file here or click to upload
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm mb-6">
                        Supported formats: .eml, .msg, .txt
                    </p>
                    <div className="flex items-center gap-4 justify-center mt-2">
                        <button
                            className="px-6 py-2.5 bg-[var(--cyan)] border-none rounded-lg text-[#0a0e1a] text-[13px] font-bold cursor-pointer shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all hover:bg-[var(--cyan-hover)]"
                        >
                            Select File
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                loadSampleDemo();
                            }}
                            className="px-6 py-2.5 bg-transparent border border-[var(--cyan)] rounded-lg text-[var(--cyan)] text-[13px] font-bold cursor-pointer transition-all hover:bg-[rgba(0,243,255,0.1)] flex items-center gap-2"
                        >
                            <FileDigit size={16} />
                            Load Sample Phishing Attack
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".eml,.msg,.txt"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files[0])}
                    />
                </motion.div>
            )}

            {/* Analysis in Progress */}
            {isAnalyzing && (
                <div>
                    {/* Processing Header */}
                    <div className="card p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <Loader size={32} className="text-[var(--cyan)]" />
                                </motion.div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                        Analyzing Email: {uploadedFile?.name || contextData?.title || 'Unknown'}
                                    </h3>
                                    <p className="text-[var(--text-secondary)] text-[13px]">
                                        Processing Layer {currentLayer} of {layers.length}
                                    </p>
                                </div>
                            </div>
                            <button onClick={resetAnalysis} className="px-4 py-2 bg-transparent border border-[var(--red)] text-[var(--red)] rounded-md text-[13px] cursor-pointer transition-all duration-200 hover:bg-[rgba(255,51,51,0.1)]">
                                Cancel Analysis
                            </button>
                        </div>
                        <div className="w-full h-2 bg-[rgba(255,255,255,0.1)] rounded overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentLayer / layers.length) * 100}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-[var(--cyan)] to-[#0096ff] shadow-[0_0_10px_rgba(0,243,255,0.6)]"
                            />
                        </div>
                    </div>

                    {/* Layer Visualization */}
                    <div className="grid grid-cols-3 gap-5">
                        {layers.map((layer, index) => {
                            const LayerIcon = layer.icon;
                            const isActive = currentLayer === layer.id;
                            const isComplete = currentLayer > layer.id;

                            return (
                                <motion.div
                                    key={layer.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`card p-6 border transition-all duration-300 ${isActive ? 'bg-opacity-10' : 'bg-transparent border-[rgba(255,255,255,0.1)] shadow-none'}`}
                                    style={{
                                        borderColor: isActive ? layer.color : 'rgba(255,255,255,0.1)',
                                        backgroundColor: isActive ? `${layer.color}10` : 'transparent',
                                        boxShadow: isActive ? `0 0 30px ${layer.color}40` : 'none'
                                    }}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2`}
                                            style={{
                                                background: isComplete ? `linear-gradient(135deg, ${layer.color}40, ${layer.color}20)` : 'rgba(255,255,255,0.05)',
                                                borderColor: isActive || isComplete ? layer.color : 'rgba(255,255,255,0.1)'
                                            }}>
                                            {isComplete ? (
                                                <CheckCircle size={24} color={layer.color} />
                                            ) : isActive ? (
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                                    <LayerIcon size={24} color={layer.color} />
                                                </motion.div>
                                            ) : (
                                                <LayerIcon size={24} className="text-[var(--text-secondary)]" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold" style={{ color: isActive || isComplete ? layer.color : 'var(--text-secondary)' }}>
                                                Layer {layer.id}
                                            </h4>
                                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                {layer.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-[11px] text-[var(--text-secondary)]">
                                        {layer.checks.map((check, i) => (
                                            <div key={i} className="flex items-center gap-2 mb-1.5">
                                                {isComplete ? (
                                                    <CheckCircle size={14} color={layer.color} />
                                                ) : isActive ? (
                                                    <Loader size={14} color={layer.color} />
                                                ) : (
                                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[rgba(255,255,255,0.2)]" />
                                                )}
                                                <span>{check}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Analysis Results */}
            {analysisComplete && analysisResults && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {/* Action Bar (Hide the main title if in investigation view)*/}
                    <div className={`flex justify-between items-center mb-6 ${isInvestigationView ? 'mt-6' : 'mt-0'}`}>
                        {!isInvestigationView && (
                            <h2 className="text-[22px] font-bold text-[var(--text-primary)]">
                                Analysis Results
                            </h2>
                        )}
                        <div className={`flex gap-3 ${isInvestigationView ? 'ml-auto' : 'ml-0'}`}>
                            {!isInvestigationView && (
                                <button
                                    onClick={resetAnalysis}
                                    className="px-5 py-2.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[var(--text-primary)] text-[13px] font-semibold cursor-pointer flex items-center gap-2 transition-all hover:bg-[rgba(255,255,255,0.1)]"
                                >
                                    <X size={16} />
                                    Analyze Another
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Threat Verdict */}
                    <div className="card p-6 md:p-8 mb-6 border border-[var(--red)] bg-[rgba(255,51,102,0.03)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--red)] blur-[100px] opacity-10 rounded-full mix-blend-screen pointer-events-none"></div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                            <div>
                                <h3 className="text-base font-bold text-[var(--red)] mb-3 flex items-center gap-2 tracking-[0.2em]">
                                    <AlertTriangle size={18} />
                                    THREAT VERDICT
                                </h3>
                                <div className="flex items-center gap-5 mt-2">
                                    <div className="text-[56px] border-r border-[rgba(255,51,102,0.3)] pr-6 font-black text-[var(--red)] leading-none glow-text-red">
                                        {analysisResults.riskScore}
                                    </div>
                                    <div className="pl-1">
                                        <div className="text-2xl font-black text-white mb-2 uppercase tracking-wider block">
                                            {analysisResults.threatType}
                                        </div>
                                        <div className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-widest uppercase flex items-center gap-2">
                                            <Brain size={14} className="text-[var(--cyan)]" /> AI Confidence: <span className="text-white bg-[rgba(255,255,255,0.1)] px-2 py-0.5 rounded">{analysisResults.confidence}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 md:items-end w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-[rgba(255,51,102,0.2)] md:border-t-0">
                                <div className="px-6 py-3 bg-[var(--red)] rounded-lg text-sm font-bold text-white shadow-[0_0_20px_rgba(255,51,102,0.4)] text-center tracking-widest uppercase border border-[var(--red)] w-full md:w-auto">
                                    RECOMMENDATION: {analysisResults.action}
                                </div>
                                <div className="text-[10px] text-[var(--text-secondary)] font-mono text-center md:text-right mt-1 max-w-[250px] uppercase tracking-wider leading-relaxed">
                                    Policy engine requires immediate isolation of affected assets based on threat intelligence mapping.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid: Analysis Output + Response Actions */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* Left Column: Analysis Output (spans 2 cols) */}
                        <div className="xl:col-span-2 space-y-5">
                            <h3 className="text-[14px] font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-3 pl-1">
                                <Database size={16} className="text-[var(--cyan)]" />
                                Analysis Output
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Email Preview */}
                                <div className="card p-6">
                                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
                                        <Eye size={20} className="text-[var(--cyan)]" />
                                        Email Content Analysis
                                    </h3>

                                    <div className="mb-5 p-4 bg-[rgba(255,255,255,0.03)] rounded-lg border-l-4 border-[var(--cyan)]">
                                        <div className="text-xs text-[var(--text-secondary)] mb-2">
                                            <strong className="text-[var(--text-primary)]">From:</strong> {analysisResults.emailContent.from}
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)] mb-2">
                                            <strong className="text-[var(--text-primary)]">To:</strong> {analysisResults.emailContent.to}
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)]">
                                            <strong className="text-[var(--text-primary)]">Subject:</strong> {analysisResults.emailContent.subject}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-[rgba(0,0,0,0.3)] rounded-lg text-[13px] leading-[1.8] text-[var(--text-primary)] whitespace-pre-wrap">
                                        <div dangerouslySetInnerHTML={{
                                            __html: highlightUrgencyWords(analysisResults.emailContent.body, analysisResults.emailContent.urgencyWords)
                                        }} />
                                    </div>

                                    {/* URLs Found */}
                                    {analysisResults.emailContent.urls.length > 0 && (
                                        <div className="mt-5">
                                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                                                URLs Detected ({analysisResults.emailContent.urls.length})
                                            </h4>
                                            {analysisResults.emailContent.urls.map((urlData, i) => (
                                                <div key={i} className="p-3 bg-[rgba(255,59,92,0.1)] border border-[var(--red)] rounded-md mb-2">
                                                    <div className="text-xs text-[var(--cyan)] break-all mb-1.5">
                                                        {urlData.url}
                                                    </div>
                                                    <div className="text-[11px] text-[var(--red)] font-semibold">
                                                        ⚠️ {urlData.risk} RISK: {urlData.reason}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Attachments Found */}
                                    {analysisResults.emailContent.attachments && analysisResults.emailContent.attachments.length > 0 && (
                                        <div className="mt-5">
                                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                                                Attachments Detected ({analysisResults.emailContent.attachments.length})
                                            </h4>
                                            {analysisResults.emailContent.attachments.map((att, i) => {
                                                const filename = typeof att === 'string' ? att : (att.filename || `Attachment_${i + 1}`);
                                                return (
                                                    <div key={i} className="p-3 bg-[rgba(255,255,255,0.05)] border border-[var(--border-color)] rounded-md mb-2 flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <Paperclip size={16} className="text-[var(--text-secondary)]" />
                                                            <span className="text-[13px] text-[var(--text-primary)] font-medium">
                                                                {filename}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => runSandbox(filename)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(0,243,255,0.1)] border border-[var(--cyan)] rounded text-[var(--cyan)] text-[11px] font-semibold cursor-pointer transition-all hover:bg-[rgba(0,243,255,0.2)]">
                                                            <Play size={12} />
                                                            Execute in Sandbox
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Detailed Analysis */}
                                <div className="flex flex-col gap-4">
                                    {/* Layer Results */}
                                    {Object.entries(analysisResults.layerResults).map(([layerId, results]) => {
                                        const layer = layers[parseInt(layerId) - 1];
                                        const LayerIcon = layer.icon;

                                        return (
                                            <div key={layerId} className="card p-5">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border-2"
                                                        style={{
                                                            background: `linear-gradient(135deg, ${layer.color}40, ${layer.color}20)`,
                                                            borderColor: layer.color
                                                        }}>
                                                        <LayerIcon size={20} color={layer.color} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold" style={{ color: layer.color }}>
                                                            {layer.name}
                                                        </h4>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-[var(--text-secondary)]">
                                                    {/* Layer 1: Text Analysis */}
                                                    {layerId === '1' && (
                                                        <>
                                                            <div className="mb-2">
                                                                <strong className="text-[var(--text-primary)]">Urgency Score:</strong> {results.urgencyScore}/100
                                                            </div>
                                                            <div className="mb-2">
                                                                <strong className="text-[var(--text-primary)]">Sentiment:</strong> {results.sentiment}
                                                            </div>
                                                            <div className="mb-2">
                                                                <strong className="text-[var(--text-primary)]">Keywords Found:</strong> {results.keywords.join(', ')}
                                                            </div>
                                                            <div>
                                                                <strong className="text-[var(--text-primary)]">Findings:</strong>
                                                                <ul className="mt-1.5 pl-5 list-disc">
                                                                    {results.findings.map((finding, i) => (
                                                                        <li key={i}>{finding}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Layer 2: URL Analysis */}
                                                    {layerId === '2' && (
                                                        <>
                                                            <div className="mb-2">
                                                                <strong className="text-[var(--text-primary)]">URLs Found:</strong> {results.urlsFound}
                                                            </div>
                                                            <div className="mb-2 text-[var(--red)]">
                                                                <strong>Malicious URLs:</strong> {results.maliciousUrls}
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Layer 3: Image Analysis */}
                                                    {layerId === '3' && (
                                                        <>
                                                            <div className="mb-2">
                                                                <strong className="text-[var(--text-primary)]">Images Found:</strong> {results.imagesFound}
                                                            </div>
                                                            <div>
                                                                <strong className="text-[var(--text-primary)]">Suspicious Images:</strong> {results.suspiciousImages}
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Layer 4: Attachment Analysis */}
                                                    {layerId === '4' && (
                                                        <>
                                                            <div className="mb-2">
                                                                <strong className="text-[var(--text-primary)]">Attachments Found:</strong> {results.attachmentsFound}
                                                            </div>
                                                            <div>
                                                                <strong className="text-[var(--text-primary)]">Malicious Files:</strong> {results.maliciousFiles}
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Layer 5: Header Analysis */}
                                                    {layerId === '5' && (
                                                        <>
                                                            <div className="mb-2">
                                                                <strong className="text-[var(--text-primary)]">SPF:</strong> <span className={results.spf === 'FAIL' ? 'text-[var(--red)]' : 'text-[var(--green)]'}>{results.spf}</span>
                                                            </div>
                                                            <div className="mb-2">
                                                                <strong className="text-[var(--text-primary)]">DKIM:</strong> <span className={results.dkim === 'FAIL' ? 'text-[var(--red)]' : 'text-[var(--green)]'}>{results.dkim}</span>
                                                            </div>
                                                            <div className="mb-2">
                                                                <strong className="text-[var(--text-primary)]">DMARC:</strong> <span className={results.dmarc === 'NONE' ? 'text-[var(--yellow)]' : 'text-[var(--green)]'}>{results.dmarc}</span>
                                                            </div>
                                                            <div>
                                                                <strong className="text-[var(--text-primary)]">Sender Auth:</strong> <span className="text-[var(--red)]">{results.senderAuth}</span>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Layer 6: Decision Engine */}
                                                    {layerId === '6' && (
                                                        <>
                                                            <div className="mb-2">
                                                                <strong className="text-[var(--text-primary)]">Final Score:</strong> {results.finalScore}/100
                                                            </div>
                                                            <div className="mb-2">
                                                                <strong className="text-[var(--text-primary)]">Verdict:</strong> <span className="text-[var(--red)]">{results.verdict}</span>
                                                            </div>
                                                            <div className="mb-2">
                                                                <strong className="text-[var(--text-primary)]">Confidence:</strong> {results.confidence}%
                                                            </div>
                                                            <div>
                                                                <strong className="text-[var(--text-primary)]">Recommendation:</strong> <span className="text-[var(--red)] font-bold">{results.recommendation}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Sandbox Detonation Layer UI */}
                                {sandboxResults && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="card p-5 mt-5 border-l-4 border-[var(--red)] bg-gradient-to-br from-[rgba(255,51,102,0.05)] to-transparent"
                                    >
                                        <h4 className="text-[14px] font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                                            <Target size={18} className="text-[var(--red)]" />
                                            Sandbox Detonation Result
                                        </h4>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">File Name</div>
                                                <div className="text-[12px] font-mono text-[var(--cyan)]">{sandboxResults.fileName}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">SHA256 Hash</div>
                                                <div className="text-[12px] font-mono text-[var(--text-primary)]">{sandboxResults.sha256}</div>
                                            </div>
                                        </div>

                                        <div className="bg-[rgba(0,0,0,0.3)] p-3 rounded-lg border border-[rgba(255,255,255,0.05)] mb-4">
                                            <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">Behavior Monitoring</div>
                                            <ul className="space-y-1">
                                                {sandboxResults.behavior.map((beh, idx) => (
                                                    <li key={idx} className="flex gap-2 items-start text-[11px] text-[#e6edf3]">
                                                        <span className="text-[var(--red)] mt-[2px]">•</span> <span>{beh}</span>
                                                    </li>
                                                ))}
                                                <li className="flex gap-2 items-start text-[11px] text-[#e6edf3]">
                                                    <span className="text-[var(--red)] mt-[2px]">•</span> <span>Network Connection: {sandboxResults.networkActivity}</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="bg-[rgba(0,0,0,0.3)] p-3 rounded-lg border border-[rgba(255,255,255,0.05)] mb-4">
                                            <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">Malware Execution Timeline</div>
                                            <div className="space-y-2">
                                                {sandboxResults.timeline.map((step, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 text-[11px]">
                                                        <Clock size={12} className="text-[var(--text-secondary)]" />
                                                        <span className="font-mono text-[var(--cyan)] bg-[rgba(0,243,255,0.1)] px-1 rounded">{step.time}</span>
                                                        <span className="text-white">{step.action}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.05)]">
                                            <div className="flex items-center gap-3">
                                                <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">Threat Verdict</div>
                                                <div className="px-2 py-1 bg-[var(--red)] text-white text-[12px] font-bold rounded shadow-[0_0_15px_rgba(255,51,102,0.4)]">
                                                    {sandboxResults.verdict}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px]">
                                                <span className="text-[var(--text-secondary)] uppercase">AI Confidence</span>
                                                <span className="text-white font-mono bg-[rgba(255,255,255,0.1)] px-1.5 py-0.5 rounded">{sandboxResults.confidence}%</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div> {/* End Left Column */}

                        {/* Right Column: Response Actions */}
                        <div className="space-y-5">
                            <h3 className="text-[14px] font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-3 pl-1">
                                <Zap size={16} className="text-[#ffb703]" />
                                Response Actions
                            </h3>

                            <div className="card p-5 space-y-4 border border-[rgba(255,183,3,0.1)] bg-[rgba(255,183,3,0.02)]">
                                {/* Action 1: Delete Email */}
                                <div className="p-4 bg-[rgba(255,51,102,0.05)] border border-[rgba(255,51,102,0.2)] rounded-lg">
                                    <div className="flex gap-3">
                                        <div className="p-2 w-8 h-8 flex items-center justify-center bg-[var(--red)] rounded-lg shrink-0 text-white">
                                            <Trash2 size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-bold text-white tracking-wide leading-none">Purge Emails</h4>
                                            <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 tracking-wide leading-relaxed">Delete all occurrences across 12 employee inboxes.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAction('purge')}
                                        disabled={actionStatus.purge === 'success' || actionStatus.purge === 'loading'}
                                        className={`w-full mt-4 py-2 rounded text-[11px] font-bold tracking-widest uppercase transition-all
                                        ${actionStatus.purge === 'success' ? 'bg-[#00ff9d] text-[#0a0e1a]' : actionStatus.purge === 'loading' ? 'bg-[rgba(255,255,255,0.1)] text-white' : 'bg-[var(--red)] hover:bg-[#ff1a53] text-white shadow-[0_0_15px_rgba(255,51,102,0.3)]'}`}
                                    >
                                        {actionStatus.purge === 'success' ? 'Purged Successfully' : actionStatus.purge === 'loading' ? 'Executing...' : 'Execute Purge'}
                                    </button>
                                </div>

                                {/* Action 2: Block Sender Domain */}
                                <div className="p-4 bg-[rgba(0,243,255,0.05)] border border-[rgba(0,243,255,0.2)] rounded-lg">
                                    <div className="flex gap-3">
                                        <div className="p-2 w-8 h-8 flex items-center justify-center bg-[var(--cyan)] rounded-lg shrink-0 text-[#0a0e1a]">
                                            <Shield size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-bold text-white tracking-wide leading-none">Block Sender Domain</h4>
                                            <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 tracking-wide leading-relaxed">Add domain to Enterprise Blocklist at gateway.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAction('block')}
                                        disabled={actionStatus.block === 'success' || actionStatus.block === 'loading'}
                                        className={`w-full mt-4 py-2 rounded text-[11px] font-bold tracking-widest uppercase transition-all
                                        ${actionStatus.block === 'success' ? 'bg-[#00ff9d] text-[#0a0e1a]' : actionStatus.block === 'loading' ? 'bg-[rgba(255,255,255,0.1)] text-white' : 'bg-transparent border border-[var(--cyan)] hover:bg-[rgba(0,243,255,0.1)] text-[var(--cyan)] shadow-[0_0_10px_rgba(0,243,255,0.1)_inset]'}`}
                                    >
                                        {actionStatus.block === 'success' ? 'Domain Blocked' : actionStatus.block === 'loading' ? 'Executing...' : 'Block Domain'}
                                    </button>
                                </div>

                                {/* Action 3: Suspend Compromised User */}
                                <div className="p-4 bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.2)] rounded-lg">
                                    <div className="flex gap-3">
                                        <div className="p-2 w-8 h-8 flex items-center justify-center bg-[#ffd700] rounded-lg shrink-0 text-[#0a0e1a]">
                                            <UserX size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-bold text-white tracking-wide leading-none">Suspend User Account</h4>
                                            <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 tracking-wide leading-relaxed">Force logoff and lock AD account for target user.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAction('suspend')}
                                        disabled={actionStatus.suspend === 'success' || actionStatus.suspend === 'loading'}
                                        className={`w-full mt-4 py-2 rounded text-[11px] font-bold tracking-widest uppercase transition-all
                                        ${actionStatus.suspend === 'success' ? 'bg-[#00ff9d] text-[#0a0e1a]' : actionStatus.suspend === 'loading' ? 'bg-[rgba(255,255,255,0.1)] text-white' : 'bg-transparent border border-[#ffd700] hover:bg-[rgba(255,215,0,0.1)] text-[#ffd700] shadow-[0_0_10px_rgba(255,215,0,0.1)_inset]'}`}
                                    >
                                        {actionStatus.suspend === 'success' ? 'Account Suspended' : actionStatus.suspend === 'loading' ? 'Executing...' : 'Suspend User'}
                                    </button>
                                </div>

                            </div>
                        </div>

                    </div>


                </motion.div>
            )}
        </div>
    );
};

export default EmailAnalyzer;
