interface Window {
  electron?: {
    window: {
      close: () => void;
      minimize: () => void;
      maximize: () => void;
    };
    updater: {
      onUpdateAvailable: (cb: () => void) => void;
      onUpdateDownloaded: (cb: () => void) => void;
      installUpdate: () => void;
    };
    file: {
      saveToDesktop: (filename: string, content: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    };
  };
}
