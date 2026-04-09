import commander from 'commander';


export type ParserFrom = 'node' | 'electron' | 'user';

export interface CommandEvent {
  args: any[];
  options: Record<string, any>;
};

export type CommanderCommand = commander.Command;
