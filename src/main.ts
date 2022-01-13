import { terminal } from "terminal-kit";

import { Menu } from "./Menu";

terminal.fullscreen(true);
terminal.on("key", (name) => {
  if ("CTRL_C" === name) {
    terminal.clear();
    terminal.processExit(0);
  }
});

async function startApp() {
  await Menu.drawMainMenu();
}

startApp();
