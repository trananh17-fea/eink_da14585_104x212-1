const { useEffect, useMemo, useRef, useState } = React;

type DitherType = "none" | "ordered" | "floyd-steinberg";
type WorkspaceMode = "mode-1" | "mode-2" | "mode-3";
type ScreenModeKey =
  | "image"
  | "calendar"
  | "clock"
  | "calendarAnalog"
  | "fabric";

type ImageParams = {
  brightness: number;
  contrast: number;
  dithering: DitherType;
  ditherIntensity: number;
  mtu: number;
  confirmInterval: number;
};

type FabricField = {
  id: string;
  label: string;
  value: string;
};

type LoadingState = {
  active: boolean;
  title: string;
  detail: string;
};

type BluetoothDeviceWithGatt = BluetoothDevice & {
  gatt?: BluetoothRemoteGATTServer;
};

const SERVICE_UUID = "00001f10-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID = "00001f1f-0000-1000-8000-00805f9b34fb";
const DATA_CHARACTERISTIC_UUID = "00001f11-0000-1000-8000-00805f9b34fb";

const DISPLAY_WIDTH = 212;
const DISPLAY_HEIGHT = 104;
const PANEL_BUFFER_WIDTH = 104;
const PANEL_BUFFER_HEIGHT = 212;
const BUFFER_SIZE = (PANEL_BUFFER_WIDTH * PANEL_BUFFER_HEIGHT) / 8;

const CMD_CLEAR_DISPLAY = 0x00;
const CMD_DISPLAY_IMAGE = 0x01;
const CMD_WRITE_DATA = 0x03;
const CMD_SAVE_IMAGE = 0x04;
const CMD_SET_IMAGE_SIZE = 0x06;

const initialImageParams: ImageParams = {
  brightness: 100,
  contrast: 100,
  dithering: "none",
  ditherIntensity: 1,
  mtu: 20,
  confirmInterval: 20,
};

const initialFabricFields: FabricField[] = [
  { id: "fabricWidth", label: "Khổ vải", value: "62/66 NEW" },
  { id: "fabricStaff", label: "Nhân viên xả", value: "Tai" },
  { id: "fabricPo", label: "PO", value: "302J07" },
  { id: "fabricRelaxDate", label: "Ngày xả", value: "12/3 9h" },
  { id: "fabricOkDate", label: "Ngày OK", value: "14/3" },
  { id: "fabricItem", label: "Item", value: "Tie: 0464" },
  { id: "fabricColor", label: "Màu", value: "Caviar" },
  { id: "fabricLot", label: "Lot", value: "4/296 6/985" },
  { id: "fabricBuy", label: "Buy", value: "1224" },
  { id: "fabricRoll", label: "Roll", value: "101" },
  { id: "fabricYds", label: "YDS", value: "489" },
  { id: "fabricNote", label: "Ghi chú", value: "T4" },
];

