/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Play,
  X,
  FileText,
  Search,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import OrbAvatar from './components/OrbAvatar';

interface Note {
  id: string;
  title: string;
  content: string;
  images: string[];
  updatedAt: number;
}

function MenuItem({ children, onClick, shortcut, check }: { children: React.ReactNode; onClick: () => void; shortcut?: string; check?: boolean }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className="flex items-center justify-between gap-6 px-3 py-1.5 text-[11px] font-sans text-left hover:bg-ascii-fg hover:text-ascii-bg transition-colors w-full"
    >
      <span className="flex items-center gap-2">
        <span className="w-3 text-ascii-fg/50 text-[9px]">{check !== undefined ? (check ? '✓' : '') : ''}</span>
        {children}
      </span>
      {shortcut && <span className="text-[9px] opacity-40 shrink-0">{shortcut}</span>}
    </button>
  );
}

function MenuDivider() {
  return <div className="h-px bg-ascii-border/40 mx-2 my-0.5" />;
}

const SKULL_POSES = [
  {
    skull: "M100,30 C60,30 40,60 40,90 C40,110 50,120 55,145 C57,155 70,165 100,165 C130,165 143,155 145,145 C150,120 160,110 160,90 C160,60 140,30 100,30 Z",
    eyeL: "M65,85 C55,85 55,110 65,110 C75,110 85,100 80,85 Z",
    eyeR: "M135,85 C145,85 145,110 135,110 C125,110 115,100 120,85 Z",
  },
  {
    skull: "M100,45 C50,45 35,70 35,95 C35,115 50,125 55,145 C57,155 70,160 100,160 C130,160 143,155 145,145 C150,125 165,115 165,95 C165,70 150,45 100,45 Z",
    eyeL: "M70,90 C50,90 50,120 70,120 C85,120 90,110 85,90 Z",
    eyeR: "M130,90 C150,90 150,120 130,120 C115,120 110,110 115,90 Z",
  },
  {
    skull: "M110,35 C70,30 45,60 45,95 C45,115 45,130 55,150 C57,160 75,165 105,165 C135,165 150,155 150,140 C150,115 160,105 160,85 C160,55 145,40 110,35 Z",
    eyeL: "M75,90 C60,95 65,115 75,115 C85,115 90,105 85,90 Z",
    eyeR: "M130,85 C145,85 145,110 135,110 C125,110 115,100 125,85 Z",
  },
];

