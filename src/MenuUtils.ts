import { terminal } from "terminal-kit";
import { InputFieldOptions } from "terminal-kit/Terminal";

let INPUT_PROMISES: { abort: () => void }[] = [];

export async function inputField(
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

export async function abortInputs() {
  if (INPUT_PROMISES.length) {
    for (const input of INPUT_PROMISES) input.abort();
    INPUT_PROMISES = [];
  }
}

export * as MenuUtils from "./MenuUtils";
