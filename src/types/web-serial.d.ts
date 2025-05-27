// Type definitions for Web Serial API
export interface SerialPortInfo {
  usbProductId?: number;
  usbVendorId?: number;
  path?: string;
  manufacturer?: string;
  serialNumber?: string;
  locationId?: string;
  vendor?: string;
  product?: string;
}

declare global {
  interface Navigator {
    serial: {
      getPorts(): Promise<SerialPort[]>;
      requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
    };
  }

  interface SerialPortInfo {
    usbProductId?: number;
    usbVendorId?: number;
  }

  interface SerialPortOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: 'none' | 'even' | 'odd';
    bufferSize?: number;
    flowControl?: 'none' | 'hardware';
  }

  interface SerialPort {
    readonly readable: ReadableStream<Uint8Array>;
    readonly writable: WritableStream<Uint8Array>;
    open(options: SerialPortOptions): Promise<void>;
    close(): Promise<void>;
    getInfo(): SerialPortInfo;
  }

  interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
  }

  interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
  }
}

export {};
