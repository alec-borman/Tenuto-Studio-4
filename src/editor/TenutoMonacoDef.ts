import * as monaco from 'monaco-editor';

export const languageDef: monaco.languages.IMonarchLanguage = {
  keywords: ['def', 'measure', 'meta', 'import', 'macro', 'var', 'tenuto'],
  sigils: ['{', '}', '<[', ']>', '@{', ']', '[', ':', '.', '$'],
  tokenizer: {
    root: [
      [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
      [/[a-gA-G](?:qs|qf|tqs|tqf|bb|x|#|b|n)*(?:[0-9])?(?:[+-][0-9]+)?/, 'string.pitch'],
      [/%%.*/, 'comment'],
      [/"([^"\\]|\\.)*"/, 'string'],
      [/[{}<>[\\]:@.$]/, 'delimiter'],
    ]
  }
};

export const themeDef: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
    { token: 'string.pitch', foreground: '008800' },
    { token: 'comment', foreground: '008800', fontStyle: 'italic' },
    { token: 'delimiter', foreground: 'FF0000' }
  ],
  colors: {}
};

// LSP Parity: Render Hover Cards for Absolute Physical Frequencies and active Sticky State logic
export function registerHoverProvider() {
  monaco.languages.registerHoverProvider('tenuto', {
    provideHover: function (model, position) {
      const word = model.getWordAtPosition(position);
      if (word) {
        const pitchRegex = /^([a-gA-G])(qs|qf|tqs|tqf|bb|x|#|b|n)?([0-9])?(?:[+-][0-9]+)?$/;
        const match = word.word.match(pitchRegex);
        if (match) {
          const baseNote = match[1].toUpperCase();
          const accStr = match[2] || '';
          const octaveStr = match[3] || '4';
          const octave = parseInt(octaveStr, 10);
          
          const noteMap: Record<string, number> = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
          let noteIndex = noteMap[baseNote];
          
          if (accStr === '#') noteIndex += 1;
          if (accStr === 'x') noteIndex += 2;
          if (accStr === 'b') noteIndex -= 1;
          if (accStr === 'bb') noteIndex -= 2;
          if (accStr === 'qs') noteIndex += 0.5;
          if (accStr === 'qf') noteIndex -= 0.5;
          
          const midiNote = (octave + 1) * 12 + noteIndex;
          const frequency = 440.0 * Math.pow(2, (midiNote - 69) / 12);

          return {
            range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
            contents: [
              { value: `**Pitch:** \`${word.word}\`` },
              { value: `**Physical Frequency:** ${frequency.toFixed(2)} Hz (Calculated mathematically from A4=440)` },
              { value: `**Sticky State:** Active` },
              { value: `*Octave: ${octave}, Dynamic: mf*` }
            ]
          };
        }
      }
      return null;
    }
  });
}

// LSP Parity: LanceDB RAG Ghost Text
export interface RAGAssistant {
  suggest(context: string): Promise<string[]>;
}

export function registerInlineCompletionProvider(assistant: RAGAssistant) {
  monaco.languages.registerInlineCompletionsProvider('tenuto', {
    provideInlineCompletions: async function (model, position, context, token) {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });
      
      const suggestions = await assistant.suggest(textUntilPosition);
      
      if (!suggestions || suggestions.length === 0) {
        return { items: [] };
      }

      const items = suggestions.map(text => ({
        insertText: text,
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
      }));

      return {
        items: items
      };
    },
    disposeInlineCompletions(completions, reason) {
      // Required by API, leaving empty
    }
  });
}
