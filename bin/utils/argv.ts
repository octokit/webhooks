export const parseArgv = (
  argv: string[]
): [args: string[], flags: string[]] => {
  const flags: string[] = [];
  const args: string[] = [];

  argv.forEach((arg) => {
    arg.startsWith("--") ? flags.push(arg) : args.push(arg);
  });

  return [args, flags];
};
