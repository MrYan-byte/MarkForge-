/// <reference types="vite/client" />

interface Window {
  markforge?: {
    openFiles: () => Promise<string[]>;
    saveFileDialog: (defaultPath: string) => Promise<string | null>;
    onMenuCommand: (handler: (command: string) => void) => () => void;
  };
}
