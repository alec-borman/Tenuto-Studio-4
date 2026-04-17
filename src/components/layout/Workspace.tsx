import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { languageDef, themeDef, registerHoverProvider, registerInlineCompletionProvider } from '../../editor/TenutoMonacoDef';
import { audioEngine } from '../../audio/AudioEngine';
import { Play, Square, Settings, Folder, List, Sliders, Activity, Circle, Repeat, Clock, Pause, Metronome } from 'lucide-react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

const TopBar: React.FC<{ onPlay: () => void, onStop: () => void, onSave: () => void, isPlaying: boolean }> = ({ onPlay, onStop, onSave, isPlaying }) => (
  <header role="banner" className="col-span-3 row-start-1 h-12 bg-slate-900 border-b border-slate-800 text-slate-300 flex items-center px-4 justify-between select-none">
    <div className="flex items-center gap-4">
      <div className="font-bold text-white tracking-widest text-lg" aria-label="App Title">TENUTO STUDIO 4.0</div>
      <div className="h-6 w-px bg-slate-700 mx-2"></div>
      
      <div className="flex items-center gap-2">
        <select aria-label="Profile Selector" className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2 py-1 rounded">
          <option value="core">Core</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <div className="flex bg-slate-800 rounded-md p-1 gap-1" role="group" aria-label="Transport Controls">
        <button 
          onClick={onPlay}
          className={`flex items-center justify-center w-10 h-8 rounded transition-colors ${isPlaying ? 'bg-emerald-600 text-white' : 'hover:bg-slate-700 text-emerald-500'}`}
          title="Play/Pause"
          aria-label="Play/Pause"
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="none" />}
        </button>
        <button 
          onClick={onStop}
          className="flex items-center justify-center w-10 h-8 rounded hover:bg-slate-700 text-slate-400 transition-colors"
          title="Stop"
          aria-label="Stop"
        >
          <Square size={16} fill="currentColor" />
        </button>
        <button 
          className="flex items-center justify-center w-10 h-8 rounded hover:bg-slate-700 text-red-500 transition-colors"
          title="Record"
          aria-label="Record"
        >
          <Circle size={14} fill="currentColor" />
        </button>
      </div>
      <div className="flex bg-slate-800 rounded-md p-1 gap-1">
        <button 
          className="flex items-center justify-center w-10 h-8 rounded hover:bg-slate-700 text-slate-400 transition-colors"
          title="Loop"
          aria-label="Loop"
        >
          <Repeat size={16} />
        </button>
        <button 
          className="flex items-center justify-center w-10 h-8 rounded hover:bg-slate-700 text-slate-400 transition-colors"
          title="Metronome"
          aria-label="Metronome"
        >
          <Activity size={16} />
        </button>
      </div>
      <div className="flex items-center bg-slate-800 rounded-md px-3 h-10 font-mono text-sm text-emerald-400 border border-slate-700 shadow-inner gap-2">
        <Clock size={14} className="text-slate-500" />
        <span aria-label="Tempo">120.0 BPM</span>
        <span className="text-slate-500 pl-2 border-l border-slate-700 ml-2" aria-label="Time Signature">4/4</span>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button 
        onClick={onSave}
        className="px-3 h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
        title="Save Workspace (PWA API)"
        aria-label="Save Local Workspace"
      >
        SAVE
      </button>
      <button 
        className="px-3 h-8 text-xs font-semibold bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded transition-colors"
        aria-label="Share/Export Menu"
      >
        Export
      </button>
      <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
        <Settings size={18} />
      </button>
    </div>
  </header>
);

const BottomStatusBar: React.FC = () => (
  <footer role="contentinfo" className="col-span-3 row-start-3 h-8 bg-slate-900 border-t border-slate-800 text-slate-400 flex items-center px-4 justify-between text-xs font-mono select-none">
    <div className="flex items-center gap-4">
      <span className="flex items-center gap-1"><Activity size={12} /> Ready</span>
    </div>
    <div className="flex gap-4">
      <span className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
        Ableton Link: Disconnected
      </span>
      <span className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
        TSN: Disconnected
      </span>
    </div>
  </footer>
);

