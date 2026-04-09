import React, { useEffect, useId, useRef, useState } from 'react';
import { X, Send, Loader2, ShieldCheck } from 'lucide-react';
import api, { classifyApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const GEMINI_MARK_SIZES = {
    large: 28,
    header: 18,
    small: 14
};

const GeminiMark = ({ size = 'small' }) => {
    const pixelSize = GEMINI_MARK_SIZES[size] || GEMINI_MARK_SIZES.small;
    const gradientId = useId();

    return (
        <svg
            width={pixelSize}
            height={pixelSize}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={gradientId} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4285f4" />
                    <stop offset="30%" stopColor="#9b72cb" />
                    <stop offset="60%" stopColor="#d96570" />
                    <stop offset="100%" stopColor="#f4b400" />
                </linearGradient>
            </defs>
            <path
                d="M12 24L10.4285 15.8953C10.166 14.7648 9.2312 13.8407 8.12581 13.5905L0.000373053 12L8.12581 10.4095C9.2312 10.1593 10.166 9.23519 10.4285 8.10468L12 0L13.5714 8.10468C13.834 9.23519 14.7687 10.1593 15.8741 10.4095L24 12L15.8741 13.5905C14.7687 13.8407 13.834 14.7648 13.5714 15.8953L12 24Z"
                fill={`url(#${gradientId})`}
            />
        </svg>
    );
};

const Chatbot = ({ email }) => {
    const { logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            addBotMessage('Hello, I am Gemini AI. I can explain why an email was flagged and help with phishing awareness.');
        }
    }, [isOpen]);

    const addBotMessage = (text) => {
        setMessages((prev) => [...prev, { type: 'bot', text, timestamp: new Date() }]);
    };

    const addUserMessage = (text) => {
        setMessages((prev) => [...prev, { type: 'user', text, timestamp: new Date() }]);
    };

    const sendMessageToBackend = async (message) => {
        try {
            setIsLoading(true);

            const response = await api.post('/chat', {
                message,
                email_id: email?.id || null
            });

            addBotMessage(response.data.response);
        } catch (error) {
            const apiError = classifyApiError(error);
            if (apiError.kind === 'unauthorized') {
                logout(apiError.message);
                return;
            }
            addBotMessage(apiError.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => {
        if (!inputValue.trim() || isLoading) return;
        addUserMessage(inputValue);
        sendMessageToBackend(inputValue);
        setInputValue('');
    };

    const handleQuickAction = (question) => {
        if (isLoading) return;
        addUserMessage(question);
        sendMessageToBackend(question);
    };

    const quickActions = [
        'Give me a walkthrough',
        'Why is this flagged?',
        'Train me',
        'Help'
    ];

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={floatingButtonStyle}
                    aria-label="Open Gemini AI chat"
                    title="Open Gemini AI"
                >
                    <div style={floatingInnerStyle}>
                        <GeminiMark size="large" />
                    </div>
                </button>
            )}

            {isOpen && (
                <div style={panelStyle}>
                    <div style={headerStyle}>
                        <div style={headerLeftStyle}>
                            <div style={logoBadgeStyle}>
                                <GeminiMark size="header" />
                            </div>
                            <div>
                                <div style={headerTitleStyle}>Gemini AI</div>
                                <div style={headerSubtitleStyle}>Security assistant for phishing analysis</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={closeButtonStyle}
                            aria-label="Close chat"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div style={contextBannerStyle}>
                        <ShieldCheck size={14} />
                        <span>{email?.subject ? `Context linked to: ${email.subject}` : 'General phishing help mode'}</span>
                    </div>

                    <div style={messagesStyle}>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                                    alignItems: 'flex-end',
                                    gap: '10px'
                                }}
                            >
                                {msg.type === 'bot' && (
                                    <div style={miniBadgeStyle}>
                                        <GeminiMark size="small" />
                                    </div>
                                )}
                            <div
                                style={{
                                    ...messageBubbleStyle,
                                    ...(msg.type === 'user' ? userBubbleStyle : botBubbleStyle)
                                }}
                            >
                                    <div style={messageTextStyle}>{renderMessageContent(msg.text)}</div>
                                    <div style={messageMetaStyle}>
                                        {msg.type === 'user' ? 'You' : 'Gemini'}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '10px' }}>
                                <div style={miniBadgeStyle}>
                                    <GeminiMark size="small" />
                                </div>
                                <div style={{ ...messageBubbleStyle, ...botBubbleStyle, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Loader2 size={16} style={{ animation: 'spin 1.2s linear infinite', color: '#3b82f6' }} />
                                    <span style={{ fontSize: '13px', color: '#5b6474' }}>Gemini is thinking...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {messages.length < 3 && !isLoading && (
                        <div style={quickActionsWrapStyle}>
                            <div style={quickActionsLabelStyle}>Quick prompts</div>
                            <div style={quickActionsGridStyle}>
                                {quickActions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleQuickAction(action)}
                                        style={quickActionStyle}
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={inputWrapStyle}>
                        <div style={inputShellStyle}>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask Gemini AI why this email looks risky..."
                                disabled={isLoading}
                                style={inputStyle}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                                style={{
                                    ...sendButtonStyle,
                                    opacity: inputValue.trim() && !isLoading ? 1 : 0.5,
                                    cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default'
                                }}
                                aria-label="Send message"
                            >
                                <Send size={17} />
                            </button>
                        </div>
                    </div>

                    <style>{`
                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}
        </>
    );
};

const floatingButtonStyle = {
    position: 'fixed',
    bottom: '28px',
    right: '28px',
    width: '68px',
    height: '68px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.96) 0%, rgba(237,244,255,0.94) 45%, rgba(215,229,255,0.9) 100%)',
    border: '1px solid rgba(191, 219, 254, 0.95)',
    cursor: 'pointer',
    boxShadow: '0 16px 28px rgba(96, 165, 250, 0.28), 0 0 0 6px rgba(219, 234, 254, 0.45), inset 0 1px 0 rgba(255,255,255,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: 0
};

const floatingInnerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
    textShadow: '0 1px 2px rgba(0,0,0,0.08)'
};

const panelStyle = {
    position: 'fixed',
    bottom: '122px',
    right: '28px',
    width: '400px',
    height: '620px',
    background: 'linear-gradient(180deg, #f9fbff 0%, #eef4ff 100%)',
    borderRadius: '24px',
    boxShadow: '0 28px 60px rgba(15, 23, 42, 0.26)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 2000,
    overflow: 'hidden',
    border: '1px solid rgba(148, 163, 184, 0.24)'
};

const headerStyle = {
    background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 55%, #60a5fa 100%)',
    color: 'white',
    padding: '18px 18px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
};

const headerLeftStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
};

const logoBadgeStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.28)'
};

const headerTitleStyle = {
    fontWeight: 700,
    fontSize: '16px',
    lineHeight: 1.1
};

const headerSubtitleStyle = {
    fontSize: '11px',
    opacity: 0.92,
    marginTop: '4px'
};

const closeButtonStyle = {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: 'white',
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const contextBannerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'rgba(59, 130, 246, 0.08)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
    color: '#355070',
    fontSize: '12px',
    fontWeight: 500
};

const messagesStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '18px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    background: 'linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)'
};

const miniBadgeStyle = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.96) 0%, rgba(237,244,255,0.94) 45%, rgba(215,229,255,0.9) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 6px 12px rgba(59, 130, 246, 0.16)'
};

const messageBubbleStyle = {
    maxWidth: '82%',
    padding: '12px 14px 10px',
    borderRadius: '18px',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)'
};

const botBubbleStyle = {
    backgroundColor: 'rgba(255,255,255,0.92)',
    color: '#1f2937',
    border: '1px solid rgba(203, 213, 225, 0.65)',
    borderBottomLeftRadius: '6px'
};

const userBubbleStyle = {
    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    color: 'white',
    borderBottomRightRadius: '6px'
};

const messageTextStyle = {
    fontSize: '14px',
    lineHeight: '1.55',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
};

const messageMetaStyle = {
    marginTop: '8px',
    fontSize: '11px',
    opacity: 0.6,
    fontWeight: 600
};

const quickActionsWrapStyle = {
    padding: '14px 16px',
    borderTop: '1px solid rgba(148, 163, 184, 0.18)',
    background: 'rgba(255,255,255,0.5)'
};

const quickActionsLabelStyle = {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: '10px'
};

const quickActionsGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px'
};

const quickActionStyle = {
    textAlign: 'left',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(148, 163, 184, 0.24)',
    borderRadius: '14px',
    fontSize: '12px',
    color: '#1d4ed8',
    cursor: 'pointer',
    fontWeight: '600',
    boxShadow: '0 6px 14px rgba(15, 23, 42, 0.04)'
};

const inputWrapStyle = {
    padding: '14px 16px 16px',
    borderTop: '1px solid rgba(148, 163, 184, 0.18)',
    background: 'rgba(255,255,255,0.82)'
};

const inputShellStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    borderRadius: '18px',
    background: 'white',
    border: '1px solid rgba(148, 163, 184, 0.24)',
    boxShadow: '0 8px 18px rgba(15, 23, 42, 0.05)'
};

const inputStyle = {
    flex: 1,
    padding: '10px 12px',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#1f2937',
    backgroundColor: 'transparent'
};

const sendButtonStyle = {
    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    color: 'white',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)'
};

const renderMessageContent = (text) => {
    const cleanText = (text || '').replace(/\[RISK_METER:\d+\]\s*/g, '').trim();
    const lines = cleanText.split('\n');

    return lines.map((line, index) => {
        if (!line.trim()) {
            return <div key={index} style={{ height: '8px' }} />;
        }

        return (
            <div key={index} style={{ marginBottom: '6px' }}>
                {renderInlineFormatting(line)}
            </div>
        );
    });
};

const renderInlineFormatting = (line) => {
    const parts = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<React.Fragment key={key++}>{line.slice(lastIndex, match.index)}</React.Fragment>);
        }

        const token = match[0];
        if (token.startsWith('**') && token.endsWith('**')) {
            parts.push(
                <strong key={key++} style={{ fontWeight: 700 }}>
                    {token.slice(2, -2)}
                </strong>
            );
        } else if (token.startsWith('*') && token.endsWith('*')) {
            parts.push(
                <span key={key++} style={{ fontStyle: 'italic' }}>
                    {token.slice(1, -1)}
                </span>
            );
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
        parts.push(<React.Fragment key={key++}>{line.slice(lastIndex)}</React.Fragment>);
    }

    return parts;
};

export default Chatbot;