const screenModes: Array<{
  key: ScreenModeKey;
  label: string;
  description: string;
  modeValue: number;
}> = [
  {
    key: "clock",
    label: "Đồng hồ",
    description: "Đồng hồ thời gian",
    modeValue: 0,
  },
  { key: "calendar", label: "Lịch", description: "Lịch cơ bản", modeValue: 1 },
  {
    key: "calendarAnalog",
    label: "Lịch & đồng hồ",
    description: "Lịch và đồng hồ kim",
    modeValue: 2,
  },
  {
    key: "image",
    label: "Hình ảnh",
    description: "Hiển thị ảnh đơn sắc",
    modeValue: 3,
  },
  { key: "fabric", label: "Thẻ kho", description: "Thẻ kho vải", modeValue: 4 },
];

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function formatCurrentTime(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function imageDataToString(epdData: Uint8Array) {
  let str = "";
  for (let i = 0; i < epdData.length; i += 1) {
    str += `0x${epdData[i].toString(16).padStart(2, "0")}`;
    if (i < epdData.length - 1) {
      str += ",";
      str += (i + 1) % 16 === 0 ? "\n" : " ";
    }
  }
  return str;
}

function stringToImageData(str: string) {
  const cleanStr = str.replace(/[\[\]{}]/g, "");
  const matches = cleanStr.match(/0[xX][0-9a-fA-F]{2}/g) || [];

  if (matches.length === 0) {
    throw new Error("Không tìm thấy dữ liệu 0xXX hợp lệ");
  }

  const result = new Uint8Array(matches.length);
  for (let i = 0; i < matches.length; i += 1) {
    result[i] = parseInt(matches[i].slice(2), 16);
  }
  return result;
}

function resizeImage(image: ImageBitmap, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Không tạo được canvas context");
  }

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  const shouldRotate = image.height > image.width;
  const sourceWidth = shouldRotate ? image.height : image.width;
  const sourceHeight = shouldRotate ? image.width : image.height;
  const aspectRatio = sourceWidth / sourceHeight;
  const isSquareLike = aspectRatio > 0.8 && aspectRatio < 1.25;
  const scale = isSquareLike
    ? Math.min(width / sourceWidth, height / sourceHeight) * 0.92
    : Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = Math.round(sourceWidth * scale);
  const drawHeight = Math.round(sourceHeight * scale);
  const offsetX = Math.floor((width - drawWidth) / 2);
  const offsetY = Math.floor((height - drawHeight) / 2);

  ctx.save();
  if (shouldRotate) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(
      image,
      -drawHeight / 2,
      -drawWidth / 2,
      drawHeight,
      drawWidth,
    );
  } else {
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  }
  ctx.restore();

  return ctx.getImageData(0, 0, width, height);
}

function applyDithering(
  imageData: ImageData,
  ditherType: DitherType,
  intensity: number,
) {
  if (ditherType === "none") {
    return imageData;
  }

  const width = imageData.width;
  const height = imageData.height;
  const output = new Uint8Array(imageData.data);

  if (ditherType === "floyd-steinberg") {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const oldGray = Math.round(
          0.299 * output[index] +
            0.587 * output[index + 1] +
            0.114 * output[index + 2],
        );
        const newGray = oldGray < 128 ? 0 : 255;
        const error = (oldGray - newGray) * intensity;

        output[index] = newGray;
        output[index + 1] = newGray;
        output[index + 2] = newGray;

        const errorSpread = [
          { x: 1, y: 0, factor: 7 / 16 },
          { x: -1, y: 1, factor: 3 / 16 },
          { x: 0, y: 1, factor: 5 / 16 },
          { x: 1, y: 1, factor: 1 / 16 },
        ];

        for (const spread of errorSpread) {
          const nx = x + spread.x;
          const ny = y + spread.y;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIndex = (ny * width + nx) * 4;
            output[nIndex] = Math.max(
              0,
              Math.min(255, output[nIndex] + error * spread.factor),
            );
            output[nIndex + 1] = Math.max(
              0,
              Math.min(255, output[nIndex + 1] + error * spread.factor),
            );
            output[nIndex + 2] = Math.max(
              0,
              Math.min(255, output[nIndex + 2] + error * spread.factor),
            );
          }
        }
      }
    }
  } else {
    const ditherMatrix = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];
    const matrixSize = 4;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const oldGray = Math.round(
          0.299 * output[index] +
            0.587 * output[index + 1] +
            0.114 * output[index + 2],
        );
        const threshold =
          (ditherMatrix[y % matrixSize][x % matrixSize] /
            (matrixSize * matrixSize)) *
          255 *
          intensity;
        const newGray = oldGray < threshold ? 0 : 255;

        output[index] = newGray;
        output[index + 1] = newGray;
        output[index + 2] = newGray;
      }
    }
  }

  return new ImageData(new Uint8ClampedArray(output), width, height);
}

