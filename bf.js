"use strict"

class BFInterpreter {
  constructor(code, input = Uint8Array([]), cell_bit = 8, eof = -1) {
    this.code = code.replaceAll(/[^\<\>\-\+\.\,\[\]]/g, "")
    this.pc = 0
    this.input = input
    this.pos = 0
    this.m = 2 ** cell_bit
    this.eof = eof
    this.ptr = 0
    this.pcells = []
    this.mcells = []
    this.jump = {}
    const stack = []
    for (let i = 0; i < this.code.length; i++) {
      if (this.code.at(i) == "[") {
        stack.push(i + 1)
      }
      if (this.code.at(i) == "]") {
        const j = stack.pop() ?? 0
        this.jump[i+1] = j
        this.jump[j] = i+1
      }
    }
  }

  get(pointer = undefined) {
    const ptr = pointer ?? this.ptr
    const value = ptr < 0 ? this.mcells[-1 - ptr] : this.pcells[ptr]
    return value ?? 0
  }

  set(value) {
    const v = (value % this.m + this.m) % this.m

    if (this.ptr < 0) {
      this.mcells[-1 - this.ptr] = v
    } else {
      this.pcells[this.ptr] = v
    }
  }

  step() {
    const c = this.code.at(this.pc++)
    if (c == "<") this.lt()
    if (c == ">") this.gt()
    if (c == "-") this.minus()
    if (c == "+") this.plus()
    if (c == ".") this.dot()
    if (c == ",") this.comma()
    if (c == "[") this.lbrack()
    if (c == "]") this.rbrack()
  }

  lt() { this.ptr-- }
  gt() { this.ptr++ }
  minus() { this.set( this.get() - 1 ) }
  plus( ) { this.set( this.get() + 1 ) }
  dot() {
    this.output(this.get())
  }
  comma() {
    if (this.pos < this.input.length) {
      this.set(this.input[this.pos++])
    } else {
      this.set(this.eof)
    }
  }
  lbrack() {
    if (this.get() == 0) this.pc = this.jump[this.pc] ?? this.pc
  }
  rbrack() {
    if (this.get() != 0) this.pc = this.jump[this.pc]
  }
}
