function ScreenControlPanel(props: ScreenControlPanelProps) {
  const isVi = props.locale === "vi";
  const decreaseRotation = () => {
    props.onRotationIntervalChange(Math.max(5, props.rotationIntervalSec - 5));
  };

  const increaseRotation = () => {
    props.onRotationIntervalChange(props.rotationIntervalSec + 5);
  };

  const getModeIcon = (mode: ScreenModeKey) => {
    if (mode === "calendar") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="16" height="15" rx="3" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      );
    }

    if (mode === "clock") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
        </svg>
      );
    }

    if (mode === "calendarAnalog") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="12" height="14" rx="3" />
          <path d="M6 2v4M12 2v4M3 9h12" />
          <circle cx="18" cy="16" r="3.5" />
          <path d="M18 14.6v1.7l1.1.8" />
        </svg>
      );
    }

    if (mode === "fabric") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="10" height="16" rx="2" />
          <path d="M8 8h2M8 12h2M8 16h2M16 7v10M19 7v10" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M7 9h10M7 12h10M7 15h6" />
      </svg>
    );
  };

  const getModeLabel = (mode: ScreenModeKey) => {
    const labels = {
      image: isVi ? "Hình ảnh" : "Image",
      calendar: isVi ? "Lịch" : "Calendar",
      clock: isVi ? "Đồng hồ" : "Clock",
      calendarAnalog: isVi ? "Lịch & đồng hồ" : "Calendar & clock",
      fabric: isVi ? "Thẻ kho" : "Fabric card",
    };
    return labels[mode];
  };

  const getModeDescription = (mode: ScreenModeKey) => {
    const descriptions = {
      image: isVi ? "Nội dung ảnh E-Ink" : "E-Ink image content",
      calendar: isVi ? "Giao diện lịch cơ bản" : "Basic calendar layout",
      clock: isVi ? "Hiển thị thời gian" : "Time display",
      calendarAnalog: isVi ? "Lịch kết hợp đồng hồ" : "Calendar and clock",
      fabric: isVi ? "Biểu mẫu thẻ kho" : "Fabric card form",
    };
    return descriptions[mode];
  };

  const connectionTitle = props.connected
    ? isVi
      ? "Thiết bị đang sẵn sàng"
      : "Device ready"
    : isVi
      ? "Thiết bị chưa kết nối"
      : "Device offline";

  return (
    <section className="panel-card operations-suite panel-span-two">
      <div className="operations-suite-head">
        <div>
          <span className="eyebrow">
            {isVi ? "Điều khiển trung tâm" : "Central control"}
          </span>
          <h2>
            {isVi
              ? "Điều khiển thiết bị và chế độ màn hình"
              : "Device and display control"}
          </h2>
        </div>
        <div
          className={
            props.connected ? "status-tag is-online" : "status-tag is-offline"
          }
        >
          {props.connected ? (isVi ? "Đang hoạt động" : "Online") : "Offline"}
        </div>
      </div>

      <div className="operations-suite-grid">
        <div className="ble-console">
          <div className="ble-console-top">
            <div className="ble-console-indicator">
              <span
                className={
                  props.connected ? "ble-dot is-online" : "ble-dot is-offline"
                }
              />
            </div>
            <div className="ble-console-copy">
              <span className="ble-console-kicker">Bluetooth LE</span>
              <h3>{connectionTitle}</h3>
            </div>
          </div>

          <div className="ble-console-stats">
            <div className="ble-stat">
              <span>{isVi ? "Thiết bị" : "Device"}</span>
              <strong>{props.deviceName}</strong>
            </div>
            <div className="ble-stat">
              <span>{isVi ? "Thời gian hiện tại" : "Local time"}</span>
              <strong>{props.currentTime}</strong>
            </div>
            <div className="ble-stat">
              <span>{isVi ? "Môi trường" : "Environment"}</span>
              <strong>
                {props.bluetoothAvailable
                  ? "Web Bluetooth"
                  : isVi
                    ? "Không hỗ trợ"
                    : "Unsupported"}
              </strong>
            </div>
          </div>

          <div className="ble-console-actions">
            <button
              className="primary-button"
              disabled={props.connected || props.connecting}
              onClick={props.onConnect}
            >
              {props.connected
                ? isVi
                  ? "Đã kết nối"
                  : "Connected"
                : props.connecting
                  ? isVi
                    ? "Đang kết nối..."
                    : "Connecting..."
                  : isVi
                    ? "Kết nối"
                    : "Connect"}
            </button>
            <button
              className="ghost-button"
              disabled={!props.connected}
              onClick={props.onDisconnect}
            >
              {isVi ? "Ngắt kết nối" : "Disconnect"}
            </button>
            <button
              className="ghost-button"
              disabled={!props.connected}
              onClick={props.onSyncTime}
            >
              {isVi ? "Đồng bộ thời gian" : "Sync time"}
            </button>
          </div>
        </div>

        <div className="display-console">
          <div className="display-console-head">
            <div>
              <span className="eyebrow">
                {isVi ? "Chế độ hiển thị" : "Display modes"}
              </span>
              <h3>
                {isVi ? "Chọn giao diện màn hình" : "Choose a display mode"}
              </h3>
            </div>
            <div className="current-mode-pill">
              {getModeLabel(props.currentScreenMode)}
            </div>
          </div>

          <div className="display-mode-grid">
            {screenModes.map((mode) => (
              <button
                key={mode.key}
                className={
                  props.currentScreenMode === mode.key
                    ? "display-mode-card is-active"
                    : "display-mode-card"
                }
                disabled={!props.connected}
                onClick={() =>
                  mode.key === "fabric"
                    ? props.onOpenFabricModal()
                    : props.onModeSelect(mode.key)
                }
              >
                <span className="display-mode-icon">
                  {getModeIcon(mode.key)}
                </span>
                <strong>{getModeLabel(mode.key)}</strong>
                <small>{getModeDescription(mode.key)}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rotation-console">
        <div className="rotation-console-head">
          <div>
            <span className="eyebrow">
              {isVi ? "Luân chuyển tự động" : "Auto rotation"}
            </span>
            <h3>
              {isVi
                ? "Thiết lập chu kỳ đổi màn hình"
                : "Configure scheduled screen rotation"}
            </h3>
          </div>
          <div
            className={
              props.rotationEnabled
                ? "rotation-state is-running"
                : "rotation-state"
            }
          >
            <span className="rotation-state-icon" aria-hidden="true">
              {props.rotationEnabled ? "▶" : "||"}
            </span>
            <span>
              {props.rotationEnabled
                ? isVi
                  ? "Đang luân chuyển"
                  : "Rotating"
                : isVi
                  ? "Tạm dừng"
                  : "Paused"}
            </span>
          </div>
        </div>

        <div className="rotation-chip-grid">
          {screenModes.map((mode) => (
            <label className="rotation-chip" key={mode.key}>
              <input
                type="checkbox"
                checked={props.rotationSelection.includes(mode.key)}
                onChange={() => props.onRotationToggle(mode.key)}
              />
              <span>{getModeLabel(mode.key)}</span>
            </label>
          ))}
        </div>

        <div className="rotation-controls-pro">
          <div className="setting-group compact rotation-interval-group">
            <label htmlFor="rotationInterval">
              {isVi ? "Chu kỳ xoay (giây)" : "Rotation interval (seconds)"}
            </label>
            <div className="stepper-input">
              <button
                type="button"
                className="icon-button stepper-button"
                onClick={decreaseRotation}
              >
                -
              </button>
              <input
                id="rotationInterval"
                type="number"
                min="5"
                step="5"
                value={props.rotationIntervalSec}
                onChange={(event) =>
                  props.onRotationIntervalChange(
                    Number(event.target.value) || 5,
                  )
                }
              />
              <button
                type="button"
                className="icon-button stepper-button"
                onClick={increaseRotation}
              >
                +
              </button>
            </div>
          </div>
          <div className="rotation-action-row">
            <button
              className="primary-button"
              disabled={!props.connected}
              onClick={props.onRotationStart}
            >
              {isVi ? "Bắt đầu luân chuyển" : "Start rotation"}
            </button>
            <button
              className="ghost-button"
              disabled={!props.rotationEnabled}
              onClick={props.onRotationStop}
            >
              {isVi ? "Dừng luân chuyển" : "Stop rotation"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FabricModal(props: FabricModalProps) {
  if (!props.open) {
    return null;
  }

  const isVi = props.locale === "vi";

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="panel-head">
          <div>
            <span className="eyebrow">{isVi ? "Thẻ kho" : "Fabric card"}</span>
            <h2>{isVi ? "Nhập dữ liệu thẻ kho" : "Enter fabric card data"}</h2>
          </div>
          <button className="icon-button" onClick={props.onClose}>
            {isVi ? "Đóng" : "Close"}
          </button>
        </div>

        <div className="fabric-form fabric-form-modal">
          {props.fabricFields.map((field) => (
            <div className="setting-group" key={field.id}>
              <label htmlFor={field.id}>{field.label}</label>
              <input
                id={field.id}
                type="text"
                value={field.value}
                onChange={(event) =>
                  props.onChange(field.id, event.target.value)
                }
              />
            </div>
          ))}
        </div>

        <div className="modal-footer-actions">
          <button className="ghost-button" onClick={props.onClose}>
            {isVi ? "Hủy" : "Cancel"}
          </button>
          <button
            className="primary-button"
            disabled={!props.connected}
            onClick={props.onSubmit}
          >
            {isVi ? "Xác nhận và nạp lên màn hình" : "Confirm and upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
