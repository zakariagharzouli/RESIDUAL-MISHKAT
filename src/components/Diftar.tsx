import React, { useState, useEffect, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { getStroke } from 'perfect-freehand';
import { HexColorPicker } from 'react-colorful';
import { Stroke, Shape, DiftarPage, UserData } from '../types';
import { useT } from '../lib/theme';
import { Icon, Icons, useIsNarrow, useIsMobile } from './ui';
import { DI, ToolPreview } from './DiftarUI';

// Page templates
const PAGE_TEMPLATES = [
  { type: 'revision',   icon: 'book', labelFr: 'Révision',   labelAr: 'مراجعة',   paperStyle: 'lines'        as const, paperColor: '#fdfcf8', descFr: "Réciter et noter ses erreurs", descAr: 'تسميع وتدوين الأخطاء', defaultTitle: { fr: 'Révision',      ar: 'مراجعة'      } },
  { type: 'tafsir',     icon: 'search', labelFr: 'Tafsir',     labelAr: 'تفسير',    paperStyle: 'arabesque'    as const, paperColor: '#f4ecd8', descFr: "Le sens des versets", descAr: 'معاني الآيات', defaultTitle: { fr: 'Tafsir',        ar: 'تفسير'       } },
  { type: 'dates',      icon: 'calendar', labelFr: 'Planning',   labelAr: 'تخطيط',    paperStyle: 'grid'         as const, paperColor: '#fdfcf8', descFr: "Organiser sa semaine", descAr: 'تنظيم الأسبوع', defaultTitle: { fr: 'Planning',      ar: 'تخطيط'       } },
  { type: 'objectives', icon: 'target', labelFr: 'Objectifs',  labelAr: 'أهداف',    paperStyle: 'dots'         as const, paperColor: '#fff0f3', descFr: "Ses objectifs du mois", descAr: 'أهداف الشهر', defaultTitle: { fr: 'Objectifs',     ar: 'أهداف'       } },
  { type: 'vocab',      icon: 'list', labelFr: 'Vocabulaire',labelAr: 'مفردات',   paperStyle: 'music'        as const, paperColor: '#f8f4ff', descFr: "Mots et leur sens", descAr: 'الكلمات ومعانيها', defaultTitle: { fr: 'Vocabulaire',   ar: 'مفردات'      } },
  { type: 'dua',        icon: 'heart', labelFr: "Dou'a",      labelAr: 'دعاء',     paperStyle: 'floral'       as const, paperColor: '#f4f8ec', descFr: "Invocations à garder", descAr: 'أدعية للحفظ', defaultTitle: { fr: "Dou'a",        ar: 'دعاء'        } },
  { type: 'notes',      icon: 'edit', labelFr: 'Notes',      labelAr: 'ملاحظات',  paperStyle: 'diamond'      as const, paperColor: '#fffbe6', descFr: "Prendre des notes vite", descAr: 'ملاحظات سريعة', defaultTitle: { fr: 'Notes rapides', ar: 'ملاحظات سريعة'} },
  { type: 'schema',     icon: 'layers', labelFr: 'Schéma',     labelAr: 'مخطط',     paperStyle: 'hexagonal'    as const, paperColor: '#e8f4fb', descFr: "Carte mentale", descAr: 'خريطة ذهنية', defaultTitle: { fr: 'Schéma',        ar: 'مخطط ذهني'   } },
  { type: 'tajweed',    icon: 'wind', labelFr: 'Tajweed',    labelAr: 'تجويد',    paperStyle: 'islamic_star' as const, paperColor: '#fff4e6', descFr: "Règles de lecture", descAr: 'أحكام التلاوة', defaultTitle: { fr: 'Tajweed',       ar: 'تجويد'       } },
  { type: 'custom',     icon: 'sparkle', labelFr: 'Libre',      labelAr: 'حر',       paperStyle: 'blank'        as const, paperColor: '#ffffff',  descFr: "Page blanche", descAr: 'صفحة فارغة', defaultTitle: { fr: 'Nouvelle Page', ar: 'صفحة جديدة'  } },
];

const PAPER_COLOR_NAMES: Record<string, string> = {
  '#fdfcf8': 'Crème', '#ffffff': 'Blanc', '#f4ecd8': 'Sépia',
  '#f0f7f0': 'Sauge', '#fff0f3': 'Rose',
  '#f5e8ff': 'Lavande', '#e8f4fb': 'Ciel', '#fffbe6': 'Beurre', '#e6f8f1': 'Menthe',
  '#FFF3E0': 'Pêche', '#FFE4B5': 'Miel', '#FFD5B8': 'Abricot', '#FFE5D0': 'Saumon',
  '#FDE8CC': 'Cannelle', '#F9E4D4': 'Terracotta', '#FFF0DB': 'Safran',
  '#FAE0C8': 'Aurore', '#FCEBD3': 'Ambre', '#FFF8F0': 'Vanille',
  '#FF8C42': 'Orange', '#FFB347': 'Mandarine', '#FF6B6B': 'Corail',
  '#B7C4A8': 'Eucalyptus', '#D4C5B0': 'Gris chaud', '#C5C0D8': 'Myrtille',
  '#2C2C3A': 'Anthracite', '#3E2723': 'Moka',
};

/** Couleur de texte lisible sur un fond donné (encre sombre ou blanc). */
const readableOn = (hex: string) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.62 ? '#3a2a12' : '#ffffff';
};

const PAPER_COLORS = [
  { value: '#fdfcf8', label: 'Crème' },
  { value: '#ffffff', label: 'Blanc' },
  { value: '#f4ecd8', label: 'Sépia' },
  { value: '#f0f7f0', label: 'Sauge' },
  { value: '#fff0f3', label: 'Rose' },
  { value: '#f5e8ff', label: 'Lavande' },
  { value: '#e8f4fb', label: 'Ciel' },
  { value: '#fffbe6', label: 'Beurre' },
  { value: '#e6f8f1', label: 'Menthe' },
  { value: '#FFF3E0', label: 'Pêche' },
  { value: '#FFE4B5', label: 'Miel' },
  { value: '#FFD5B8', label: 'Abricot' },
  { value: '#FFE5D0', label: 'Saumon' },
  { value: '#FDE8CC', label: 'Cannelle' },
  { value: '#F9E4D4', label: 'Terracotta' },
  { value: '#FFF0DB', label: 'Safran' },
  { value: '#FAE0C8', label: 'Aurore' },
  { value: '#FCEBD3', label: 'Ambre' },
  { value: '#FFF8F0', label: 'Vanille' },
  { value: '#FF8C42', label: 'Orange' },
  { value: '#FFB347', label: 'Mandarine' },
  { value: '#FF6B6B', label: 'Corail' },
  { value: '#B7C4A8', label: 'Eucalyptus' },
  { value: '#D4C5B0', label: 'Gris chaud' },
  { value: '#C5C0D8', label: 'Myrtille' },
  { value: '#2C2C3A', label: 'Anthracite' },
  { value: '#3E2723', label: 'Moka' },
];

const EMOJI_LIST = [
  '👍','❤️','⭐','✨','🎉','🏆','🎯','💡','✅','💪',
  '😊','😍','🙏','🤍','💎','📖','✍️','🌟','🔥','🎊',
  '🌺','🌸','🌼','💐','🦋','🌿','🌈','🌙','☀️','🕊️',
  '🤲','🕌','📿','☪️','🕋','🌹','🍃','🏵️','💚','🫶',
];

// All shapes, organized by category
const SHAPE_CATEGORIES = [
  {
    label: { fr: 'Géométriques', ar: 'هندسية' },
    shapes: [
      { id: 'circle',     type: 'circle'     as const, label: { fr: 'Cercle',      ar: 'دائرة'       } },
      { id: 'ellipse',    type: 'ellipse'    as const, label: { fr: 'Ellipse',     ar: 'بيضاوي'      } },
      { id: 'semicircle', type: 'semicircle' as const, label: { fr: 'Demi-cercle', ar: 'نصف دائرة'   } },
      { id: 'square',     type: 'square'     as const, label: { fr: 'Carré',       ar: 'مربع'        } },
      { id: 'rectangle',  type: 'rectangle'  as const, label: { fr: 'Rectangle',   ar: 'مستطيل'      } },
      { id: 'triangle',   type: 'triangle'   as const, label: { fr: 'Triangle',    ar: 'مثلث'        } },
      { id: 'diamond',    type: 'diamond'    as const, label: { fr: 'Losange',     ar: 'معين'        } },
      { id: 'hexagon',    type: 'hexagon'    as const, label: { fr: 'Hexagone',    ar: 'سداسي'       } },
      { id: 'pentagon',   type: 'pentagon'   as const, label: { fr: 'Pentagone',   ar: 'خماسي'       } },
      { id: 'octagon',    type: 'octagon'    as const, label: { fr: 'Octogone',    ar: 'ثماني'       } },
      { id: 'trapezoid',  type: 'trapezoid'  as const, label: { fr: 'Trapèze',     ar: 'شبه منحرف'   } },
    ],
  },
  {
    label: { fr: 'Décoratifs', ar: 'زخرفية' },
    shapes: [
      { id: 'star',          type: 'star'          as const, label: { fr: 'Étoile 5',     ar: 'نجمة 5'  } },
      { id: 'star6',         type: 'star6'         as const, label: { fr: 'Étoile 6',     ar: 'نجمة 6'  } },
      { id: 'heart',         type: 'heart'         as const, label: { fr: 'Cœur',         ar: 'قلب'     } },
      { id: 'crescent',      type: 'crescent'      as const, label: { fr: 'Croissant',    ar: 'هلال'    } },
      { id: 'cloud',         type: 'cloud'         as const, label: { fr: 'Nuage',        ar: 'سحابة'   } },
      { id: 'lightning',     type: 'lightning'     as const, label: { fr: 'Éclair',       ar: 'برق'     } },
      { id: 'sun',           type: 'sun'           as const, label: { fr: 'Soleil',       ar: 'شمس'     } },
      { id: 'speech_bubble', type: 'speech_bubble' as const, label: { fr: 'Bulle',        ar: 'فقاعة'   } },
      { id: 'cross',         type: 'cross'         as const, label: { fr: 'Croix',        ar: 'صليب'    } },
    ],
  },
  {
    label: { fr: 'Lignes', ar: 'خطوط' },
    shapes: [
      { id: 'line',         type: 'line'         as const, label: { fr: 'Ligne',           ar: 'خط'         } },
      { id: 'arrow',        type: 'arrow'        as const, label: { fr: 'Flèche',          ar: 'سهم'        } },
      { id: 'curved_arrow', type: 'curved_arrow' as const, label: { fr: 'Flèche courbée', ar: 'سهم منحني'  } },
      { id: 'double_arrow', type: 'double_arrow' as const, label: { fr: 'Double flèche',  ar: 'سهم مزدوج'  } },
      { id: 'bracket',      type: 'bracket'      as const, label: { fr: 'Accolade',        ar: 'قوس'        } },
    ],
  },
];

// Color palette organized by category
// Tous les stylos, dans l'ordre des raccourcis clavier
const TOOLS = [
  { id: 'pen',          fr: 'Stylo',        ar: 'قلم',         hint: '1' },
  { id: 'fountain-pen', fr: 'Plume',        ar: 'ريشة',        hint: '2' },
  { id: 'highlighter',  fr: 'Surligneur',   ar: 'تحديد',       hint: '3' },
  { id: 'chalk',        fr: 'Craie',        ar: 'طباشير',      hint: '4' },
  { id: 'ruler',        fr: 'Règle',        ar: 'مسطرة',       hint: '5' },
  { id: 'eraser',       fr: 'Gomme',        ar: 'ممحاة',       hint: '6' },
  { id: 'spray',        fr: 'Aérosol',      ar: 'رذاذ',        hint: '7' },
  { id: 'marker',       fr: 'Marqueur',     ar: 'ماركر',       hint: '8' },
  { id: 'neon',         fr: 'Néon',         ar: 'نيون',        hint: '9' },
  { id: 'pencil',       fr: 'Crayon',       ar: 'رصاص',        hint: '0' },
  { id: 'watercolor',   fr: 'Aquarelle',    ar: 'ألوان مائية', hint: '-' },
  { id: 'calligraphy',  fr: 'Calligraphie', ar: 'خط',          hint: ''  },
  { id: 'dotted',       fr: 'Pointillé',    ar: 'منقّط',       hint: ''  },
  { id: 'brush',        fr: 'Pinceau',      ar: 'فرشاة',       hint: ''  },
];

const RECENT_KEY = 'diftar_recent_colors';
const DEFAULT_RECENT = ['#1c1409', '#8B2635', '#1D3557', '#2D6A4F', '#C8962A', '#E07A9A'];

const COLOR_PALETTE = {
  classiques: [
    '#000000', '#1a1a1a', '#4a4a4a', '#888888', '#cccccc', '#ffffff',
    '#8B2635', '#D4AF37', '#1D3557', '#2A9D8F', '#264653', '#5f4339',
  ],
  pastels: [
    '#FFD6E7', '#FFC9D0', '#FFDAB9', '#FFF3CD', '#D1F5E0', '#C7ECEE',
    '#D0D9FF', '#E8D5FF', '#FFE4E1', '#F0E6FF', '#E0F4FF', '#F5F5DC',
  ],
  vives: [
    '#E63946', '#F4722B', '#F9C74F', '#43AA8B', '#00B4D8', '#7B2FBE',
    '#FF006E', '#FB5607', '#FFBE0B', '#06D6A0', '#118AB2', '#8338EC',
  ],
  sombres: [
    '#2C2C3A', '#3E2723', '#1D3557', '#1b4332', '#3d2c00', '#4a1942',
    '#2d3561', '#3d1515', '#1a3c1a', '#002855', '#362f5e', '#4a3728',
  ],
  speciaux: [
    'gradient:gold-red', 'gradient:blue-cyan', 'gradient:purple-pink',
    'gradient:green-teal', 'gradient:sunset', 'gradient:ocean',
    'pattern:dots', 'pattern:stripes', 'pattern:crosses',
  ],
};

