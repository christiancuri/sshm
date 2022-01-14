import fs from "fs/promises";
import os from "os";
import path from "path";

export type TConfig = {
  connections: TConnection[];
};

const DEFAULT_CONFIG: TConfig = {
  connections: [],
};

let APP_VERSION = "";
let CONFIG: TConfig;

const CONFIG_FOLDER = `${os.homedir()}/.sshm`;
const CONFIG_PATH = `${CONFIG_FOLDER}/config`;

export type TConnection = {
  name: string;
  description?: string;
  user: string;
  host: string;
  port: number;
  identify_file?: string;
};

async function accessPath(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch (e) {
    return false;
  }
}

async function configExists(): Promise<boolean> {
  return accessPath(CONFIG_PATH);
}

async function createConfigFolder() {
  if (!(await accessPath(CONFIG_FOLDER))) {
    await fs.mkdir(CONFIG_FOLDER, {
      recursive: true,
    });
  }
}

export async function saveConfig(config: TConfig) {
  CONFIG = config;
  if (config && Object.keys(config).length) {
    await createConfigFolder();
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
  }
}

export async function getConfig(): Promise<TConfig> {
  if (CONFIG) return CONFIG;

  if (await configExists()) {
    const content = await fs.readFile(CONFIG_PATH, "utf-8");
    const config = JSON.parse(content);
    CONFIG = config;
  } else {
    CONFIG = DEFAULT_CONFIG;
  }

  return CONFIG;
}

export async function getAppVersion(): Promise<string> {
  if (!APP_VERSION) {
    const packagePath = path.resolve(__dirname, "../package.json");
    const packageContent = await fs.readFile(packagePath, "utf-8");
    const { version } = JSON.parse(packageContent);
    APP_VERSION = version;
  }
  return APP_VERSION;
}

export * as Config from "./config";