function convertImageToEPDData(imageData: ImageData, imageParams: ImageParams) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = DISPLAY_WIDTH;
  tempCanvas.height = DISPLAY_HEIGHT;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) {
    throw new Error("Không tạo được canvas context");
  }

  tempCtx.putImageData(imageData, 0, 0);
  const data = tempCtx.getImageData(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
  const pixelData = new Uint8Array(data.data);
  const brightnessFactor = imageParams.brightness / 100;
  const contrastFactor = imageParams.contrast / 100;

  for (let i = 0; i < pixelData.length; i += 4) {
    let r = pixelData[i];
    let g = pixelData[i + 1];
    let b = pixelData[i + 2];

    r = Math.round((r - 128) * contrastFactor + 128) * brightnessFactor;
    g = Math.round((g - 128) * contrastFactor + 128) * brightnessFactor;
    b = Math.round((b - 128) * contrastFactor + 128) * brightnessFactor;

    pixelData[i] = Math.max(0, Math.min(255, r));
    pixelData[i + 1] = Math.max(0, Math.min(255, g));
    pixelData[i + 2] = Math.max(0, Math.min(255, b));
  }

  data.data.set(pixelData);
  tempCtx.putImageData(data, 0, 0);
  const ditheredImageData = applyDithering(
    data,
    imageParams.dithering,
    imageParams.ditherIntensity,
  );

  const epdData = new Uint8Array(BUFFER_SIZE);
  epdData.fill(0xff);

  const widthByte = PANEL_BUFFER_WIDTH / 8;
  const ditheredData = ditheredImageData.data;
  for (let x = 0; x < DISPLAY_WIDTH; x += 1) {
    for (let y = 0; y < DISPLAY_HEIGHT; y += 1) {
      const index = (y * DISPLAY_WIDTH + x) * 4;
      if (ditheredData[index] >= 128) {
        continue;
      }

      const rawX = y;
      const rawY = x;
      const epdIndex = Math.floor(rawX / 8) + rawY * widthByte;
      epdData[epdIndex] &= ~(0x80 >> (rawX % 8));
    }
  }

  return epdData;
}