export const Diftar = ({ userData, setUserData, lang, onSaveNow, onEditingChange }: { userData: UserData; setUserData: React.Dispatch<React.SetStateAction<UserData>>; lang: string; onSaveNow?: (data: UserData) => void; onEditingChange?: (editing: boolean) => void }) => {
  const t = useT();
  const narrow = useIsNarrow();
  const isMobile = useIsMobile();
  const fr = lang === 'fr';
  const [activePageId, setActivePageId]     = useState<string | null>(null);
  useEffect(() => { onEditingChange?.(!!activePageId); return () => onEditingChange?.(false); }, [activePageId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [editingPageId, setEditingPageId]   = useState<string | null>(null);
  const [tool, setTool]                     = useState<'select' | 'pen' | 'highlighter' | 'fountain-pen' | 'chalk' | 'eraser' | 'ruler' | 'spray' | 'marker' | 'neon' | 'pencil' | 'watercolor' | 'calligraphy' | 'dotted' | 'brush'>('pen');
  const [shapeSize, setShapeSize]           = useState(60);
  const [showToolsMenu, setShowToolsMenu]           = useState(false);
  const [showCustomizationMenu, setShowCustomizationMenu] = useState(false);
  const [color, setColor]                   = useState('#8B2635');
  const [colorTab, setColorTab]             = useState<keyof typeof COLOR_PALETTE>('classiques');
  const [width, setWidth]                   = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [undoStack, setUndoStack]           = useState<{ strokes: Stroke[]; shapes: Shape[] }[]>([]);
  const [redoStack, setRedoStack]           = useState<{ strokes: Stroke[]; shapes: Shape[] }[]>([]);
  const [currentStrokes, setCurrentStrokes] = useState<Stroke[]>([]);
  const [shapes, setShapes]             = useState<Shape[]>([]);
  const [showShapePicker, setShowShapePicker]   = useState(false);
  const [shapeCategory, setShapeCategory]       = useState(0);
  const [showEmojiPicker, setShowEmojiPicker]   = useState(false);
  const [showMoreMenu, setShowMoreMenu]         = useState(false);
  const [viewportW, setViewportW]               = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1440));
  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [recentColors, setRecentColors]         = useState<string[]>(() => {
    try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) || 'null'); return Array.isArray(v) && v.length ? v.slice(0, 6) : DEFAULT_RECENT; } catch { return DEFAULT_RECENT; }
  });
  const [activeEmoji, setActiveEmoji]           = useState<string | null>(null);
  const activeEmojiRef = useRef<string | null>(null);
  const [showColorWheel, setShowColorWheel]     = useState(false);
  const [showPaperSettings, setShowPaperSettings]   = useState(false);
  const [isSaving, setIsSaving]             = useState(false);
  const [paperStyle, setPaperStyle]         = useState<'lines'|'blank'|'grid'|'dots'|'arabesque'|'diamond'|'hexagonal'|'music'|'floral'|'islamic_star'|'waves'|'leaves'|'crosses'|'triangles'>('lines');
  const [paperColor, setPaperColor]         = useState('#fdfcf8');
  const [pageHeight, setPageHeight]         = useState(5000);
  const [canvasScale, setCanvasScale]       = useState(1);


  const isDrawingRef    = useRef(false);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const stickerCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [activeShapeType, setActiveShapeType] = useState<Shape['type'] | null>(null);
  const activeShapeTypeRef = useRef<Shape['type'] | null>(null);
  const setActiveShapeTypeWithRef = useCallback((val: Shape['type'] | null) => {
    activeShapeTypeRef.current = val;
    setActiveShapeType(val);
  }, []);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear]   = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [galleryFilter, setGalleryFilter]         = useState<string | null>(null);
  const [isDrawing, setIsDrawing]           = useState(false);
  const [toastMessage, setToastMessage]     = useState<string | null>(null);
  // Help guide
  const [showHelp, setShowHelp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Selection tool state
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  // Stylus / palm-rejection
  const PEN_KEY = 'mishkat_pen_seen';
  const penSeenBefore = (() => { try { return localStorage.getItem(PEN_KEY) === '1'; } catch { return false; } })();
  const [penEverDetected, setPenEverDetected] = useState(false);
  const [stylusMode, setStylusMode]         = useState(penSeenBefore);
  const stylusModeRef = useRef(penSeenBefore);
  // Zoom
  const [zoom, setZoom]                     = useState(1);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomTimerRef = useRef<number | undefined>(undefined);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const staticBufferRef = useRef<HTMLCanvasElement | null>(null);
  const rectCacheRef = useRef<DOMRect | null>(null);
  // Selection drag ref: tracks move/resize/rotate drags
  const selectionDragRef = useRef<{
    startX: number; startY: number;
    shapeStartX: number; shapeStartY: number;
    shapeStartW: number; shapeStartH: number;
    shapeId: string;
    handle: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'rotate';
    shapeStartRotation: number;
  } | null>(null);
  const toolbarRef     = useRef<HTMLDivElement>(null);
  const [toolbarH, setToolbarH] = useState(72);
  const [searchQuery, setSearchQuery]   = useState('');
  const [showSearch, setShowSearch]     = useState(false);
  const [libraryScrolled, setLibraryScrolled] = useState(false);
  const libraryContainerRef = useRef<HTMLDivElement>(null);

  const activePage = userData.diftarPages.find(p => p.id === activePageId);

  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setToolbarH(e.contentRect.height));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);



  // Keep ref in sync for event handlers
  useEffect(() => {
    stylusModeRef.current = stylusMode;
  }, [stylusMode]);

  // Auto-switch to stylus mode once a pen is detected
  useEffect(() => {
    if (penEverDetected) {
      setStylusMode(true);
    }
  }, [penEverDetected]);

  useEffect(() => {
    if (activePageId) { setLibraryScrolled(false); return; }
    const el = libraryContainerRef.current;
    if (!el) return;
    const scrollParent = el.closest('main') as HTMLElement | null;
    if (!scrollParent) return;
    const handle = () => setLibraryScrolled(scrollParent.scrollTop > 100);
    scrollParent.addEventListener('scroll', handle, { passive: true });
    return () => scrollParent.removeEventListener('scroll', handle);
  }, [activePageId]);

  const updateStaticBuffer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!staticBufferRef.current) staticBufferRef.current = document.createElement('canvas');
    const sb = staticBufferRef.current;
    if (sb.width !== canvas.width || sb.height !== canvas.height) { sb.width = canvas.width; sb.height = canvas.height; }
    const sctx = sb.getContext('2d');
    if (!sctx) return;
    sctx.clearRect(0, 0, sb.width, sb.height);

    const renderStroke = (stroke, targetCtx) => {
      if (stroke.type === 'spray') {
        if (stroke.points.length === 0) return;
        targetCtx.save(); targetCtx.fillStyle = stroke.color; targetCtx.globalAlpha = 0.75;
        stroke.points.forEach((point: {x:number;y:number}, pi: number) => {
          const base = ((point.x * 97 + point.y * 31 + pi * 17) | 0);
          for (let i = 0; i < 10; i++) {
            const h1 = ((base + i * 1103515245 + 12345) >>> 0) % 1000;
            const h2 = ((h1 * 22695477 + 1) >>> 0) % 1000;
            targetCtx.beginPath();
            targetCtx.arc(point.x + Math.cos((h1/1000)*Math.PI*2)*(h2/1000)*stroke.width*2.5, point.y + Math.sin((h1/1000)*Math.PI*2)*(h2/1000)*stroke.width*2.5, 0.7, 0, Math.PI*2);
            targetCtx.fill();
          }
        });
        targetCtx.restore(); return;
      }
      // perfect-freehand for pen and brush tools
      if ((stroke.type === 'pen' || stroke.type === 'brush') && stroke.points.length >= 2) {
        const pfPoints = stroke.points.map(p => [p.x, p.y, p.p ?? 0.5]);
        const outlinePoints = getStroke(pfPoints, {
          size: stroke.type === 'brush' ? stroke.width * 4 : stroke.width * 2,
          thinning: 0,
          smoothing: 0.7,
          streamline: 0.1,
          simulatePressure: false,
          last: true,
        });
        if (outlinePoints.length < 2) { /* skip */ }
        else {
          targetCtx.save();
          targetCtx.fillStyle = stroke.color;
          if (stroke.type === 'brush') { targetCtx.globalAlpha = 0.72; targetCtx.shadowBlur = stroke.width * 2; targetCtx.shadowColor = stroke.color; }
          targetCtx.beginPath();
          targetCtx.moveTo(outlinePoints[0][0], outlinePoints[0][1]);
          for (let i = 1; i < outlinePoints.length; i++) {
            const xm = (outlinePoints[i-1][0] + outlinePoints[i][0]) / 2;
            const ym = (outlinePoints[i-1][1] + outlinePoints[i][1]) / 2;
            targetCtx.quadraticCurveTo(outlinePoints[i-1][0], outlinePoints[i-1][1], xm, ym);
          }
          targetCtx.closePath();
          targetCtx.fill();
          targetCtx.restore();
        }
        return;
      }
      if (stroke.points.length < 2) return;
      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.strokeStyle = getStrokeStyle(targetCtx, stroke);
      targetCtx.lineJoin = 'round';
      if (stroke.type === 'highlighter') {
        targetCtx.globalCompositeOperation = 'multiply'; targetCtx.globalAlpha = 0.4;
        targetCtx.lineCap = 'square'; targetCtx.lineWidth = stroke.width * 2.5;
      } else if (stroke.type === 'fountain-pen') {
        targetCtx.globalCompositeOperation = 'source-over'; targetCtx.lineCap = 'butt';
        targetCtx.lineWidth = stroke.width * 1.2; targetCtx.setTransform(1, 0, 0.4, 1, 0, 0);
      } else if (stroke.type === 'chalk') {
        targetCtx.globalCompositeOperation = 'source-over'; targetCtx.globalAlpha = 0.75;
        targetCtx.lineCap = 'round'; targetCtx.lineWidth = stroke.width * 2;
        targetCtx.setLineDash([2, 3]); targetCtx.shadowBlur = 4; targetCtx.shadowColor = stroke.color;
      } else if (stroke.type === 'eraser') {
        targetCtx.globalCompositeOperation = 'destination-out'; targetCtx.strokeStyle = 'rgba(0,0,0,1)';
        targetCtx.lineCap = 'round'; targetCtx.lineWidth = stroke.width * 4;
      } else if (stroke.type === 'marker') {
        targetCtx.globalCompositeOperation = 'source-over'; targetCtx.globalAlpha = 0.65;
        targetCtx.lineCap = 'square'; targetCtx.lineWidth = stroke.width * 2;
      } else if (stroke.type === 'neon') {
        targetCtx.globalCompositeOperation = 'source-over'; targetCtx.lineCap = 'round';
        targetCtx.lineWidth = stroke.width; targetCtx.shadowBlur = stroke.width * 5;
        targetCtx.shadowColor = stroke.color; targetCtx.globalAlpha = 0.95;
      } else if (stroke.type === 'pencil') {
        targetCtx.globalCompositeOperation = 'source-over'; targetCtx.globalAlpha = 0.55;
        targetCtx.lineCap = 'round'; targetCtx.lineWidth = stroke.width * 0.85; targetCtx.setLineDash([1, 1.2]);
      } else if (stroke.type === 'watercolor') {
        targetCtx.globalCompositeOperation = 'source-over'; targetCtx.globalAlpha = 0.16;
        targetCtx.lineCap = 'round'; targetCtx.lineWidth = stroke.width * 5;
        targetCtx.shadowBlur = stroke.width * 4; targetCtx.shadowColor = stroke.color;
      } else if (stroke.type === 'calligraphy') {
        targetCtx.globalCompositeOperation = 'source-over'; targetCtx.globalAlpha = 0.88;
        targetCtx.lineCap = 'butt'; targetCtx.lineWidth = stroke.width * 2.2;
        targetCtx.setTransform(1, 0, 0.45, 1, 0, 0);
      } else if (stroke.type === 'dotted') {
        targetCtx.globalCompositeOperation = 'source-over'; targetCtx.globalAlpha = 0.9;
        targetCtx.lineCap = 'round'; targetCtx.lineWidth = stroke.width;
        targetCtx.setLineDash([stroke.width * 0.1, stroke.width * 2.5]);
      } else if (stroke.type === 'brush') {
        targetCtx.globalCompositeOperation = 'source-over'; targetCtx.globalAlpha = 0.72;
        targetCtx.lineCap = 'round'; targetCtx.lineWidth = stroke.width * 3.5;
        targetCtx.shadowBlur = stroke.width * 3; targetCtx.shadowColor = stroke.color;
      } else {
        targetCtx.globalCompositeOperation = 'source-over'; targetCtx.lineCap = 'round'; targetCtx.lineWidth = stroke.width;
      }
      targetCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
      if (stroke.type === 'ruler') {
        const last = stroke.points[stroke.points.length - 1]; targetCtx.lineTo(last.x, last.y);
      } else {
        for (let i = 1; i < stroke.points.length - 1; i++) {
          const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
          const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
          targetCtx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
        }
        const last = stroke.points[stroke.points.length - 1]; targetCtx.lineTo(last.x, last.y);
      }
      targetCtx.stroke(); targetCtx.restore();
    };

    currentStrokes.forEach(s => renderStroke(s, sctx));
    shapes.forEach((shape) => {
      sctx.save(); sctx.strokeStyle = shape.color; sctx.fillStyle = shape.color; sctx.lineWidth = 2;
      sctx.translate(shape.x, shape.y); if (shape.rotation) sctx.rotate((shape.rotation * Math.PI) / 180);
      const w = shape.width, h = shape.height;
      switch (shape.type) {
        case 'circle':    sctx.beginPath(); sctx.arc(0, 0, w / 2, 0, Math.PI * 2); sctx.fill(); break;
        case 'square':    sctx.fillRect(-w / 2, -h / 2, w, h); break;
        case 'rectangle': sctx.fillRect(-w / 2, -h / 2, w, h); break;
        case 'triangle':  sctx.beginPath(); sctx.moveTo(0, -h / 2); sctx.lineTo(-w / 2, h / 2); sctx.lineTo(w / 2, h / 2); sctx.closePath(); sctx.fill(); break;
        case 'diamond':   sctx.beginPath(); sctx.moveTo(0, -h / 2); sctx.lineTo(w / 2, 0); sctx.lineTo(0, h / 2); sctx.lineTo(-w / 2, 0); sctx.closePath(); sctx.fill(); break;
        case 'hexagon': { sctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3 - Math.PI / 6; i === 0 ? sctx.moveTo(Math.cos(a) * w / 2, Math.sin(a) * h / 2) : sctx.lineTo(Math.cos(a) * w / 2, Math.sin(a) * h / 2); } sctx.closePath(); sctx.fill(); break; }
        case 'pentagon': { sctx.beginPath(); for (let i = 0; i < 5; i++) { const a = (i * 2 * Math.PI) / 5 - Math.PI / 2; i === 0 ? sctx.moveTo(Math.cos(a) * w / 2, Math.sin(a) * h / 2) : sctx.lineTo(Math.cos(a) * w / 2, Math.sin(a) * h / 2); } sctx.closePath(); sctx.fill(); break; }
        case 'star': { sctx.beginPath(); for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2; const r = i % 2 === 0 ? w / 2 : w / 4; i === 0 ? sctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : sctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } sctx.closePath(); sctx.fill(); break; }
        case 'heart': { sctx.beginPath(); sctx.moveTo(0, -h/4); sctx.bezierCurveTo(w/2, -h/2, w/2, h/4, 0, h/2); sctx.bezierCurveTo(-w/2, h/4, -w/2, -h/2, 0, -h/4); sctx.closePath(); sctx.fill(); break; }
        case 'crescent': { sctx.beginPath(); sctx.arc(0, 0, w / 2, 0, Math.PI * 2, false); sctx.arc(w * 0.22, -h * 0.08, w * 0.42, 0, Math.PI * 2, true); sctx.fill('evenodd'); break; }
        case 'line':  sctx.beginPath(); sctx.moveTo(-w / 2, 0); sctx.lineTo(w / 2, 0); sctx.stroke(); break;
        case 'arrow': { const aw = Math.min(15, w * 0.2); sctx.beginPath(); sctx.moveTo(-w / 2, 0); sctx.lineTo(w / 2 - aw, 0); sctx.moveTo(w / 2 - aw, 0); sctx.lineTo(w / 2 - aw - 6, -aw * 0.5); sctx.moveTo(w / 2 - aw, 0); sctx.lineTo(w / 2 - aw - 6, aw * 0.5); sctx.stroke(); break; }
        // New shapes
        case 'ellipse': sctx.beginPath(); sctx.ellipse(0, 0, w / 2, h / 3, 0, 0, Math.PI * 2); sctx.fill(); break;
        case 'cross': { const t = w * 0.28; sctx.fillRect(-t/2, -h/2, t, h); sctx.fillRect(-w/2, -t/2, w, t); break; }
        case 'octagon': { sctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; i === 0 ? sctx.moveTo(Math.cos(a)*w/2, Math.sin(a)*h/2) : sctx.lineTo(Math.cos(a)*w/2, Math.sin(a)*h/2); } sctx.closePath(); sctx.fill(); break; }
        case 'trapezoid': { sctx.beginPath(); sctx.moveTo(-w*0.3, -h/2); sctx.lineTo(w*0.3, -h/2); sctx.lineTo(w/2, h/2); sctx.lineTo(-w/2, h/2); sctx.closePath(); sctx.fill(); break; }
        case 'cloud': {
          sctx.beginPath();
          sctx.arc(-w*0.2, h*0.1, w*0.22, 0, Math.PI*2);
          sctx.arc(w*0.1,  -h*0.05, w*0.26, 0, Math.PI*2);
          sctx.arc(w*0.32,  h*0.1, w*0.18, 0, Math.PI*2);
          sctx.arc(-w*0.08, h*0.18, w*0.20, 0, Math.PI*2);
          sctx.fill(); break;
        }
        case 'lightning': { sctx.beginPath(); sctx.moveTo(w*0.1,-h/2); sctx.lineTo(-w*0.15,0); sctx.lineTo(w*0.05,0); sctx.lineTo(-w*0.1,h/2); sctx.lineTo(w*0.2,-h*0.05); sctx.lineTo(0,-h*0.05); sctx.closePath(); sctx.fill(); break; }
        case 'sun': {
          sctx.beginPath(); sctx.arc(0, 0, w*0.28, 0, Math.PI*2); sctx.fill();
          for (let i = 0; i < 8; i++) { const a = (i/8)*Math.PI*2; sctx.beginPath(); sctx.moveTo(Math.cos(a)*w*0.33, Math.sin(a)*w*0.33); sctx.lineTo(Math.cos(a)*w*0.48, Math.sin(a)*w*0.48); sctx.lineWidth=3; sctx.stroke(); }
          break;
        }
        case 'speech_bubble': {
          const r = w*0.12;
          sctx.beginPath(); sctx.roundRect(-w/2, -h/2, w, h*0.75, r); sctx.fill();
          sctx.beginPath(); sctx.moveTo(-w*0.15, h*0.25); sctx.lineTo(-w*0.05, h/2); sctx.lineTo(w*0.15, h*0.25); sctx.fill(); break;
        }
        case 'double_arrow': { const aw=Math.min(12,w*0.18); sctx.beginPath(); sctx.moveTo(-w/2+aw,0); sctx.lineTo(w/2-aw,0); [w/2-aw,-(w/2-aw)].forEach(x => { sctx.moveTo(x,0); sctx.lineTo(x+(x>0?-aw:aw),-aw*0.5); sctx.moveTo(x,0); sctx.lineTo(x+(x>0?-aw:aw),aw*0.5); }); sctx.stroke(); break; }
        case 'bracket': { sctx.beginPath(); sctx.moveTo(w*0.2,-h/2); sctx.lineTo(0,-h/2); sctx.lineTo(0,h/2); sctx.lineTo(w*0.2,h/2); sctx.stroke(); break; }
        case 'star6': { sctx.beginPath(); for (let i=0;i<12;i++){const a=(i*Math.PI)/6-Math.PI/2;const r=i%2===0?w/2:w/4;i===0?sctx.moveTo(Math.cos(a)*r,Math.sin(a)*r):sctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);} sctx.closePath(); sctx.fill(); break; }
        case 'semicircle': { sctx.beginPath(); sctx.arc(0,0,w/2,Math.PI,0); sctx.closePath(); sctx.fill(); break; }
        case 'curved_arrow': { const aw2=Math.min(14,w*0.18); sctx.beginPath(); sctx.moveTo(-w/2,h/4); sctx.quadraticCurveTo(0,-h/2,w/2,h/4); sctx.stroke(); sctx.beginPath(); sctx.moveTo(w/2,h/4); sctx.lineTo(w/2-aw2,h/4-aw2*0.8); sctx.moveTo(w/2,h/4); sctx.lineTo(w/2-aw2*0.6,h/4+aw2*0.9); sctx.stroke(); break; }
        case 'emoji': {
          if (shape.emoji) {
            sctx.globalAlpha = 1;
            sctx.font = `${w}px serif`;
            sctx.textAlign = 'center';
            sctx.textBaseline = 'middle';
            sctx.fillStyle = 'black';
            sctx.fillText(shape.emoji, 0, 0);
          }
          break;
        }
      }
      sctx.restore();
    });
  }, [currentStrokes, shapes, paperColor]);

  const SIZE_PRESETS = [
    { label: lang === 'fr' ? 'Fin' : 'رفيع',    value: 1  },
    { label: lang === 'fr' ? 'Normal' : 'عادي',  value: 3  },
    { label: lang === 'fr' ? 'Épais' : 'سميك',   value: 8  },
    { label: lang === 'fr' ? 'Gros' : 'كبير',    value: 15 },
    { label: lang === 'fr' ? 'XL' : 'ضخم',       value: 25 },
  ];

  const getBrandColorForPaper = (_pc: string) => '#8B2635';

  const getColoredStickerSvg = (svg: string, pc: string) => {
    const brandColor = getBrandColorForPaper(pc);
    let colored = svg
      .replace('<svg ', `<svg width="60" height="60" `)
      .replace(/currentColor/g, brandColor);
    return colored;
  };

  const getStrokeStyle = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.color === 'pattern:dots') {
      const pc = document.createElement('canvas'); pc.width = 10; pc.height = 10;
      const pctx = pc.getContext('2d')!;
      pctx.fillStyle = '#8B2635'; pctx.beginPath(); pctx.arc(5, 5, 2, 0, Math.PI * 2); pctx.fill();
      return ctx.createPattern(pc, 'repeat') || '#8B2635';
    }
    if (stroke.color === 'pattern:stripes') {
      const pc = document.createElement('canvas'); pc.width = 10; pc.height = 10;
      const pctx = pc.getContext('2d')!;
      pctx.strokeStyle = '#D4AF37'; pctx.lineWidth = 2; pctx.beginPath(); pctx.moveTo(0, 0); pctx.lineTo(10, 10); pctx.stroke();
      return ctx.createPattern(pc, 'repeat') || '#D4AF37';
    }
    if (stroke.color === 'pattern:crosses') {
      const pc = document.createElement('canvas'); pc.width = 12; pc.height = 12;
      const pctx = pc.getContext('2d')!;
      pctx.strokeStyle = '#2A9D8F'; pctx.lineWidth = 1.5;
      pctx.beginPath(); pctx.moveTo(6, 0); pctx.lineTo(6, 12);
      pctx.moveTo(0, 6); pctx.lineTo(12, 6); pctx.stroke();
      return ctx.createPattern(pc, 'repeat') || '#2A9D8F';
    }
    const gradients: Record<string, [string, string]> = {
      'gradient:gold-red':    ['#D4AF37', '#8B2635'],
      'gradient:blue-cyan':   ['#1D3557', '#A8DADC'],
      'gradient:purple-pink': ['#6D597A', '#FF99C8'],
      'gradient:green-teal':  ['#2D6A4F', '#95D5B2'],
      'gradient:sunset':      ['#F4A261', '#E76F51'],
      'gradient:ocean':       ['#03045E', '#90E0EF'],
    };
    if (gradients[stroke.color]) {
      const [c1, c2] = gradients[stroke.color];
      const grad = ctx.createLinearGradient(0, 0, 1000, 1400);
      grad.addColorStop(0, c1); grad.addColorStop(1, c2);
      return grad;
    }
    return stroke.color;
  };

  useEffect(() => {
    if (activePage) {
      setCurrentStrokes(activePage.strokes || []);
      setShapes((activePage.shapes as any) || []);
      setPageHeight(activePage.height || 5000);
      setPaperStyle(activePage.paperStyle || 'lines');
      setPaperColor((activePage as any).paperColor || '#fdfcf8');
      setUndoStack([]);
      setRedoStack([]);
    }
  }, [activePageId]);

  useEffect(() => {
    if (!activePageId) return;
    const username = (userData.settings.username || '').trim();
    const message = username.toLowerCase() === 'rahima'
      ? (lang === 'fr' ? `Bienvenue Rahima, votre Diftar est prêt.` : `مرحبا يا رحيمة، دفترك جاهز للكتابة.`)
      : (lang === 'fr' ? `Bienvenue ${username}, votre Diftar est prêt.` : `أهلاً ${username}، دفترك جاهز.`);

    setToastMessage(message);
    const timer = window.setTimeout(() => setToastMessage(null), 4500);
    return () => window.clearTimeout(timer);
  }, [activePageId, lang, userData.settings.username]);

  const drawPaperLines = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (paperStyle === 'blank') return;
    const lineColor = '#8B263512';
    const marginColor = '#8B263528';

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;

    if (paperStyle === 'lines' || paperStyle === 'grid') {
      for (let y = 60; y < h; y += 32) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    }
    if (paperStyle === 'grid') {
      for (let x = 0; x < w; x += 32) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    }
    if (paperStyle === 'dots') {
      for (let x = 32; x < w; x += 32) {
        for (let y = 32; y < h; y += 32) { ctx.moveTo(x, y); ctx.arc(x, y, 0.7, 0, Math.PI * 2); }
      }
    }
    if (paperStyle === 'arabesque') {
      for (let y = 60; y < h; y += 32) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      for (let y = 80; y < h; y += 96) {
        ctx.save();
        ctx.strokeStyle = '#D4AF3720';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < w; x += 20) {
          ctx.moveTo(x, y); ctx.lineTo(x + 10, y - 10); ctx.lineTo(x + 20, y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
    if (paperStyle === 'diamond') {
      // Diagonal grid (45°) — two sets of parallel lines
      const step = 32;
      for (let d = -h; d < w + h; d += step) {
        ctx.moveTo(d, 0); ctx.lineTo(d + h, h);
        ctx.moveTo(d, 0); ctx.lineTo(d - h, h);
      }
    }
    if (paperStyle === 'hexagonal') {
      // Honeycomb outlines
      const r = 22, hexH = r * Math.sqrt(3);
      for (let row = 0; row * hexH * 0.75 < h + r; row++) {
        for (let col = 0; col * r * 1.5 < w + r * 2; col++) {
          const cx2 = col * r * 1.5 + r + (row % 2 === 1 ? r * 0.75 : 0);
          const cy2 = row * hexH * 0.75 + hexH / 2;
          ctx.moveTo(cx2 + r, cy2);
          for (let i = 1; i <= 6; i++) {
            const a = (Math.PI / 3) * i;
            ctx.lineTo(cx2 + r * Math.cos(a), cy2 + r * Math.sin(a));
          }
        }
      }
    }
    if (paperStyle === 'music') {
      // Music staff: groups of 5 lines, 8px apart, with 28px gap between groups
      const staffGap = 8;
      const groupGap = 40;
      let y = 60;
      while (y < h) {
        for (let l = 0; l < 5; l++) {
          ctx.moveTo(0, y + l * staffGap);
          ctx.lineTo(w, y + l * staffGap);
        }
        y += 5 * staffGap + groupGap;
      }
    }
    if (paperStyle === 'floral') {
      const spacing = 48;
      ctx.fillStyle = lineColor;
      for (let fy = spacing; fy < h; fy += spacing) {
        for (let fx = spacing; fx < w; fx += spacing) {
          for (let p = 0; p < 5; p++) {
            const a = (p / 5) * Math.PI * 2 - Math.PI / 2;
            const px = fx + Math.cos(a) * 7, py = fy + Math.sin(a) * 7;
            ctx.save(); ctx.beginPath(); ctx.ellipse(px, py, 5, 2.5, a, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          }
          ctx.beginPath(); ctx.arc(fx, fy, 1.8, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    if (paperStyle === 'islamic_star') {
      const ss = 28, sp = 58;
      for (let fy = sp / 2; fy < h + sp; fy += sp * 0.866) {
        const offset = (Math.round(fy / (sp * 0.866)) % 2) * sp / 2;
        for (let fx = offset; fx < w + sp; fx += sp) {
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 - Math.PI / 8;
            const r = i % 2 === 0 ? ss * 0.5 : ss * 0.22;
            i === 0 ? ctx.moveTo(fx + Math.cos(a) * r, fy + Math.sin(a) * r)
                    : ctx.lineTo(fx + Math.cos(a) * r, fy + Math.sin(a) * r);
          }
          ctx.closePath(); ctx.stroke();
        }
      }
    }
    if (paperStyle === 'waves') {
      for (let fy = 40; fy < h; fy += 28) {
        ctx.beginPath(); ctx.moveTo(0, fy);
        for (let fx = 0; fx < w; fx += 20) {
          ctx.quadraticCurveTo(fx + 10, fy - 8, fx + 20, fy);
        }
        ctx.stroke();
      }
    }
    if (paperStyle === 'leaves') {
      ctx.fillStyle = lineColor;
      const lsp = 52;
      for (let fy = lsp; fy < h; fy += lsp) {
        for (let fx = lsp; fx < w; fx += lsp) {
          const offset = (Math.floor(fy / lsp) % 2) * lsp / 2;
          const lx = fx + offset - lsp / 2;
          ctx.save(); ctx.translate(lx, fy); ctx.rotate(Math.PI / 6);
          ctx.beginPath(); ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }
    }
    if (paperStyle === 'crosses') {
      ctx.fillStyle = lineColor;
      const csp = 28;
      for (let fy = csp; fy < h; fy += csp) {
        for (let fx = csp; fx < w; fx += csp) {
          ctx.fillRect(fx - 3, fy - 0.8, 6, 1.6);
          ctx.fillRect(fx - 0.8, fy - 3, 1.6, 6);
        }
      }
    }
    if (paperStyle === 'triangles') {
      const ts = 28;
      for (let row = 0; row * ts < h + ts; row++) {
        for (let col = 0; col * ts < w + ts; col++) {
          const bx = col * ts, by = row * ts;
          ctx.beginPath();
          if ((row + col) % 2 === 0) { ctx.moveTo(bx, by + ts); ctx.lineTo(bx + ts, by + ts); ctx.lineTo(bx + ts / 2, by); }
          else { ctx.moveTo(bx, by); ctx.lineTo(bx + ts, by); ctx.lineTo(bx + ts / 2, by + ts); }
          ctx.closePath(); ctx.stroke();
        }
      }
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = marginColor;
    ctx.lineWidth = 1.5;
    const marginX = lang === 'ar' ? w - 80 : 80;
    ctx.moveTo(marginX, 0); ctx.lineTo(marginX, h);
    ctx.stroke();

    ctx.restore();
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = paperColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPaperLines(ctx, canvas.width, canvas.height);

    if (!offscreenRef.current) offscreenRef.current = document.createElement('canvas');
    const strokesLayer = offscreenRef.current;
    if (strokesLayer.width !== canvas.width || strokesLayer.height !== canvas.height) {
      strokesLayer.width = canvas.width;
      strokesLayer.height = canvas.height;
    }
    const sctx = strokesLayer.getContext('2d')!;
    sctx.clearRect(0, 0, strokesLayer.width, strokesLayer.height);

    if (staticBufferRef.current) {
      sctx.drawImage(staticBufferRef.current, 0, 0);
    }

    if (activeStrokeRef.current) {
      const stroke = activeStrokeRef.current;
      sctx.save();
      if (stroke.type === 'spray') {
        sctx.fillStyle = stroke.color; sctx.globalAlpha = 0.75;
        stroke.points.forEach((point: {x:number;y:number}, pi: number) => {
          const base = ((point.x * 97 + point.y * 31 + pi * 17) | 0);
          for (let i = 0; i < 10; i++) {
            const h1 = ((base + i * 1103515245 + 12345) >>> 0) % 1000;
            const h2 = ((h1 * 22695477 + 1) >>> 0) % 1000;
            sctx.beginPath();
            sctx.arc(point.x + Math.cos((h1/1000)*Math.PI*2)*(h2/1000)*stroke.width*2.5, point.y + Math.sin((h1/1000)*Math.PI*2)*(h2/1000)*stroke.width*2.5, 0.7, 0, Math.PI*2);
            sctx.fill();
          }
        });
      } else {
        sctx.beginPath();
        if (stroke.type === 'eraser') {
          sctx.globalCompositeOperation = 'destination-out';
          sctx.strokeStyle = 'rgba(0,0,0,1)';
          sctx.lineCap = 'round';
          sctx.lineWidth = stroke.width * 4;
        } else {
          sctx.strokeStyle = getStrokeStyle(sctx, stroke);
          sctx.lineJoin = 'round';
          if (stroke.type === 'highlighter') {
            sctx.globalCompositeOperation = 'multiply'; sctx.globalAlpha = 0.4; sctx.lineCap = 'square'; sctx.lineWidth = stroke.width * 2.5;
          } else if (stroke.type === 'fountain-pen') {
            sctx.globalCompositeOperation = 'source-over'; sctx.lineCap = 'butt'; sctx.lineWidth = stroke.width * 1.2; sctx.setTransform(1, 0, 0.4, 1, 0, 0);
          } else if (stroke.type === 'chalk') {
            sctx.globalCompositeOperation = 'source-over'; sctx.globalAlpha = 0.75; sctx.lineCap = 'round'; sctx.lineWidth = stroke.width * 2; sctx.setLineDash([2, 3]); sctx.shadowBlur = 4; sctx.shadowColor = stroke.color;
          } else if (stroke.type === 'marker') {
            sctx.globalCompositeOperation = 'source-over'; sctx.globalAlpha = 0.65; sctx.lineCap = 'square'; sctx.lineWidth = stroke.width * 2;
          } else if (stroke.type === 'neon') {
            sctx.globalCompositeOperation = 'source-over'; sctx.lineCap = 'round'; sctx.lineWidth = stroke.width; sctx.shadowBlur = stroke.width * 5; sctx.shadowColor = stroke.color; sctx.globalAlpha = 0.95;
          } else if (stroke.type === 'pencil') {
            sctx.globalCompositeOperation = 'source-over'; sctx.globalAlpha = 0.55; sctx.lineCap = 'round'; sctx.lineWidth = stroke.width * 0.85; sctx.setLineDash([1, 1.2]);
          } else if (stroke.type === 'watercolor') {
            sctx.globalCompositeOperation = 'source-over'; sctx.globalAlpha = 0.16; sctx.lineCap = 'round'; sctx.lineWidth = stroke.width * 5; sctx.shadowBlur = stroke.width * 4; sctx.shadowColor = stroke.color;
          } else if (stroke.type === 'calligraphy') {
            sctx.globalCompositeOperation = 'source-over'; sctx.globalAlpha = 0.88; sctx.lineCap = 'butt'; sctx.lineWidth = stroke.width * 2.2; sctx.setTransform(1, 0, 0.45, 1, 0, 0);
          } else if (stroke.type === 'dotted') {
            sctx.globalCompositeOperation = 'source-over'; sctx.globalAlpha = 0.9; sctx.lineCap = 'round'; sctx.lineWidth = stroke.width; sctx.setLineDash([stroke.width * 0.1, stroke.width * 2.5]);
          } else if (stroke.type === 'brush') {
            sctx.globalCompositeOperation = 'source-over'; sctx.globalAlpha = 0.72; sctx.lineCap = 'round'; sctx.lineWidth = stroke.width * 3.5; sctx.shadowBlur = stroke.width * 3; sctx.shadowColor = stroke.color;
          } else {
            sctx.globalCompositeOperation = 'source-over'; sctx.lineCap = 'round'; sctx.lineWidth = stroke.width;
          }
        }
        if (stroke.points.length > 0) {
          sctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          if (stroke.type === 'ruler') {
            const last = stroke.points[stroke.points.length - 1]; sctx.lineTo(last.x, last.y);
          } else {
            for (let i = 1; i < stroke.points.length - 1; i++) {
              const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
              const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
              sctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
            }
            const last = stroke.points[stroke.points.length - 1]; sctx.lineTo(last.x, last.y);
          }
          sctx.stroke();
        }
      }
      sctx.restore();
    }

    ctx.drawImage(strokesLayer, 0, 0);
  };

  useEffect(() => { updateStaticBuffer(); redrawCanvas(); }, [currentStrokes, shapes, paperColor, paperStyle, pageHeight]);

  // Sync stylusMode boolean → ref (readable inside pointer handlers)
  useEffect(() => { stylusModeRef.current = stylusMode; }, [stylusMode]);

  // Deselect shape when switching away from select tool
  useEffect(() => { if (tool !== 'select') setSelectedShapeId(null); }, [tool]);

  // Clean up stale selection when shapes array changes (undo/redo)
  useEffect(() => {
    if (selectedShapeId && !shapes.find(s => s.id === selectedShapeId)) setSelectedShapeId(null);
  }, [shapes, selectedShapeId]);


  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !activePageId) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 800) setPageHeight(prev => prev + 1000);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activePageId]);

  useEffect(() => { if (penEverDetected) { setStylusMode(true); } }, [penEverDetected]);

  // Le message ne s'affiche qu'à la toute première détection sur cet appareil
  const penSeenAtMount = useRef(penSeenBefore);
  useEffect(() => {
    if (!penEverDetected || penSeenAtMount.current) return;
    setToastMessage(lang === 'fr' ? 'Stylet détecté : le doigt fait défiler, le stylet dessine' : 'تم اكتشاف القلم: الإصبع للتمرير والقلم للرسم');
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [penEverDetected, lang]);

  const getCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    // Always fetch a live rect so scroll offset is never stale
    const rect = canvas.getBoundingClientRect();
    rectCacheRef.current = rect;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleCanvasClick = (e: React.PointerEvent) => {
    if (activeShapeTypeRef.current) {
      const { x, y } = getCoords(e);
      setUndoStack(prev => [...prev, { strokes: currentStrokes, shapes }]);
      setRedoStack([]);
      const type = activeShapeTypeRef.current;
      const newShape: Shape = {
        id: Date.now().toString(),
        type,
        x, y,
        width:  type === 'rectangle' ? shapeSize * 1.7 : type === 'line' || type === 'arrow' ? shapeSize * 2 : shapeSize,
        height: type === 'rectangle' ? shapeSize * 0.7 : shapeSize,
        color: color,
      };
      setShapes(prev => [...prev, newShape]);
      setActiveShapeTypeWithRef(null);
    }
  };

  const startDrawing = (e: React.PointerEvent) => {
    if (e.pointerType === 'pen' && !penEverDetected) {
      setPenEverDetected(true);
      stylusModeRef.current = true;
      try { localStorage.setItem(PEN_KEY, '1'); } catch { /* stockage indisponible */ }
    }
    // Palm rejection MUST be first — before any pointer tracking
    if (stylusModeRef.current && e.pointerType === 'touch') return;

    if (activeShapeTypeRef.current) { handleCanvasClick(e); return; }
    if (activeEmojiRef.current) {
      const { x, y } = getCoords(e);
      setUndoStack(prev => [...prev, { strokes: currentStrokes, shapes }]);
      setRedoStack([]);
      setShapes(prev => [...prev, {
        id: Date.now().toString(), type: 'emoji', x, y,
        width: shapeSize, height: shapeSize, color, emoji: activeEmojiRef.current!,
      }]);
      return;
    }

    // Select tool: hit-test shapes and prepare drag
    if (tool === 'select') {
      const { x, y } = getCoords(e);
      const hit = [...shapes].reverse().find(s =>
        Math.abs(s.x - x) < s.width / 2 + 10 &&
        Math.abs(s.y - y) < s.height / 2 + 10
      );
      if (hit) {
        setSelectedShapeId(hit.id);
        setUndoStack(prev => [...prev, { strokes: currentStrokes, shapes }]);
        setRedoStack([]);
        selectionDragRef.current = {
          startX: e.clientX, startY: e.clientY,
          shapeStartX: hit.x, shapeStartY: hit.y,
          shapeStartW: hit.width, shapeStartH: hit.height,
          shapeId: hit.id, handle: 'move',
          shapeStartRotation: hit.rotation || 0,
        };
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* le trait continue sans capture */ }
      } else {
        setSelectedShapeId(null);
        selectionDragRef.current = null;
      }
      return;
    }

    // Capture pointer so events continue even if finger/stylus leaves canvas
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* le trait continue sans capture */ }
    const { x, y } = getCoords(e);
    if (tool === 'eraser') {
      const idx = shapes.findIndex((s: Shape) => Math.sqrt(Math.pow(s.x - x, 2) + Math.pow(s.y - y, 2)) < 30);
      if (idx !== -1) {
        setUndoStack(prev => [...prev, { strokes: currentStrokes, shapes }]);
        setRedoStack([]);
        setShapes(prev => prev.filter((_, i) => i !== idx));
        return;
      }
    }
    isDrawingRef.current = true;
    setIsDrawing(true);
    activeStrokeRef.current = {
      points: [{ x, y }],
      color: tool === 'eraser' ? 'rgba(0,0,0,1)' : color,
      width: tool === 'highlighter' ? width * 5 : width,
      type: tool as Stroke['type'],
      timestamp: Date.now(),
    };
    setUndoStack(prev => [...prev, { strokes: currentStrokes, shapes }]);
    setRedoStack([]);
  };

  const drawFrameRef = useRef<number>(undefined);

  const draw = (e: React.PointerEvent) => {
    // Palm rejection MUST be first
    if (stylusModeRef.current && e.pointerType === 'touch') return;

    // Select tool: move the dragged shape
    if (tool === 'select') {
      const drag = selectionDragRef.current;
      if (!drag || drag.handle !== 'move') return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = rectCacheRef.current ?? canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const dx = (e.clientX - drag.startX) * scaleX;
      const dy = (e.clientY - drag.startY) * scaleY;
      setShapes(prev => prev.map(s =>
        s.id === drag.shapeId ? { ...s, x: drag.shapeStartX + dx, y: drag.shapeStartY + dy } : s
      ));
      return;
    }
    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = rectCacheRef.current ?? canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (activeStrokeRef.current.type === 'ruler') {
      // Ruler only needs the current position (replaces preview point)
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const start = activeStrokeRef.current.points[0];
      const dx = Math.abs(x - start.x), dy = Math.abs(y - start.y);
      activeStrokeRef.current.points = dx > dy ? [start, { x, y: start.y }] : [start, { x: start.x, y }];
    } else {
      // Use coalesced events to capture all sub-frame stylus/touch points
      const native = e.nativeEvent as PointerEvent;
      const coalesced = native.getCoalescedEvents?.() ?? [];
      const coalescedEvents = coalesced.length ? coalesced : [native];
      for (const ce of coalescedEvents) {
        activeStrokeRef.current.points.push({
          x: (ce.clientX - rect.left) * scaleX,
          y: (ce.clientY - rect.top) * scaleY,
        });
      }
    }

    if (!drawFrameRef.current) {
      drawFrameRef.current = requestAnimationFrame(() => {
        redrawCanvas();
        drawFrameRef.current = undefined;
      });
    }
  };

  const stopDrawing = (e?: React.PointerEvent) => {
    if (e && stylusModeRef.current && e.pointerType === 'touch') return;
    if (tool === 'select') { selectionDragRef.current = null; return; }
    if (!isDrawingRef.current || !activeStrokeRef.current) { isDrawingRef.current = false; setIsDrawing(false); return; }
    isDrawingRef.current = false; setIsDrawing(false);
    const finishedStroke = activeStrokeRef.current;
    setCurrentStrokes(prev => [...prev, finishedStroke]);
    activeStrokeRef.current = null;
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(s => [...s, { strokes: currentStrokes, shapes }]);
    setUndoStack(s => s.slice(0, -1));
    setCurrentStrokes(prev.strokes); setShapes(prev.shapes);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(s => [...s, { strokes: currentStrokes, shapes }]);
    setRedoStack(s => s.slice(0, -1));
    setCurrentStrokes(next.strokes); setShapes(next.shapes);
  };

  const exportPDF = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pageHeightNum = pdf.internal.pageSize.getHeight();
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    position -= pageHeightNum;

    while (position > -pdfHeight) {
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      position -= pageHeightNum;
    }
    pdf.save(`${activePage?.title || 'diftar'}.pdf`);
  };

  const savePage = () => {
    if (!activePageId) return;
    setIsSaving(true);
    setUserData((prev: UserData) => ({
      ...prev,
      diftarPages: prev.diftarPages.map(p =>
        p.id === activePageId
          ? { ...p, strokes: currentStrokes, shapes, height: pageHeight, paperStyle, paperColor: paperColor, lastSaved: Date.now() }
          : p
      ),
    }));
    setTimeout(() => setIsSaving(false), 1000);
  };

  useEffect(() => {
    const intervalSec = userData.settings?.autoSaveInterval;
    if (intervalSec === 0) return;
    const ms = intervalSec ? intervalSec * 1000 : 5000;
    const timer = setInterval(() => { if (activePageId) savePage(); }, ms);
    return () => clearInterval(timer);
  }, [currentStrokes, shapes, activePageId, userData.settings?.autoSaveInterval]);

  const createPage = (tpl?: typeof PAGE_TEMPLATES[0]) => {
    const template = tpl || PAGE_TEMPLATES[4];
    const newPage: DiftarPage = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      title: lang === 'fr' ? template.defaultTitle.fr : template.defaultTitle.ar,
      type: template.type as any,
      strokes: [], shapes: [],
      height: 5000,
      paperStyle: template.paperStyle,
      paperColor: template.paperColor,
      lastSaved: Date.now(),
    };
    setUserData((prev: UserData) => ({ ...prev, diftarPages: [newPage, ...prev.diftarPages] }));
    setShowTemplateModal(false);
    setActivePageId(newPage.id);
    onSaveNow?.({ ...userData, diftarPages: [newPage, ...userData.diftarPages] });
  };

  const renamePage = (id: string, newTitle: string) => {
    const updatedPages = userData.diftarPages.map(p => p.id === id ? { ...p, title: newTitle } : p);
    setUserData((prev: UserData) => ({ ...prev, diftarPages: prev.diftarPages.map(p => p.id === id ? { ...p, title: newTitle } : p) }));
    onSaveNow?.({ ...userData, diftarPages: updatedPages });
  };

  useEffect(() => {
    const updateScale = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        rectCacheRef.current = rect;
        setCanvasScale(rect.width / canvas.width);
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (canvasRef.current) ro.observe(canvasRef.current);
    window.addEventListener('resize', updateScale);

    // When the scroll container scrolls, canvas.getBoundingClientRect().top changes
    // but rectCacheRef stays frozen → new strokes land at the wrong position.
    // Fix: invalidate the rect cache on every scroll event.
    const sc = scrollContainerRef.current;
    const updateRectOnScroll = () => {
      if (canvasRef.current) rectCacheRef.current = canvasRef.current.getBoundingClientRect();
    };
    sc?.addEventListener('scroll', updateRectOnScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', updateScale);
      ro.disconnect();
      sc?.removeEventListener('scroll', updateRectOnScroll);
    };
  }, [activePageId]);

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, on: false });

  useEffect(() => {
    const container = scrollContainerRef.current; if (!container || !activePageId) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 800) setPageHeight(prev => prev + 1000);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activePageId]);

  useEffect(() => {
    // Le curseur de couleur ne suit la souris que sur la page, pas sur la barre ni les menus
    const handle = (e: MouseEvent) => { setCursorPos({ x: e.clientX, y: e.clientY, on: (e.target as HTMLElement)?.tagName === 'CANVAS' }); };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  useEffect(() => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return;
    const id = window.setTimeout(() => setRecentColors(prev => {
      if (prev.includes(color)) return prev;
      const next = [color, ...prev].slice(0, 6);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* stockage indisponible */ }
      return next;
    }), 700);
    return () => window.clearTimeout(id);
  }, [color]);

  const closeAllPanels = () => {
    setShowToolsMenu(false); setShowCustomizationMenu(false); setShowShapePicker(false);
    setShowPaperSettings(false); setShowEmojiPicker(false); setShowColorWheel(false); setShowMoreMenu(false);
    setActiveShapeTypeWithRef(null);
    activeEmojiRef.current = null; setActiveEmoji(null);
  };

  // ── Raccourcis clavier ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (activePageId) savePage(); return; }
      if (e.key === 'Escape') { closeAllPanels(); setSelectedShapeId(null); return; }
      if (!activePageId || e.ctrlKey || e.metaKey) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedShapeId) {
          e.preventDefault();
          setUndoStack(prev => [...prev, { strokes: currentStrokes, shapes }]);
          setRedoStack([]);
          setShapes(prev => prev.filter(s => s.id !== selectedShapeId));
          setSelectedShapeId(null);
          return;
        }
      }
      if (e.key === 's' || e.key === 'S') { setTool('select'); return; }
      if (e.key === '1') setTool('pen');
      if (e.key === '2') setTool('fountain-pen');
      if (e.key === '3') setTool('highlighter');
      if (e.key === '4') setTool('chalk');
      if (e.key === '5') setTool('ruler');
      if (e.key === '6') setTool('eraser');
      if (e.key === '7') setTool('spray');
      if (e.key === '8') setTool('marker');
      if (e.key === '9') setTool('neon');
      if (e.key === '0') setTool('pencil');
      if (e.key === '-') setTool('watercolor');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activePageId, undo, redo, savePage]);

  // ──────────────────────────────────
  // PAGE LIST VIEW (Gallery)
  // ──────────────────────────────────
  if (!activePageId) {
    const TYPE_COLORS: Record<string, string> = {
      tajweed:    '#8B2635',
      revision:   '#E63946',
      tafsir:     '#2D6A4F',
      dates:      '#7209B7',
      objectives: '#4361EE',
      vocab:      '#D4AF37',
      dua:        '#03045E',
      notes:      '#4A4E69',
      schema:     '#FB8500',
      custom:     '#B5838D',
    };

    const CARD_IMAGES: Record<string, string> = {
      tajweed:    '/diftar-cards/tajweed.png',
      revision:   '/diftar-cards/revision.png',
      tafsir:     '/diftar-cards/tafsir.png',
      dates:      '/diftar-cards/planning.png',
      objectives: '/diftar-cards/objectif.png',
      vocab:      '/diftar-cards/vocab.png',
      dua:        '/diftar-cards/doua.png',
      notes:      '/diftar-cards/notes.png',
      schema:     '/diftar-cards/schema.png',
      custom:     '/diftar-cards/libre.png',
    };

    const FILTER_LABELS = fr
      ? ['Toutes', 'Révision', 'Tafsir', 'Planning', 'Objectifs', 'Vocab', "Dou'a", 'Notes', 'Tajweed', 'Schéma', 'Libre']
      : ['الكل', 'مراجعة', 'تفسير', 'تخطيط', 'أهداف', 'مفردات', 'دعاء', 'ملاحظات', 'تجويد', 'مخطط', 'حر'];
    const FILTER_TYPES = [null, 'revision', 'tafsir', 'dates', 'objectives', 'vocab', 'dua', 'notes', 'tajweed', 'schema', 'custom'];

    const filteredPages = (galleryFilter
      ? userData.diftarPages.filter(p => p.type === galleryFilter)
      : userData.diftarPages
    ).filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const getTimeAgo = (ts: number) => {
      const diff = Date.now() - ts;
      const mins = Math.floor(diff / 60000);
      if (mins < 2) return fr ? 'à l\'instant' : 'الآن';
      if (mins < 60) return fr ? `il y a ${mins} min` : `منذ ${mins} د`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return fr ? `il y a ${hrs}h` : `منذ ${hrs}س`;
      const days = Math.floor(hrs / 24);
      return fr ? `il y a ${days}j` : `منذ ${days}ي`;
    };

    return (
      <div ref={libraryContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: narrow ? '16px 14px 100px' : '26px 28px 36px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6 }}>
              {`${userData.diftarPages.length} ${fr ? 'pages · cahier numérique' : 'صفحة · دفتر رقمي'}`}
            </div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 32, margin: 0, color: t.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fr ? 'Diftar' : 'الدفتر'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => { setShowSearch(v => !v); if (showSearch) setSearchQuery(''); }}
              style={{ padding: '8px 14px', borderRadius: 8, background: showSearch ? `${t.accent}14` : t.card, border: `1px solid ${showSearch ? t.accent : t.line}`, color: showSearch ? t.accent : t.inkDim, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.15s' }}>
              <Icon d={Icons.search} size={12}/> {fr ? 'Rechercher' : 'بحث'}
            </button>
            <button onClick={() => setShowTemplateModal(true)}
              style={{ padding: '8px 16px', borderRadius: 8, background: t.accent, color: '#1a0f00', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none' }}>
              <Icon d={Icons.plus} size={13} color="#1a0f00"/> {fr ? 'Nouvelle page' : 'صفحة جديدة'}
            </button>
          </div>
        </div>

        {/* ── Filter chips ── */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_LABELS.map((label, i) => {
            const ft = FILTER_TYPES[i];
            const active = galleryFilter === ft;
            return (
              <button key={label} onClick={() => setGalleryFilter(active ? null : ft)}
                style={{
                  fontSize: 11, padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                  color: active ? t.ink : t.inkDim, fontWeight: active ? 500 : 400,
                  background: active ? `${t.accent}18` : t.bgSoft,
                  border: `1px solid ${active ? `${t.accent}33` : t.line}`,
                }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Search input ── */}
        {showSearch && (
          <div style={{ position: 'relative' }}>
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={fr ? 'Rechercher une page par titre…' : 'ابحث عن صفحة...'}
              style={{ width: '100%', padding: '10px 36px 10px 14px', background: t.card, border: `1px solid ${t.accent}40`, borderRadius: 10, color: t.ink, fontSize: 13, outline: 'none', boxShadow: `0 0 0 3px ${t.accent}10` }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: t.inkMute, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>
                ×
              </button>
            )}
          </div>
        )}

        {/* ── Empty state ── */}
        {userData.diftarPages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 22, color: t.inkDim, marginBottom: 8 }}>
              {fr ? 'Aucune page pour l\'instant.' : 'لا توجد صفحات بعد.'}
            </div>
            <button onClick={() => setShowTemplateModal(true)}
              style={{ marginTop: 12, padding: '10px 20px', borderRadius: 8, background: t.accent, color: '#1a0f00', fontWeight: 600, fontSize: 12, cursor: 'pointer', border: 'none' }}>
              {fr ? 'Créer une page' : 'إنشاء صفحة'}
            </button>
          </div>
        ) : filteredPages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: t.inkMute }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 20, color: t.inkDim }}>
              {fr ? `Aucun résultat pour « ${searchQuery} »` : `لا نتائج لـ « ${searchQuery} »`}
            </div>
            <button onClick={() => setSearchQuery('')}
              style={{ marginTop: 14, padding: '8px 18px', borderRadius: 8, background: t.card, border: `1px solid ${t.line}`, color: t.inkDim, fontSize: 12, cursor: 'pointer' }}>
              {fr ? 'Effacer la recherche' : 'مسح البحث'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : narrow ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 24 : narrow ? 20 : 32 }}>
            {filteredPages.map(page => {
              const c = TYPE_COLORS[page.type] || t.accent;
              const tpl = PAGE_TEMPLATES.find(tp => tp.type === page.type);
              const imgSrc = CARD_IMAGES[page.type] || '';
              return (
                <div key={page.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.4s ease' }}>

                  {/* Top label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, border: `1px solid ${t.line}`, padding: '3px 12px', borderRadius: 20, background: t.card, color: t.inkMute, flexShrink: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0 }}/>
                    {tpl?.[fr ? 'labelFr' : 'labelAr'] || page.type}
                  </div>

                  {/* Notebook card */}
                  <div style={{ position: 'relative', borderRadius: '4px 16px 16px 4px', overflow: 'hidden', border: `1px solid ${t.line}`, background: t.card, aspectRatio: '3 / 4.2', width: '100%', display: 'flex', boxShadow: '0 8px 25px rgba(0,0,0,0.06)', transition: 'transform 0.3s cubic-bezier(0.2, 1, 0.3, 1), box-shadow 0.3s ease', cursor: 'pointer' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-5px)'; el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = ''; el.style.boxShadow = '0 8px 25px rgba(0,0,0,0.06)'; }}
                  >
                    {/* Spine */}
                    <div style={{ width: 18, background: c, flexShrink: 0, boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.1)', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '35px 0' }}>
                        {[0,1,2,3,4].map(i => (
                          <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)' }}/>
                        ))}
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={() => setActivePageId(page.id)}>
                      {/* Cover image */}
                      <div style={{ flex: 1, overflow: 'hidden', background: `${c}10` }}>
                        <img src={imgSrc} alt={page.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                      </div>

                      {/* Footer — title input inside the book */}
                      <div style={{ padding: '12px 12px', background: t.card, borderTop: `2px solid ${c}25`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                          <input
                            id={`diftar-title-${page.id}`}
                            value={page.title}
                            onClick={e => e.stopPropagation()}
                            onChange={e => renamePage(page.id, e.target.value)}
                            style={{ width: '100%', border: 'none', borderBottom: '1px solid transparent', background: 'transparent', fontFamily: 'Fraunces, serif', fontSize: narrow ? 12 : 14, fontWeight: 600, fontStyle: 'italic', color: c, outline: 'none', padding: 0, cursor: 'text', transition: 'border-color 0.2s' }}
                            onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = `${c}50`; }}
                            onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = 'transparent'; }}
                          />
                          <div style={{ fontSize: 9.5, color: t.inkMute, marginTop: 2 }}>
                            {fr ? 'Modifié ' : 'عُدِّل '}{getTimeAgo(page.lastSaved)}
                          </div>
                        </div>
                        {tpl && <span style={{ opacity: 0.45, flexShrink: 0, display: 'inline-flex' }}><Icon d={(Icons as Record<string, React.ReactNode>)[tpl.icon]} size={15}/></span>}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons below the card */}
                  <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 8, width: '100%' }}>
                    <button onClick={() => setActivePageId(page.id)}
                      style={{ background: 'transparent', border: '1px solid rgba(45,106,79,0.2)', padding: '5px 14px', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2D6A4F', cursor: 'pointer', borderRadius: 20, transition: 'all 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(45,106,79,0.07)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(45,106,79,0.4)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(45,106,79,0.2)'; }}
                    >
                      {fr ? 'Entrer' : 'دخول'}
                    </button>
                    <button
                      onClick={() => { const el = document.getElementById(`diftar-title-${page.id}`) as HTMLInputElement | null; el?.focus(); el?.select(); }}
                      style={{ background: 'transparent', border: 'none', padding: '4px 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.inkMute, cursor: 'pointer', borderRadius: 4, transition: 'color 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.ink; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.inkMute; }}
                    >
                      {fr ? 'Renommer' : 'إعادة تسمية'}
                    </button>
                    <button onClick={e => { e.stopPropagation(); setShowConfirmDelete(page.id); }}
                      style={{ background: 'transparent', border: 'none', padding: '4px 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.inkMute, cursor: 'pointer', borderRadius: 4, transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8B2635'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,38,53,0.05)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.inkMute; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      {fr ? 'Supprimer' : 'حذف'}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add card */}
            <div onClick={() => setShowTemplateModal(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 7, height: 7, opacity: 0, marginBottom: 12 }}/>
              <div style={{ background: 'transparent', border: `1.5px dashed ${t.line}`, borderRadius: '4px 16px 16px 4px', aspectRatio: '3 / 4.2', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: t.inkDim, cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = t.accent; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = t.line; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.cardElev, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={Icons.plus} size={18} color={t.accent}/>
                </div>
                <span style={{ fontSize: 12 }}>{fr ? 'Nouvelle page' : 'صفحة جديدة'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Template Modal */}
        {showTemplateModal && (
          <div
            onClick={() => setShowTemplateModal(false)}
            style={{ position: 'fixed', inset: 0, backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: `${t.accent}40` }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: t.bgSoft, border: `1px solid ${t.line}`, borderRadius: 24, padding: narrow ? 20 : 32, maxWidth: 520, width: '100%', display: 'flex', flexDirection: 'column', gap: 24, maxHeight: '85vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 22, color: t.accent }}>
                    {fr ? 'Choisir un modèle' : 'اختر نموذجاً'}
                  </div>
                  <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700, color: t.inkMute, marginTop: 4 }}>
                    {fr ? 'Sélectionnez le type de page' : 'اختر نوع الصفحة'}
                  </div>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${t.accent}14`, color: t.inkMute, border: 'none', cursor: 'pointer', fontSize: 16 }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: narrow ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 12 }}>
                {PAGE_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.type}
                    onClick={() => createPage(tpl)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 20, borderRadius: 16, border: `1px solid ${t.line}`, background: tpl.paperColor, cursor: 'pointer', transition: 'border-color 0.15s', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = t.accent)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = t.line)}
                  >
                    <span style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${t.accent}14`, color: t.accent }}><Icon d={(Icons as Record<string, React.ReactNode>)[tpl.icon]} size={22}/></span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: t.accent }}>
                        {fr ? tpl.labelFr : tpl.labelAr}
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 500, color: t.inkMute, marginTop: 3 }}>
                        {fr ? tpl.descFr : tpl.descAr}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Confirm delete modal */}
        {showConfirmDelete && (
          <div style={{ position: 'fixed', inset: 0, backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: `${t.accent}33` }}>
            <div style={{ background: t.bgSoft, border: `1px solid ${t.line}`, borderRadius: 24, padding: 40, maxWidth: 360, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', fontSize: 28 }}>
                🗑
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 22, color: t.accent }}>
                {fr ? 'Supprimer la page ?' : 'حذف الصفحة؟'}
              </div>
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  style={{ flex: 1, padding: 12, borderRadius: 16, border: `1px solid ${t.line}`, color: t.inkMute, background: 'transparent', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                >
                  {fr ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  onClick={() => {
                    const pageIdToDelete = showConfirmDelete;
                    const updatedPages = userData.diftarPages.filter(p => p.id !== pageIdToDelete);
                    setUserData((prev: UserData) => ({ ...prev, diftarPages: prev.diftarPages.filter(p => p.id !== pageIdToDelete) }));
                    setShowConfirmDelete(null);
                    onSaveNow?.({ ...userData, diftarPages: updatedPages });
                  }}
                  style={{ flex: 1, padding: 12, borderRadius: 16, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                >
                  {fr ? 'Supprimer' : 'حذف'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Scroll-to-top (library view) ── */}
        {libraryScrolled && (
          <button
            onClick={() => (libraryContainerRef.current?.closest('main') as HTMLElement | null)?.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ position: 'fixed', bottom: isMobile ? 88 : 28, right: isMobile ? 16 : 28, zIndex: 100, width: 40, height: 40, borderRadius: '50%', background: t.card, border: `1px solid ${t.accent}30`, boxShadow: `0 4px 16px rgba(0,0,0,0.14)`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.accent, fontSize: 16, fontWeight: 900, transition: 'box-shadow 0.15s' }}
          >
            ↑
          </button>
        )}
      </div>
    );
  }

  // ── Scroll handle ────────────────────────────────────────────────────────
  const _sc      = scrollContainerRef.current;
  const thumbPct = _sc ? Math.max(8, Math.min(60, (_sc.clientHeight / _sc.scrollHeight) * 100)) : 12;

  // ──────────────────────────────────
  // CANVAS / EDITOR VIEW
  // ──────────────────────────────────
  const barBtn = (active: boolean): React.CSSProperties => ({
    width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    background: active ? `${t.accent}22` : 'transparent', color: active ? t.accent : t.inkDim,
  });
  const panelStyle: React.CSSProperties = { backdropFilter: 'blur(24px)', borderRadius: 22, boxShadow: '0 18px 48px -16px rgba(40,28,8,0.35)', border: `1px solid ${t.line}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 14, background: t.card };
  const panelTitle: React.CSSProperties = { fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkMute };
  const menuRow = (c: string): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 10px', borderRadius: 12, border: 'none', background: 'transparent', color: c, fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'start' });
  const zoomBy = (k: number) => {
    setZoom(z => (k === 0 ? 1 : Math.max(0.25, Math.min(4, z * k))));
    setShowZoomIndicator(true); window.clearTimeout(zoomTimerRef.current);
    zoomTimerRef.current = window.setTimeout(() => setShowZoomIndicator(false), 1500);
  };
  const toolLabel = (() => { const tl = TOOLS.find(x => x.id === tool); return tl ? (fr ? tl.fr : tl.ar) : ''; })();

  const btnStyle = (active: boolean): React.CSSProperties => active
    ? { background: t.accent, color: '#fff', border: 'none', borderRadius: '50%', padding: 10, cursor: 'pointer', fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }
    : { background: 'transparent', color: t.accent, border: 'none', borderRadius: '50%', padding: 10, cursor: 'pointer', fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: '100%' }}>

      {/* TOOLBAR */}
      <div ref={toolbarRef} style={{ flexShrink: 0, position: 'relative', zIndex: 10, padding: '8px 12px 0', display: 'flex', flexDirection: 'column', pointerEvents: 'none' }}>

        {/* Barre principale : retour et titre · outil et couleurs · actions */}
        <div style={{
          position: 'relative', zIndex: 45,
          backdropFilter: 'blur(24px)', borderRadius: 22, boxShadow: '0 6px 24px -8px rgba(40,28,8,0.22)',
          border: `1px solid ${t.line}`, padding: '6px 8px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, rowGap: 6,
          pointerEvents: 'auto', background: t.card,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <button onClick={() => { savePage(); setActivePageId(null); }} aria-label={fr ? 'Retour au Diftar' : 'رجوع'} style={barBtn(false)}>
              <Icon d={DI.back} size={20} style={{ transform: fr ? 'none' : 'scaleX(-1)' }}/>
            </button>
            <input
              value={activePage?.title}
              aria-label={fr ? 'Titre de la page' : 'عنوان الصفحة'}
              onChange={e => setUserData((prev: UserData) => ({ ...prev, diftarPages: prev.diftarPages.map(p => p.id === activePageId ? { ...p, title: e.target.value } : p) }))}
              style={{ fontFamily: 'Fraunces, serif', fontSize: 17, width: narrow ? 120 : 170, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: t.ink, padding: '0 4px' }}
            />
          </div>

          {/* Outil courant + couleurs récentes + insertions (sa propre ligne quand la barre ne tient pas) */}
          <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 3, borderRadius: 16, background: t.bgSoft, border: `1px solid ${t.lineSoft}`,
            ...(viewportW < 1280 ? { order: 3, width: '100%', overflowX: 'auto', justifyContent: viewportW < 700 ? 'flex-start' : 'center' } : {}) }}>
            <button onClick={() => { const o = showToolsMenu; closeAllPanels(); setShowToolsMenu(!o); }} aria-expanded={showToolsMenu}
              title={fr ? 'Stylos et outils' : 'الأقلام والأدوات'}
              style={{ height: 44, padding: '0 10px 0 4px', borderRadius: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                background: showToolsMenu ? t.card : 'transparent', boxShadow: showToolsMenu ? `0 0 0 1.5px ${t.accent}` : 'none', color: t.ink }}>
              <span style={{ width: 52, display: 'flex', justifyContent: 'center' }}>
                {tool === 'select' ? <Icon d={DI.select} size={20}/> : <ToolPreview id={tool} color={color}/>}
              </span>
              {!narrow && <span style={{ fontSize: 13, fontWeight: 600 }}>{toolLabel}</span>}
            </button>
            <span style={{ width: 1, height: 26, background: t.line, margin: '0 2px' }}/>
            {recentColors.map(c => (
              <button key={c} onClick={() => { setColor(c); if (tool === 'eraser' || tool === 'select') setTool('pen'); }} aria-label={fr ? `Couleur ${c}` : c} aria-pressed={color === c}
                style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: c, flexShrink: 0,
                  boxShadow: color === c ? `0 0 0 2px ${t.card}, 0 0 0 4px ${t.accent}` : 'inset 0 0 0 1px rgba(0,0,0,0.12)', transform: color === c ? 'scale(1.06)' : 'none' }}/>
            ))}
            <button onClick={() => { const o = showCustomizationMenu; closeAllPanels(); setShowCustomizationMenu(!o); }} aria-expanded={showCustomizationMenu} title={fr ? 'Toutes les couleurs' : 'كل الألوان'} style={barBtn(showCustomizationMenu)}>
              <Icon d={DI.palette} size={20}/>
            </button>
            <span style={{ width: 1, height: 26, background: t.line, margin: '0 2px' }}/>
            <button onClick={() => { const o = showShapePicker; closeAllPanels(); setShowShapePicker(!o); }} aria-expanded={showShapePicker} title={fr ? 'Formes' : 'الأشكال'} style={barBtn(showShapePicker || !!activeShapeType)}>
              <Icon d={DI.shapes} size={20}/>
            </button>
            <button onClick={() => { const o = showEmojiPicker; closeAllPanels(); setShowEmojiPicker(!o); }} aria-expanded={showEmojiPicker} title={fr ? 'Emojis' : 'إيموجي'} style={barBtn(showEmojiPicker || !!activeEmoji)}>
              <Icon d={DI.emoji} size={20}/>
            </button>
            <button onClick={() => { const o = showPaperSettings; closeAllPanels(); setShowPaperSettings(!o); }} aria-expanded={showPaperSettings} title={fr ? 'Papier' : 'الورق'} style={barBtn(showPaperSettings)}>
              <Icon d={DI.paper} size={20}/>
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button onClick={() => { closeAllPanels(); setTool(tool === 'select' ? 'pen' : 'select'); }} title={fr ? 'Sélectionner et déplacer (S)' : 'تحديد (S)'} aria-pressed={tool === 'select'} style={barBtn(tool === 'select')}>
              <Icon d={DI.select} size={19}/>
            </button>
            <button
              onClick={() => { if (stylusMode) { setStylusMode(false); setPenEverDetected(false); } else { setStylusMode(true); setPenEverDetected(true); } }}
              title={fr ? (stylusMode ? 'Mode stylet : le doigt fait défiler' : 'Mode doigt : le doigt dessine') : (stylusMode ? 'وضع القلم' : 'وضع الإصبع')}
              aria-pressed={stylusMode} style={barBtn(stylusMode)}>
              <Icon d={stylusMode ? DI.stylus : DI.finger} size={19}/>
            </button>
            <span style={{ width: 1, height: 26, background: t.line, margin: '0 2px' }}/>
            <button onClick={undo} disabled={undoStack.length === 0} title={fr ? 'Annuler' : 'تراجع'} style={{ ...barBtn(false), opacity: undoStack.length ? 1 : 0.35 }}>
              <Icon d={DI.undo} size={19}/>
            </button>
            <button onClick={redo} disabled={redoStack.length === 0} title={fr ? 'Rétablir' : 'إعادة'} style={{ ...barBtn(false), opacity: redoStack.length ? 1 : 0.35 }}>
              <Icon d={DI.redo} size={19}/>
            </button>
            <button onClick={() => { const o = showMoreMenu; closeAllPanels(); setShowMoreMenu(!o); }} aria-expanded={showMoreMenu} title={fr ? 'Plus d\'options' : 'المزيد'} style={barBtn(showMoreMenu)}>
              <Icon d={DI.more} size={19}/>
            </button>
            <button onClick={savePage} disabled={isSaving}
              style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', marginInlineStart: 4, borderRadius: 13, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                background: isSaving ? `${t.accent}22` : t.accent, color: isSaving ? t.accent : '#1a0f00', transition: 'background 0.25s, color 0.25s' }}>
              <Icon d={DI.check} size={16} stroke={2.4}/>
              {!narrow && <span>{isSaving ? (fr ? 'Enregistré' : 'تم الحفظ') : (fr ? 'Enregistrer' : 'حفظ')}</span>}
            </button>
          </div>
        </div>

        {/* Toucher à côté d'un menu le ferme, sans laisser de trait */}
        {(showToolsMenu || showCustomizationMenu || showShapePicker || showEmojiPicker || showPaperSettings || showMoreMenu) && (
          <div onPointerDown={e => { e.preventDefault(); e.stopPropagation(); closeAllPanels(); }}
            style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'auto', background: 'rgba(20,14,6,0.06)' }}/>
        )}

        {/* Panels */}
        {(showToolsMenu || showCustomizationMenu || showShapePicker || showEmojiPicker || showPaperSettings || showMoreMenu) && (
          <div
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, maxWidth: 640, margin: '0 auto', pointerEvents: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 90px)', paddingTop: 4 }}
          >
              {showMoreMenu && (
                <div style={{ ...panelStyle, gap: 6 }}>
                  <div style={panelTitle}>{fr ? 'Affichage' : 'العرض'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom −" style={barBtn(false)}><Icon d={DI.zoomOut} size={20}/></button>
                    <button onClick={() => zoomBy(0)} style={{ flex: 1, height: 40, borderRadius: 12, border: `1px solid ${t.line}`, background: t.bgSoft, color: t.ink, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontVariantNumeric: 'tabular-nums' }}>
                      {Math.round(zoom * 100)} %
                    </button>
                    <button onClick={() => zoomBy(1.2)} aria-label="Zoom +" style={barBtn(false)}><Icon d={DI.zoomIn} size={20}/></button>
                  </div>
                  <div style={{ height: 1, background: t.lineSoft, margin: '10px 0' }}/>
                  <button onClick={() => { exportPDF(); setShowMoreMenu(false); }} style={menuRow(t.ink)}>
                    <Icon d={DI.download} size={19}/> {fr ? 'Exporter en PDF' : 'تصدير PDF'}
                  </button>
                  <button onClick={() => setShowHelp(true)} style={menuRow(t.ink)}>
                    <Icon d={DI.help} size={19}/> {fr ? 'Guide du Diftar' : 'دليل الدفتر'}
                  </button>
                  <button onClick={() => { setShowMoreMenu(false); setShowConfirmClear(true); }} style={menuRow('#C2412D')}>
                    <Icon d={DI.trash} size={19}/> {fr ? 'Effacer toute la page' : 'مسح الصفحة'}
                  </button>
                </div>
              )}

              {showToolsMenu && (
                <div style={panelStyle}>
                  <div style={panelTitle}>{fr ? 'Stylos' : 'الأقلام'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${narrow ? 3 : 4}, minmax(0, 1fr))`, gap: 8 }}>
                    {TOOLS.map(tb => {
                      const on = tool === tb.id;
                      return (
                        <button key={tb.id} onClick={() => { setTool(tb.id as any); setActiveShapeTypeWithRef(null); setShowToolsMenu(false); }} aria-pressed={on}
                          style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 6px 10px', borderRadius: 16, cursor: 'pointer',
                            border: `1.5px solid ${on ? t.accent : t.lineSoft}`, background: on ? `${t.accent}14` : t.card, color: on ? t.ink : t.inkDim }}>
                          <ToolPreview id={tb.id} color={color}/>
                          <span style={{ fontSize: 13, fontWeight: on ? 600 : 500 }}>{fr ? tb.fr : tb.ar}</span>
                          {tb.hint && !narrow && <span style={{ position: 'absolute', top: 6, insetInlineEnd: 8, fontSize: 10, color: t.inkMute }}>{tb.hint}</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div style={panelTitle}>{fr ? 'Épaisseur' : 'السُّمك'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {SIZE_PRESETS.map(p => {
                      const on = width === p.value;
                      return (
                        <button key={p.value} onClick={() => setWidth(p.value)} aria-label={p.label} aria-pressed={on} title={p.label}
                          style={{ width: 44, height: 44, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1.5px solid ${on ? t.accent : t.lineSoft}`, background: on ? `${t.accent}14` : t.card }}>
                          <span style={{ borderRadius: '50%', background: color.startsWith('#') ? color : t.ink, width: Math.max(4, Math.min(p.value * 1.4, 26)), height: Math.max(4, Math.min(p.value * 1.4, 26)) }}/>
                        </button>
                      );
                    })}
                    <input type="range" min="1" max="50" value={width} onChange={e => setWidth(parseInt(e.target.value))} aria-label={fr ? 'Épaisseur' : 'السمك'}
                      style={{ flex: 1, minWidth: 120, accentColor: t.accent }}/>
                    <span style={{ fontSize: 13, color: t.inkMute, minWidth: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{width}</span>
                  </div>
                </div>
              )}

              {showCustomizationMenu && (
                <div style={panelStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, border: `2px solid ${t.accent}33`, background: color, flexShrink: 0 }} />
                    <div>
                      <div style={panelTitle}>{fr ? 'Couleur active' : 'اللون المحدد'}</div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: t.inkMute }}>{color}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(Object.keys(COLOR_PALETTE) as (keyof typeof COLOR_PALETTE)[]).map(cat => (
                      <button key={cat} onClick={() => setColorTab(cat)} style={{ padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        ...(colorTab === cat ? { background: t.ink, color: t.bg } : { background: t.bgSoft, color: t.inkDim }) }}>
                        {cat === 'classiques' ? (fr ? 'Classiques' : 'كلاسيك') : cat === 'pastels' ? (fr ? 'Pastels' : 'باستيل') : cat === 'vives' ? (fr ? 'Vives' : 'زاهية') : cat === 'sombres' ? (fr ? 'Sombres' : 'داكنة') : (fr ? 'Spéciaux' : 'خاصة')}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 8 }}>
                    {COLOR_PALETTE[colorTab].map(c => (
                      <button key={c} onClick={() => { setColor(c); setShowCustomizationMenu(false); }}
                        style={{ aspectRatio: '1', borderRadius: '50%', border: 'none', cursor: 'pointer',
                          background: c.startsWith('gradient:')
                            ? ({'gradient:gold-red':'linear-gradient(135deg,#D4AF37,#8B2635)','gradient:blue-cyan':'linear-gradient(135deg,#1D3557,#A8DADC)','gradient:purple-pink':'linear-gradient(135deg,#6D597A,#FF99C8)','gradient:green-teal':'linear-gradient(135deg,#2D6A4F,#95D5B2)','gradient:sunset':'linear-gradient(135deg,#F4A261,#E76F51)','gradient:ocean':'linear-gradient(135deg,#03045E,#90E0EF)'}[c] || '#888')
                            : c.startsWith('pattern:') ? '#f5f5f5' : c,
                          boxShadow: color === c ? `0 0 0 2px ${t.card}, 0 0 0 4px ${t.accent}` : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#888',
                        }}>
                        {c.startsWith('pattern:') && (c === 'pattern:dots' ? '•••' : c === 'pattern:stripes' ? '///' : '+++')}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setShowColorWheel(v => !v)} aria-expanded={showColorWheel}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 12, border: `1px solid ${t.line}`, color: t.ink, fontSize: 14, fontWeight: 500, cursor: 'pointer', background: showColorWheel ? `${t.accent}14` : t.card }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'conic-gradient(#e63946, #f4a261, #e9c46a, #2a9d8f, #457b9d, #6d597a, #e63946)' }}/>
                      {fr ? 'Couleur sur mesure' : 'لون مخصص'}
                    </button>
                    <input type="text" value={color.startsWith('#') ? color : ''} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setColor(e.target.value); }}
                      style={{ flex: 1, height: 40, padding: '0 12px', borderRadius: 12, border: `1px solid ${t.line}`, background: t.bgSoft, color: t.inkDim, fontSize: 14, fontVariantNumeric: 'tabular-nums', outline: 'none' }} placeholder="#8B2635" aria-label={fr ? 'Code couleur' : 'رمز اللون'} />
                  </div>
                  {showColorWheel && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <HexColorPicker color={color.startsWith('#') ? color : '#8B2635'} onChange={setColor} style={{ width: '100%', maxWidth: 220, height: 180 }} />
                    </div>
                  )}
                </div>
              )}

              {showShapePicker && (
                <div style={panelStyle}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {SHAPE_CATEGORIES.map((cat, i) => (
                      <button key={i} onClick={() => setShapeCategory(i)} style={{ padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        ...(shapeCategory === i ? { background: t.ink, color: t.bg } : { background: t.bgSoft, color: t.inkDim }) }}>
                        {cat.label[lang as 'fr' | 'ar']}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: t.accentBright, opacity: 0.6, flexShrink: 0 }}>{fr ? 'Taille' : 'الحجم'}</div>
                    <input type="range" min="20" max="200" value={shapeSize} onChange={e => setShapeSize(parseInt(e.target.value))} style={{ flex: 1, accentColor: t.accent }} />
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: t.inkMute, minWidth: 40, textAlign: 'right', flexShrink: 0 }}>{shapeSize}px</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                    {SHAPE_CATEGORIES[shapeCategory].shapes.map(shape => (
                      <button
                        key={shape.id}
                        onClick={() => { setActiveShapeTypeWithRef(shape.type); setShowShapePicker(false); }}
                        style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 16, border: `2px solid`, cursor: 'pointer', transition: 'all 0.15s',
                          ...(activeShapeType === shape.type ? { background: t.accent, borderColor: t.accent, color: '#fff' } : { background: `${t.accent}0d`, borderColor: `${t.accent}1f`, color: t.accent }) }}
                      >
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
                          {shape.type === 'circle'       && <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2" />}
                          {shape.type === 'ellipse'      && <ellipse cx="14" cy="14" rx="12" ry="7" fill="none" stroke="currentColor" strokeWidth="2" />}
                          {shape.type === 'semicircle'   && <path d="M3,14 A11,11 0 0,1 25,14 Z" fill="none" stroke="currentColor" strokeWidth="2" />}
                          {shape.type === 'square'       && <rect x="4" y="4" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" />}
                          {shape.type === 'rectangle'    && <rect x="2" y="7" width="24" height="14" fill="none" stroke="currentColor" strokeWidth="2" />}
                          {shape.type === 'triangle'     && <polygon points="14,3 25,25 3,25" fill="none" stroke="currentColor" strokeWidth="2" />}
                          {shape.type === 'diamond'      && <polygon points="14,2 26,14 14,26 2,14" fill="none" stroke="currentColor" strokeWidth="2" />}
                          {shape.type === 'hexagon'      && <polygon points="14,2 24,8 24,20 14,26 4,20 4,8" fill="none" stroke="currentColor" strokeWidth="2" />}
                          {shape.type === 'pentagon'     && <polygon points="14,2 25,10 21,24 7,24 3,10" fill="none" stroke="currentColor" strokeWidth="2" />}
                          {shape.type === 'octagon'      && <polygon points="10,2 18,2 26,10 26,18 18,26 10,26 2,18 2,10" fill="none" stroke="currentColor" strokeWidth="2" />}
                          {shape.type === 'trapezoid'    && <polygon points="8,4 20,4 26,24 2,24" fill="none" stroke="currentColor" strokeWidth="2" />}
                          {shape.type === 'star'         && <polygon points="14,2 17,11 26,11 19,17 22,26 14,20 6,26 9,17 2,11 11,11" fill="currentColor" />}
                          {shape.type === 'star6'        && <polygon points="14,2 16,10 24,8 18,14 24,20 16,18 14,26 12,18 4,20 10,14 4,8 12,10" fill="currentColor" />}
                          {shape.type === 'heart'        && <path d="M14,21 C9,17 4,13 4,8 C4,5 6,3 9,3 C11,3 13,5 14,7 C15,5 17,3 19,3 C22,3 24,5 24,8 C24,13 19,17 14,21Z" fill="currentColor" />}
                          {shape.type === 'crescent'     && <path d="M14,2 A12,12 0 1,1 14,26 A8,8 0 1,0 14,2Z" fill="currentColor" />}
                          {shape.type === 'cloud'        && <><circle cx="10" cy="16" r="5" fill="currentColor"/><circle cx="16" cy="12" r="6" fill="currentColor"/><circle cx="21" cy="16" r="4" fill="currentColor"/></>}
                          {shape.type === 'lightning'    && <polygon points="16,2 10,14 15,14 12,26 20,12 14,12" fill="currentColor" />}
                          {shape.type === 'sun'          && <><circle cx="14" cy="14" r="5" fill="currentColor"/><line x1="14" y1="2" x2="14" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="14" y1="22" x2="14" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="2" y1="14" x2="6" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="22" y1="14" x2="26" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>}
                          {shape.type === 'speech_bubble'&& <><rect x="2" y="2" width="24" height="18" rx="4" fill="currentColor" /><polygon points="8,20 6,26 14,20" fill="currentColor"/></>}
                          {shape.type === 'line'         && <line x1="3" y1="14" x2="25" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
                          {shape.type === 'arrow'        && <><line x1="3" y1="14" x2="23" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /><polyline points="17,8 24,14 17,20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /></>}
                          {shape.type === 'curved_arrow' && <><path d="M4,20 Q14,2 24,20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><polyline points="19,14 24,20 18,22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></>}
                          {shape.type === 'double_arrow' && <><line x1="3" y1="14" x2="25" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><polyline points="9,8 3,14 9,20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><polyline points="19,8 25,14 19,20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></>}
                          {shape.type === 'bracket'      && <><polyline points="10,3 4,3 4,25 10,25" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><polyline points="18,3 24,3 24,25 18,25" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></>}
                        </svg>
                        <span style={{ fontSize: 7, fontWeight: 700, marginTop: 4, lineHeight: 1.2, textAlign: 'center' }}>{shape.label[lang as 'fr' | 'ar']}</span>
                      </button>
                    ))}
                  </div>
                  {activeShapeType && (
                    <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: t.accentBright }}>
                      {fr ? 'Cliquez sur la page pour placer la forme' : 'انقر على الصفحة لوضع الشكل'}
                    </div>
                  )}
                </div>
              )}

              {showEmojiPicker && (
                <div style={panelStyle}>
                  <div style={panelTitle}>
                    {fr ? 'Choisir un emoji — cliquez sur la page pour placer' : 'اختر رمزاً — انقر على الصفحة للوضع'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8 }}>
                    {EMOJI_LIST.map(em => (
                      <button key={em} onClick={() => { activeEmojiRef.current = em; setActiveEmoji(em); setShowEmojiPicker(false); }}
                        style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: 'none', cursor: 'pointer', transition: 'transform 0.15s',
                          background: activeEmoji === em ? `${t.accent}1a` : 'transparent',
                          boxShadow: activeEmoji === em ? `0 0 0 2px ${t.accent}` : 'none' }}>
                        {em}
                      </button>
                    ))}
                  </div>
                  {activeEmoji && (
                    <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: t.accentBright }}>
                      {activeEmoji} {fr ? '— cliquez sur la page pour placer' : '— انقر على الصفحة للوضع'}
                    </div>
                  )}
                </div>
              )}

              {showPaperSettings && (
                <div style={panelStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={panelTitle}>{fr ? 'Style de papier' : 'نوع الورق'}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {[
                        { id: 'blank',        label: fr ? 'Blanc'        : 'أبيض'     },
                        { id: 'lines',        label: fr ? 'Lignes'       : 'سطور'     },
                        { id: 'grid',         label: fr ? 'Grille'       : 'شبكة'     },
                        { id: 'dots',         label: fr ? 'Points'       : 'نقاط'     },
                        { id: 'arabesque',    label: fr ? 'Arabesque'    : 'عربسك'    },
                        { id: 'diamond',      label: fr ? 'Diamant'      : 'ماسة'     },
                        { id: 'hexagonal',    label: fr ? "Nid d'abeille": 'خلية نحل' },
                        { id: 'music',        label: fr ? 'Portée'       : 'موسيقى'   },
                        { id: 'floral',       label: fr ? '🌸 Floral'    : '🌸 زهور'  },
                        { id: 'islamic_star', label: fr ? '✦ Islamique'  : '✦ إسلامي'},
                        { id: 'waves',        label: fr ? '〰 Vagues'    : '〰 أمواج' },
                        { id: 'leaves',       label: fr ? '🍃 Feuilles'  : '🍃 أوراق' },
                        { id: 'crosses',      label: fr ? '+ Croix'      : '+ صلبان'  },
                        { id: 'triangles',    label: fr ? '△ Triangles'  : '△ مثلثات'},
                      ].map(s => (
                        <button key={s.id} onClick={() => { setPaperStyle(s.id as any); setShowPaperSettings(false); }}
                          style={{ padding: '8px 16px', borderRadius: 16, border: `1px solid`, cursor: 'pointer', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
                            ...(paperStyle === s.id ? { background: t.accent, color: '#fff', borderColor: t.accent } : { background: `${t.accent}0d`, color: t.inkMute, borderColor: 'transparent' }) }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={panelTitle}>{fr ? 'Couleur de papier' : 'لون الورق'}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {PAPER_COLORS.map(pc => (
                        <button key={pc.value} onClick={() => { setPaperColor(pc.value); setShowPaperSettings(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 20, border: `1px solid`, cursor: 'pointer', fontSize: 10, fontWeight: 700, background: pc.value,
                            borderColor: paperColor === pc.value ? t.accent : 'rgba(139,38,53,0.15)',
                            color: readableOn(pc.value),
                            boxShadow: paperColor === pc.value ? `0 0 0 2px ${t.accent}` : 'none' }}>
                          {pc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

      </div>
      {/* FIN TOOLBAR FIXÉE */}

      {/* CANVAS + INLINE SCRUBBER */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 0 }}>

      {/* ZONE SCROLLABLE (canvas) */}
      <div
        ref={scrollContainerRef}
        style={{ flex: 1, borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflowY: 'auto', position: 'relative', border: `1px solid ${t.accent}14`, scrollBehavior: 'smooth' }}
        className="no-scrollbar"
      >
        {/* Toast */}
        {toastMessage && (
          <div style={{ position: 'fixed', left: '50%', top: 20, zIndex: 60, transform: 'translateX(-50%)', borderRadius: 24, padding: '12px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', fontSize: 13, fontWeight: 700, background: 'rgba(15,23,42,0.94)', color: '#fff', pointerEvents: 'none' }}>
            {toastMessage}
          </div>
        )}

        {/* Zoom indicator */}
        {showZoomIndicator && (
          <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 70, borderRadius: 16, padding: '8px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 700, background: 'rgba(15,23,42,0.88)', color: '#fff', pointerEvents: 'none' }}>
            {Math.round(zoom * 100)}%
          </div>
        )}

        {/* Binding spiral */}
        <div style={{ position: 'absolute', top: 0, [lang === 'ar' ? 'right' : 'left']: 0, width: 40, zIndex: 20, pointerEvents: 'none', height: `${pageHeight}px`, background: 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '32px 8px' }}>
            {[...Array(Math.ceil(pageHeight / 120))].map((_, i) => (
              <div key={i} style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.05)' }} />
            ))}
          </div>
        </div>

        {/* Canvas + selection overlay — zoom applied here */}
        <div style={{ position: 'relative', width: '100%', transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
          <canvas
            ref={canvasRef}
            width={1000}
            height={pageHeight}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            style={{ width: '100%', touchAction: stylusMode ? 'pan-y' : 'none', display: 'block', cursor: tool === 'select' ? 'default' : 'none' }}
          />
          {/* Selection handles overlay */}
          {tool === 'select' && (() => {
            const selShape = selectedShapeId ? shapes.find(s => s.id === selectedShapeId) : null;
            if (!selShape) return null;
            const sc = canvasScale;
            const cx = selShape.x * sc;
            const cy = selShape.y * sc;
            const hw = (selShape.width / 2) * sc;
            const hh = (selShape.height / 2) * sc;
            const H = 44;
            const cornerHandles = [
              { id: 'nw' as const, left: cx - hw, top: cy - hh, cursor: 'nw-resize' },
              { id: 'ne' as const, left: cx + hw, top: cy - hh, cursor: 'ne-resize' },
              { id: 'sw' as const, left: cx - hw, top: cy + hh, cursor: 'sw-resize' },
              { id: 'se' as const, left: cx + hw, top: cy + hh, cursor: 'se-resize' },
            ];
            return (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
                {/* Dashed selection border */}
                <div style={{ position: 'absolute', left: cx - hw - 3, top: cy - hh - 3, width: hw * 2 + 6, height: hh * 2 + 6, border: `1.5px dashed ${t.accent}`, borderRadius: 4, opacity: 0.85 }} />
                {/* Corner resize handles */}
                {cornerHandles.map(h => (
                  <div key={h.id} style={{ position: 'absolute', left: h.left - H/2, top: h.top - H/2, width: H, height: H, cursor: h.cursor, pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onPointerDown={(ev) => {
                      ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId);
                      setUndoStack(prev => [...prev, { strokes: currentStrokes, shapes }]); setRedoStack([]);
                      selectionDragRef.current = { startX: ev.clientX, startY: ev.clientY, shapeStartX: selShape.x, shapeStartY: selShape.y, shapeStartW: selShape.width, shapeStartH: selShape.height, shapeId: selShape.id, handle: h.id, shapeStartRotation: selShape.rotation || 0 };
                    }}
                    onPointerMove={(ev) => {
                      const drag = selectionDragRef.current;
                      if (!drag || drag.handle === 'move' || drag.handle === 'rotate') return;
                      const canvas = canvasRef.current; if (!canvas) return;
                      const rect = canvas.getBoundingClientRect();
                      const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
                      const dx = (ev.clientX - drag.startX) * sx, dy = (ev.clientY - drag.startY) * sy;
                      const nw = drag.handle.includes('e') ? Math.max(20, drag.shapeStartW + dx * 2) : drag.handle.includes('w') ? Math.max(20, drag.shapeStartW - dx * 2) : drag.shapeStartW;
                      const nh = drag.handle.includes('s') ? Math.max(20, drag.shapeStartH + dy * 2) : drag.handle.includes('n') ? Math.max(20, drag.shapeStartH - dy * 2) : drag.shapeStartH;
                      setShapes(prev => prev.map(s => s.id === drag.shapeId ? { ...s, width: nw, height: nh } : s));
                    }}
                    onPointerUp={() => { selectionDragRef.current = null; }}
                  >
                    <div style={{ width: 10, height: 10, background: 'white', border: `2px solid ${t.accent}`, borderRadius: 2, boxShadow: '0 1px 6px rgba(0,0,0,0.25)' }} />
                  </div>
                ))}
                {/* Rotation line */}
                <div style={{ position: 'absolute', left: cx - 1, top: cy - hh - 22, width: 1.5, height: 22, background: t.accent, opacity: 0.5 }} />
                {/* Rotation handle */}
                <div style={{ position: 'absolute', left: cx - H/2, top: cy - hh - H - 22, width: H, height: H, cursor: 'grab', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onPointerDown={(ev) => {
                    ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId);
                    setUndoStack(prev => [...prev, { strokes: currentStrokes, shapes }]); setRedoStack([]);
                    selectionDragRef.current = { startX: ev.clientX, startY: ev.clientY, shapeStartX: selShape.x, shapeStartY: selShape.y, shapeStartW: selShape.width, shapeStartH: selShape.height, shapeId: selShape.id, handle: 'rotate', shapeStartRotation: selShape.rotation || 0 };
                  }}
                  onPointerMove={(ev) => {
                    const drag = selectionDragRef.current;
                    if (!drag || drag.handle !== 'rotate') return;
                    const canvas = canvasRef.current; if (!canvas) return;
                    const rect = canvas.getBoundingClientRect();
                    const shapeCX = rect.left + selShape.x / (canvas.width / rect.width);
                    const shapeCY = rect.top + selShape.y / (canvas.height / rect.height);
                    const angle = Math.atan2(ev.clientY - shapeCY, ev.clientX - shapeCX) * (180 / Math.PI) + 90;
                    setShapes(prev => prev.map(s => s.id === drag.shapeId ? { ...s, rotation: Math.round(angle) } : s));
                  }}
                  onPointerUp={() => { selectionDragRef.current = null; }}
                >
                  <div style={{ width: 12, height: 12, background: t.accent, borderRadius: '50%', border: '2px solid white', boxShadow: '0 1px 6px rgba(0,0,0,0.3)' }} />
                </div>
                {/* Floating action bar */}
                <div style={{ position: 'absolute', left: cx, top: cy + hh + 14, transform: 'translateX(-50%)', pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 20, padding: '4px 8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', background: t.bg, border: `1px solid ${t.accent}26` }}>
                  <button onPointerDown={ev => ev.stopPropagation()} onClick={() => { setUndoStack(prev => [...prev, { strokes: currentStrokes, shapes }]); setRedoStack([]); setShapes(prev => prev.filter(s => s.id !== selShape.id)); setSelectedShapeId(null); }}
                    style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}
                    title={fr ? 'Supprimer' : 'حذف'}>🗑</button>
                  <button onPointerDown={ev => ev.stopPropagation()} onClick={() => { const dup: Shape = { ...selShape, id: Date.now().toString(), x: selShape.x + 30, y: selShape.y + 30 }; setUndoStack(prev => [...prev, { strokes: currentStrokes, shapes }]); setRedoStack([]); setShapes(prev => [...prev, dup]); setSelectedShapeId(dup.id); }}
                    style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'transparent', color: t.accent, cursor: 'pointer', fontSize: 16 }}
                    title={fr ? 'Dupliquer' : 'نسخ'}>⧉</button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Add space button */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', background: paperColor }}>
          <button onClick={() => setPageHeight(prev => prev + 2000)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 20, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${t.accent}26`, color: t.accent, background: `${t.accent}0d`, cursor: 'pointer' }}>
            + {fr ? "Ajouter de l'espace" : 'إضافة مساحة'}
          </button>
        </div>

        {/* Custom cursor */}
        {tool !== 'select' && cursorPos.on && (
          <div style={{ position: 'fixed', left: cursorPos.x, top: cursorPos.y, zIndex: 60, pointerEvents: 'none', transform: 'translate(-50%, -50%)', transition: 'left 0.03s linear, top 0.03s linear' }}>
            <div style={{
              width: activeShapeType ? 60 : (tool === 'highlighter' ? width * 6 : width + 16) * canvasScale,
              height: activeShapeType ? 60 : (tool === 'highlighter' ? width * 5 : width + 16) * canvasScale,
              borderRadius: tool === 'highlighter' ? 4 : '50%',
              background: activeShapeType ? 'transparent' : (tool === 'eraser' ? 'rgba(255,255,255,0.4)' : color),
              opacity: tool === 'highlighter' ? 0.35 : 0.85,
              border: activeShapeType ? `2px dashed ${t.accentBright}` : '1px solid rgba(255,255,255,0.8)',
              transform: isDrawing ? 'scale(0.8)' : 'scale(1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              {activeShapeType && (
                <span style={{ fontSize: 14, opacity: 0.6, color: t.accentBright }}>
                  {activeShapeType === 'circle' ? '○' : activeShapeType === 'square' ? '□' : activeShapeType === 'triangle' ? '△' : activeShapeType === 'line' ? '—' : activeShapeType === 'arrow' ? '→' : '✦'}
                </span>
              )}
            </div>
          </div>
        )}


      </div> {/* end canvas container */}

      </div> {/* end canvas + scrubber flex row */}

      {/* ─── Help / Guide modal ──────────────────────────────────────────── */}
      {showHelp && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowHelp(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 672, maxHeight: '88vh', display: 'flex', flexDirection: 'column', borderRadius: 32, boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden', background: t.card, border: `1px solid ${t.accent}1e` }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: `1px solid ${t.accent}14`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${t.accent}1a`, fontSize: 18, color: t.accent }}>ℹ</div>
                <div>
                  <h2 style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 18, lineHeight: 1.2, color: t.accent, margin: 0 }}>
                    {lang === 'fr' ? 'Guide du Diftar' : 'دليل الدفتر'}
                  </h2>
                  <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: t.accentBright, opacity: 0.55, margin: 0 }}>
                    {lang === 'fr' ? 'Toutes les fonctions expliquées' : 'شرح جميع الوظائف'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowHelp(false)} style={{ padding: 10, borderRadius: '50%', border: 'none', cursor: 'pointer', color: t.inkMute, background: `${t.accent}0d`, fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* Section: Outils de dessin */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: t.accentBright }}>✎</span>
                  <h3 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: t.accentBright, opacity: 0.7, margin: 0 }}>
                    {lang === 'fr' ? 'Outils de dessin' : 'أدوات الرسم'}
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                  {[
                    { icon: '✏️', name: lang === 'fr' ? 'Stylo'         : 'قلم',          key: '1', desc: lang === 'fr' ? 'Trait fluide avec lissage parfait'        : 'خط سلس بتمهيد مثالي' },
                    { icon: '🪶', name: lang === 'fr' ? 'Plume'         : 'ريشة',         key: '2', desc: lang === 'fr' ? 'Trait incliné style calligraphie latine'   : 'خط مائل بأسلوب الخط اللاتيني' },
                    { icon: '🖊', name: lang === 'fr' ? 'Surligneur'    : 'تحديد',        key: '3', desc: lang === 'fr' ? 'Couleur transparente pour annoter'          : 'لون شفاف للتعليق' },
                    { icon: '🍂', name: lang === 'fr' ? 'Craie'         : 'طباشير',       key: '4', desc: lang === 'fr' ? 'Texture poudreuse avec grain'               : 'ملمس ناعم كالطباشير' },
                    { icon: '📏', name: lang === 'fr' ? 'Règle'         : 'مسطرة',        key: '5', desc: lang === 'fr' ? 'Ligne droite parfaite H ou V'               : 'خط أفقي أو عمودي مثالي' },
                    { icon: '🧽', name: lang === 'fr' ? 'Gomme'         : 'ممحاة',        key: '6', desc: lang === 'fr' ? 'Efface les traits et supprime les formes'   : 'يمحو الخطوط ويحذف الأشكال' },
                    { icon: '💨', name: lang === 'fr' ? 'Aérosol'       : 'رذاذ',         key: '7', desc: lang === 'fr' ? 'Effet spray avec densité variable'           : 'تأثير رذاذ بكثافة متغيرة' },
                    { icon: '🖍', name: lang === 'fr' ? 'Marqueur'      : 'ماركر',        key: '8', desc: lang === 'fr' ? 'Couleur vive semi-transparente'              : 'لون نابض شبه شفاف' },
                    { icon: '⚡', name: lang === 'fr' ? 'Néon'          : 'نيون',         key: '9', desc: lang === 'fr' ? 'Trait lumineux avec halo coloré'            : 'خط مضيء مع هالة ملونة' },
                    { icon: '✏️', name: lang === 'fr' ? 'Crayon'        : 'رصاص',         key: '0', desc: lang === 'fr' ? 'Trait granuleux texturé'                     : 'خط حبيبي مع ملمس' },
                    { icon: '💧', name: lang === 'fr' ? 'Aquarelle'     : 'ألوان مائية',  key: '-', desc: lang === 'fr' ? 'Lavis doux aux bords flous'                  : 'طلاء ناعم بحواف ضبابية' },
                    { icon: '🖋', name: lang === 'fr' ? 'Calligraphie'  : 'خط عربي',      key: '',  desc: lang === 'fr' ? 'Trait pen avec rotation 45°'                 : 'قلم بزاوية 45°' },
                    { icon: '・', name: lang === 'fr' ? 'Pointillé'     : 'منقّط',        key: '',  desc: lang === 'fr' ? 'Suite de points réguliers'                   : 'سلسلة نقاط منتظمة' },
                    { icon: '🎨', name: lang === 'fr' ? 'Pinceau'       : 'فرشاة',        key: '',  desc: lang === 'fr' ? 'Trait large avec dégradé de bords'           : 'خط عريض بتدرج الحواف' },
                  ].map(tool => (
                    <div key={tool.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 16, background: `${t.accent}0a` }}>
                      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{tool.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 900, color: t.accent }}>{tool.name}</span>
                          {tool.key && (
                            <kbd style={{ fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 6, fontFamily: 'monospace', background: `${t.accent}1a`, color: t.accent }}>{tool.key}</kbd>
                          )}
                        </div>
                        <p style={{ fontSize: 10, marginTop: 2, lineHeight: 1.5, color: t.inkMute }}>{tool.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section: Sélection */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: t.accentBright }}>↖</span>
                  <h3 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: t.accentBright, opacity: 0.7, margin: 0 }}>
                    {lang === 'fr' ? 'Outil Sélection' : 'أداة التحديد'}
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '↖', text: lang === 'fr' ? 'Appuyez sur le bouton ↖ dans la barre ou la touche S pour activer la sélection' : 'اضغط زر ↖ في الشريط أو مفتاح S لتفعيل التحديد' },
                    { icon: '👆', text: lang === 'fr' ? 'Touchez ou cliquez une forme pour la sélectionner (bordure pointillée)' : 'المس أو انقر على شكل لتحديده (إطار منقط)' },
                    { icon: '⇕', text: lang === 'fr' ? 'Glissez la forme pour la déplacer librement sur la page' : 'اسحب الشكل لتحريكه بحرية على الصفحة' },
                    { icon: '◼', text: lang === 'fr' ? '4 poignées aux coins — glissez pour redimensionner' : '4 مقابض في الزوايا — اسحب لتغيير الحجم' },
                    { icon: '↶', text: lang === 'fr' ? 'Poignée ronde en haut — glissez pour pivoter' : 'مقبض دائري في الأعلى — اسحب للتدوير' },
                    { icon: '🗑', text: lang === 'fr' ? 'Bouton 🗑 sous la sélection ou touche Suppr pour effacer' : 'زر 🗑 تحت التحديد أو مفتاح Delete للحذف' },
                    { icon: '⧉', text: lang === 'fr' ? 'Bouton ⧉ pour dupliquer la forme en conservant couleur et taille' : 'زر ⧉ لتكرار الشكل مع الحفاظ على لونه وحجمه' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 16, background: `${t.accent}0a` }}>
                      <span style={{ flexShrink: 0, marginTop: 2, width: 20, textAlign: 'center', fontSize: 15, color: t.accent }}>{row.icon}</span>
                      <p style={{ fontSize: 11, lineHeight: 1.6, color: t.inkMute, margin: 0 }}>{row.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section: Zoom */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: t.accentBright }}>⊕</span>
                  <h3 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: t.accentBright, opacity: 0.7, margin: 0 }}>
                    {lang === 'fr' ? 'Zoom' : 'التكبير'}
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '±',  text: lang === 'fr' ? 'Boutons − / % / + dans la barre en haut à droite' : 'أزرار − / % / + في الشريط أعلى اليمين' },
                    { icon: '💯', text: lang === 'fr' ? 'Cliquez sur le % pour revenir à 100%' : 'انقر على % للعودة إلى 100%' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 16, background: `${t.accent}0a` }}>
                      <span style={{ fontSize: 15, flexShrink: 0, width: 20, textAlign: 'center', marginTop: 2 }}>{row.icon}</span>
                      <p style={{ fontSize: 11, lineHeight: 1.6, color: t.inkMute, margin: 0 }}>{row.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section: Navigation & Scroll */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: t.accentBright }}>↕️</span>
                  <h3 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: t.accentBright, opacity: 0.7, margin: 0 }}>
                    {lang === 'fr' ? 'Navigation & Scroll' : 'التنقل والتحريك'}
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '👆', text: lang === 'fr' ? 'Faites glisser un doigt sur le fond pour scroller naturellement (swipe)' : 'اسحب بإصبع واحد على الخلفية للتحريك الطبيعي (swipe)' },
                    { icon: '🖱', text: lang === 'fr' ? 'Utilisez la roulette de la souris pour un défilement classique' : 'استخدم عجلة الماوس للتحريك التقليدي' },
                    { icon: '🖊', text: lang === 'fr' ? 'Mode Stylet : vos doigts font scroller, seul le stylet dessine (détection automatique)' : 'وضع القلم: أصابعك تقوم بالتحريك فقط، ويرسم القلم فقط (اكتشاف تلقائي)' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 16, background: `${t.accent}0a` }}>
                      <span style={{ fontSize: 15, flexShrink: 0, width: 20, textAlign: 'center', marginTop: 2 }}>{row.icon}</span>
                      <p style={{ fontSize: 11, lineHeight: 1.6, color: t.inkMute, margin: 0 }}>{row.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section: Stylus / Palm rejection */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 14 }}>🖊</span>
                  <h3 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: t.accentBright, opacity: 0.7, margin: 0 }}>
                    {lang === 'fr' ? 'Mode Stylet & Rejet de paume' : 'وضع القلم ورفض راحة اليد'}
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '🖊', text: lang === 'fr' ? 'Bouton 🖊 dans la barre → mode Stylet activé : seul l\'Apple Pencil dessine' : 'زر 🖊 في الشريط → وضع القلم: يرسم القلم فقط' },
                    { icon: '👆', text: lang === 'fr' ? 'Bouton 👆 → mode Doigt : le doigt et le stylet dessinent' : 'زر 👆 → وضع الإصبع: الإصبع والقلم كلاهما يرسمان' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 16, background: `${t.accent}0a` }}>
                      <span style={{ fontSize: 15, flexShrink: 0, width: 20, textAlign: 'center', marginTop: 2 }}>{row.icon}</span>
                      <p style={{ fontSize: 11, lineHeight: 1.6, color: t.inkMute, margin: 0 }}>{row.text}</p>
                    </div>
                  ))}
                </div>
              </section>


              {/* Section: Papier & navigation */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: t.accentBright }}>⚙</span>
                  <h3 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: t.accentBright, opacity: 0.7, margin: 0 }}>
                    {lang === 'fr' ? 'Papier & navigation' : 'الورق والتنقل'}
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '📋', text: lang === 'fr' ? 'Menu Papier (⚙) → choisir le style (lignes, grille, points, arabesque…) et la couleur du fond' : 'قائمة الورق (⚙) → اختيار النمط (خطوط، شبكة، نقاط…) ولون الخلفية' },
                    { icon: '🎨', text: lang === 'fr' ? 'Menu Couleurs (🎨) → palette classique, pastels, vives, sombres, dégradés et motifs' : 'قائمة الألوان (🎨) → لوحة كلاسيكية، باستيل، زاهية، داكنة، تدرجات ونقوش' },
                    { icon: '⭐', text: lang === 'fr' ? 'Menu Formes (⭐) → 22 formes géométriques et décoratives, redimensionnables avant placement' : 'قائمة الأشكال (⭐) → 22 شكلاً هندسياً وزخرفياً، قابلة للتغيير قبل الوضع' },
                    { icon: '↕️', text: lang === 'fr' ? 'La page s\'agrandit automatiquement en bas — ou cliquez "+ Espace" pour en ajouter plus' : 'تتمدد الصفحة تلقائياً للأسفل — أو انقر "+ مساحة" لإضافة المزيد' },
                    { icon: '📤', text: lang === 'fr' ? 'Bouton Exporter → PDF multi-page haute résolution' : 'زر تصدير → PDF متعدد الصفحات بدقة عالية' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 16, background: `${t.accent}0a` }}>
                      <span style={{ fontSize: 15, flexShrink: 0, width: 20, textAlign: 'center', marginTop: 2 }}>{row.icon}</span>
                      <p style={{ fontSize: 11, lineHeight: 1.6, color: t.inkMute, margin: 0 }}>{row.text}</p>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px', flexShrink: 0, borderTop: `1px solid ${t.accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: t.inkMute, opacity: 0.5, margin: 0 }}>
                {lang === 'fr' ? '💡 Astuce : le guide est aussi accessible hors connexion' : '💡 نصيحة: يمكن الوصول إلى الدليل بدون إنترنت'}
              </p>
              <button
                onClick={() => setShowHelp(false)}
                style={{ padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', background: t.accent }}
              >
                {lang === 'fr' ? 'Compris !' : 'فهمت!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)' }}>
          <div style={{ width: '100%', maxWidth: 420, borderRadius: 32, boxShadow: '0 30px 60px rgba(0,0,0,0.3)', background: t.card, border: `1px solid ${t.accent}26`, overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'modalShow 0.4s cubic-bezier(0.2, 1, 0.3, 1)' }}>
            <div style={{ padding: '40px 32px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: `${t.accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>👆</div>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: `${t.accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🖊️</div>
              </div>
              <div>
                <h2 style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 28, color: t.accent, margin: 0 }}>
                  {lang === 'fr' ? 'Nouvelle Navigation' : 'تنقل جديد'}
                </h2>
                <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: t.accentBright, opacity: 0.6, marginTop: 8 }}>
                  {lang === 'fr' ? 'Expérience fluide et naturelle' : 'تجربة سلسة وطبيعية'}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: lang === 'fr' ? 'left' : 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 20, background: `${t.accent}0d` }}>
                  <span style={{ fontSize: 24 }}>👆</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>{lang === 'fr' ? 'Le doigt scrolle' : 'الإصبع للتنقل'}</div>
                    <p style={{ fontSize: 11, color: t.inkMute, margin: '2px 0 0' }}>{lang === 'fr' ? 'Glissez un doigt n\'importe où pour naviguer.' : 'اسحب بإصبع واحد في أي مكان للتنقل.'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 20, background: `${t.accent}0d` }}>
                  <span style={{ fontSize: 24 }}>🖊️</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>{lang === 'fr' ? 'Le stylet dessine' : 'القلم للرسم'}</div>
                    <p style={{ fontSize: 11, color: t.inkMute, margin: '2px 0 0' }}>{lang === 'fr' ? 'L\'Apple Pencil dessine, votre paume est ignorée.' : 'القلم يرسم، ويتم تجاهل راحة اليد.'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 20, background: `${t.accent}0d` }}>
                  <span style={{ fontSize: 24 }}>✨</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>{lang === 'fr' ? 'Automatique' : 'تلقائي'}</div>
                    <p style={{ fontSize: 11, color: t.inkMute, margin: '2px 0 0' }}>{lang === 'fr' ? 'Le mode s\'active dès le premier contact du stylet.' : 'يتم تفعيل الوضع بمجرد لمس القلم.'}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { localStorage.setItem('diftar_onboarding_v2', 'true'); setShowOnboarding(false); }}
                style={{ marginTop: 8, padding: '16px 0', borderRadius: 16, border: 'none', background: t.accent, color: '#fff', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', boxShadow: `0 8px 20px ${t.accent}40` }}
              >
                {lang === 'fr' ? 'J\'ai compris' : 'فهمت'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm clear */}
      {showConfirmClear && (
        <div style={{ position: 'fixed', inset: 0, backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: `${t.accent}33` }}>
          <div style={{ background: t.card, padding: 40, borderRadius: 32, boxShadow: '0 25px 50px rgba(0,0,0,0.2)', maxWidth: 360, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 32 }}>💨</div>
            <h3 style={{ fontSize: 24, fontFamily: 'serif', fontStyle: 'italic', color: t.accent, margin: 0 }}>{lang === 'fr' ? 'Effacer la page ?' : 'مسح الصفحة؟'}</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowConfirmClear(false)} style={{ flex: 1, padding: '12px 0', borderRadius: 16, border: `1px solid ${t.accent}`, background: 'transparent', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', cursor: 'pointer', color: t.accent, opacity: 0.5 }}>{lang === 'fr' ? 'Annuler' : 'إلغاء'}</button>
              <button onClick={() => { setUndoStack(prev => [...prev, { strokes: currentStrokes, shapes }]); setCurrentStrokes([]); setShapes([]); setShowConfirmClear(false); }} style={{ flex: 1, padding: '12px 0', borderRadius: 16, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', cursor: 'pointer' }}>{lang === 'fr' ? 'Effacer' : 'مسح'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
