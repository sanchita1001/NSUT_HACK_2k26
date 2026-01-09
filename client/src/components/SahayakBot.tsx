"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Mic } from 'lucide-react';

export function SahayakBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', text: 'Namaste! I am PFMS Sahayak. Ask me about suspicious transactions or vendor history.' }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isTyping, isListening]);

    const handleSend = () => {
        if (!input.trim()) return;
        const newMsg: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, newMsg]);
        setInput("");
        setIsTyping(true);

        // Mock AI Response Logic
        setTimeout(() => {
            let response = "I can help with that. Please describe the specific scheme or vendor.";
            const lowerInput = newMsg.text.toLowerCase();

            if (lowerInput.includes("vendor") || lowerInput.includes("payment")) {
                response = "I found 3 vendors with similar names. 'Rural Infra Builders' (ID: VEN-882) has a high risk score of 88.";
            } else if (lowerInput.includes("scheme") || lowerInput.includes("fund")) {
                response = "PM-KISAN scheme utilization is 92%. However, distinct anomalies detected in Sitapur district.";
            } else if (lowerInput.includes("alert") || lowerInput.includes("fraud")) {
                response = "There are 2 critical alerts pending review in the last 24 hours.";
            } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
                response = "Namaste Officer! How can I assist you with fraud detection today?";
            }

            setMessages(prev => [...prev, { role: 'bot', text: response }]);
            setIsTyping(false);
        }, 1500);
    };

    const handleVoice = () => {
        setIsListening(true);
        setTimeout(() => {
            setIsListening(false);
            setInput("Show me high risk vendors in Lucknow");
        }, 2000); // Simulate 2s of listening
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-200 ease-in-out">
                    <div className="bg-blue-900 p-4 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Bot className="h-6 w-6 text-white" />
                            <span className="text-white font-bold">PFMS Sahayak</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-blue-200 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="h-96 overflow-y-auto p-4 bg-slate-50 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 text-gray-500 rounded-lg p-3 text-xs italic shadow-sm">
                                    Analyzing...
                                </div>
                            </div>
                        )}
                        {isListening && (
                            <div className="flex justify-end">
                                <div className="bg-red-100 text-red-600 border border-red-200 rounded-lg p-3 text-xs flex items-center shadow-sm animate-pulse">
                                    <Mic className="h-3 w-3 mr-2" />
                                    Listening...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 bg-white border-t border-gray-200 flex items-center space-x-2">
                        <button
                            onClick={handleVoice}
                            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isListening ? 'text-red-500' : 'text-gray-500'}`}
                            title="Voice Command"
                        >
                            <Mic className="h-5 w-5" />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 border-none focus:ring-0 text-sm bg-transparent"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-50"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-900 hover:bg-blue-800 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </button>
        </div>
    );
}