function App() {
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const deviceRef = useRef<BluetoothDeviceWithGatt | null>(null);
  const controlCharacteristicRef =
    useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const dataCharacteristicRef =
    useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const rotationTimerRef = useRef<number | null>(null);
  const rotationIndexRef = useRef(0);

  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("mode-1");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [locale, setLocale] = useState<LocaleMode>("vi");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [currentTime, setCurrentTime] = useState(() =>
    formatCurrentTime(new Date()),
  );
  const [deviceName, setDeviceName] = useState("Chưa kết nối");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [statusLines, setStatusLines] = useState<string[]>([
    "Hệ thống sẵn sàng.",
  ]);
  const [progress, setProgress] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentScreenMode, setCurrentScreenMode] =
    useState<ScreenModeKey>("clock");
  const [imageParams, setImageParams] =
    useState<ImageParams>(initialImageParams);
  const [fabricFields, setFabricFields] =
    useState<FabricField[]>(initialFabricFields);
  const [fabricModalOpen, setFabricModalOpen] = useState(false);
  const [rotationSelection, setRotationSelection] = useState<ScreenModeKey[]>([
    "clock",
    "calendar",
    "image",
  ]);
  const [rotationIntervalSec, setRotationIntervalSec] = useState(15);
  const [rotationEnabled, setRotationEnabled] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    active: false,
    title: "",
    detail: "",
  });

  const bluetoothAvailable = useMemo(
    () => typeof navigator !== "undefined" && "bluetooth" in navigator,
    [],
  );

  const currentModeConfig = useMemo(
    () =>
      screenModes.find((mode) => mode.key === currentScreenMode) ||
      screenModes[0],
    [currentScreenMode],
  );

  const getScreenModeLabel = (mode: ScreenModeKey) => {
    const labels = {
      image: locale === "vi" ? "Hình ảnh" : "Image",
      calendar: locale === "vi" ? "Lịch" : "Calendar",
      clock: locale === "vi" ? "Đồng hồ" : "Clock",
      calendarAnalog: locale === "vi" ? "Lịch & đồng hồ" : "Calendar & clock",
      fabric: locale === "vi" ? "Thẻ kho" : "Fabric card",
    };
    return labels[mode];
  };

  const appendStatus = (message: string) => {
    setStatusLines((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString("vi-VN")}] ${message}`,
    ]);
    console.log(message);
  };

  const setLoading = (title: string, detail: string) => {
    setLoadingState({ active: true, title, detail });
  };

  const clearLoading = () => {
    setLoadingState({ active: false, title: "", detail: "" });
  };

  const runBusyTask = async (
    title: string,
    detail: string,
    task: () => Promise<void>,
  ) => {
    setLoading(title, detail);
    try {
      await task();
    } finally {
      clearLoading();
    }
  };

  const stopRotation = (silent?: boolean) => {
    if (rotationTimerRef.current) {
      window.clearInterval(rotationTimerRef.current);
      rotationTimerRef.current = null;
    }
    if (rotationEnabled) {
      setRotationEnabled(false);
      if (!silent) {
        appendStatus("Đã dừng lịch tự động chuyển màn hình.");
      }
    }
  };

  const resetConnection = () => {
    controlCharacteristicRef.current = null;
    dataCharacteristicRef.current = null;
    deviceRef.current = null;
    setDeviceName("Chưa kết nối");
    setConnected(false);
    stopRotation(true);
  };

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(formatCurrentTime(new Date()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      stopRotation(true);
      const device = deviceRef.current;
      if (device?.gatt?.connected) {
        device.gatt.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let active = true;

    const drawPreview = async () => {
      if (!imageFile) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      try {
        const image = await createImageBitmap(imageFile);
        if (!active) {
          return;
        }

        const resized = resizeImage(image, DISPLAY_WIDTH, DISPLAY_HEIGHT);
        const processed = convertImageToEPDData(resized, imageParams);
        const previewImageData = new ImageData(DISPLAY_WIDTH, DISPLAY_HEIGHT);
        const widthByte = PANEL_BUFFER_WIDTH / 8;

        for (let x = 0; x < DISPLAY_WIDTH; x += 1) {
          for (let y = 0; y < DISPLAY_HEIGHT; y += 1) {
            const rawX = y;
            const rawY = x;
            const epdIndex = Math.floor(rawX / 8) + rawY * widthByte;
            const isBlack = (processed[epdIndex] & (0x80 >> (rawX % 8))) === 0;
            const pixelIndex = (y * DISPLAY_WIDTH + x) * 4;
            const color = isBlack ? 0 : 255;
            previewImageData.data[pixelIndex] = color;
            previewImageData.data[pixelIndex + 1] = color;
            previewImageData.data[pixelIndex + 2] = color;
            previewImageData.data[pixelIndex + 3] = 255;
          }
        }

        ctx.putImageData(previewImageData, 0, 0);
      } catch (error) {
        console.error(error);
      }
    };

    void drawPreview();
    return () => {
      active = false;
    };
  }, [imageFile, imageParams]);

  const ensureControlCharacteristic = () => {
    const characteristic = controlCharacteristicRef.current;
    if (!characteristic) {
      throw new Error("Vui lòng kết nối thiết bị trước");
    }
    return characteristic;
  };

  const ensureDataCharacteristic = () => {
    const characteristic = dataCharacteristicRef.current;
    if (!characteristic) {
      throw new Error("Chưa có kênh dữ liệu hình ảnh");
    }
    return characteristic;
  };

  const sendCommand = async (command: number, data: number[] = []) => {
    const characteristic = ensureControlCharacteristic();
    const buffer = new Uint8Array([command, ...data]);
    appendStatus(
      `Gui lenh: ${Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ")}`,
    );
    await characteristic.writeValue(buffer);
  };

  const sendDataCommand = async (command: number, data: number[] = []) => {
    const characteristic = ensureDataCharacteristic();
    const buffer = new Uint8Array([command, ...data]);
    appendStatus(
      `Gui du lieu: ${Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ")}`,
    );
    await characteristic.writeValue(buffer);
  };

  const sendTimestamp = async (unixTime: number) => {
    const characteristic = ensureControlCharacteristic();
    const buffer = new Uint8Array(5);
    buffer[0] = 0xdd;
    buffer[1] = (unixTime >> 24) & 0xff;
    buffer[2] = (unixTime >> 16) & 0xff;
    buffer[3] = (unixTime >> 8) & 0xff;
    buffer[4] = unixTime & 0xff;
    await characteristic.writeValue(buffer);
  };

  const sendScreenMode = async (modeKey: ScreenModeKey) => {
    const mode = screenModes.find((item) => item.key === modeKey);
    if (!mode) {
      return;
    }
    await sendCommand(0xe1, [mode.modeValue]);
    await delay(200);
    await sendCommand(0xe2);
    setCurrentScreenMode(mode.key);
    appendStatus(`Đã chuyển sang màn hình ${mode.label}.`);
  };

  const prepareImageData = async (file: File) => {
    const image = await createImageBitmap(file);
    const resized = resizeImage(image, DISPLAY_WIDTH, DISPLAY_HEIGHT);
    const epdData = convertImageToEPDData(resized, imageParams);
    return epdData;
  };

  const writeImageData = async (epdData: Uint8Array, chunkSize: number) => {
    await sendDataCommand(CMD_SET_IMAGE_SIZE, [
      (epdData.length >> 24) & 0xff,
      (epdData.length >> 16) & 0xff,
      (epdData.length >> 8) & 0xff,
      epdData.length & 0xff,
    ]);

    let offset = 0;
    while (offset < epdData.length) {
      const size = Math.min(chunkSize, epdData.length - offset);
      const chunk = epdData.slice(offset, offset + size);
      await sendDataCommand(CMD_WRITE_DATA, [
        (offset >> 8) & 0xff,
        offset & 0xff,
        ...chunk,
      ]);

      offset += size;
      const percent = Math.round((offset / epdData.length) * 100);
      setProgress(percent);
      appendStatus(`Đang tải dữ liệu hình ảnh... ${percent}%`);
      await delay(imageParams.confirmInterval);
    }
  };

  const handleConnect = async () => {
    setStatusLines([]);
    setProgress(0);
    if (!bluetoothAvailable) {
      appendStatus(
        "Trinh duyet khong ho tro Web Bluetooth. Hay dung Chrome hoac Edge.",
      );
      return;
    }

    try {
      const bluetooth = (navigator as Navigator & { bluetooth: Bluetooth })
        .bluetooth;
      const device = (await bluetooth.requestDevice({
        filters: [
          { namePrefix: "IOT-EINK" },
          { namePrefix: "DLG" },
          { namePrefix: "EINK" },
        ],
        optionalServices: [SERVICE_UUID],
      })) as BluetoothDeviceWithGatt;

      deviceRef.current = device;
      setDeviceName(device.name || "E-Ink Device");
      appendStatus(`Đã tìm thấy thiết bị ${device.name || "không rõ tên"}.`);

      let server: BluetoothRemoteGATTServer | null = null;
      for (let retries = 3; retries > 0; retries -= 1) {
        try {
          appendStatus(`Đang kết nối GATT, còn ${retries} lần thử.`);
          server = (await device.gatt?.connect()) ?? null;
          if (server) {
            break;
          }
        } catch (error) {
          if (retries === 1) {
            throw error;
          }
          await delay(1000);
        }
      }

      if (!server) {
        throw new Error("Không kết nối được GATT server");
      }

      device.addEventListener("gattserverdisconnected", () => {
        appendStatus("Thiết bị đã ngắt kết nối.");
        resetConnection();
      });

      const service = await server.getPrimaryService(SERVICE_UUID);
      controlCharacteristicRef.current =
        await service.getCharacteristic(CHARACTERISTIC_UUID);
      dataCharacteristicRef.current = await service.getCharacteristic(
        DATA_CHARACTERISTIC_UUID,
      );
      setConnected(true);
      appendStatus("Kết nối thành công.");
    } catch (error) {
      appendStatus(
        `Kết nối thất bại: ${error instanceof Error ? error.message : String(error)}`,
      );
      resetConnection();
    }
  };

  const handleDisconnect = () => {
    const device = deviceRef.current;
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    appendStatus("Đã ngắt kết nối thiết bị.");
    resetConnection();
  };

  const handleSyncTime = async () => {
    await runBusyTask(
      "Đồng bộ thời gian",
      "Gửi thời gian hiện tại sang thiết bị",
      async () => {
        try {
          const now = new Date();
          const unixTime =
            Math.floor(now.getTime() / 1000) - now.getTimezoneOffset() * 60;
          await sendTimestamp(unixTime);
          await delay(200);
          await sendCommand(0xe2);
          appendStatus(
            `Đồng bộ thời gian thành công: ${now.toLocaleString("vi-VN")}`,
          );
        } catch (error) {
          appendStatus(
            `Đồng bộ thất bại: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  };

  const handleStartRotation = () => {
    if (!connected) {
      appendStatus("Cần kết nối thiết bị trước khi bật lịch chuyển màn hình.");
      return;
    }
    if (rotationSelection.length < 2) {
      appendStatus("Cần chọn ít nhất 2 màn hình để tạo lịch xoay.");
      return;
    }

    stopRotation(true);
    rotationIndexRef.current = 0;
    setRotationEnabled(true);
    appendStatus(`Bật lịch xoay màn hình mỗi ${rotationIntervalSec} giây.`);

    rotationTimerRef.current = window.setInterval(() => {
      const nextMode =
        rotationSelection[rotationIndexRef.current % rotationSelection.length];
      rotationIndexRef.current += 1;
      void sendScreenMode(nextMode).catch((error) => {
        appendStatus(
          `Lich xoay bi dung: ${error instanceof Error ? error.message : String(error)}`,
        );
        stopRotation(true);
      });
    }, rotationIntervalSec * 1000);
  };

  const toggleRotationSelection = (key: ScreenModeKey) => {
    setRotationSelection((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const handleUploadFabric = async () => {
    await runBusyTask(
      "Đang nạp thẻ kho",
      "Gửi toàn bộ thông tin thẻ kho lên màn hình",
      async () => {
        try {
          const encoder = new TextEncoder();
          for (let i = 0; i < fabricFields.length; i += 1) {
            const valueBytes = Array.from(
              encoder.encode(fabricFields[i].value.trim()),
            );
            await sendCommand(0xf0, [i, ...valueBytes]);
            await delay(40);
          }
          await sendScreenMode("fabric");
          appendStatus("Đã nạp thông tin thẻ kho lên thiết bị.");
          setFabricModalOpen(false);
        } catch (error) {
          appendStatus(
            `Nạp thẻ kho thất bại: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  };

  const handleSendAll = async () => {
    if (!imageFile) {
      appendStatus("Vui lòng chọn một hình ảnh.");
      return;
    }

    await runBusyTask(
      "Loading...",
      "Xử lý ảnh, ghi dữ liệu, hiển thị và lưu thiết bị",
      async () => {
        try {
          const epdData = await prepareImageData(imageFile);
          setProgress(0);
          await sendScreenMode("image");
          await delay(300);
          await writeImageData(epdData, 16);
          await sendDataCommand(CMD_DISPLAY_IMAGE);
          await sendDataCommand(CMD_SAVE_IMAGE);
          await delay(800);
          await sendCommand(0xe2);
          appendStatus("Đã hoàn tất toàn bộ quy trình tải ảnh.");
        } catch (error) {
          appendStatus(
            `Tải ảnh thất bại: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  };

  const onImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageFile(event.target.files?.[0] ?? null);
  };

  const onImageFileDrop = (file: File) => {
    setImageFile(file);
  };

  const updateFabricValue = (id: string, value: string) => {
    setFabricFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, value } : field)),
    );
  };

  const updateImageParam = <K extends keyof ImageParams>(
    key: K,
    value: ImageParams[K],
  ) => {
    setImageParams((prev) => ({ ...prev, [key]: value }));
  };

  const resetImageParams = () => {
    setImageParams(initialImageParams);
  };

  const statusText = statusLines.join("\n");

  return (
    <div className="app-shell">
      <div className="background-orb background-orb-a" />
      <div className="background-orb background-orb-b" />

      <div className="app-frame">
        <TopBar
          theme={theme}
          locale={locale}
          sidebarOpen={sidebarOpen}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
          onThemeToggle={() =>
            setTheme((prev) => (prev === "light" ? "dark" : "light"))
          }
          onLocaleToggle={() =>
            setLocale((prev) => (prev === "vi" ? "en" : "vi"))
          }
        />
        <div className="workspace-shell">
          <ModeRail
            workspaceMode={workspaceMode}
            locale={locale}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onModeChange={setWorkspaceMode}
          />
          <div className="workspace-main">
            {workspaceMode === "mode-1" ? (
              <div className="workspace-grid">
                <ScreenControlPanel
                  locale={locale}
                  connected={connected}
                  connecting={connecting}
                  currentTime={currentTime}
                  deviceName={deviceName}
                  bluetoothAvailable={bluetoothAvailable}
                  currentScreenMode={currentScreenMode}
                  rotationEnabled={rotationEnabled}
                  rotationIntervalSec={rotationIntervalSec}
                  rotationSelection={rotationSelection}
                  onConnect={() => void handleConnect()}
                  onDisconnect={handleDisconnect}
                  onSyncTime={() => void handleSyncTime()}
                  onOpenFabricModal={() => setFabricModalOpen(true)}
                  onModeSelect={(mode) =>
                    void runBusyTask(
                      "Đang chuyển màn hình",
                      `Đang chuyển sang ${screenModes.find((item) => item.key === mode)?.label || mode}`,
                      async () => {
                        await sendScreenMode(mode);
                      },
                    )
                  }
                  onRotationToggle={toggleRotationSelection}
                  onRotationIntervalChange={setRotationIntervalSec}
                  onRotationStart={handleStartRotation}
                  onRotationStop={() => stopRotation()}
                />
                <ImageWorkspace
                  locale={locale}
                  connected={connected}
                  progress={progress}
                  imageFile={imageFile}
                  imageParams={imageParams}
                  previewRef={previewRef}
                  onFileChange={onImageFileChange}
                  onFileDrop={onImageFileDrop}
                  onImageParamChange={updateImageParam}
                  onResetImageParams={resetImageParams}
                  onSendAll={() => void handleSendAll()}
                />
                <StatusPanel
                  locale={locale}
                  connected={connected}
                  statusText={statusText}
                />
              </div>
            ) : workspaceMode === "mode-2" ? (
              <PlaceholderMode
                locale={locale}
                title={
                  locale === "vi"
                    ? "Mode 2 đang được đặt cho workflow nâng cao"
                    : "Mode 2 reserved for advanced workflows"
                }
                subtitle={locale === "vi" ? "Mở rộng sau" : "Coming later"}
                points={[
                  locale === "vi"
                    ? "Dashboard xem trước nhiều thiết bị"
                    : "Dashboard for multiple devices",
                  locale === "vi"
                    ? "Đồng bộ dữ liệu theo mẫu template"
                    : "Template-based data sync",
                  locale === "vi"
                    ? "Lịch chạy tự động theo ca làm việc"
                    : "Shift-based scheduling",
                ]}
              />
            ) : (
              <PlaceholderMode
                locale={locale}
                title={
                  locale === "vi"
                    ? "Mode 3 đang được đặt cho dashboard bảo trì"
                    : "Mode 3 reserved for maintenance dashboard"
                }
                subtitle={locale === "vi" ? "Mở rộng sau" : "Coming later"}
                points={[
                  locale === "vi"
                    ? "Chẩn đoán kết nối và log nâng cao"
                    : "Advanced connection diagnostics",
                  locale === "vi"
                    ? "Thư viện giao diện cho từng loại màn hình"
                    : "Screen-specific UI library",
                  locale === "vi"
                    ? "Quản lý preset và profile vận hành"
                    : "Preset and operating profile manager",
                ]}
              />
            )}
          </div>
        </div>
      </div>

      <FabricModal
        locale={locale}
        open={fabricModalOpen}
        connected={connected}
        fabricFields={fabricFields}
        onClose={() => setFabricModalOpen(false)}
        onChange={updateFabricValue}
        onSubmit={() => void handleUploadFabric()}
      />
      <LoadingOverlay loadingState={loadingState} />
    </div>
  );
}
