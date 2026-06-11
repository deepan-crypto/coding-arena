import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const languageMap = {
  cpp: 'cpp',
  java: 'java',
  python: 'python',
  javascript: 'javascript'
};

export default function EditorPanel({ language, value, onChange, theme }) {
  const editorLanguage = languageMap[language] || 'javascript';
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  // Sync external value changes (like Reset or Language Change) to the editor
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language={editorLanguage}
          defaultValue={value}
          onChange={(newValue) => onChange(newValue || '')}
          onMount={handleEditorDidMount}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          loading={
            <div className="editor-loading">
              <p>Loading editor...</p>
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 4,
            smoothScrolling: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 12 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            folding: true,
            showUnused: false,
            matchBrackets: 'always'
          }}
        />
      </div>
    </div>
  );
}