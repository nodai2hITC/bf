"use strict"

let bfi = undefined
let decoder = undefined
let running = false

class MyBFInterpreter extends BFInterpreter {
  output(char) {
    const u8a = new Uint8Array(1)
    u8a[0] = char % 256
    document.getElementById("output").value += decoder.decode(u8a, { stream: true })
  }
}

const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: true,
    mode: "brainfuck",
    indentUnit: 2,
    autofocus: true,
    matchBrackets: true,
    mode: "text/x-brainfuck"
})

window.addEventListener("DOMContentLoaded", function() {
  if (location.hash) {
    const hash = location.hash.slice(1)
    const u8a = Uint8Array.fromBase64(hash, { alphabet: "base64url" })
    const code = new TextDecoder().decode(u8a)
    editor.setValue(code)
  }

  document.getElementById("copy").addEventListener("click", () => {
    const code = editor.getValue()
    const u8a = new TextEncoder().encode(code)
    const hash = u8a.toBase64({ alphabet: "base64url", omitPadding: true })
    location.hash = hash
    navigator.clipboard.writeText(location.href)
  })

  document.getElementById("run").addEventListener("click", run)
  function run() {
    if (running) {
      stop()
      return
    }
    running = true
    document.getElementById("run").textContent = "■停止"

    document.getElementById("output").value = ""
    const code = editor.getValue()
    const input = new TextEncoder().encode(document.getElementById("input").value)
    const speed = parseInt(document.getElementById("speed").value)
    const cell_bit = parseInt(document.getElementById("cell_bit").value)
    const eof = parseInt(document.getElementById("eof").value)

    bfi = new MyBFInterpreter(code, input, cell_bit, eof)
    decoder = new TextDecoder()

    const before = document.getElementById("before")
    const active = document.getElementById("active")
    const after  = document.getElementById("after")
    
    const fontsize_str = window.getComputedStyle(document.body).fontSize
    const fontsize = parseInt(fontsize_str) || 16
    const length = parseInt(document.body.scrollWidth / ((fontsize + 1) * 3)) - 1
    let left = 0
    
    let ptrs_html = ""
    let cells_html = ""
    let chars_html = ""
    for (let i = 0; i < length; i++){
        ptrs_html  += `<td id="ptr${i}">${i}</td>`
        cells_html += `<td id="cell${i}">0</td>`
        chars_html += `<td id="char${i}">0</td>`
    }
    document.getElementById("ptrs").innerHTML = ptrs_html
    document.getElementById("cells").innerHTML = cells_html
    document.getElementById("chars").innerHTML = chars_html

    const func = () => {
      for (let i=0; i<(speed == 0 ? 1000 : 1); i++) bfi.step()
      before.textContent = bfi.code.slice(0, bfi.pc)
      active.textContent = bfi.code.at(bfi.pc) || "\u00A0"
      after.textContent  = bfi.code.slice(bfi.pc + 1)
      const ptr = bfi.ptr;
      if (ptr < left) {
        left = ptr - parseInt(length * 2 / 3)
      } else if (left + length <= ptr) {
        left = ptr - parseInt(length / 3)
      }
      for (let i = 0; i < length; i++) {
        const value = bfi.get(left + i)
        document.getElementById(`ptr${i}`).textContent = left + i
        document.getElementById(`cell${i}`).textContent = value
        document.getElementById(`char${i}`).textContent = "\u00A0"
        if (32 < value && value < 127) {
          document.getElementById(`char${i}`).textContent = String.fromCharCode(value)
        }
        if (left + i == ptr) {
          document.getElementById(`ptr${i}`).className = "active"
          document.getElementById(`cell${i}`).className = "active"
          document.getElementById(`char${i}`).className = "active"
        } else {
          document.getElementById(`ptr${i}`).className = ""
          document.getElementById(`cell${i}`).className = ""
          document.getElementById(`char${i}`).className = ""
        }
      }
      if (bfi.code.length <= bfi.pc) stop()
      if (running) window.setTimeout(func, speed || 1)
    }
    func()
  }

  function stop() {
    document.getElementById("run").textContent = "▶実行"
    running = false
  }

  autosize(document.querySelectorAll("textarea"))
})
