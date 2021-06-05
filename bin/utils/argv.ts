import { strict as assert } from "assert";
import fs from "fs";
import path from "path";
import { capitalize } from ".";

type Join<T extends unknown[], D extends string> = T extends []
  ? ""
  : T extends [string]
  ? `${T[0]}`
  : T extends [string, ...infer U]
  ? `${T[0]}${D}${Join<U, D>}`
  : string;

type CapitalizeIf<
  Condition extends boolean,
  T extends string
> = Condition extends true ? Capitalize<T> : T;

type SplitCamel<
  S extends string,
  D extends string,
  IsTail extends boolean = false
> = string extends S
  ? string[]
  : S extends ""
  ? []
  : S extends `${infer T}${D}${infer U}`
  ? [CapitalizeIf<IsTail, T>, ...SplitCamel<U, D, true>]
  : [CapitalizeIf<IsTail, S>];

type Camelize<S> = S extends string ? Join<SplitCamel<S, "-">, ""> : S;

const dashToCamelCase = <T extends string>(str: T): Camelize<T> =>
  str
    .split("-")
    .map((seg, index) => (index !== 0 ? capitalize(seg) : seg))
    .join("") as Camelize<T>;

const getArgsAndFlags = (argv: string[]): [args: string[], flags: string[]] => {
  const flags: string[] = [];
  const args: string[] = [];

  argv.forEach((arg) => {
    arg.startsWith("--") ? flags.push(arg) : args.push(arg);
  });

  return [args, flags];
};

function assertHasRequiredArgs<T extends string[]>(
  foundArgs: string[],
  requiredArgs: T
): asserts foundArgs is T {
  requiredArgs.forEach((missingMessage, index) => {
    assert.ok(foundArgs[index], missingMessage);
  });
}

type CamelCasedFlags<K extends string> = Partial<Record<Camelize<K>, boolean>>;

const getHelpText = (pathToScript: string, full = false): string => {
  const { dir, name } = path.parse(pathToScript);

  try {
    const doc = fs.readFileSync(`${dir}/docs/${name}.md`, "utf-8");

    const endOfSummary =
      !full && doc.includes("## Details")
        ? doc.indexOf("## Details")
        : doc.length;

    return [
      doc.substring(0, endOfSummary).trim(),
      "",
      `See here for more: bin/docs/${name}.md`,
    ].join("\n");
  } catch {
    throw new Error(`NO DOCUMENTATION WAS FOUND AT bin/docs/${name}.md`);
  }
};

const isSupportedFlag = <TFlag extends string>(
  flag: string,
  supportedFlags: TFlag[]
): flag is TFlag => supportedFlags.includes(flag as TFlag);

const processFlags = <TFlag extends string>(
  flags: string[],
  supportedFlags: TFlag[] = []
): CamelCasedFlags<TFlag> => {
  const finalFlags: CamelCasedFlags<TFlag> = {};

  flags.forEach((flag) => {
    const flagWithoutLeadingDashes = flag.substring("--".length);

    if (!isSupportedFlag(flagWithoutLeadingDashes, supportedFlags)) {
      throw new Error(`Unknown flag "${flag}"`);
    }

    finalFlags[dashToCamelCase(flagWithoutLeadingDashes)] = true;
  });

  return finalFlags;
};

export const parseArgv = <TRequiredArgs extends string[], TFlag extends string>(
  pathToScript: string,
  argsMissingMessages: TRequiredArgs,
  supportedFlags: TFlag[] = []
): [args: TRequiredArgs, flags: CamelCasedFlags<TFlag>] => {
  const [foundArgs, flags] = getArgsAndFlags(process.argv.slice(2));

  if (flags.includes("--help") || flags.includes("--help-full")) {
    console.log(getHelpText(pathToScript, flags.includes("--help-full")));

    process.exit();
  }

  assertHasRequiredArgs(foundArgs, argsMissingMessages);

  return [foundArgs, processFlags(flags, supportedFlags)];
};
