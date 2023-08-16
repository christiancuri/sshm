import { exec } from "child_process";
import fs from "fs/promises";
import { Client, ClientChannel, ConnectConfig } from "ssh2";
import { terminal } from "terminal-kit";

import { Config } from "./config";
import { MenuUtils } from "./MenuUtils";

export let hasConnection: boolean | undefined = void 0;

async function getConnectionOptions(
  connection: Config.TConnection,
): Promise<ConnectConfig> {
  const options: ConnectConfig = {
    host: connection.host,
    username: connection.user,
    port: connection.port || 22,
    keepaliveCountMax: 5,
    keepaliveInterval: 30 * 1000,
  };

  if (connection.identify_file)
    options.privateKey = await fs.readFile(connection.identify_file, "utf-8");
  if (process.env.SSH_AUTH_SOCK) options.agent = process.env.SSH_AUTH_SOCK;
  if (options.agent) options.agentForward = true;
  if (!options.privateKey) {
    options.password = await MenuUtils.inputField(`Input password`, {
      cancelable: false,
      maxLength: 1024,
      echoChar: "*",
    });
    terminal.white(`\n`);
  }

  return options;
}

async function createClient(options: ConnectConfig): Promise<Client> {
  return new Promise((resolve, reject) => {
    const client = new Client();

    client.connect(options);

    client.on("ready", () => resolve(client)).on("error", reject);
  });
}

async function getClient(connection: Config.TConnection): Promise<Client> {
  const clientOptions = await getConnectionOptions(connection);
  return createClient(clientOptions);
}

async function runShell(command: string) {
  return new Promise((resolve, reject) => {
    const cmd = exec(command);
    cmd.on("close", resolve).on("error", reject);
  });
}

export async function connectSSH(connectionId: number) {
  const config = await Config.getConfig();

  const connection = config.connections[connectionId];

  if (!connection) throw new Error(`Connection not found`);

  terminal.clear();
  terminal.cyan(`Connecting on ${connection.user}@${connection.host}...\n`);
  terminal.windowTitle(connection.name);
  terminal.wrap();

  const close = async (clientConnection?: Client) => {
    clientConnection?.end?.();
    hasConnection = void 0;
    terminal.green(
      `Thanks for using SSH Manager v${await Config.getAppVersion()}`,
    );
    terminal.processExit(0);
  };

  const resizeStream = (stream: ClientChannel) => {
    stream.setWindow(
      process.stdout.rows as any,
      process.stdout.columns as any,
      ...(process.stdout.getWindowSize() as [any, any]),
    );
  };

  try {
    await runShell(
      `ssh-keygen -R ${connection.host} 2>/dev/null && ssh-keyscan -t rsa ${connection.host} >> ~/.ssh/known_hosts`,
    );

    const client = await getClient(connection);
    terminal.fullscreen(false);
    hasConnection = true;

    const [rows, columns, [height, width]] = [
      process.stdout.rows,
      process.stdout.columns,
      process.stdout.getWindowSize(),
    ];

    client.shell(
      { rows, cols: columns, height, width, term: "xterm-256color" },
      { env: process.env },
      (err, stream) => {
        if (err) {
          terminal.red(err);
          terminal.processExit(0);
          return;
        }
        process.stdin.setRawMode(true);
        process.stdin.pipe(stream);
        process.stdin.unref();
        stream.pipe(process.stdout);
        stream.stderr.pipe(process.stderr);
        resizeStream(stream);
        process.stdout.on("resize", () => resizeStream(stream));

        stream.on("close", () => {
          close();
        });
      },
    );
  } catch (error) {
    if ((error as any)?.level === "client-authentication") {
      terminal.brightRed(
        `${connection.user}@${
          connection.host
        }: Permission denied (publickey,gssapi-keyex,gssapi-with-mic${
          connection.identify_file ? "" : ",password"
        })\n`,
      );
    } else {
      terminal.brightRed(`${JSON.stringify(error)}\n`);
    }
    close();
  }

  process.on("SIGINT", close);
  process.on(`SIGHUP`, close);
  process.on(`SIGUSR1`, close);
  process.on(`SIGUSR2`, close);
}

export * as Connection from "./connection";
