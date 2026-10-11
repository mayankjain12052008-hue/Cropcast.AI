import { useState, useRef, useEffect } from 'react';
import { chatWithGemini, type ChatMessage } from '@/lib/gemini';
import { useTranslation } from '@/lib/LanguageContext';
import { Send, Loader2, Sparkles, Sprout, X, MessageSquare, Lightbulb, ShieldCheck } from 'lucide-react';

interface AIAssistantProps {
  context: {
    cropName: string;
    diseaseName: string;
    severity: string;
    pathogenType: string;
    weatherSummary: string;
    locationName: string;
  };
}

const SUGGESTED_QUESTIONS = [
  'gemini.suggestion1',
  'gemini.suggestion2',
  'gemini.suggestion3',
  'gemini.suggestion4',
];

export default function AIAssistant({ context }: AIAssistantProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendQuestion = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: question.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const reply = await chatWithGemini(newMessages, context);
      setMessages([...newMessages, { role: 'model', text: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('gemini.chatError');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-green-700 via-emerald-700 to-teal-800 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
            <Sprout className="h-6 w-6" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute h-3 w-3 animate-ping rounded-full bg-green-300 opacity-75" />
              <span className="relative h-3 w-3 rounded-full bg-green-300 ring-2 ring-green-800" />
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold tracking-tight">CropCast.AI</h3>
            <p className="text-[11px] text-green-200/90">{t('gemini.assistantDesc')}</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              title="Clear chat"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="max-h-80 min-h-[140px] space-y-3 overflow-y-auto bg-slate-50/80 p-4"
      >
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="relative mb-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 ring-1 ring-green-200">
                <Sprout className="h-7 w-7 text-green-600" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">{t('gemini.welcomeMsg')}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[240px]">{t('gemini.welcomeHint')}</p>
            <div className="mt-4 flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
              <span className="text-[11px] font-medium text-green-700">{t('gemini.poweredBy')}</span>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 to-emerald-700 text-white">
                <Sprout className="h-3.5 w-3.5" />
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-br-md shadow-sm shadow-green-600/20'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
              }`}
            >
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 to-emerald-700 text-white">
              <Sprout className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white border border-slate-200 px-4 py-3 shadow-sm">
              <span className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="text-xs text-slate-400">{t('gemini.thinking')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && !loading && (
        <div className="px-4 pb-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[11px] font-semibold text-slate-500">{t('gemini.suggestedQuestions')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((key) => (
              <button
                key={key}
                onClick={() => sendQuestion(t(key))}
                className="rounded-full border border-green-200 bg-green-50/60 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100 hover:border-green-300 active:scale-95"
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mb-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendQuestion(input); }}
            placeholder={t('gemini.inputPlaceholder')}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 focus:bg-white transition-colors"
          />
          <button
            onClick={() => sendQuestion(input)}
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 text-white shadow-md shadow-green-600/20 transition hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-slate-400 text-center">{t('gemini.disclaimer')}</p>
      </div>
    </div>
  );
}
