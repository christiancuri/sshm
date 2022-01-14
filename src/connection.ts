import { spawn } from "child_process";
import { terminal } from "terminal-kit";

import { Config } from "./config";

export let hasConnection = void 0;

export async function connectSSH(connectionId: number) {
  const config = await Config.getConfig();

  const connection = config.connections[connectionId];

  if (!connection) throw new Error(`Connection not found`);

  const command = ["-tt"];

  if (connection.identify_file) command.push("-i", connection.identify_file);

  command.push(
    `${connection.user}@${connection.host}`,
    "-p",
    connection.port.toString(),
  );

  terminal.clear();
  terminal.cyan(`Connecting on ${connection.user}@${connection.host}...\n`);
  terminal.windowTitle(connection.name);
  terminal.wrap();

  const ssh = spawn(`ssh`, command, {
    detached: true,
    env: process.env,
    shell: true,
  });

  ssh.unref();

  hasConnection = true;

  process.stdin.setRawMode(true);
  process.stdin.pipe(ssh.stdin);

  ssh.stderr.pipe(process.stderr);
  ssh.stdout.pipe(process.stdout);

  const close = async () => {
    hasConnection = void 0;
    ssh.kill();
    terminal.green(
      `Thanks for using SSH Manager ${await Config.getAppVersion()}`,
    );
    terminal.processExit(0);
  };

  ssh.on("error", close);
  ssh.on(`exit`, close);

  process.on("SIGINT", close);
  process.on(`SIGHUP`, close);
  process.on(`SIGUSR1`, close);
  process.on(`SIGUSR2`, close);
}

export * as Connection from "./connection";
