import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, Sparkles, User, Palette, Briefcase, 
  ShoppingBag, ChevronRight, Play, CheckCircle, Lock, 
  Menu, X, Share2, Info, Star, Heart, TrendingUp,
  ScanFace, Wand2, Layers, ArrowRight, Download,
  MapPin, Sun, Moon, Aperture, MoveHorizontal, Eye,
  BookOpen, Video, FileText, Unlock, Settings, 
  CreditCard, Crown, Check, ShieldCheck, Dumbbell, Grid,
  Search, Globe, Map, Zap, Facebook, Instagram, Twitter, Linkedin,
  RotateCw, ZoomIn, PartyPopper, CalendarHeart, Smartphone, Home, Compass, Shirt, RefreshCw, Lightbulb, Scissors,
  Bell, Bookmark, Sliders
} from 'lucide-react';
import * as GeminiService from './services/geminiService';

/**
 * VIZUHALIZANDO - AI Image Consultant App
 * Ready to Market Version 1.0 (PWA Enabled)
 */

// --- Tipos & Interfaces ---

type ViewState = 
  | 'onboarding' 
  | 'upload' 
  | 'analyzing' 
  | 'paywall'
  | 'pricing'
  | 'dashboard' 
  | 'look-generator' 
  | 'look-result'
  | 'assistant';

type PlanTier = 'free' | 'premium' | 'pro';

interface UserProfile {
  name: string;
  email?: string;
  image: string | null; // Original uploaded image
  rotation?: number; 
  analyzed: boolean;
  skinTone?: string;
  faceShape?: string;
  season?: string;
  palette?: string[]; // Persisted color palette
  contrast?: 'Baixo' | 'Médio' | 'Alto';
  traits?: string[];
  description?: string;
  lightingGuide?: string; // Iconometria/Light suggestion
  visagismTips?: string[]; // Visagism tips
  
  // Usage tracking for Free plan
  looksGenerated: number;
}

interface GeneratedLookData {
  id: string;
  objective: string;
  titulo: string;
  detalhes: string;
  environment?: string;
  items: string[];
  tips: string;
  imagePlaceholder: string;
}

// --- Dados dos Planos (Billing) ---
const PLANS = {
  monthly: [
    {
      id: 'free',
      name: 'Free',
      price: 'R$ 0',
      period: '/mês',
      features: ['Análise de Rosto e Cores', '1 Look Contextualizado', 'Acesso ao Perfil Visual'],
      cta: 'Plano Atual',
      highlight: false,
      tier: 'free'
    },
    {
      id: 'premium_monthly',
      name: 'Premium',
      price: 'R$ 39',
      period: '/mês',
      features: ['Looks Ilimitados', 'Objetivos Avançados (Encontros, Trabalho)', 'Exportação HD', 'Histórico Visual Salvo'],
      cta: 'Assinar Premium',
      highlight: true,
      tier: 'premium'
    }
  ],
  annual: [
     {
      id: 'free_annual',
      name: 'Free',
      price: 'R$ 0',
      period: '/mês',
      features: ['Análise de Rosto e Cores', '1 Look Contextualizado', 'Acesso ao Perfil Visual'],
      cta: 'Plano Atual',
      highlight: false,
      tier: 'free'
    },
    {
      id: 'premium_annual',
      name: 'Premium Anual',
      price: 'R$ 29,90',
      period: '/mês',
      subtext: 'R$ 349/ano (Economize 25%)',
      features: ['Tudo do Premium', 'Prioridade no Suporte', 'Acesso antecipado a novos recursos'],
      cta: 'Assinar Anual',
      highlight: true,
      tier: 'premium'
    }
  ]
};

const SEASONS: Record<string, { colors: string[], description: string, icon: string }> = {
  'Inverno Brilhante': { 
    colors: ['#000000', '#FFFFFF', '#E60026', '#1F3A93', '#8E44AD'], 
    description: 'Cores frias, intensas e puras. Alto contraste é sua marca.',
    icon: '❄️'
  },
  'Verão Suave': { 
    colors: ['#7B8CA3', '#ECECEE', '#9EA8C9', '#D98E96', '#A094B7'], 
    description: 'Cores frias, suaves e opacas. Elegância discreta e fluida.',
    icon: '☀️'
  },
  'Outono Profundo': { 
    colors: ['#4B2E1E', '#D4AF37', '#9E3C28', '#2E523A', '#6D2121'], 
    description: 'Cores quentes, escuras e terrosas. Sofisticação natural.',
    icon: '🍂'
  },
  'Primavera Clara': { 
    colors: ['#FEF5E7', '#F4D03F', '#F39C12', '#7DCEA0', '#3498DB'], 
    description: 'Cores quentes, claras e vibrantes. Energia e acessibilidade.',
    icon: '🌸'
  },
};

const LOOK_OBJECTIVES = [
  { id: 'work', label: 'Trabalho', icon: Briefcase, desc: 'Looks para credibilidade.', environmentContext: 'Escritório moderno e sofisticado', premium: false, iconEmoji: '💼' },
  { id: 'date', label: 'Encontro', icon: CalendarHeart, desc: 'Romântico e moderno.', environmentContext: 'Restaurante intimista à luz de velas', premium: true, iconEmoji: '🥂' },
  { id: 'date_night', label: 'Date Night', icon: CalendarHeart, desc: 'Romântico e moderno.', environmentContext: 'Restaurante intimista à luz de velas', premium: true, iconEmoji: '🌙' },
  { id: 'party', label: 'Festa', icon: PartyPopper, desc: 'Brilho e sofisticação.', environmentContext: 'Lounge noturno sofisticado', premium: true, iconEmoji: '✨' },
  { id: 'casual', label: 'Casual', icon: User, desc: 'Estilo no dia a dia.', environmentContext: 'Rua urbana elegante com café ao fundo', premium: false, iconEmoji: '☕' },
  { id: 'formal', label: 'Gala', icon: Crown, desc: 'Luxo e elegância.', environmentContext: 'Salão de baile clássico luxuoso', premium: true, iconEmoji: '🏛️' },
];

