interface Window {
  electron?: {
    window: {
      close: () => void;
      minimize: () => void;
      maximize: () => void;
    };
    updater: {
      onUpdateAvailable: (cb: (version: string) => void) => void;
      onUpdateDownloading: (cb: (percent: number) => void) => void;
      onUpdateInstalling: (cb: () => void) => void;
      onUpdateError: (cb: (message: string) => void) => void;
      installUpdate: () => void;
    };
    file: {
      saveToDesktop: (filename: string, content: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    };
  };
}
