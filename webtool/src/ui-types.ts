type ThemeMode = "light" | "dark";
type LocaleMode = "vi" | "en";

type TopBarProps = {
  theme: ThemeMode;
  locale: LocaleMode;
  sidebarOpen: boolean;
  onMenuToggle: () => void;
  onThemeToggle: () => void;
  onLocaleToggle: () => void;
};

type ModeRailProps = {
  workspaceMode: WorkspaceMode;
  locale: LocaleMode;
  open: boolean;
  onClose: () => void;
  onModeChange: (mode: WorkspaceMode) => void;
};

type HeroSectionProps = {
  locale: LocaleMode;
  connected: boolean;
  currentTime: string;
  currentModeLabel: string;
  deviceName: string;
  bluetoothAvailable: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

type ScreenControlPanelProps = {
  locale: LocaleMode;
  connected: boolean;
  connecting: boolean;
  currentTime: string;
  deviceName: string;
  bluetoothAvailable: boolean;
  currentScreenMode: ScreenModeKey;
  rotationEnabled: boolean;
  rotationIntervalSec: number;
  rotationSelection: ScreenModeKey[];
  onConnect: () => void;
  onDisconnect: () => void;
  onSyncTime: () => void;
  onOpenFabricModal: () => void;
  onModeSelect: (mode: ScreenModeKey) => void;
  onRotationToggle: (mode: ScreenModeKey) => void;
  onRotationIntervalChange: (value: number) => void;
  onRotationStart: () => void;
  onRotationStop: () => void;
};

type ImageWorkspaceProps = {
  locale: LocaleMode;
  connected: boolean;
  progress: number;
  imageFile: File | null;
  imageParams: ImageParams;
  previewRef: React.RefObject<HTMLCanvasElement>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (file: File) => void;
  onImageParamChange: <K extends keyof ImageParams>(key: K, value: ImageParams[K]) => void;
  onResetImageParams: () => void;
  onSendAll: () => void;
};

type StatusPanelProps = {
  locale: LocaleMode;
  connected: boolean;
  statusText: string;
};

type PlaceholderModeProps = {
  locale: LocaleMode;
  title: string;
  subtitle: string;
  points: string[];
};

type FabricModalProps = {
  locale: LocaleMode;
  open: boolean;
  connected: boolean;
  fabricFields: FabricField[];
  onClose: () => void;
  onChange: (id: string, value: string) => void;
  onSubmit: () => void;
};

type LoadingOverlayProps = {
  loadingState: LoadingState;
};
