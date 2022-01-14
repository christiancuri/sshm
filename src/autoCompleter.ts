import fs from "fs";
import os from "os";
import path from "path";
import { autoComplete } from "terminal-kit";

const baseDir = os.homedir();

export async function autoCompleter(inputString) {
  let inputDir, inputFile, currentDir, files, completion;

  if (inputString[inputString.length - 1] === "/") {
    inputDir = inputString;
    inputFile = "";
  } else {
    inputDir = path.dirname(inputString);
    inputDir = inputDir === "." ? "" : inputDir + "/";
    inputFile = path.basename(inputString);
  }

  if (path.isAbsolute(inputString)) {
    currentDir = inputDir;
  } else {
    currentDir = baseDir + inputDir;
  }

  try {
    files = await readdir(currentDir);
  } catch (error) {
    return inputString;
  }

  if (!Array.isArray(files) || !files.length) {
    return inputString;
  }

  completion = autoComplete(files, inputFile, true);

  if (Array.isArray(completion)) {
    (completion as any).prefix = inputDir;
  } else {
    completion = path.normalize(inputDir + completion);
  }

  return completion;
}

async function readdir(dir: string) {
  return new Promise((resolve, reject) => {
    if (dir[dir.length - 1] !== "/") {
      dir += "/";
    }

    fs.readdir(dir, async (error, files) => {
      if (error) {
        reject(error);
        return;
      }

      const response = await Promise.all(
        files.map(async (file) => {
          return new Promise((resolve, reject) => {
            fs.lstat(dir + file, (error_, stats) => {
              if (error_) {
                reject(error_);
                return;
              }
              if (stats.isDirectory()) {
                file += "/";
              }
              resolve(file);
            });
          });
        }),
      );

      resolve(response);
    });
  });
}
