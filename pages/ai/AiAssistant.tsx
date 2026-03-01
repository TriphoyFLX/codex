import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './AiAssistant.module.css';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

// --- ТИПЫ ДАННЫХ ---
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  imageUrl?: string;
}

// --- ИКОНКИ (SVG КОМПОНЕНТЫ) ---
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);
const AttachIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

// --- ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ---
const renderMath = (text: string) => {
  const fixedText = text.replace(/\\\[(.*?)\\\]/gs, '$$$1$$');
  const parts = fixedText.split(/(\$\$.*?\$\$|\$.*?\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$')) return <BlockMath key={i} math={part.slice(2, -2)} />;
    if (part.startsWith('$') && part.endsWith('$')) return <InlineMath key={i} math={part.slice(1, -1)} />;
    return part;
  });
};

const AiAvatar = () => <div className={styles.avatar}>🧞</div>;
const UserAvatar = () => <div className={`${styles.avatar} ${styles.userAvatar}`}>Д</div>;

const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
  const formatTime = (date: Date) => new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`${styles.message} ${message.isUser ? styles.userMessage : styles.aiMessage}`}>
      {!message.isUser && <AiAvatar />}
      <div className={styles.messageContent}>
        {message.imageUrl && <img src={message.imageUrl} alt="User upload" className={styles.messageImage} />}
        <div className={styles.messageText}>{renderMath(message.text)}</div>
        <div className={styles.messageTime}>{formatTime(message.timestamp)}</div>
      </div>
      {message.isUser && <UserAvatar />}
    </div>
  );
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---
const AiAssistant: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
  
    useEffect(() => {
      try {
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages).map((msg: Message) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
          setMessages(parsedMessages);
        } else {
          setMessages([{ id: '1', text: 'Привет! Я Джинн Знаний. Чем могу помочь сегодня?', isUser: false, timestamp: new Date() }]);
        }
      } catch (error) { console.error("Failed to parse messages from localStorage", error); }
    }, []);
  
    useEffect(() => {
      if (messages.length > 0) localStorage.setItem('chatMessages', JSON.stringify(messages));
    }, [messages]);
  
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
    
    useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [inputText]);
  
    const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          alert('Пожалуйста, выберите файл изображения.');
          return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    };
    
    const handleSendMessage = useCallback(async () => {
      if ((inputText.trim() === '' && !imageFile) || isTyping) return;
  
      const userMessage: Message = { id: Date.now().toString(), text: inputText, isUser: true, timestamp: new Date(), imageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined };
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setIsTyping(true);
  
      let apiMessageContent: any = [{ type: "text", text: inputText }];
      if (imageFile) {
        try {
          apiMessageContent.push({ type: "image_url", image_url: { url: await toBase64(imageFile) } });
        } catch (error) { console.error("Ошибка конвертации изображения:", error); setIsTyping(false); return; }
      }
  
      setImageFile(null);
      setImagePreview(null);
      
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", 
                  content: ` Ты — AI-ассистент "Джинн Знаний", помогающий ученику Диме. Твоя главная задача — объяснять материал, а не давать готовые ответы. *** ПРАВИЛА ФОРМАТИРОВАНИЯ (ОЧЕНЬ ВАЖНО!): 1.  ВСЕГДА используй LaTeX для математических формул, переменных и выражений. 2.  Оборачивай инлайн-формулы в ОДИНАРНЫЕ доллары: $ax^2 + bx + c = 0$. 3.  Оборачивай блочные (на отдельной строке) формулы в ДВОЙНЫЕ доллары: $$D = b^2 - 4ac$$. 4.  ЗАПРЕЩЕНО отправлять LaTeX-код без долларов. Это КРИТИЧЕСКИ важно. ПРИМЕРЫ: -   ПРАВИЛЬНО: Когда $a \ne 0$, уравнение является квадратным. -   НЕПРАВИЛЬНО: Когда a \ne 0, уравнение является квадратным. -   ПРАВИЛЬНО: Формула для дроби выглядит так: $$\\frac{a}{b}$$ -   НЕПРАВИЛЬНО: Формула для дроби выглядит так: \\frac{a}{b} *** КОНКРЕТНО ДЛЯ КВАДРАТНЫХ УРАВНЕНИЙ (вида $ax^2 + bx + c = 0$): Твой план ответа всегда должен быть таким: 1.  **Найти коэффициенты:** Попросить ученика определить $a$, $b$ и $c$. 2.  **Формула дискриминанта:** Напомнить формулу $$D = b^2 - 4ac$$. 3.  **Смысл дискриминанта:** Объяснить, что означает $D > 0$, $D = 0$ и $D < 0$. 4.  **Формулы корней:** Дать формулы $$x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}$$. 5.  **Предложение помощи:** Предложить вместе пройти все шаги. `, 
                },
                ...messages.slice(-10).map(m => ({ role: m.isUser ? "user" : "assistant", content: m.text })),
                { role: "user", content: apiMessageContent },
            ],
          }),
        });
  
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        
        const data = await response.json();
        const aiText = data?.choices?.[0]?.message?.content || "⚠️ Ошибка.";
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: aiText, isUser: false, timestamp: new Date() }]);
  
      } catch (error) {
        console.error("Ошибка запроса:", error);
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: "❌ Ошибка. Не удалось получить ответ.", isUser: false, timestamp: new Date() }]);
      } finally {
        setIsTyping(false);
      }
    }, [inputText, imageFile, messages, isTyping]);
  
    return (
        <div className={styles.container}>
            <div className={`${styles.overlay} ${isChatHistoryOpen ? styles.open : ''}`} onClick={() => setIsChatHistoryOpen(false)} />
            
            

            <main className={styles.chatArea}>
                <header className={styles.header}>
                    
                    <div className={styles.headerTitle}>
                        <AiAvatar />
                        <div>
                            <h1 className={styles.title}>Джинн Знаний</h1>
                            <div className={styles.status}>
                                <span className={styles.statusDot}></span>
                                Онлайн
                            </div>
                        </div>
                    </div>
                </header>

                <div className={styles.messagesContainer}>
                    {messages.map((message) => <MessageItem key={message.id} message={message} />)}
                    {isTyping && (
                        <div className={`${styles.message} ${styles.aiMessage}`}>
                            <AiAvatar />
                            <div className={styles.typingIndicator}>
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className={styles.inputContainer}>
                    {imagePreview && (
                        <div className={styles.imagePreviewContainer}>
                            <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                            <button onClick={() => { setImageFile(null); setImagePreview(null); }} className={styles.removeImageButton}><CloseIcon /></button>
                        </div>
                    )}
                    <div className={styles.inputWrapper}>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} accept="image/*" />
                        <button className={styles.iconButton} onClick={() => fileInputRef.current?.click()} aria-label="Attach file">
                            <AttachIcon />
                        </button>
                        <textarea
                            ref={textareaRef}
                            className={styles.textInput}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder="Спросите что-нибудь..."
                            rows={1}
                            disabled={isTyping}
                        />
                        <button className={styles.sendButton} onClick={handleSendMessage} disabled={(inputText.trim() === '' && !imageFile) || isTyping}>
                            <SendIcon />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
  
export default AiAssistant;