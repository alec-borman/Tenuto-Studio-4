export interface TextMutation {
  offset: number;
  length: number;
  insertText: string;
}

export interface Command {
  forward: TextMutation;
  reverse: TextMutation;
}

export class CommandHistory {
  private stack: Command[] = [];
  private index: number = -1;

  public execute(command: Command, applyMutation: (mutation: TextMutation) => void) {
    // Drop redo history past current index
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(command);
    this.index++;
    applyMutation(command.forward);
  }

  public undo(applyMutation: (mutation: TextMutation) => void): boolean {
    if (this.index >= 0) {
      applyMutation(this.stack[this.index].reverse);
      this.index--;
      return true;
    }
    return false;
  }

  public redo(applyMutation: (mutation: TextMutation) => void): boolean {
    if (this.index < this.stack.length - 1) {
      this.index++;
      applyMutation(this.stack[this.index].forward);
      return true;
    }
    return false;
  }
}