function SkullCursor() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % SKULL_POSES.length), 1800 + Math.random() * 400);
    return () => clearInterval(id);
  }, []);
  const pose = SKULL_POSES[idx];
  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: 14, height: 14, overflow: 'visible' }}
      animate={{ y: [0, -2, 0] }}
      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
    >
      <motion.path fill="var(--color-ascii-fg)" animate={{ d: pose.skull }} transition={{ duration: 0.9, ease: [0.45, 0, 0.55, 1] }} />
      <motion.path fill="var(--color-ascii-bg)" animate={{ d: pose.eyeL }} transition={{ duration: 0.9, ease: [0.45, 0, 0.55, 1] }} />
      <motion.path fill="var(--color-ascii-bg)" animate={{ d: pose.eyeR }} transition={{ duration: 0.9, ease: [0.45, 0, 0.55, 1] }} />
    </motion.svg>
  );
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('New Document');
  const [darkMode, setDarkMode] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLiveRendering, setIsLiveRendering] = useState(false);
  const [isScrambled, setIsScrambled] = useState(false);
  const [scrambledContent, setScrambledContent] = useState('');
  const [isTransient, setIsTransient] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.2);
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date());
  const [uptime, setUptime] = useState(0);
  const [coreLoad, setCoreLoad] = useState('0.0');
  const [pulses, setPulses] = useState<{ id: number; x: number; y: number; text: string; type?: 'enter' | 'paste' }[]>([]);
  const [isCopying, setIsCopying] = useState(false);
  const [wireframeEnabled, setWireframeEnabled] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'downloading' | 'installing'>('idle');
  const [updateProgress, setUpdateProgress] = useState(0);
  const [cursorLine, setCursorLine] = useState(0);
  const [cursorCol, setCursorCol] = useState(0);
  const [textareaScrollTop, setTextareaScrollTop] = useState(0);
  const [textareaFocused, setTextareaFocused] = useState(false);
  // Find & Replace
  const [showFind, setShowFind] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [findCaseSensitive, setFindCaseSensitive] = useState(false);
  const [findMatches, setFindMatches] = useState<Array<{start: number; end: number}>>([]);
  const [findMatchIdx, setFindMatchIdx] = useState(0);
  // View options
  const [wordWrap, setWordWrap] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  // Go To Line
  const [showGoToLine, setShowGoToLine] = useState(false);
  const [goToLineValue, setGoToLineValue] = useState('');
  
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const transientTimeoutRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const liveRenderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeNoteRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const lineHeight = Math.round(fontSize * 1.55);

  const updateCursorLine = () => {
    const el = textareaRef.current;
    if (!el) return;
    const before = el.value.substring(0, el.selectionStart);
    const lines = before.split('\n');
    setCursorLine(lines.length - 1);
    setCursorCol(lines[lines.length - 1].length);
    setTextareaScrollTop(el.scrollTop);
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = el.scrollTop;
  };

  const computeMatches = (query: string, text: string, cs: boolean) => {
    if (!query) return [];
    try {
      const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), cs ? 'g' : 'gi');
      const out: Array<{start: number; end: number}> = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null && out.length < 5000)
        out.push({ start: m.index, end: m.index + m[0].length });
      return out;
    } catch { return []; }
  };

  const jumpToMatch = (idx: number, matches: Array<{start: number; end: number}>) => {
    const el = textareaRef.current;
    if (!el || !matches.length) return;
    const m = matches[idx];
    el.focus();
    el.setSelectionRange(m.start, m.end);
    const line = content.substring(0, m.start).split('\n').length - 1;
    el.scrollTop = Math.max(0, line * lineHeight - el.clientHeight / 2);
    updateCursorLine();
  };

  const findNext = (ms = findMatches, idx = findMatchIdx) => {
    if (!ms.length) return;
    const next = (idx + 1) % ms.length;
    setFindMatchIdx(next);
    jumpToMatch(next, ms);
  };

  const findPrev = (ms = findMatches, idx = findMatchIdx) => {
    if (!ms.length) return;
    const prev = (idx - 1 + ms.length) % ms.length;
    setFindMatchIdx(prev);
    jumpToMatch(prev, ms);
  };

  const replaceOne = () => {
    if (!findMatches.length) return;
    const m = findMatches[findMatchIdx];
    const newContent = content.substring(0, m.start) + replaceQuery + content.substring(m.end);
    handleContentChange(newContent);
    // After content change the effect recomputes matches; advance index so we don't re-select the same spot
    setFindMatchIdx(idx => Math.min(idx, findMatches.length - 2));
  };

  const replaceAll = () => {
    if (!findMatches.length) return;
    let result = content, offset = 0;
    for (const m of findMatches) {
      result = result.substring(0, m.start + offset) + replaceQuery + result.substring(m.end + offset);
      offset += replaceQuery.length - (m.end - m.start);
    }
    handleContentChange(result);
  };

  const openFind = (withReplace = false) => {
    setShowFind(true);
    setShowReplace(withReplace);
    setTimeout(() => findInputRef.current?.focus(), 60);
  };

  const closeFind = () => {
    setShowFind(false);
    setShowReplace(false);
    textareaRef.current?.focus();
  };

  const insertDateTime = () => {
    const el = textareaRef.current;
    if (!el || isScrambled || isLiveRendering) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const stamp = new Date().toLocaleString();
    const next = content.substring(0, s) + stamp + content.substring(e);
    handleContentChange(next);
    setTimeout(() => { el.setSelectionRange(s + stamp.length, s + stamp.length); updateCursorLine(); }, 0);
  };

  const handleSelectAll = () => { textareaRef.current?.select(); };

  const handleGoToLine = () => {
    const el = textareaRef.current;
    if (!el) return;
    const n = parseInt(goToLineValue);
    if (isNaN(n)) return;
    const lines = content.split('\n');
    const target = Math.max(0, Math.min(n - 1, lines.length - 1));
    const pos = lines.slice(0, target).join('\n').length + (target > 0 ? 1 : 0);
    el.focus();
    el.setSelectionRange(pos, pos);
    el.scrollTop = Math.max(0, target * lineHeight - el.clientHeight / 2);
    setCursorLine(target);
    setTextareaScrollTop(el.scrollTop);
    setShowGoToLine(false);
    setGoToLineValue('');
  };

  const zoomIn = () => setFontSize(s => Math.min(s + 2, 40));
  const zoomOut = () => setFontSize(s => Math.max(s - 2, 10));
  const zoomReset = () => setFontSize(18);

  const saveToDesktop = async () => {
    if (!window.electron) {
      // Fallback for browser: use download link
      downloadNote();
      return;
    }
    const result = await window.electron.file.saveToDesktop(title || 'Untitled', content);
    if (result.success) {
      setSaveToast(`Saved to Desktop as "${(title || 'Untitled').replace(/[<>:"/\\|?*]/g, '_')}.txt"`);
    } else {
      setSaveToast(`Save failed: ${result.error}`);
    }
    // Store ref so unmount can clear it before it fires
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setSaveToast(null), 3000);
  };
  
  const addImage = (dataUrl: string) => setNoteImages(prev => [...prev, dataUrl]);
  const removeImage = (idx: number) => setNoteImages(prev => prev.filter((_, i) => i !== idx));

  const handleImageFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = ev => { if (ev.target?.result) addImage(ev.target.result as string); };
      reader.readAsDataURL(file);
    });
  };

  const handleEditorDragOver = (e: React.DragEvent) => {
    const items = Array.from(e.dataTransfer.items) as DataTransferItem[];
    if (items.some(i => i.type.startsWith('image/'))) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleEditorDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type.startsWith('image/'));
    if (files.length) { e.preventDefault(); handleImageFiles(files); }
  };

  // Close menu on outside click
  useEffect(() => {
    if (!openMenu) return;
    const handler = () => setOpenMenu(null);
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [openMenu]);

  // Updater IPC listeners
  useEffect(() => {
    if (!window.electron) return;
    window.electron.updater.onUpdateDownloading((pct: number) => {
      setUpdateStatus('downloading');
      setUpdateProgress(pct);
    });
    window.electron.updater.onUpdateInstalling(() => {
      setUpdateStatus('installing');
      setUpdateProgress(100);
    });
  }, []);

  // Sync ref for effect safety
  useEffect(() => {
    activeNoteRef.current = activeNoteId;
  }, [activeNoteId]);

  // Recompute find matches when query/content changes
  useEffect(() => {
    if (!showFind || !findQuery) { setFindMatches([]); setFindMatchIdx(0); return; }
    const ms = computeMatches(findQuery, content, findCaseSensitive);
    setFindMatches(ms);
    setFindMatchIdx(0);
    if (ms.length) jumpToMatch(0, ms);
  }, [findQuery, content, findCaseSensitive, showFind]);

  // Global keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'f') { e.preventDefault(); openFind(false); }
      if (ctrl && e.key === 'h') { e.preventDefault(); openFind(true); }
      if (ctrl && e.key === 'g') { e.preventDefault(); setShowGoToLine(true); }
      if (ctrl && (e.key === '=' || e.key === '+')) { e.preventDefault(); zoomIn(); }
      if (ctrl && e.key === '-') { e.preventDefault(); zoomOut(); }
      if (ctrl && e.key === '0') { e.preventDefault(); zoomReset(); }
      if (ctrl && e.key === 'a' && textareaFocused) { e.preventDefault(); handleSelectAll(); }
      if (e.key === 'F5' && textareaFocused) { e.preventDefault(); insertDateTime(); }
      if (e.key === 'F3') { e.preventDefault(); e.shiftKey ? findPrev() : findNext(); }
      if (e.key === 'Escape') { closeFind(); setShowGoToLine(false); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [showFind, findMatches, findMatchIdx, findQuery, content, findCaseSensitive, isScrambled, isLiveRendering, textareaFocused]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTypingSound = () => {
    if (!isSoundEnabled) return;
    
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Triangle wave provides a softer, premium mechanical 'thud' compared to square
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(soundVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      console.warn('Audio peripheral failed to initialize');
    }
  };

  // Typing animation timeout
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsTyping(true);
    playTypingSound();
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => setIsTyping(false), 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = e.currentTarget;
      const { selectionStart } = textarea;

      const textAtCursor = textarea.value.substring(0, selectionStart);
      const lines = textAtCursor.split('\n');
      const lineCount = lines.length;
      const lastLineLength = lines[lines.length - 1].length;

      const charWidth = Math.round(fontSize * 0.601);

      const id = Date.now();
      const topOffset = (lineCount * lineHeight) - textarea.scrollTop + 8;
      const leftOffset = (lastLineLength * charWidth) + 32; // 32 = pl-8 left padding
      
      if (topOffset > 0 && topOffset < textarea.offsetHeight) {
        const chars = "!@#$%^&*()_+{}:\"<>?,./;'[]\\=-`~1234567890QWERTYUIOPASDFGHJKLZXCVBNM";
        const randomChar = chars[Math.floor(Math.random() * chars.length)];
        
        setPulses(prev => [...prev, { id, x: leftOffset, y: topOffset, text: randomChar, type: 'enter' }]);
        setTimeout(() => {
          setPulses(prev => prev.filter(p => p.id !== id));
        }, 1000);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (isScrambled || isLiveRendering || isTransient) return;

    // Intercept image pastes
    const imageItem = (Array.from(e.clipboardData.items) as DataTransferItem[]).find(i => i.type.startsWith('image/'));
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) handleImageFiles([file]);
      return;
    }

    e.preventDefault();
    const clipboardData = e.clipboardData.getData('Text');
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;

    const start = content.substring(0, selectionStart);
    const end = content.substring(selectionEnd);
    
    // Generate scrambled version for the reveal effect
    const chars = "!@#$%^&*()_+{}:\"<>?,./;'[]\\=-`~1234567890QWERTYUIOPASDFGHJKLZXCVBNM";
    const scrambled = clipboardData.split('').map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    const noteIdAtPaste = activeNoteId;
    setIsTransient(true);
    setContent(start + scrambled + end);

    const lineCount = content.substring(0, selectionStart).split('\n').length;
    const lastLineLength = content.substring(0, selectionStart).split('\n').pop()?.length || 0;

    const charWidth = Math.round(fontSize * 0.601);

    const topOffset = (lineCount * lineHeight) - textarea.scrollTop + 8;
    const leftOffset = (lastLineLength * charWidth) + 32; // 32 = pl-8 left padding

    const newPulses = Array(5).fill(0).map((_, i) => ({
      id: Date.now() + i,
      x: leftOffset + (i * 15),
      y: topOffset + (Math.random() * 20 - 10),
      text: chars[Math.floor(Math.random() * chars.length)],
      type: 'paste' as const
    }));

    setPulses(prev => [...prev, ...newPulses]);
    
    if (transientTimeoutRef.current) clearTimeout(transientTimeoutRef.current);
    transientTimeoutRef.current = window.setTimeout(() => {
      // Safety check: only apply reveal if we are still on the same note
      if (activeNoteRef.current === noteIdAtPaste) {
        setContent(prev => {
          const head = prev.substring(0, selectionStart);
          const tail = prev.substring(selectionStart + clipboardData.length);
          return head + clipboardData + tail;
        });
      }
      const ids = newPulses.map(p => p.id);
      setPulses(prev => prev.filter(p => !ids.includes(p.id)));
      setIsTransient(false);
      transientTimeoutRef.current = null;
    }, 1000);
  };

  const handleCopy = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (isScrambled || isLiveRendering || isTransient) return;
    
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart === selectionEnd) return;

    const selectedText = content.substring(selectionStart, selectionEnd);
    e.clipboardData.setData('text/plain', selectedText);
    e.preventDefault();
    const noteIdAtCopy = activeNoteId;

    // Visual Scramble Effect on screen
    const chars = "!@#$%^&*()_+{}:\"<>?,./;'[]\\=-`~1234567890QWERTYUIOPASDFGHJKLZXCVBNM";
    const scrambled = selectedText.split('').map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    const start = content.substring(0, selectionStart);
    const end = content.substring(selectionEnd);
    
    setIsTransient(true);
    setContent(start + scrambled + end);
    setIsCopying(true);

    if (transientTimeoutRef.current) clearTimeout(transientTimeoutRef.current);
    transientTimeoutRef.current = window.setTimeout(() => {
      if (activeNoteRef.current === noteIdAtCopy) {
        setContent(prev => {
          const head = prev.substring(0, selectionStart);
          const tail = prev.substring(selectionStart + selectedText.length);
          return head + selectedText + tail;
        });
      }
      setIsCopying(false);
      setIsTransient(false);
      transientTimeoutRef.current = null;
    }, 1000);
  };


  // Scrambler Logic
  useEffect(() => {
    if (!isScrambled) {
      setScrambledContent('');
      return;
    }

    const chars = "!@#$%^&*()_+{}:\"<>?,./;'[]\\=-`~1234567890QWERTYUIOPASDFGHJKLZXCVBNM";
    const scramble = () => {
      const scrambled = content.split('').map(char => {
        if (/\s/.test(char)) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      setScrambledContent(scrambled);
    };

    scramble();
    const interval = setInterval(scramble, 100);
    return () => clearInterval(interval);
  }, [isScrambled, content]);

  // Initialize synthesis
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setSystemTime(new Date());
      setUptime(prev => prev + 1);
      setCoreLoad((Math.random() * 5 + 12.4).toFixed(1));
    }, 1000);
    
    synthesisRef.current = window.speechSynthesis;

    const savedNotes = localStorage.getItem('ascii_notes');
    if (savedNotes) {
      const parsed: Note[] = JSON.parse(savedNotes).map((n: Note) => ({ images: [], ...n }));
      setNotes(parsed);
      if (parsed.length > 0) {
        setActiveNoteId(parsed[0].id);
        setContent(parsed[0].content);
        setTitle(parsed[0].title);
        setNoteImages(parsed[0].images ?? []);
      }
    } else {
      createNewNote();
    }

    return () => {
      clearInterval(timeInterval);
      // Cancel any in-flight timers so they don't setState after unmount
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (transientTimeoutRef.current) clearTimeout(transientTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (liveRenderTimerRef.current) clearInterval(liveRenderTimerRef.current);
      // Cancel speech synthesis if active
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('ascii_notes', JSON.stringify(notes));
    }, 500);
    return () => clearTimeout(timer);
  }, [notes]);

  useEffect(() => {
    if (activeNoteId && !isTransient && !isLiveRendering) {
      setNotes(prev => prev.map(n =>
        n.id === activeNoteId
          ? { ...n, content, title, images: noteImages, updatedAt: Date.now() }
          : n
      ));
    }
  }, [content, title, noteImages, activeNoteId, isTransient, isLiveRendering]);

  const createNewNote = () => {
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 11),
      title: 'Untitled Note',
      content: '',
      images: [],
      updatedAt: Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setContent('');
    setTitle('Untitled Note');
    setNoteImages([]);
  };

  const deleteNote = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => {
      const remaining = prev.filter(n => n.id !== id);
      if (activeNoteId === id) {
        const next = remaining[0] ?? null;
        setActiveNoteId(next?.id ?? null);
        setContent(next?.content ?? '');
        setTitle(next?.title ?? '');
        setNoteImages(next?.images ?? []);
      }
      return remaining;
    });
  };

  const selectNote = (note: Note) => {
    setActiveNoteId(note.id);
    setContent(note.content);
    setTitle(note.title);
    setNoteImages(note.images ?? []);
  };

  const handleTTS = () => {
    if (!synthesisRef.current) return;
    if (isSpeaking) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = content || 'Nothing to read.';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synthesisRef.current.speak(utterance);
  };

  const handleLiveRender = () => {
    if (isLiveRendering || content.length === 0) return;

    const originalText = content;
    setIsLiveRendering(true);
    setContent('');

    let index = 0;
    // Store in ref so the unmount cleanup can cancel it
    liveRenderTimerRef.current = setInterval(() => {
      if (index >= originalText.length) {
        clearInterval(liveRenderTimerRef.current!);
        liveRenderTimerRef.current = null;
        setIsLiveRendering(false);
        return;
      }
      setContent(prev => prev + originalText[index]);
      index++;
    }, 20);
  };

  const handleClearBuffer = () => {
    if (confirm('TERMINAL_COMMAND: CLEAR_INPUT_BUFFER?')) {
      setContent('');
    }
  };

  const downloadNote = () => {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'buffer'}.txt`;
    document.body.appendChild(a);
    a.click();
    // Clean up immediately — the click schedules the download, so these are safe to remove
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`h-full flex flex-col relative overflow-hidden ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      {crtEnabled && (
        <>
          <div className="scanlines" />
          <div className="crt-vignette" />
          <div className="crt-flicker" />
        </>
      )}
      
      {/* Help Overlay Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-ascii-bg/90 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setShowHelp(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-2xl w-full border-2 border-ascii-fg p-8 bg-ascii-bg shadow-[0_0_40px_rgba(0,255,65,0.2)] relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 cursor-pointer hover:text-red-500" onClick={() => setShowHelp(false)}>
                <X size={24} />
              </div>
              <h2 className="text-2xl font-bold mb-6 border-b-2 border-ascii-fg pb-2 uppercase tracking-widest">Sentinel System V5.2.0</h2>
              <div className="space-y-4 font-sans text-sm">
                <p className="text-ascii-fg opacity-80">Welcome to the Sentinel Secure Notepad. This environment is designed for industrial-grade encrypted text processing.</p>
                <div className="grid grid-cols-2 gap-4">
                   <div className="border border-ascii-dim p-3">
                      <h3 className="font-bold text-ascii-fg mb-1">COMMAND LIST</h3>
                      <ul className="list-disc list-inside text-xs opacity-70">
                        <li>FILE: Manage buffer segments</li>
                        <li>EDIT: Clear or modify data</li>
                        <li>VIEW: Toggle visual subsystems</li>
                        <li>MESH: Topographic wireframe active</li>
                        <li>SYNTHESIZE: Audio output active</li>
                      </ul>
                   </div>
                   <div className="border border-ascii-dim p-3">
                      <h3 className="font-bold text-ascii-fg mb-1">CORE STATUS</h3>
                      <ul className="list-disc list-inside text-xs opacity-70">
                        <li>READY: System idle</li>
                        <li>BUSY: I/O throughput</li>
                        <li>ENC: Scramble mode active</li>
                      </ul>
                   </div>
                </div>
                <div className="mt-8 pt-4 border-t border-ascii-dim flex justify-between items-center text-[10px] opacity-40">
                   <span>FIRMWARE: NX-SENTINEL-A1</span>
                   <span>LICENSE: CORPORATE_STANDARD</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* OS Title Bar + Menu */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files) { handleImageFiles(e.target.files); e.target.value = ''; } }}
      />

      <div className="title-bar shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-4">
           <span className="glitch-text font-bold tracking-widest" data-text="TERMINAL NOTEPAD">TERMINAL NOTEPAD</span>
           <div className="no-drag flex items-center gap-1 ml-4 text-[11px] font-sans font-medium text-ascii-bg">
              {/* Status pill */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-ascii-bg/20 rounded mr-2">
                <div className="w-1.5 h-1.5 rounded-full bg-ascii-fg animate-pulse" />
                <span className="text-[8px] tracking-widest opacity-70">ONLINE</span>
              </div>

              {/* FILE menu */}
              <div className="relative" onMouseDown={e => e.stopPropagation()}>
                <button
                  onMouseDown={() => setOpenMenu(m => m === 'FILE' ? null : 'FILE')}
                  className={`px-3 py-0.5 rounded transition-colors ${openMenu === 'FILE' ? 'bg-ascii-bg/30' : 'hover:bg-ascii-bg/20'}`}
                >File</button>
                <AnimatePresence>
                  {openMenu === 'FILE' && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.1 }}
                      className="absolute top-full left-0 mt-1 z-[100] flex flex-col bg-ascii-bg border border-ascii-border/80 min-w-[180px] shadow-2xl shadow-black/60 rounded-sm overflow-hidden text-ascii-fg"
                    >
                      <MenuItem onClick={() => { createNewNote(); setOpenMenu(null); }}>New Buffer</MenuItem>
                      <MenuDivider />
                      <MenuItem onClick={() => { imageInputRef.current?.click(); setOpenMenu(null); }}>Insert Image</MenuItem>
                      <MenuDivider />
                      <MenuItem onClick={() => { saveToDesktop(); setOpenMenu(null); }}>Save to Desktop</MenuItem>
                      <MenuItem onClick={() => { downloadNote(); setOpenMenu(null); }}>Export / Download</MenuItem>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* EDIT menu */}
              <div className="relative" onMouseDown={e => e.stopPropagation()}>
                <button
                  onMouseDown={() => setOpenMenu(m => m === 'EDIT' ? null : 'EDIT')}
                  className={`px-3 py-0.5 rounded transition-colors ${openMenu === 'EDIT' ? 'bg-ascii-bg/30' : 'hover:bg-ascii-bg/20'}`}
                >Edit</button>
                <AnimatePresence>
                  {openMenu === 'EDIT' && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.1 }}
                      className="absolute top-full left-0 mt-1 z-[100] flex flex-col bg-ascii-bg border border-ascii-border/80 min-w-[200px] shadow-2xl shadow-black/60 rounded-sm overflow-hidden text-ascii-fg"
                    >
                      <MenuItem shortcut="Ctrl+A" onClick={() => { handleSelectAll(); setOpenMenu(null); }}>Select All</MenuItem>
                      <MenuDivider />
                      <MenuItem shortcut="Ctrl+F" onClick={() => { openFind(false); setOpenMenu(null); }}>Find</MenuItem>
                      <MenuItem shortcut="Ctrl+H" onClick={() => { openFind(true); setOpenMenu(null); }}>Replace</MenuItem>
                      <MenuItem shortcut="Ctrl+G" onClick={() => { setShowGoToLine(true); setOpenMenu(null); }}>Go to Line</MenuItem>
                      <MenuDivider />
                      <MenuItem shortcut="F5" onClick={() => { insertDateTime(); setOpenMenu(null); }}>Insert Date/Time</MenuItem>
                      <MenuItem onClick={() => { handleClearBuffer(); setOpenMenu(null); }}>Clear Buffer</MenuItem>
                      <MenuItem onClick={() => { setIsScrambled(!isScrambled); setOpenMenu(null); }}>Crypto Mode</MenuItem>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* VIEW menu */}
              <div className="relative" onMouseDown={e => e.stopPropagation()}>
                <button
                  onMouseDown={() => setOpenMenu(m => m === 'VIEW' ? null : 'VIEW')}
                  className={`px-3 py-0.5 rounded transition-colors ${openMenu === 'VIEW' ? 'bg-ascii-bg/30' : 'hover:bg-ascii-bg/20'}`}
                >View</button>
                <AnimatePresence>
                  {openMenu === 'VIEW' && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.1 }}
                      className="absolute top-full left-0 mt-1 z-[100] flex flex-col bg-ascii-bg border border-ascii-border/80 min-w-[190px] shadow-2xl shadow-black/60 rounded-sm overflow-hidden text-ascii-fg"
                    >
                      <MenuItem check={wordWrap} onClick={() => { setWordWrap(w => !w); setOpenMenu(null); }}>Word Wrap</MenuItem>
                      <MenuItem check={showLineNumbers} onClick={() => { setShowLineNumbers(n => !n); setOpenMenu(null); }}>Line Numbers</MenuItem>
                      <MenuDivider />
                      <MenuItem shortcut="Ctrl++" onClick={() => { zoomIn(); setOpenMenu(null); }}>Zoom In</MenuItem>
                      <MenuItem shortcut="Ctrl+-" onClick={() => { zoomOut(); setOpenMenu(null); }}>Zoom Out</MenuItem>
                      <MenuItem shortcut="Ctrl+0" onClick={() => { zoomReset(); setOpenMenu(null); }}>Restore Zoom</MenuItem>
                      <MenuDivider />
                      <MenuItem check={crtEnabled} onClick={() => { setCrtEnabled(!crtEnabled); setOpenMenu(null); }}>CRT Effect</MenuItem>
                      <MenuItem check={wireframeEnabled} onClick={() => { setWireframeEnabled(!wireframeEnabled); setOpenMenu(null); }}>Mesh Overlay</MenuItem>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button className="px-3 py-0.5 rounded hover:bg-ascii-bg/20 transition-colors" onClick={handleTTS}>Synth</button>
              <button className="px-3 py-0.5 rounded hover:bg-ascii-bg/20 transition-colors" onClick={() => setDarkMode(!darkMode)}>Theme</button>
           </div>
        </div>
        <div className="no-drag flex items-center gap-1">
          <span
            className="cursor-pointer px-2 py-0.5 text-[10px] font-bold hover:opacity-100 transition-opacity"
            onClick={() => setShowHelp(true)}
          >HELP</span>
          <div className="w-px h-3 bg-ascii-bg/30 mx-1" />
          <button
            onClick={() => window.electron?.window.minimize()}
            className="w-7 h-6 flex items-center justify-center hover:bg-ascii-bg/20 transition-colors text-ascii-bg font-bold text-[11px]"
            title="Minimize"
          >─</button>
          <button
            onClick={() => window.electron?.window.maximize()}
            className="w-7 h-6 flex items-center justify-center hover:bg-ascii-bg/20 transition-colors text-ascii-bg font-bold text-[10px]"
            title="Maximize"
          >□</button>
          <button
            onClick={() => window.electron?.window.close()}
            className="w-7 h-6 flex items-center justify-center hover:bg-red-600 transition-colors text-ascii-bg font-bold text-[13px]"
            title="Close"
          >✕</button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar Panel */}
        <aside className="w-[260px] shrink-0 flex flex-col border-r border-ascii-border bg-black/30 backdrop-blur-sm overflow-hidden">

          {/* Orb Hero Section */}
          <div className="relative flex flex-col items-center pt-5 pb-3 px-4 border-b border-ascii-border/50">
            {/* Corner accents */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-ascii-fg/30" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-ascii-fg/30" />

            <OrbAvatar
              darkMode={darkMode}
              isTyping={isTyping}
              isSpeaking={isSpeaking}
              isScrambled={isScrambled}
              wireframeEnabled={wireframeEnabled}
            />

            {/* System ID */}
            <div className="mt-2 text-center">
              <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-ascii-fg">SENTINEL</div>
              <div className="text-[8px] tracking-[0.15em] text-ascii-dim uppercase mt-0.5">NX-PRISM-C5 // ONLINE</div>
            </div>

            {/* Status pills */}
            <div className="flex gap-2 mt-3">
              {[
                { label: 'I/O', active: isTyping },
                { label: 'PCM', active: isSpeaking },
                { label: 'ENC', active: isScrambled, accent: true },
              ].map(({ label, active, accent }) => (
                <div key={label} className={`flex items-center gap-1 px-2 py-0.5 border text-[8px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  active
                    ? accent
                      ? 'border-ascii-accent2 text-ascii-accent2 bg-ascii-accent2/10'
                      : 'border-ascii-fg text-ascii-fg bg-ascii-fg/10'
                    : 'border-ascii-border text-ascii-dim'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${active ? (accent ? 'bg-ascii-accent2 animate-pulse' : 'bg-ascii-fg animate-pulse') : 'bg-ascii-dim/40'}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* System Metrics */}
          <div className="grid grid-cols-3 border-b border-ascii-border/50">
            {[
              { label: 'TIME', value: systemTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) },
              { label: 'UP', value: `${Math.floor(uptime/60)}m${uptime%60}s` },
              { label: 'LOAD', value: `${coreLoad}%` },
            ].map(({ label, value }, i) => (
              <div key={label} className={`flex flex-col items-center py-2.5 gap-0.5 ${i < 2 ? 'border-r border-ascii-border/50' : ''}`}>
                <span className="text-[7px] uppercase tracking-widest text-ascii-dim font-bold">{label}</span>
                <span className="text-[11px] font-sans font-bold text-ascii-fg leading-none">{value}</span>
              </div>
            ))}
          </div>

          {/* Audio Controls */}
          <div className="px-3 py-3 border-b border-ascii-border/50 space-y-2.5">
            <span className="text-[8px] font-black tracking-[0.3em] uppercase text-ascii-dim block">Audio</span>

            <div className="flex gap-2">
              <button
                onClick={handleTTS}
                className={`flex-1 flex items-center justify-center gap-2 py-2 border text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-sm ${
                  isSpeaking
                    ? 'border-ascii-fg bg-ascii-fg text-ascii-bg'
                    : 'border-ascii-border text-ascii-fg hover:border-ascii-fg hover:bg-ascii-fg/10'
                }`}
              >
                {isSpeaking ? <><span className="w-2 h-2 bg-ascii-bg rounded-sm inline-block" /> Stop</> : <><Play size={10} /> Play</>}
              </button>
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className={`w-10 flex items-center justify-center border rounded-sm transition-all duration-200 ${
                  isSoundEnabled ? 'border-ascii-fg bg-ascii-fg/10 text-ascii-fg' : 'border-ascii-border text-ascii-dim'
                }`}
                title="Toggle Keystroke Audio"
              >
                {isSoundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[8px] uppercase tracking-wider">
                <span className="text-ascii-dim">Gain</span>
                <span className="text-ascii-fg font-sans">{(soundVolume * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0" max="0.5" step="0.05"
                value={soundVolume}
                onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                className="w-full h-0.5 bg-ascii-dim/30 rounded-full appearance-none cursor-pointer accent-ascii-fg"
              />
            </div>
          </div>

          {/* Buffer Controls */}
          <div className="px-3 py-3 border-b border-ascii-border/50 space-y-2">
            <span className="text-[8px] font-black tracking-[0.3em] uppercase text-ascii-dim block">Buffer</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleLiveRender}
                className="flex items-center justify-center gap-1.5 py-2 border border-ascii-border text-ascii-fg text-[10px] font-bold uppercase tracking-wider rounded-sm hover:border-ascii-fg hover:bg-ascii-fg/10 transition-all duration-200"
              >
                <Play size={9} /> Render
              </button>
              <button
                onClick={() => setIsScrambled(!isScrambled)}
                className={`flex items-center justify-center gap-1.5 py-2 border text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all duration-200 ${
                  isScrambled
                    ? 'border-ascii-accent2 bg-ascii-accent2/10 text-ascii-accent2'
                    : 'border-ascii-border text-ascii-fg hover:border-ascii-fg hover:bg-ascii-fg/10'
                }`}
              >
                {isScrambled ? 'Decrypt' : 'Encrypt'}
              </button>
            </div>
          </div>

          {/* Notes Directory */}
          <div className="flex flex-col flex-1 min-h-0 px-3 py-3 gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black tracking-[0.3em] uppercase text-ascii-dim">Files</span>
              <button
                onClick={createNewNote}
                className="flex items-center gap-1 px-2 py-0.5 border border-ascii-border text-ascii-fg text-[8px] font-bold uppercase tracking-wider rounded-sm hover:border-ascii-fg hover:bg-ascii-fg/10 transition-all duration-200"
              >
                <Plus size={9} /> New
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-ascii-dim/30">
              {notes.map(note => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`group flex items-center gap-2 px-2 py-2 cursor-pointer rounded-sm transition-all duration-150 ${
                    activeNoteId === note.id
                      ? 'bg-ascii-fg text-ascii-bg'
                      : 'text-ascii-dim hover:text-ascii-fg hover:bg-ascii-fg/5'
                  }`}
                >
                  <FileText size={10} className="shrink-0" />
                  <span className="flex-1 text-[10px] font-sans truncate uppercase">{note.title || 'Untitled'}</span>
                  <button
                    onClick={(e) => deleteNote(note.id, e)}
                    className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 ${activeNoteId === note.id ? 'text-ascii-bg hover:text-red-600' : ''}`}
                  >
                    <Trash2 size={9} />
                  </button>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-center text-ascii-dim text-[9px] uppercase tracking-widest py-6 opacity-50">
                  No buffers
                </div>
              )}
            </div>
          </div>

          {/* Viz Bar */}
          <div className="flex items-end gap-px h-6 px-3 border-t border-ascii-border/50">
            {[40, 70, 20, 90, 50, 30, 80, 45, 60, 35, 75, 25, 85, 55, 65, 15].map((h, i) => (
              <motion.div
                key={i}
                animate={isSpeaking ? { height: [`${h}%`, `${h * 0.4}%`, `${h}%`] } : { height: `${Math.min(h * 0.3, 30)}%` }}
                transition={{ repeat: Infinity, duration: 0.4 + i * 0.05 }}
                className="flex-1 bg-ascii-fg/50 rounded-t-px"
              />
            ))}
          </div>
        </aside>

        {/* Editor Area */}
        <section className="flex-1 flex flex-col p-2 gap-2 overflow-hidden relative min-h-0">
          <div className="flex items-center gap-2 text-[10px] font-bold px-2 py-1 bg-ascii-fg/10 border border-ascii-border relative overflow-hidden shrink-0">
             <motion.div 
               animate={{ x: ['-100%', '100%'] }}
               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
               className="absolute inset-y-0 w-12 bg-ascii-fg/5 skew-x-12" 
             />
             <span className="text-ascii-dim uppercase">Location:</span>
             <input 
               value={title} 
               onChange={(e) => setTitle(e.target.value)}
               className="bg-transparent border-none outline-none flex-1 uppercase text-base relative z-10"
             />
             
             {isTyping && (
                <div className="flex items-center gap-2 px-2 py-1 bg-ascii-fg text-ascii-bg text-[10px] font-bold">
                  <span>ACTIVE</span>
                </div>
             )}
          </div>

          <div className="editor-glass p-0 flex flex-col min-h-0 overflow-hidden">

            {/* Find & Replace Panel */}
            <AnimatePresence>
              {showFind && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="shrink-0 overflow-hidden border-b border-ascii-border/50 bg-black/30"
                >
                  <div className="p-2 space-y-1.5">
                    {/* Find row */}
                    <div className="flex items-center gap-2">
                      <Search size={11} className="text-ascii-dim shrink-0" />
                      <input
                        ref={findInputRef}
                        value={findQuery}
                        onChange={e => setFindQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.shiftKey ? findPrev() : findNext(); } if (e.key === 'Escape') closeFind(); }}
                        placeholder="Find..."
                        className="flex-1 bg-transparent border border-ascii-border/50 text-ascii-fg font-sans text-[11px] px-2 py-1 outline-none focus:border-ascii-fg placeholder:text-ascii-dim/40"
                        spellCheck={false}
                      />
                      <span className="text-[9px] font-sans text-ascii-dim shrink-0 w-12 text-center">
                        {findMatches.length ? `${findMatchIdx + 1}/${findMatches.length}` : '0/0'}
                      </span>
                      <button onClick={() => findPrev()} className="p-1 text-ascii-dim hover:text-ascii-fg transition-colors"><ChevronUp size={12} /></button>
                      <button onClick={() => findNext()} className="p-1 text-ascii-dim hover:text-ascii-fg transition-colors"><ChevronDown size={12} /></button>
                      <button
                        onClick={() => setFindCaseSensitive(c => !c)}
                        className={`px-1.5 py-0.5 text-[9px] font-bold border transition-colors ${findCaseSensitive ? 'border-ascii-fg text-ascii-fg bg-ascii-fg/10' : 'border-ascii-border/40 text-ascii-dim'}`}
                        title="Case sensitive"
                      >Aa</button>
                      <button onClick={closeFind} className="p-1 text-ascii-dim hover:text-ascii-fg transition-colors"><X size={12} /></button>
                    </div>
                    {/* Replace row */}
                    {showReplace && (
                      <div className="flex items-center gap-2">
                        <div className="w-[11px] shrink-0" />
                        <input
                          value={replaceQuery}
                          onChange={e => setReplaceQuery(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') replaceOne(); if (e.key === 'Escape') closeFind(); }}
                          placeholder="Replace..."
                          className="flex-1 bg-transparent border border-ascii-border/50 text-ascii-fg font-sans text-[11px] px-2 py-1 outline-none focus:border-ascii-fg placeholder:text-ascii-dim/40"
                          spellCheck={false}
                        />
                        <button onClick={replaceOne} className="px-2 py-1 border border-ascii-border/50 text-ascii-fg text-[9px] font-bold uppercase hover:border-ascii-fg hover:bg-ascii-fg/10 transition-colors">Replace</button>
                        <button onClick={replaceAll} className="px-2 py-1 border border-ascii-border/50 text-ascii-fg text-[9px] font-bold uppercase hover:border-ascii-fg hover:bg-ascii-fg/10 transition-colors">All</button>
                        <div className="w-[68px]" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className={`relative flex-1 flex min-h-0 overflow-hidden transition-all duration-150 ${isDragOver ? 'ring-2 ring-inset ring-ascii-fg/60' : ''}`}
              onDragOver={handleEditorDragOver}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleEditorDrop}
            >
              {isDragOver && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-ascii-fg/5">
                  <span className="text-ascii-fg font-sans text-[11px] uppercase tracking-[0.3em] border border-ascii-fg/50 px-4 py-2 bg-ascii-bg/80">DROP IMAGE HERE</span>
                </div>
              )}
              {/* Line Numbers */}
              {showLineNumbers && (
                <div
                  ref={lineNumbersRef}
                  className="shrink-0 overflow-hidden select-none border-r border-ascii-border/20 bg-black/20"
                  style={{ width: 44, overflowY: 'hidden', paddingTop: 8 }}
                >
                  {content.split('\n').map((_, i) => (
                    <div key={i} className="text-right pr-2 font-mono transition-colors duration-100"
                      style={{
                        fontSize: fontSize * 0.72,
                        lineHeight: `${lineHeight}px`,
                        height: lineHeight,
                        color: i === cursorLine ? 'var(--color-ascii-fg)' : 'var(--color-ascii-dim)',
                        opacity: i === cursorLine ? 0.85 : 0.35,
                      }}
                    >{i + 1}</div>
                  ))}
                </div>
              )}

            <div className="relative flex-1 flex flex-col min-h-0">
              <textarea
                ref={textareaRef}
                value={isScrambled ? scrambledContent : content}
                onChange={(e) => { if (!isScrambled && !isLiveRendering) { handleContentChange(e.target.value); updateCursorLine(); } }}
                onKeyDown={(e) => !isScrambled && !isLiveRendering && handleKeyDown(e)}
                onKeyUp={updateCursorLine}
                onMouseUp={updateCursorLine}
                onSelect={updateCursorLine}
                onScroll={() => { const t = textareaRef.current?.scrollTop ?? 0; setTextareaScrollTop(t); if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = t; }}
                onFocus={() => setTextareaFocused(true)}
                onBlur={() => setTextareaFocused(false)}
                onPaste={(e) => !isScrambled && !isLiveRendering && handlePaste(e)}
                onCopy={handleCopy}
                wrap={wordWrap ? 'soft' : 'off'}
                className={`flex-1 bg-transparent border-none outline-none resize-none font-mono pt-2 pr-2 pb-2 pl-8 selection:bg-ascii-fg selection:text-ascii-bg scrollbar-thin scrollbar-track-transparent scrollbar-thumb-ascii-dim/50 ${isScrambled || isLiveRendering ? 'cursor-not-allowed opacity-80' : ''}`}
                style={{ fontSize, lineHeight: `${lineHeight}px` }}
                placeholder="[WAITING_FOR_DATA_INPUT...]"
                spellCheck={false}
                readOnly={isScrambled || isLiveRendering}
              />

              {/* Active Line Indicator */}
              <AnimatePresence>
                {textareaFocused && !isScrambled && !isLiveRendering && (
                  <motion.div
                    className="absolute left-0 pointer-events-none flex items-center z-10"
                    style={{
                      top: cursorLine * lineHeight - textareaScrollTop + 8,
                      height: lineHeight,
                      width: 28,
                    }}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.12 }}
                  >
                    {/* Glow backdrop */}
                    <motion.div
                      className="absolute inset-0"
                      animate={{ opacity: [0.06, 0.14, 0.06] }}
                      transition={{ repeat: Infinity, duration: 1.4 }}
                      style={{ background: 'linear-gradient(90deg, var(--color-ascii-fg) 0%, transparent 100%)' }}
                    />
                    {/* Skull cursor */}
                    <motion.div
                      className="relative flex items-center"
                      style={{ paddingLeft: 3 }}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                    >
                      <SkullCursor />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enter/Paste Key Pulses */}
              <AnimatePresence mode="popLayout">
                {pulses.map(pulse => (
                  <ScramblerPulse
                    key={pulse.id}
                    x={pulse.x}
                    y={pulse.y}
                    initialText={pulse.text}
                    type={pulse.type}
                  />
                ))}
              </AnimatePresence>
            </div>
            </div>{/* end flex row (line numbers + textarea) */}

            {/* Image Strip */}
            <AnimatePresence>
              {noteImages.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 border-t border-ascii-border/40 bg-black/20 overflow-hidden"
                >
                  <div className="flex gap-2 p-2 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-ascii-dim/40">
                    {noteImages.map((src, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="relative shrink-0 group cursor-pointer"
                        onClick={() => setLightboxIdx(idx)}
                      >
                        <img
                          src={src}
                          alt={`Image ${idx + 1}`}
                          className="h-20 w-auto max-w-[140px] object-cover border border-ascii-border/50 group-hover:border-ascii-fg/60 transition-colors"
                          style={{ imageRendering: 'auto' }}
                        />
                        <button
                          onClick={e => { e.stopPropagation(); removeImage(idx); }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-ascii-bg border border-ascii-fg/50 text-ascii-fg text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-ascii-fg hover:text-ascii-bg"
                        >✕</button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-ascii-dim text-[8px] font-sans text-center opacity-0 group-hover:opacity-100 transition-opacity px-1 py-0.5 truncate">
                          {idx + 1}/{noteImages.length}
                        </div>
                      </motion.div>
                    ))}
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="shrink-0 h-20 w-16 border border-dashed border-ascii-border/50 hover:border-ascii-fg/60 text-ascii-dim hover:text-ascii-fg transition-colors flex items-center justify-center text-[18px]"
                      title="Add image"
                    >+</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Go To Line Modal */}
        <AnimatePresence>
          {showGoToLine && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50"
              onClick={() => setShowGoToLine(false)}
            >
              <motion.div
                initial={{ scale: 0.92, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 10 }}
                className="bg-ascii-bg border border-ascii-fg p-6 shadow-[0_0_40px_rgba(0,255,65,0.2)] min-w-[280px]"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-ascii-dim mb-3">Go To Line</div>
                <input
                  autoFocus
                  type="number"
                  min={1}
                  max={content.split('\n').length}
                  value={goToLineValue}
                  onChange={e => setGoToLineValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleGoToLine(); if (e.key === 'Escape') setShowGoToLine(false); }}
                  placeholder={`1 – ${content.split('\n').length}`}
                  className="w-full bg-transparent border border-ascii-border text-ascii-fg font-sans text-sm px-3 py-2 outline-none focus:border-ascii-fg placeholder:text-ascii-dim/30 mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={handleGoToLine} className="flex-1 py-2 bg-ascii-fg text-ascii-bg text-[10px] font-black uppercase tracking-widest hover:bg-ascii-fg/80 transition-colors">Go</button>
                  <button onClick={() => setShowGoToLine(false)} className="flex-1 py-2 border border-ascii-border text-ascii-dim text-[10px] font-bold uppercase tracking-widest hover:border-ascii-fg hover:text-ascii-fg transition-colors">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* OS Status Bar */}
      <div className="status-bar shrink-0">
        <div className="flex items-center gap-6">
           <div>Ln {cursorLine + 1}, Col {cursorCol + 1}</div>
           <div>{content.split('\n').length} lines</div>
           <div>{content.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length} words</div>
           <div>{content.length} chars</div>
           <div>ENCODING UTF-8</div>
           <div>ZOOM {Math.round((fontSize / 18) * 100)}%</div>
           <div className="flex items-center gap-3">
             <span className="text-ascii-fg text-[8px] tracking-[0.2em]">DATA_LINE_SECURE</span>
             <div className="flex gap-0.5">
               {[1,2,3].map(i => (
                 <motion.div 
                   key={i}
                   animate={{ opacity: [0.2, 1, 0.2] }}
                   transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                   className="w-0.5 h-2 bg-ascii-fg"
                 />
               ))}
             </div>
             <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-ascii-accent2 animate-pulse shadow-[0_0_8px_var(--color-ascii-accent2)]' : 'bg-ascii-fg/30'}`} />
           </div>
        </div>
        <div className="flex gap-6 uppercase tracking-widest">
           <div>{notes.length} SEGMENTS</div>
           <div className="text-ascii-fg animate-pulse font-bold">STABLE</div>
        </div>
      </div>


      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && noteImages[lightboxIdx] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/90 flex items-center justify-center p-8"
            onClick={() => setLightboxIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-full max-h-full flex flex-col items-center gap-3"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={noteImages[lightboxIdx]}
                alt={`Image ${lightboxIdx + 1}`}
                className="max-w-[90vw] max-h-[80vh] object-contain border border-ascii-border/50 shadow-[0_0_40px_rgba(0,255,65,0.1)]"
              />
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setLightboxIdx(i => (i! > 0 ? i! - 1 : noteImages.length - 1))}
                  className="px-3 py-1 border border-ascii-border/50 text-ascii-dim hover:text-ascii-fg hover:border-ascii-fg text-[10px] font-sans uppercase tracking-wider transition-colors"
                >◂ PREV</button>
                <span className="text-ascii-dim text-[9px] font-sans tracking-widest">
                  {lightboxIdx + 1} / {noteImages.length}
                </span>
                <button
                  onClick={() => setLightboxIdx(i => (i! < noteImages.length - 1 ? i! + 1 : 0))}
                  className="px-3 py-1 border border-ascii-border/50 text-ascii-dim hover:text-ascii-fg hover:border-ascii-fg text-[10px] font-sans uppercase tracking-wider transition-colors"
                >NEXT ▸</button>
                <button
                  onClick={() => { removeImage(lightboxIdx); setLightboxIdx(noteImages.length > 1 ? Math.min(lightboxIdx, noteImages.length - 2) : null); }}
                  className="px-3 py-1 border border-red-900/50 text-red-500/70 hover:text-red-400 hover:border-red-500 text-[10px] font-sans uppercase tracking-wider transition-colors"
                >DELETE</button>
              </div>
            </motion.div>
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute top-4 right-4 text-ascii-dim hover:text-ascii-fg text-[18px] transition-colors"
            >✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Status Overlay */}
      <AnimatePresence>
        {updateStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[500] w-[320px] border border-ascii-fg/60 bg-ascii-bg shadow-[0_0_40px_rgba(0,255,65,0.25)] overflow-hidden"
          >
            {/* Animated scan line */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-px bg-ascii-fg/60"
              animate={{ scaleX: [0, 1], originX: 0 }}
              transition={{ duration: updateStatus === 'downloading' ? 0.3 : 0.1 }}
            />
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  className="w-2 h-2 rounded-full bg-ascii-fg"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                />
                <span className="text-ascii-fg text-[11px] font-sans font-semibold tracking-wide">
                  {updateStatus === 'downloading' ? 'Downloading update…' : 'Installing update — restarting…'}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-ascii-fg/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-ascii-fg rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: updateStatus === 'installing' ? '100%' : `${updateProgress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[9px] text-ascii-dim font-sans">
                <span>{updateStatus === 'installing' ? 'Applying patch…' : 'Fetching package…'}</span>
                <span>{updateStatus === 'installing' ? '100%' : `${Math.round(updateProgress)}%`}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save to Desktop Toast */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-12 right-4 z-[200] px-4 py-2 border border-ascii-fg bg-ascii-bg text-ascii-fg text-[10px] font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,65,0.25)]"
          >
            {saveToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Health Indicators */}
      <AnimatePresence>
        {isCopying && (
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: 20 }}
             className="fixed top-24 right-8 z-[100] bg-ascii-fg text-ascii-bg px-4 py-2 font-bold text-xs uppercase shadow-[0_0_20px_rgba(0,255,65,0.4)] border border-ascii-fg/50"
           >
             [CLIPBOARD_EXTRACT_SUCCESS]
           </motion.div>
        )}
        {isLiveRendering && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-16 right-8 z-50 bg-ascii-accent2 text-white px-4 py-2 font-bold text-xs uppercase shadow-[0_0_20px_rgba(236,72,153,0.5)]"
          >
            BUFFER RECONSTRUCTION ACTIVE
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ScramblerPulseProps {
  x: number;
  y: number;
  initialText: string;
  type?: 'enter' | 'paste';
}

const ScramblerPulse: React.FC<ScramblerPulseProps> = ({ x, y, initialText, type = 'enter' }) => {
  const [displayText, setDisplayText] = useState(initialText);
  const [color, setColor] = useState('#00ff41');
  const chars = "!@#$%^&*()_+{}:\"<>?,./;'[]\\=-`~1234567890QWERTYUIOPASDFGHJKLZXCVBNM";

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayText(chars[Math.floor(Math.random() * chars.length)]);
      setColor(Math.random() > 0.8 ? '#ffffff' : '#00ff41');
    }, type === 'paste' ? 20 : 30);
    return () => clearInterval(interval);
  }, [type]);

  const isPaste = type === 'paste';

  return (
    <div style={{ top: y - (isPaste ? 40 : 28), left: x }} className="absolute z-20 pointer-events-none flex items-center justify-center">
      {/* Expanding Ping Ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: isPaste ? 8 : 4, opacity: 0 }}
        transition={{ duration: isPaste ? 1 : 0.6, ease: "easeOut" }}
        className={`absolute rounded-full border border-ascii-fg shadow-[0_0_15px_#00ff41] ${isPaste ? 'w-8 h-8' : 'w-4 h-4'}`}
      />
      
      {/* Glitch Ghost 1 */}
      {!isPaste && (
        <motion.div
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: [0, 0.5, 0], x: [-5, 5, 0] }}
          transition={{ duration: 0.4 }}
          className="absolute font-mono text-xl font-bold text-ascii-fg/30"
        >
          {displayText}
        </motion.div>
      )}

      {/* Main Scrambling Spot */}
      <motion.div
        initial={{ opacity: 0, scale: isPaste ? 4 : 3, rotate: isPaste ? 90 : -45 }}
        animate={{ 
          opacity: [0, 1, 1, 0], 
          scale: isPaste ? [3, 1.2, 1, 0] : [2, 1, 1.1, 0.5],
          rotate: isPaste ? [90, 0] : [0, 10, -10, 0],
          color: color
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: isPaste ? 1.2 : 0.8, ease: isPaste ? "circOut" : "backOut" }}
        className={`font-mono font-bold bg-ascii-fg/10 shadow-[0_0_20px_rgba(0,255,65,0.4)] px-1 leading-none rounded-sm border border-ascii-fg/20 ${isPaste ? 'text-2xl' : 'text-xl'}`}
      >
        {displayText}
      </motion.div>

      {/* Label for Paste */}
      {isPaste && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 1, 0], y: -20 }}
          transition={{ duration: 1 }}
          className="absolute text-[8px] font-bold text-ascii-fg uppercase tracking-[0.2em] whitespace-nowrap"
        >
          [DATA_FLOOD_DETECTED]
        </motion.div>
      )}

      {/* Static Scanline Fragment */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: [0, isPaste ? 100 : 40, 0], x: isPaste ? [-50, 50] : [-20, 20] }}
        transition={{ duration: 0.5 }}
        className="absolute h-px bg-white/40 blur-[1px]"
      />
    </div>
  );
}
