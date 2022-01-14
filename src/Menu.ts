import os from "os";
import path from "path";
import { terminal } from "terminal-kit";
import { InputFieldOptions } from "terminal-kit/Terminal";

import { autoCompleter } from "./autoCompleter";
import { Config } from "./config";
import { Connection } from "./connection";
import { Utils } from "./utils";

let INPUT_PROMISES: { abort: () => void }[] = [];

export let DRAW_MAIN_MENU_WHEN_BREAK: boolean | undefined = void 0;

export enum SystemMenu {
  DIVIDER = " ",
  CREATE_CONNECTION = "Create new connection",
  DELETE_CONNECTION = "Delete connection",
  BACK_MAIN_MENU = "Back to main menu",
}

export async function getMenu(backOption = false): Promise<string[]> {
  const config = await Config.getConfig();

  const connections = config.connections.map(
    ({ name, user, host, port, description }, index) =>
      `${index}|${name.trim()}|${`${user.trim()}@${host.trim()}:${port}|${description?.trim()}`}`,
  );

  const menu: string[] = !backOption
    ? [
        SystemMenu.CREATE_CONNECTION,
        SystemMenu.DELETE_CONNECTION,
        SystemMenu.DIVIDER,
      ]
    : [SystemMenu.BACK_MAIN_MENU, SystemMenu.DIVIDER];

  menu.push(
    ...Utils.createTable(["#|Name|Connection|Description", ...connections]),
  );

  return menu;
}

export async function handleMenu(selectedText: string): Promise<void> {
  if (selectedText === SystemMenu.DIVIDER || selectedText.startsWith("#")) {
    terminal.bell();
    await drawMainMenu();
  } else if (selectedText === SystemMenu.CREATE_CONNECTION) {
    await drawCreateConnectionMenu();
  } else if (selectedText === SystemMenu.DELETE_CONNECTION) {
    await drawDeleteConnectionMenu();
  } else {
    const [id] = selectedText.split(/\s/, 1);
    try {
      await Connection.connectSSH(parseInt(id, 10));
    } catch (error) {
      terminal.bell();
      await drawMainMenu();
    }
  }
}

async function drawTitle() {
  const appVersion = await Config.getAppVersion();
  terminal.cyan(`SSH Manager v${appVersion} by ChristianCuri \n`);
}

export async function drawMainMenu() {
  if (INPUT_PROMISES.length) {
    for (const input of INPUT_PROMISES) input.abort();
    INPUT_PROMISES = [];
  }

  DRAW_MAIN_MENU_WHEN_BREAK = void 0;

  terminal.clear();
  await drawTitle();

  const menuItems = await getMenu();

  terminal.singleColumnMenu(menuItems, async (error, response) => {
    handleMenu(response.selectedText);
    //
    // terminal("\n").eraseLineAfter.green(
    //   "#%s selected: %s (%s,%s)\n",
    //   response.selectedIndex,
    //   response.selectedText,
    //   response.x,
    //   response.y,
    // );
  });
}

async function inputField(
  question: string,
  options?: InputFieldOptions,
): Promise<string> {
  terminal.white(`\n${question}: `);
  const input = terminal.inputField({
    cancelable: false,
    minLength: 2,
    maxLength: 25,
    ...(options || {}),
  });

  INPUT_PROMISES.push(input);

  return input.promise as Promise<string>;
}

async function fileField(question: string) {
  try {
    let input = await inputField(question, {
      minLength: 0,
      autoCompleteHint: true,
      autoComplete: autoCompleter,
      autoCompleteMenu: true,
    });

    if (!input || typeof input !== "string") {
      return;
    } else {
      input = path.resolve(
        path.isAbsolute(input)
          ? input
          : `${os.homedir()}${input.startsWith("/") ? input : `/${input}`}`,
      );
    }

    return input;
  } catch (error) {
    return;
  }
}

async function drawCreateConnectionMenu() {
  DRAW_MAIN_MENU_WHEN_BREAK = true;
  terminal.clear();
  await drawTitle();

  terminal.white(`\nFill the connection details: \n`);

  const name = await inputField(`Name`);
  const description = await inputField(`Description`, { maxLength: 36 });
  const user = await inputField(`User`);
  const host = await inputField(`Host`);
  const inputPort = await inputField(`Port`, {
    default: "22",
  });
  const identify_file = await fileField(`Identify file (optional)`);

  let port: number;
  try {
    port = parseInt(inputPort, 10);
  } catch (error) {
    port = 22;
  }

  terminal.clear();
  await drawTitle();

  const detailsMenu = [
    `Name: ${name}`,
    `Description: ${description}`,
    `User: ${user}`,
    `Host: ${host}`,
    `Port: ${
      port.toString() === inputPort
        ? port
        : `${port} (The port entered is invalid. Using default port)`
    }`,
  ];

  if (identify_file?.trim())
    detailsMenu.push(`Identify file: ${identify_file}`);

  terminal.white(`\nConnection details\n\n`);

  for (const menuLine of Utils.formatConnectionDetails(detailsMenu))
    terminal.white(`${menuLine}\n`);

  terminal.white(`\nSave connection? [Y/n] `);
  terminal.yesOrNo(
    { yes: ["y", "Y", "ENTER"], no: ["n"] },
    async (_, result) => {
      if (result) {
        const config = await Config.getConfig();

        config.connections.push({
          name: name.trim(),
          description: description.trim(),
          user: user.trim(),
          host: host.trim(),
          port,
          identify_file: identify_file?.trim() || undefined,
        });

        await Config.saveConfig(config);

        await drawMainMenu();
      } else {
        await drawCreateConnectionMenu();
      }
    },
  );
}

async function drawDeleteConnectionMenu() {
  await terminal.clear();
  await drawTitle();

  terminal.white(`\nSelect one connection to delete: \n`);

  const menuItems = await getMenu(true);

  terminal.singleColumnMenu(menuItems, async (error, response) => {
    handleDeleteConnection(response.selectedText);
  });
}

async function handleDeleteConnection(selectedText: string) {
  try {
    if (selectedText === SystemMenu.DIVIDER || selectedText.startsWith("#")) {
      terminal.bell();
      await drawDeleteConnectionMenu();
    } else if (selectedText === SystemMenu.BACK_MAIN_MENU) {
      terminal.bell();
      await drawMainMenu();
    } else {
      const [selectedId] = selectedText.split(/\s/, 1);
      const id = parseInt(selectedId, 10);

      const config = await Config.getConfig();

      const connection = config.connections[id];

      if (!connection) throw new Error(`Connection not found`);

      terminal.clear();
      await drawTitle();

      terminal.white(
        `\nAre you sure want to delete connection #${id} ${connection.name}? [y/N] `,
      );
      terminal.yesOrNo(
        { yes: ["y", "Y"], no: ["n", "ENTER"] },
        async (_, result) => {
          if (result) {
            const config = await Config.getConfig();
            config.connections.splice(id, 1);
            await Config.saveConfig(config);
            await drawDeleteConnectionMenu();
          } else {
            await drawDeleteConnectionMenu();
          }
        },
      );
    }
  } catch (error) {
    terminal.bell();
    await drawDeleteConnectionMenu();
  }
}

export * as Menu from "./Menu";