// --- Componentes UI Reutilizáveis ---

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled = false, ...props }: any) => {
  const baseStyle = "flex items-center justify-center px-6 py-3.5 rounded-xl font-medium transition-all duration-300 transform active:scale-95 shadow-sm select-none";
  const variants = {
    primary: "bg-vizu-dark text-white hover:bg-slate-800 disabled:bg-slate-300",
    secondary: "bg-white text-vizu-dark border border-gray-200 hover:bg-gray-50",
    gradient: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-200/50",
    premium: "bg-vizu-gold text-vizu-dark shadow-lg shadow-vizu-gold/30 hover:brightness-110",
    outline: "bg-transparent border border-gray-300 text-vizu-dark hover:bg-gray-50",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 shadow-none"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </button>
  );
};

const Logo = ({ className = "h-8" }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 5L20 35L30 5" stroke="#1A1A2E" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 5L20 20L24 5" stroke="#C5A572" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="font-serif font-bold text-xl text-vizu-dark tracking-tight">Vizuhalizando</span>
  </div>
);

// --- Landing Page Components ---

const Navbar = ({ onLogin, onInstall, canInstall }: { onLogin: () => void, onInstall?: () => void, canInstall?: boolean }) => (
  <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto w-full z-50 relative bg-white/50 backdrop-blur-sm sticky top-0 border-b border-gray-100">
    <Logo />
    <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
      <a href="#benefits" className="hover:text-vizu-gold transition-colors">Benefícios</a>
      <a href="#how-it-works" className="hover:text-vizu-gold transition-colors">Como Funciona</a>
      <a href="#pricing" className="hover:text-vizu-gold transition-colors">Planos</a>
    </div>
    <div className="flex items-center space-x-4">
      {canInstall && (
        <Button variant="ghost" onClick={onInstall} className="hidden md:flex px-4 py-2 text-vizu-dark font-bold">
          <Smartphone className="w-4 h-4 mr-2" />
          Instalar App
        </Button>
      )}
      <Button variant="ghost" onClick={onLogin} className="hidden md:flex px-4 py-2">Entrar</Button>
      <Button variant="primary" onClick={onLogin} className="px-5 py-2 text-sm">Experimentar Grátis</Button>
    </div>
  </nav>
);

const Hero = ({ onStart }: { onStart: () => void }) => (
  <section className="relative pt-20 pb-32 overflow-hidden bg-vizu-bg">
    <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-[600px] h-[600px] bg-vizu-gold/10 rounded-full blur-[100px]" />
    <div className="absolute bottom-0 left-0 translate-y-24 -translate-x-24 w-[500px] h-[500px] bg-vizu-dark/5 rounded-full blur-[100px]" />
    
    <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-vizu-gold/30 text-vizu-dark text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
        <Sparkles className="w-3 h-3 mr-2 text-vizu-gold" /> Powered by Gemini 3.0
      </div>
      <h1 className="text-5xl md:text-7xl font-serif font-bold text-vizu-dark mb-6 leading-tight">
        Seu estilo explicado pela ciência.<br />
        <span className="text-vizu-gold italic">Agora com Inteligência Artificial.</span>
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
        Descubra as cores, modelagens e looks que realmente combinam com seu rosto, sua pele e sua intenção — visualizados na sua própria foto.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button variant="primary" onClick={onStart} className="w-full sm:w-auto text-lg px-8 bg-vizu-dark text-white">
          Experimentar Grátis Agora
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="text-xs text-gray-400 mt-2 sm:mt-0 sm:absolute sm:-bottom-8">Leva menos de 3 minutos</p>
      </div>
      
      {/* Abstract UI Mockup */}
      <div className="mt-20 relative mx-auto max-w-5xl">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 bg-white">
            <div className="aspect-[16/9] bg-vizu-dark relative overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-br from-vizu-dark to-black/80" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                     <ScanFace className="w-16 h-16 text-vizu-gold/80 mx-auto mb-4" />
                     <p className="text-white/80 font-serif text-xl">Analisando traços biométricos...</p>
                  </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  </section>
);

