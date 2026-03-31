/**
 * Nút chuyển đổi giao diện Sáng/Tối
 */
const ThemeToggle: React.FC<{ theme: string; toggleTheme: () => void }> = ({
  theme,
  toggleTheme,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "0.4rem",
      marginBottom: "0.2rem",
      marginRight: 0,
    }}
  >
    <span className="theme-icon-emoji" style={{ fontSize: "1rem" }}>
      {theme === "dark" ? "🌙" : "☀️"}
    </span>
    <label className="theme-switch" htmlFor="checkbox">
      <input
        type="checkbox"
        id="checkbox"
        onChange={toggleTheme}
        checked={theme === "light"}
      />
      <div className="slider round" />
    </label>
  </div>
);

const FlagIcon: React.FC<{ locale: "vi" | "en" }> = ({ locale }) => {
  if (locale === "vi") {
    return (
      <svg viewBox="0 0 24 16" aria-hidden="true">
        <rect width="24" height="16" rx="2" fill="#da251d" />
        <path
          d="M12 3.2 13.4 7.2h4.2l-3.4 2.4 1.3 4-3.5-2.5-3.5 2.5 1.3-4-3.4-2.4h4.2Z"
          fill="#ffde00"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 16" aria-hidden="true">
      <rect width="24" height="16" rx="2" fill="#012169" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="4" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#C8102E" strokeWidth="2" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="6" />
      <path d="M12 0v16M0 8h24" stroke="#C8102E" strokeWidth="3.2" />
    </svg>
  );
};

function TopBar(props: TopBarProps) {
  const {
    theme,
    locale,
    sidebarOpen,
    onMenuToggle,
    onThemeToggle,
    onLocaleToggle,
  } = props;
  const isVi = locale === "vi";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className={sidebarOpen ? "menu-button is-active" : "menu-button"}
          onClick={onMenuToggle}
          aria-label={isVi ? "Mở thanh điều hướng" : "Open navigation"}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="topbar-brandline">
          <div className="topbar-copy">
            <strong>DA14585 E-Ink</strong>
            <span>Device dashboard</span>
          </div>
        </div>
      </div>

      <div className="topbar-title">
        {isVi
          ? "Bảng điều khiển thiết bị E-Ink"
          : "E-Ink device control dashboard"}
      </div>

      <div className="topbar-right">
        <button className="language-button" onClick={onLocaleToggle}>
          <span className="flag-icon">
            <FlagIcon locale={isVi ? "vi" : "en"} />
          </span>
          <strong>{isVi ? "vn" : "en"}</strong>
        </button>
        <ThemeToggle theme={theme} toggleTheme={onThemeToggle} />
      </div>
    </header>
  );
}

function ModeRail(props: ModeRailProps) {
  const isVi = props.locale === "vi";
  const getNavIcon = (key: WorkspaceMode) => {
    if (key === "mode-1") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h10" />
          <path d="M4 12h16" />
          <path d="M4 17h8" />
          <circle cx="17" cy="7" r="2" />
          <circle cx="9" cy="17" r="2" />
        </svg>
      );
    }

    if (key === "mode-2") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="10" height="10" rx="2" />
          <rect x="10" y="9" width="10" height="10" rx="2" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v4" />
        <path d="M12 17v4" />
        <path d="M4.9 4.9l2.8 2.8" />
        <path d="M16.3 16.3l2.8 2.8" />
        <path d="M3 12h4" />
        <path d="M17 12h4" />
        <path d="M4.9 19.1l2.8-2.8" />
        <path d="M16.3 7.7l2.8-2.8" />
        <circle cx="12" cy="12" r="3.5" />
      </svg>
    );
  };

  const items = [
    {
      key: "mode-1" as WorkspaceMode,
      title: isVi ? "Điều khiển thiết bị" : "Device control",
      desc: isVi ? "BLE, màn hình, ảnh" : "BLE, display, image",
    },
    {
      key: "mode-2" as WorkspaceMode,
      title: isVi ? "Quy trình nâng cao" : "Advanced workflows",
      desc: isVi ? "Mở rộng sau" : "Coming later",
    },
    {
      key: "mode-3" as WorkspaceMode,
      title: isVi ? "Bảo trì & preset" : "Maintenance & presets",
      desc: isVi ? "Chẩn đoán" : "Diagnostics",
    },
  ];

  return (
    <>
      <div
        className={props.open ? "sidebar-backdrop is-open" : "sidebar-backdrop"}
        onClick={props.onClose}
      />
      <aside className={props.open ? "sidebar-panel is-open" : "sidebar-panel"}>
        <nav className="sidebar-nav">
          {items.map((item) => (
            <button
              key={item.key}
              className={
                props.workspaceMode === item.key
                  ? "sidebar-nav-item is-active"
                  : "sidebar-nav-item"
              }
              onClick={() => {
                props.onModeChange(item.key);
                props.onClose();
              }}
            >
              <span className="sidebar-nav-index">{getNavIcon(item.key)}</span>
              <span className="sidebar-nav-copy">
                <strong>{item.title}</strong>
                <small>{item.desc}</small>
              </span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}

function HeroSection(props: HeroSectionProps) {
  const isVi = props.locale === "vi";
  return (
    <section className="panel-card panel-span-two">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{isVi ? "Tổng quan" : "Overview"}</span>
          <h2>
            {props.connected
              ? isVi
                ? "Thiết bị đang trực tuyến"
                : "Device online"
              : isVi
                ? "Thiết bị chưa kết nối"
                : "Device offline"}
          </h2>
        </div>
      </div>
    </section>
  );
}

function StatusPanel(props: StatusPanelProps) {
  const isVi = props.locale === "vi";
  return (
    <section className="panel-card status-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">
            {isVi ? "Luồng nhật ký" : "Log stream"}
          </span>
          <h2>{isVi ? "Nhật ký thiết bị" : "Device log"}</h2>
        </div>
        <div
          className={
            props.connected ? "status-tag is-online" : "status-tag is-offline"
          }
        >
          {props.connected ? (isVi ? "Đang hoạt động" : "Active") : "Offline"}
        </div>
      </div>
      <div id="status">{props.statusText}</div>
    </section>
  );
}

function PlaceholderMode(props: PlaceholderModeProps) {
  const isVi = props.locale === "vi";
  return (
    <div className="workspace-grid placeholder-grid">
      <section className="panel-card placeholder-hero">
        <span className="eyebrow">{props.subtitle}</span>
        <h1>{props.title}</h1>
        <p>
          {isVi
            ? "Mode này đang được giữ chỗ để hoàn thiện thành một module riêng với luồng thao tác độc lập."
            : "This mode is reserved for a dedicated module with its own workflow."}
        </p>
      </section>
      {props.points.map((point, index) => (
        <section className="panel-card" key={point}>
          <span className="eyebrow">
            {isVi ? `Ý tưởng ${index + 1}` : `Idea ${index + 1}`}
          </span>
          <h2>{point}</h2>
          <p>
            {isVi
              ? "Khi chốt chức năng thật, phần này có thể được mở rộng mà không cần thay lại khung tổng."
              : "Once the feature set is defined, this section can expand without redesigning the shell."}
          </p>
        </section>
      ))}
    </div>
  );
}

function LoadingOverlay(props: LoadingOverlayProps) {
  if (!props.loadingState.active) {
    return null;
  }

  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="spinner-ring" />
        <h3>{props.loadingState.title}</h3>
        <p>{props.loadingState.detail}</p>
      </div>
    </div>
  );
}