export const Workspace: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      monaco.languages.register({ id: 'tenuto' });
      monaco.languages.setMonarchTokensProvider('tenuto', languageDef);
      monaco.editor.defineTheme('tenutoTheme', themeDef);
      
      // LSP Parity
      registerHoverProvider();
      registerInlineCompletionProvider({
        suggest: async (context: string) => {
          // LanceDB RAG Assistant connection mock
          if (context.trim().endsWith('def')) {
            return [' track_01 {}'];
          }
          return [];
        }
      });

      const editor = monaco.editor.create(editorRef.current, {
        value: 'tenuto "4.0" {\n  \n}',
        language: 'tenuto',
        theme: 'tenutoTheme',
        minimap: { enabled: false },
        padding: { top: 16 },
        fontSize: 14,
        fontFamily: "'JetBrains Mono', monospace",
        automaticLayout: true,
      });

      let timeout: number;
      editor.onDidChangeModelContent(() => {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          // Send to Web Worker for compilation/diagnostics
        }, 200);
      });

      return () => {
        window.clearTimeout(timeout);
        editor.dispose();
      };
    }
  }, []);

  const handlePlay = async () => {
    await audioEngine.play();
    setIsPlaying(true);
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
  };

  const handleOpenWorkspace = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        // Environment Parity: Fallback to File System Access API in PWA
        const dirHandle = await (window as any).showDirectoryPicker();
        console.log("Workspace directory loaded via PWA API:", dirHandle.name);
      } else {
        console.warn("File System Access API is not supported in this browser.");
      }
    } catch (error) {
      console.error("User cancelled or API failed:", error);
    }
  };

  const handleSaveWorkspace = async () => {
    try {
      if ('showSaveFilePicker' in window) {
        const fileHandle = await (window as any).showSaveFilePicker({
          types: [{
            description: 'Tenuto AST Script',
            accept: {'text/plain': ['.ten']},
          }],
        });
        const writable = await fileHandle.createWritable();
        await writable.write("tenuto '4.0' {\n  \n}"); 
        await writable.close();
        console.log("File saved via PWA API:", fileHandle.name);
      } else {
        console.warn("File System Access API is not supported in this browser.");
      }
    } catch (error) {
      console.error("User cancelled or API failed:", error);
    }
  };

  return (
    <div className="grid h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden" style={{ gridTemplateRows: '3rem 1fr 2rem', gridTemplateColumns: '16rem 1fr 20rem' }}>
      
      {/* 3rem = h-12 */}
      <TopBar onPlay={handlePlay} onStop={handleStop} onSave={handleSaveWorkspace} isPlaying={isPlaying} />
      
      {/* 16rem = w-64 */}
      <aside role="complementary" className="col-start-1 row-start-2 bg-slate-900 border-r border-slate-800 flex flex-col min-h-0">
        <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 text-xs font-semibold tracking-wider text-slate-400 uppercase shrink-0">
          <div className="flex items-center">
            <Folder size={14} className="mr-2" /> Explorer
          </div>
          <button onClick={handleOpenWorkspace} className="hover:text-white transition-colors" title="Open Local Workspace">
            +
          </button>
        </div>
        <div className="flex-1 p-4 text-sm text-slate-500 overflow-y-auto">
          <ul className="space-y-1">
             <li className="flex items-center gap-2 text-slate-300"><List size={14}/> main.ten</li>
          </ul>
        </div>
      </aside>
      
      {/* 1fr = flex-1 */}
      <main role="main" className="col-start-2 row-start-2 bg-slate-950 flex flex-col min-h-0 w-full h-full relative">
        <PanelGroup orientation="vertical" className="w-full h-full absolute inset-0">
          <Panel defaultSize={60} minSize={20} className="relative flex flex-col min-h-0 w-full h-full">
            <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 text-xs text-slate-400 shrink-0">
              <List size={14} className="mr-2" /> Monaco Editor
            </div>
            <div className="flex-1 min-h-0 relative">
              <div className="absolute inset-0" ref={editorRef}></div>
            </div>
          </Panel>
          
          <PanelResizeHandle className="h-1 bg-slate-800 hover:bg-emerald-500/50 transition-colors cursor-row-resize active:bg-emerald-500 z-10" />
          
          <Panel defaultSize={40} minSize={20} className="bg-slate-950 flex flex-col min-h-0 w-full h-full">
            <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 text-xs text-slate-400 shrink-0">
              <Activity size={14} className="mr-2" /> WebGPU Canvas
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden relative">
                <canvas id="primary-webgpu-canvas" className="w-full h-full object-contain" />
            </div>
          </Panel>
        </PanelGroup>
      </main>
      
      {/* 20rem = w-80 */}
      <aside role="complementary" className="col-start-3 row-start-2 bg-slate-900 border-l border-slate-800 flex flex-col min-h-0">
        <div className="h-10 border-b border-slate-800 flex items-center px-4 text-xs font-semibold tracking-wider text-slate-400 uppercase shrink-0">
          <Sliders size={14} className="mr-2" /> Inspector
        </div>
        <div className="flex-1 p-4 text-sm text-slate-500 overflow-y-auto">
          <div className="flex flex-col gap-4">
             <div className="text-xs font-mono text-slate-400 border border-slate-800 p-2 rounded bg-slate-950">
                AST Node: None Selected
             </div>
          </div>
        </div>
      </aside>
      
      {/* 2rem = h-8 */}
      <BottomStatusBar />
    </div>
  );
};
