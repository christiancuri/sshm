import { terminal } from "terminal-kit";

import { Config } from "./config";
import { Utils } from "./utils";

export enum SystemMenu {
  DIVIDER = " ",
  CREATE_CONNECTION = "Create new connection",
  DELETE_CONNECTION = "Delete connection",
}

export async function getMenu(): Promise<string[]> {
  const config = await Config.getConfig();

  const connections = config.connections.map(
    ({ name, user, host, port, description }, index) =>
      `${index}|${name.trim()}|${`${user.trim()}@${host.trim()}:${port}|${description.trim()}`}`,
  );

  // let menu = Utils.createTable([
  //   "#|Name|Connection|Description",
  //   ...connections,
  // ]);

  // if (menu.length > 0) menu = [...menu, SystemMenu.DIVIDER];

  // menu = [...menu, SystemMenu.CREATE_CONNECTION, SystemMenu.DELETE_CONNECTION];

  // return menu;

  const menu: string[] = [
    SystemMenu.CREATE_CONNECTION,
    SystemMenu.DELETE_CONNECTION,
    SystemMenu.DIVIDER,
  ];

  menu.push(
    ...Utils.createTable(["#|Name|Connection|Description", ...connections]),
  );

  return menu;
}

export async function handleMenu(selectedText: string): Promise<void> {
  if (selectedText === SystemMenu.DIVIDER) {
    terminal.clear();
    await drawMainMenu();
  } else if (selectedText === SystemMenu.CREATE_CONNECTION) {
    // TODO: Handle Create new connection
  } else if (selectedText === SystemMenu.DELETE_CONNECTION) {
    // TODO: Handle delete connection
  } else {
    const [id] = selectedText.split(/\s/, 1);
    await drawMainMenu();
  }
}

export async function drawMainMenu() {
  const appVersion = await Config.getAppVersion();

  terminal.cyan(`SSH Manager v${appVersion}\n`);

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

export * as Menu from "./Menu";
