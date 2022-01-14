import { terminal } from "terminal-kit";

import { Connection } from "./connection";
import { Menu } from "./Menu";

terminal.fullscreen(true);
terminal.windowTitle("SSH Manager by ChristianCuri");

terminal.on("key", async (name) => {
  if (!Connection.hasConnection && "CTRL_C" === name) {
    if (Menu.DRAW_MAIN_MENU_WHEN_BREAK) {
      await Menu.drawMainMenu();
    } else {
      terminal.bell();
      terminal.clear();
      terminal.processExit(0);
    }
  }
});

async function startApp() {
  await Menu.drawMainMenu();
}

startApp();
