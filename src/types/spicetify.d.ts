interface SpicetifyPlayer {
  isPlaying(): boolean;
  getProgress(): number;
  addEventListener(event: string, callback: () => void): void;
  data?: {
    item?: {
      uri?: string;
    };
  };
}

declare global {
  interface Window {
    Spicetify: {
      Player: SpicetifyPlayer;
    };
  }
}

export {};
