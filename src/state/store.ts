import { create } from 'zustand';
import { ASTNode } from '../audio/AudioEngine';

interface WorkspaceState {
  ast: ASTNode | null;
  setAst: (ast: ASTNode | null) => void;
  compilerError: string | null;
  setCompilerError: (error: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  ast: null,
  setAst: (ast) => set({ ast, compilerError: null }),
  compilerError: null,
  setCompilerError: (error) => set({ compilerError: error }),
}));
