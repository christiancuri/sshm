import os from "os";
import fs from "fs/promises";
import path from "path";

export let APP_VERSION = "";

const CONFIG_PATH = `${os.homedir()}/.sshm/config`;

export type TConnection = {
  name: string;
  description?: string;
  user: string;
  host: string;
  port: number;
  identify_file?: string;
};

export type TConfig = {
  connections: TConnection[];
};

const DEFAULT_CONFIG: TConfig = {
  connections: [
    {
      name: "anubis",
      user: "anubis",
      host: "ssh.christiancuri.dev",
      port: 22,
      description: "My main bare metal",
    },
    {
      name: "anubis",
      user: "anubis",
      host: "ssh.christiancuri.dev",
      port: 22,
      description: "My main bare metal",
    },
    {
      name: "anubis",
      user: "anubis",
      host: "ssh.christiancuri.dev",
      port: 22,
      description: "My main bare metal",
    },
    {
      name: "anubis",
      user: "anubis",
      host: "ssh.christiancuri.dev",
      port: 22,
      description: "My main bare metal",
    },
    {
      name: "anubis",
      user: "anubis",
      host: "ssh.christiancuri.dev",
      port: 22,
      description: "My main bare metal",
    },
    {
      name: "anubis",
      user: "anubis",
      host: "ssh.christiancuri.dev",
      port: 22,
      description: "My main bare metal",
    },
  ],
};

async function configExists(): Promise<boolean> {
  try {
    await fs.access(CONFIG_PATH);
    return true;
  } catch (e) {
    return false;
  }
}

export async function saveConfig(config: TConfig) {
  if (config && Object.keys(config).length) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
  }
}

export async function getConfig(): Promise<TConfig> {
  if (await configExists()) {
    const content = await fs.readFile(CONFIG_PATH, "utf-8");
    const config = JSON.parse(content);
    return config;
  } else {
    return DEFAULT_CONFIG;
  }
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
