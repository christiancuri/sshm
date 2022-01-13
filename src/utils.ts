import util from "util";

function fillEmpty(str: string, totalSize: number): string {
  const empty = totalSize - str.length;
  return str + " ".repeat(empty);
}

export function createTable(array: string[]): string[] {
  const biggerSizes = [0, 0, 0, 0]; // [biggerSizeId, biggerSizeName, biggerSizeConnection, biggerSizeDescription]

  array.forEach((item) => {
    item.split("|").forEach((item, index) => {
      if (item?.trim().length > biggerSizes[index])
        biggerSizes[index] = item.trim().length;
    });
  });

  return array.map((item) => {
    const [id, name, conn, description] = item
      .split("|")
      .map((item, index) => fillEmpty(item, biggerSizes[index]));
    return util.format(`%s   %s   %s    %s`, id, name, conn, description ?? "");
  });
}

export * as Utils from "./utils";