const Benefits = () => (
  <section id="benefits" className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-serif font-bold text-vizu-dark mb-4">Não é sobre moda.<br/>É sobre entender o que funciona em você.</h2>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { icon: Palette, title: "Coloração Pessoal", desc: "Saiba quais cores valorizam seu tom de pele e reduzem olheiras." },
          { icon: ScanFace, title: "Visagismo IA", desc: "Entenda como seu rosto comunica personalidade e autoridade." },
          { icon: Sparkles, title: "Looks Reais", desc: "Veja looks aplicados em você antes de comprar qualquer peça." },
          { icon: ShieldCheck, title: "Sem Erros", desc: "Pare de gastar dinheiro com roupas que ficam paradas no armário." }
        ].map((feature, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-vizu-bg hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-vizu-gold/20 group">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <feature.icon className="w-6 h-6 text-vizu-gold" />
            </div>
            <h3 className="text-xl font-bold text-vizu-dark mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 bg-vizu-bg overflow-hidden">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        <div className="lg:w-1/2">
          <h2 className="text-4xl font-serif font-bold text-vizu-dark mb-6">Como Funciona</h2>
          <div className="space-y-8">
            {[
              { step: "01", title: "Upload da Foto", desc: "Envie uma selfie simples. Nossa IA detecta iluminação e traços." },
              { step: "02", title: "Análise Profunda", desc: "Processamos geometria facial, subtom de pele e contraste." },
              { step: "03", title: "O Momento Uau", desc: "Receba sua cartela de cores e seu primeiro look aplicado instantaneamente." }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 relative">
                <div className="flex-shrink-0 w-12 h-12 bg-vizu-dark text-vizu-gold rounded-full flex items-center justify-center font-bold font-serif text-lg shadow-lg z-10">
                  {item.step}
                </div>
                {idx !== 2 && <div className="absolute left-6 top-12 bottom-[-32px] w-0.5 bg-gray-200" />}
                <div>
                  <h3 className="text-xl font-bold text-vizu-dark mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:w-1/2 relative">
           <div className="absolute inset-0 bg-gradient-to-tr from-vizu-dark to-gray-800 rounded-2xl transform rotate-3 opacity-10 blur-xl"></div>
           <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=800" alt="App Preview" className="relative rounded-2xl shadow-2xl transform -rotate-2 border-4 border-white" />
        </div>
      </div>
    </div>
  </section>
);

const Pricing = ({ onSelect }: { onSelect: () => void }) => (
  <section id="pricing" className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-serif font-bold text-vizu-dark mb-4">Investimento</h2>
        <p className="text-gray-600">Quanto custa a sua melhor versão?</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Basic */}
        <div className="p-8 rounded-3xl border border-gray-200 bg-white hover:shadow-xl transition-all">
          <div className="mb-4 text-vizu-dark font-bold text-xl">Básico</div>
          <div className="text-4xl font-serif font-bold text-vizu-dark mb-2">Gratuito</div>
          <p className="text-gray-500 text-sm mb-6">Para conhecer seu potencial.</p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center text-sm text-gray-700"><CheckCircle className="w-4 h-4 text-vizu-gold mr-2" /> Análise Facial & Cores</li>
            <li className="flex items-center text-sm text-gray-700"><CheckCircle className="w-4 h-4 text-vizu-gold mr-2" /> 1º Look Gratuito</li>
            <li className="flex items-center text-sm text-gray-400"><X className="w-4 h-4 text-gray-300 mr-2" /> Objetivos Avançados</li>
          </ul>
          <Button variant="outline" onClick={onSelect} className="w-full">Começar Agora</Button>
        </div>

        {/* Premium */}
        <div className="p-8 rounded-3xl bg-vizu-dark text-white relative transform md:-translate-y-4 shadow-2xl">
          <div className="absolute top-0 right-0 bg-vizu-gold text-vizu-dark text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-wider">Recomendado</div>
          <div className="mb-4 font-bold text-xl text-vizu-gold">Premium</div>
          <div className="text-4xl font-serif font-bold mb-2">R$ 39<span className="text-sm font-sans font-normal text-gray-400">/mês</span></div>
          <p className="text-gray-400 text-sm mb-6">A experiência completa de estilo.</p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center text-sm"><CheckCircle className="w-4 h-4 text-vizu-gold mr-2" /> Looks Ilimitados</li>
            <li className="flex items-center text-sm"><CheckCircle className="w-4 h-4 text-vizu-gold mr-2" /> Objetivos Avançados (Festa, Trabalho)</li>
            <li className="flex items-center text-sm"><CheckCircle className="w-4 h-4 text-vizu-gold mr-2" /> Histórico Visual & Exportação</li>
          </ul>
          <Button variant="premium" onClick={onSelect} className="w-full shadow-none bg-vizu-gold text-vizu-dark font-bold">Assinar Premium</Button>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-vizu-dark text-white py-12 border-t border-gray-800">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-8 mb-8">
        <div className="col-span-1 md:col-span-1">
          <Logo className="mb-4 text-white" />
          <p className="text-gray-400 text-sm">Seu estilo explicado. Aplicado. Visualizado.</p>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <p>© 2025 Vizuhalizando AI. Todos os direitos reservados.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white">Privacidade</a>
          <a href="#" className="hover:text-white">Termos</a>
        </div>
      </div>
    </div>
  </footer>
);

const LandingPage = ({ onStart, onInstall, canInstall }: { onStart: () => void, onInstall?: () => void, canInstall?: boolean }) => {
  return (
    <div className="min-h-screen font-sans bg-white selection:bg-vizu-gold selection:text-vizu-dark">
      <Navbar onLogin={onStart} onInstall={onInstall} canInstall={canInstall} />
      <Hero onStart={onStart} />
      <Benefits />
      <HowItWorks />
      <Pricing onSelect={onStart} />
      <Footer />
    </div>
  );
};

// --- Sub-Componentes do App (Dashboard) ---

const PricingView = ({ onSelectPlan, currentPlan, onBack }: { onSelectPlan: (plan: PlanTier) => void, currentPlan: PlanTier, onBack: () => void }) => {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  
  return (
    <div className="min-h-screen bg-vizu-bg flex flex-col pb-10">
      <div className="bg-vizu-dark text-white p-8 rounded-b-[40px] shadow-xl relative overflow-hidden">
        <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20">
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-vizu-gold/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="text-center mt-6 relative z-10">
          <h2 className="text-3xl font-serif mb-2 text-vizu-gold">Desbloqueie seu Potencial</h2>
          <p className="text-gray-300 text-sm max-w-xs mx-auto">Você não muda quem é. Você aprende a se expressar melhor.</p>
        </div>
        <div className="flex justify-center mt-8 relative z-10">
          <div className="bg-gray-800 p-1 rounded-full flex relative">
            <button onClick={() => setBilling('monthly')} className={`px-6 py-2 rounded-full text-sm font-medium transition-all z-10 ${billing === 'monthly' ? 'bg-white text-vizu-dark shadow-lg' : 'text-gray-400 hover:text-white'}`}>Mensal</button>
            <button onClick={() => setBilling('annual')} className={`px-6 py-2 rounded-full text-sm font-medium transition-all z-10 ${billing === 'annual' ? 'bg-white text-vizu-dark shadow-lg' : 'text-gray-400 hover:text-white'}`}>Anual (-25%)</button>
          </div>
        </div>
      </div>
      <div className="flex-1 px-6 -mt-8 space-y-4 overflow-y-auto pt-4 pb-8">
        {PLANS[billing].map((plan) => (
          <div key={plan.id} className={`bg-white rounded-2xl p-6 border-2 transition-all relative ${plan.highlight ? 'border-vizu-gold shadow-xl shadow-vizu-gold/20 scale-105 z-10' : 'border-transparent shadow-md opacity-90'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-vizu-dark">{plan.name}</h3>
                {plan.subtext && <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">{plan.subtext}</span>}
              </div>
              <div className="text-right"><span className="text-2xl font-bold text-vizu-dark block">{plan.price}</span></div>
            </div>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start text-sm text-gray-600"><Check className="w-4 h-4 text-vizu-gold mr-2" />{feature}</li>
              ))}
            </ul>
            <Button variant={plan.highlight ? 'premium' : 'secondary'} className="w-full text-sm py-3" onClick={() => onSelectPlan(plan.tier as PlanTier)}>{plan.cta}</Button>
          </div>
        ))}
        
        <div className="text-center mt-6">
           <p className="text-xs text-gray-400">Pagamento seguro via Stripe. Cancele quando quiser.</p>
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Logic ---

const DashboardApp = ({ onInstall, canInstall }: { onInstall?: () => void, canInstall?: boolean }) => {
  const [view, setView] = useState<ViewState>('upload'); 
  const [userPlan, setUserPlan] = useState<PlanTier>('free');
  const [user, setUser] = useState<UserProfile>({
    name: 'Visitante',
    image: null,
    rotation: 0,
    analyzed: false,
    looksGenerated: 0
  });
  
  // Camera Refs and State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Persistence Logic
  useEffect(() => {
    const saved = localStorage.getItem('vizuhalizando_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        if (parsed.analyzed) setView('dashboard');
      } catch (e) {
        console.error("Failed to load user profile", e);
      }
    }
  }, []);

  useEffect(() => {
    if (user.analyzed) {
      localStorage.setItem('vizuhalizando_user', JSON.stringify(user));
    }
  }, [user]);

  // Gemini States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [generatedLook, setGeneratedLook] = useState<GeneratedLookData | null>(null);
  
  // Generation Settings
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
  const [createEnvironment, setCreateEnvironment] = useState(true);
  const [aspectRatio, setAspectRatio] = useState("3:4");
  const [resolution, setResolution] = useState("1K"); 
  
  // Editing State
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Assistant State
  const [assistantQuery, setAssistantQuery] = useState("");
  const [assistantResponse, setAssistantResponse] = useState<{text: string, chunks: any[]} | null>(null);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  // Upload Interaction State
  const [isDragging, setIsDragging] = useState(false);
  
  // Analysis Zoom State
  const [zoomAnalyzing, setZoomAnalyzing] = useState(false);

  // --- Actions ---

  const handleImageAnalysis = async (base64: string) => {
      setUser(prev => ({ ...prev, image: base64 }));
      setView('analyzing');
      setProcessingStep('Detectando rosto e iluminação...');
      
      try {
         setProcessingStep('Analisando visagismo e psicologia da imagem...');
         const analysis = await GeminiService.analyzeUserImage(base64);
         
         const seasonData = SEASONS[analysis.season];
         const detectedPalette = seasonData ? seasonData.colors : [];

         setUser(prev => ({
           ...prev,
           analyzed: true,
           skinTone: 'Detectado',
           faceShape: analysis.faceShape,
           season: analysis.season,
           palette: detectedPalette,
           contrast: analysis.contrast,
           traits: analysis.traits,
           description: analysis.description,
           lightingGuide: analysis.lightingGuide,
           visagismTips: analysis.visagismTips
         }));

         setProcessingStep('Finalizando seu dossiê...');
         setTimeout(() => {
            setView('dashboard');
         }, 1000);

      } catch (error) {
         console.error(error);
         alert("Erro na análise de imagem. Tente novamente com uma foto mais clara.");
         setView('upload');
      }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      handleImageAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };
  
  const handleUpdatePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUser(prev => ({ ...prev, image: base64 }));
        // Optionally re-analyze here or just assume user wants this for generation
        alert("Foto atualizada com sucesso! Pronta para a geração.");
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Draw image directly (no mirroring needed for analysis, mirroring is just for user preview usually)
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL('image/jpeg');
        stopCamera();
        handleImageAnalysis(base64);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleRotateImage = () => {
    setUser(prev => ({ ...prev, rotation: (prev.rotation || 0) + 90 }));
  };
  
  // Direct Generation from Dashboard ("Nano Banana")
  const handleQuickGeneration = async () => {
    if (userPlan === 'free' && user.looksGenerated >= 1) {
       alert("Você atingiu o limite do plano gratuito. Faça upgrade para gerar looks ilimitados.");
       setView('pricing');
       return;
    }
    
    setIsProcessing(true);
    setProcessingStep("Ativando Nano Banana (Modo Criação)...");
    
    // Auto-select "Fashion/Editorial" objective for the main screen magic button
    const defaultObjective = "Editorial";
    const defaultEnv = "A high-end architectural setting with soft, natural lighting";

    try {
      const prompt = `Fashion photography. The person in this image wearing a perfect look for their season: ${user.season}.
      Style: Sophisticated, Modern, Expensive.
      Face Shape: ${user.faceShape}.
      Lighting/Iconometry: ${user.lightingGuide}.
      Environment: ${defaultEnv}.
      Maintain facial identity strictly. High quality, 8k, photorealistic, masterpiece.`;

      // Pass user.image as the reference image
      const [imageUrl, explanation] = await Promise.all([
         GeminiService.generateFashionLook(prompt, "3:4", "1K", user.image || undefined),
         GeminiService.generateLookExplanation(user, "Look Sugerido", "Baseado na sua análise completa")
      ]);

      setGeneratedLook({
        id: `gen-${Date.now()}`,
        objective: 'magic',
        titulo: 'Seu Look Ideal',
        items: ['Look gerado'],
        detalhes: explanation || "Uma seleção exclusiva baseada na sua colorimetria.",
        tips: explanation,
        imagePlaceholder: imageUrl
      });
      
      // Increment Usage
      setUser(prev => ({ ...prev, looksGenerated: prev.looksGenerated + 1 }));

      setIsProcessing(false);
      setView('look-result');

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      alert("Falha na geração. Verifique sua conexão.");
    }
  };

  const generateLook = async (objectiveId: string) => {
    // Usage Logic Enforcer
    const objectiveData = LOOK_OBJECTIVES.find(o => o.id === objectiveId);

    if (userPlan === 'free') {
       if (user.looksGenerated >= 1) {
         alert("Você atingiu o limite do plano gratuito. Faça upgrade para gerar looks ilimitados.");
         setView('pricing');
         return;
       }
       if (objectiveData?.premium) {
         alert("Este objetivo é exclusivo do plano Premium. Faça upgrade para desbloquear.");
         setView('pricing');
         return;
       }
    }

    setSelectedObjective(objectiveId);
    setIsProcessing(true);
    
    setProcessingStep(`Conectando ao consultor IA...`);

    try {
      // Improved prompt for Image-to-Image / Transformation
      const prompt = `Fashion photography. The person in this image wearing a look for ${objectiveData?.label} (${objectiveData?.desc}).
      Palette: ${user.season}. Face Shape: ${user.faceShape}.
      Lighting/Iconometry: ${user.lightingGuide}.
      Environment: ${createEnvironment ? objectiveData?.environmentContext : 'Professional studio'}.
      High quality, 8k, photorealistic.`;

      setProcessingStep('Aplicando estilo na sua foto (Nano Banana)...');
      
      // Pass user.image as the reference image for the model
      const [imageUrl, explanation] = await Promise.all([
         GeminiService.generateFashionLook(prompt, aspectRatio, resolution, user.image || undefined),
         GeminiService.generateLookExplanation(user, objectiveData?.label || 'Look', objectiveData?.desc || '')
      ]);

      setGeneratedLook({
        id: `gen-${Date.now()}`,
        objective: objectiveId,
        titulo: objectiveData?.label || 'Look',
        items: ['Look gerado'],
        detalhes: explanation || user.description || 'Look personalizado',
        tips: explanation,
        imagePlaceholder: imageUrl
      });
      
      // Increment Usage
      setUser(prev => ({ ...prev, looksGenerated: prev.looksGenerated + 1 }));

      setIsProcessing(false);
      setView('look-result');

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      alert("Falha na geração. Verifique sua conexão.");
    }
  };

  const handleEditImage = async () => {
    if (!generatedLook || !editPrompt) return;
    setIsEditing(true);
    try {
      const newImage = await GeminiService.editFashionImage(generatedLook.imagePlaceholder, editPrompt);
      setGeneratedLook(prev => prev ? ({ ...prev, imagePlaceholder: newImage }) : null);
      setEditPrompt("");
    } catch (e) {
      alert("Não foi possível editar a imagem.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleAssistantQuery = async (type: 'search' | 'maps') => {
    if(!assistantQuery) return;
    setIsAssistantLoading(true);
    const loc = { lat: 40.7128, lng: -74.0060 }; 
    const result = await GeminiService.getFashionAdvice(assistantQuery, type, loc);
    setAssistantResponse(result);
    setIsAssistantLoading(false);
  };

  // --- Views ---

  if (view === 'upload') {
    return (
      <div className="min-h-screen bg-vizu-bg flex flex-col text-vizu-dark">
        {isCameraOpen ? (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="relative flex-1 bg-black overflow-hidden">
              {/* Mirrored video for selfie feel */}
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-end z-10">
                <button onClick={stopCamera} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="h-32 bg-black flex items-center justify-center pb-6">
              <button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center transform active:scale-95 transition-all">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-vizu-dark"></div>
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-6">
             <div className="flex items-center mb-8">
               <button onClick={() => window.location.reload()} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight className="w-6 h-6 rotate-180 text-gray-600" /></button>
             </div>
             
             <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto w-full">
                <div className="w-20 h-20 bg-vizu-bg border border-vizu-gold/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <ScanFace className="w-10 h-10 text-vizu-gold" />
                </div>
                <h2 className="text-3xl font-serif text-vizu-dark mb-3">Vamos analisar sua imagem</h2>
                <p className="text-gray-500 mb-8 font-light">Para revelar o que mais te valoriza, precisamos de uma foto clara do seu rosto.</p>
                
                <div className="flex flex-col gap-5 w-full">
                  <button onClick={startCamera} className="w-full py-4 bg-vizu-dark text-white rounded-2xl font-bold flex items-center justify-center shadow-lg shadow-vizu-dark/20 hover:bg-black transition-all transform active:scale-95">
                    <Camera className="w-6 h-6 mr-3 text-vizu-gold" />
                    Tirar Selfie Agora
                  </button>
                  
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold tracking-wider">Ou envie da galeria</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <label 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`w-full aspect-[3/2] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden ${isDragging ? 'border-vizu-gold bg-vizu-gold/5 scale-105 shadow-xl' : 'border-gray-300 bg-white hover:border-vizu-gold hover:bg-vizu-bg'}`}
                  >
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    {isDragging ? (
                      <div className="animate-bounce flex flex-col items-center">
                        <Download className="w-8 h-8 text-vizu-gold mb-2" />
                        <span className="text-vizu-dark font-bold text-sm">Solte para enviar</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-gray-500 font-medium text-sm">Escolher Arquivo</span>
                      </>
                    )}
                  </label>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'analyzing' || (view === 'look-generator' && isProcessing)) {
    return (
      <div className="min-h-screen bg-vizu-dark flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-vizu-gold rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-8 flex flex-col items-center">
             <div className={`w-32 h-32 relative transition-all duration-500 cursor-pointer ${zoomAnalyzing ? 'scale-[2.5] z-50 shadow-2xl' : ''}`} onClick={() => setZoomAnalyzing(!zoomAnalyzing)}>
                <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-vizu-gold rounded-full border-t-transparent animate-spin"></div>
                {user.image && (
                  <div className="absolute inset-2 rounded-full overflow-hidden border-2 border-gray-800 bg-black">
                    <img 
                      src={user.image} 
                      className="w-full h-full object-cover transition-transform duration-500" 
                      style={{ transform: `rotate(${user.rotation || 0}deg)` }}
                    />
                  </div>
                )}
             </div>
             
             {user.image && (
               <div className="flex gap-4 mt-6">
                 <button onClick={handleRotateImage} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-sm transition-colors" title="Girar 90º">
                   <RotateCw className="w-5 h-5" />
                 </button>
                 <button onClick={() => setZoomAnalyzing(!zoomAnalyzing)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-sm transition-colors" title={zoomAnalyzing ? "Reduzir" : "Ampliar"}>
                   <ZoomIn className="w-5 h-5" />
                 </button>
               </div>
             )}
          </div>
          <h3 className="text-2xl font-serif text-white mb-2">{view === 'analyzing' ? 'Decodificando Você' : 'Gerando Visual'}</h3>
          <p className="text-vizu-gold animate-pulse text-sm font-medium tracking-wide">{processingStep}</p>
        </div>
      </div>
    );
  }

  if (view === 'pricing') return <PricingView onSelectPlan={(p) => { setUserPlan(p); setView('dashboard'); }} currentPlan={userPlan} onBack={() => setView('dashboard')} />;

  if (view === 'dashboard') {
    // New Dashboard Implementation based on the Clean UI Reference (2nd image)
    return (
      <div className="min-h-screen bg-[#F5F5F5] text-vizu-dark font-sans antialiased pb-24">
        
        {/* Top Header */}
        <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-[#F5F5F5]">
            <Logo />
            <button className="p-2 bg-white rounded-full shadow-sm relative">
                <Bell className="w-5 h-5 text-gray-700" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
        </header>

        {/* Search Bar */}
        <div className="px-6 mb-6">
          <div className="flex items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
             <Search className="w-5 h-5 text-gray-400 mr-3" />
             <input type="text" placeholder="Buscar" className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400" />
          </div>
        </div>

        {/* Categories / Quick Access */}
        <div className="px-6 mb-8 overflow-x-auto hide-scroll">
           <h3 className="font-medium text-sm text-gray-500 mb-3">Categorias</h3>
           <div className="flex space-x-6">
              <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setView('look-generator')}>
                 <div className="w-14 h-14 rounded-2xl border border-gray-200 flex items-center justify-center bg-white">
                    <CalendarHeart className="w-6 h-6 text-vizu-dark" />
                 </div>
                 <span className="text-xs font-medium text-gray-600">Ocasião</span>
              </div>
              <div className="flex flex-col items-center gap-2 cursor-pointer">
                 <div className="w-14 h-14 rounded-2xl border border-gray-200 flex items-center justify-center bg-white">
                    <Palette className="w-6 h-6 text-vizu-dark" />
                 </div>
                 <span className="text-xs font-medium text-gray-600">Cores</span>
              </div>
              <div className="flex flex-col items-center gap-2 cursor-pointer">
                 <div className="w-14 h-14 rounded-2xl border border-gray-200 flex items-center justify-center bg-white">
                    <Shirt className="w-6 h-6 text-vizu-dark" />
                 </div>
                 <span className="text-xs font-medium text-gray-600">Estilo</span>
              </div>
              <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setView('assistant')}>
                 <div className="w-14 h-14 rounded-2xl border border-gray-200 flex items-center justify-center bg-white">
                    <Search className="w-6 h-6 text-vizu-dark" />
                 </div>
                 <span className="text-xs font-medium text-gray-600">Tem...</span>
              </div>
           </div>
        </div>

        {/* Main Profile Card - Clean Design */}
        <section className="px-6 mb-8">
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#F9F9F9] to-transparent z-0"></div>
                
                <h2 className="font-serif text-xl font-bold text-vizu-dark mb-6 relative z-10">Seu Perfil Visual</h2>
                
                <div className="relative mb-4 z-10">
                   {user.image ? (
                     <img 
                        src={user.image} 
                        style={{ transform: `rotate(${user.rotation || 0}deg)` }}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                     />
                   ) : (
                     <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-md">
                        <User className="w-10 h-10 text-gray-300" />
                     </div>
                   )}
                   <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#C5A572] rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                      <Check className="w-4 h-4" />
                   </div>
                   {/* Edit Button overlay */}
                   <button onClick={() => document.getElementById('photo-update-input')?.click()} className="absolute top-0 right-0 p-1 bg-white rounded-full border border-gray-200 shadow-sm text-gray-500">
                      <RefreshCw className="w-3 h-3" />
                   </button>
                   <input 
                      id="photo-update-input" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleUpdatePhoto}
                    />
                </div>
                
                <div className="mb-6 relative z-10">
                   <p className="text-gray-600 font-medium">Paleta: <span className="text-[#C5A572]">{user.season || 'Analisar'}</span></p>
                </div>
                
                <button 
                  onClick={handleQuickGeneration}
                  className="w-full py-4 bg-[#1A1A2E] text-white rounded-xl font-medium shadow-lg shadow-gray-200 active:scale-95 transition-transform relative z-10"
                >
                  Gerar novo look
                </button>
            </div>
        </section>

        {/* Menu List */}
        <div className="px-6 space-y-2 mb-8">
           <div className="bg-transparent flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                 <Bookmark className="w-5 h-5 text-gray-700" />
                 <span className="text-sm font-medium text-gray-700 group-hover:text-vizu-dark">Meus Looks Salvos</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
           </div>
           <div className="bg-transparent flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                 <Sliders className="w-5 h-5 text-gray-700" />
                 <span className="text-sm font-medium text-gray-700 group-hover:text-vizu-dark">Preferências</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
           </div>
           <div className="bg-transparent flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                 <Settings className="w-5 h-5 text-gray-700" />
                 <span className="text-sm font-medium text-gray-700 group-hover:text-vizu-dark">Configurações</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
           </div>
        </div>
        
        {/* Premium Upgrade Banner */}
        {userPlan === 'free' && (
           <div className="px-6 mb-8">
              <div onClick={() => setView('pricing')} className="bg-[#1A1A2E] rounded-xl p-4 flex items-center justify-between shadow-lg cursor-pointer">
                 <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-[#C5A572]" />
                    <span className="text-white font-medium text-sm">Upgrade para Premium</span>
                 </div>
                 <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
           </div>
        )}

        {/* Inspiration Grid (Featured Looks) */}
        <div className="px-6 mb-6">
           <h3 className="font-medium text-sm text-gray-500 mb-4">Featured looks</h3>
           <div className="grid grid-cols-2 gap-4">
               <div className="h-48 rounded-2xl bg-gray-200 overflow-hidden relative">
                   <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400" className="w-full h-full object-cover" />
               </div>
               <div className="h-48 rounded-2xl bg-gray-200 overflow-hidden relative">
                   <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400" className="w-full h-full object-cover" />
               </div>
               <div className="h-48 rounded-2xl bg-gray-200 overflow-hidden relative">
                   <img src="https://images.unsplash.com/photo-1529139574466-a302d2052574?w=400" className="w-full h-full object-cover" />
               </div>
               <div className="h-48 rounded-2xl bg-gray-200 overflow-hidden relative">
                   <img src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400" className="w-full h-full object-cover" />
               </div>
           </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 h-20 flex justify-around items-center pb-4 z-50 rounded-t-3xl shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
            <div 
                className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${view === 'dashboard' ? 'text-vizu-dark' : 'text-gray-400'}`}
                onClick={() => setView('dashboard')}
            >
                <Home className="w-6 h-6" />
            </div>
            
            <div 
                className="flex flex-col items-center gap-1 cursor-pointer text-gray-400 hover:text-vizu-dark transition-colors"
                onClick={() => setView('look-generator')}
            >
                <Grid className="w-6 h-6" />
            </div>

            <div className="flex flex-col items-center gap-1 cursor-pointer text-gray-400 hover:text-vizu-dark transition-colors"
                onClick={() => setView('assistant')}
            >
                <User className="w-6 h-6" />
            </div>
        </nav>
      </div>
    );
  }

  if (view === 'look-generator') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center bg-vizu-bg">
          <button onClick={() => setView('dashboard')} className="mr-4"><ArrowRight className="w-6 h-6 rotate-180 text-gray-600" /></button>
          <h2 className="text-xl font-serif text-vizu-dark">Selecione o Objetivo</h2>
        </div>
        <div className="p-6 overflow-y-auto pb-24">
          
          <div className="mb-6 space-y-4">
             <div className="flex items-center p-3 bg-vizu-bg rounded-xl border border-gray-200">
                <input type="checkbox" checked={createEnvironment} onChange={(e) => setCreateEnvironment(e.target.checked)} className="w-5 h-5 text-vizu-dark rounded mr-3 accent-vizu-dark" />
                <label className="text-sm font-medium text-gray-700">Criar ambiente contextualizado</label>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {LOOK_OBJECTIVES.map((obj) => (
              <button key={obj.id} onClick={() => generateLook(obj.id)} className={`flex items-center p-4 rounded-xl border transition-all text-left h-24 relative overflow-hidden ${userPlan === 'free' && obj.premium ? 'border-gray-100 bg-gray-50 opacity-70' : 'border-gray-200 hover:border-vizu-gold bg-white'}`}>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4 text-2xl">
                    {obj.iconEmoji}
                </div>
                <div>
                    <h4 className="font-bold text-vizu-dark text-lg flex items-center">
                        {obj.label} 
                        {obj.premium && <Crown className="w-3 h-3 text-vizu-gold ml-2" />}
                    </h4>
                    <p className="text-xs text-gray-500">{obj.desc}</p>
                </div>
                {userPlan === 'free' && obj.premium ? (
                    <Lock className="w-5 h-5 text-gray-400 ml-auto" />
                ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'look-result' && generatedLook) {
    return (
      <div className="min-h-screen bg-vizu-bg flex flex-col">
        <div className="relative h-[65vh] bg-vizu-dark group overflow-hidden">
           <img src={generatedLook.imagePlaceholder} className="w-full h-full object-contain bg-black" />
           <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
             <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"><X className="w-5 h-5" /></button>
           </div>
        </div>

        <div className="flex-1 bg-white -mt-6 rounded-t-[30px] relative z-20 px-6 py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
           <div className="mb-6">
             <h3 className="font-serif text-2xl text-vizu-dark mb-2">{generatedLook.titulo}</h3>
             <p className="text-sm text-gray-500 italic mb-4">"{generatedLook.detalhes}"</p>
           </div>
           
           {/* Upsell for Free Users on Result Page */}
           {userPlan === 'free' && (
              <div onClick={() => setView('pricing')} className="bg-vizu-dark p-4 rounded-xl text-white mb-6 cursor-pointer flex justify-between items-center shadow-lg">
                 <div>
                    <p className="font-bold text-sm text-vizu-gold">Gostou desse look?</p>
                    <p className="text-xs text-gray-300">Desbloqueie versões infinitas agora.</p>
                 </div>
                 <ArrowRight className="w-5 h-5 text-white" />
              </div>
           )}

           <div className="bg-vizu-bg p-4 rounded-2xl border border-gray-200 mb-6">
             <h4 className="text-xs font-bold text-vizu-dark uppercase mb-3 flex items-center"><Wand2 className="w-3 h-3 mr-2" /> Edição Mágica</h4>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={editPrompt}
                 onChange={(e) => setEditPrompt(e.target.value)}
                 placeholder="Ex: Mudar a cor da blusa para vermelho..."
                 className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-vizu-gold"
               />
               <button 
                disabled={isEditing || !editPrompt}
                onClick={handleEditImage}
                className="bg-vizu-dark text-white p-2 rounded-lg disabled:opacity-50"
               >
                 {isEditing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ArrowRight className="w-4 h-4" />}
               </button>
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'assistant') {
    return (
      <div className="min-h-screen bg-vizu-bg flex flex-col">
        <div className="bg-white p-6 shadow-sm z-10 sticky top-0">
           <div className="flex items-center mb-4">
             <button onClick={() => setView('dashboard')} className="mr-4"><ArrowRight className="w-6 h-6 rotate-180" /></button>
             <h2 className="text-xl font-serif text-vizu-dark">Assistente de Moda</h2>
           </div>
           
           <div className="flex gap-2 mb-2">
             <input 
                type="text" 
                value={assistantQuery}
                onChange={(e) => setAssistantQuery(e.target.value)}
                placeholder="Onde comprar casaco de lã preto?"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-vizu-gold"
             />
           </div>
           <div className="flex gap-2">
              <Button onClick={() => handleAssistantQuery('search')} variant="secondary" className="flex-1 py-2 text-xs" icon={Globe}>Pesquisar Web</Button>
              <Button onClick={() => handleAssistantQuery('maps')} variant="secondary" className="flex-1 py-2 text-xs" icon={Map}>Buscar Local</Button>
           </div>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {isAssistantLoading && (
            <div className="flex justify-center mt-10">
              <div className="w-8 h-8 border-4 border-vizu-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {assistantResponse && !isAssistantLoading && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="prose prose-sm text-gray-700 mb-6">
                <p>{assistantResponse.text}</p>
              </div>

              {assistantResponse.chunks.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Fontes & Locais</h4>
                  <div className="space-y-3">
                    {assistantResponse.chunks.map((chunk, i) => (
                      <div key={i} className="bg-vizu-bg p-3 rounded-lg border border-gray-100 text-xs text-gray-600 truncate">
                        {chunk.web?.uri ? (
                          <a href={chunk.web.uri} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:underline">
                            <Globe className="w-3 h-3 mr-2" /> {chunk.web.title || chunk.web.uri}
                          </a>
                        ) : chunk.maps?.uri ? (
                          <a href={chunk.maps.uri} target="_blank" rel="noreferrer" className="flex items-center text-green-600 hover:underline">
                             <MapPin className="w-3 h-3 mr-2" /> {chunk.maps.title || "Local no Mapa"}
                          </a>
                        ) : JSON.stringify(chunk)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
};

const VizuhalizandoApp = () => {
  const [showApp, setShowApp] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
          setInstallPrompt(null);
        } else {
          console.log('User dismissed the A2HS prompt');
        }
      });
    }
  };

  if (showApp) {
    return <DashboardApp onInstall={handleInstall} canInstall={!!installPrompt} />;
  }

  return <LandingPage onStart={() => setShowApp(true)} onInstall={handleInstall} canInstall={!!installPrompt} />;
};

export default VizuhalizandoApp;