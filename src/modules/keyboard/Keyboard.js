import Key from "../key/Key.js";
import layout from "./layout.js";

export default class Keyboard {
  constructor() {
    let savedLang;
    try {
      savedLang = window.localStorage.getItem("lang");
    } catch {
      // The keyboard remains usable when browser storage is unavailable.
    }
    this.lang = savedLang === "RU" ? "RU" : "ENG";
    this.keyCodes = layout.codes;
    this.keyDescriptions = layout.merge(this.lang);
    this.virtualShift = false;
    this.physicalShifts = new Set();
    this.isCapsActive = false;
  }

  get isShiftActive() {
    return this.virtualShift || this.physicalShifts.size > 0;
  }

  makeKeyArray(codes) {
    return codes.map((code) => new Key(code, this.keyDescriptions).makeKeyHTML()).join("");
  }

  makeKeyboardHTML() {
    return `
    <main class="keyboard-container">
      <div class="textarea-container">
        <textarea id="text" name="text" class="keyboard-textarea" placeholder="Type something..." aria-label="Text input" cols="60"></textarea>
      </div>
      <ul class="keyboard">
        <li class="keyboard-row">${this.makeKeyArray(this.keyCodes.slice(0, 14))}</li>
        <li class="keyboard-row">${this.makeKeyArray(this.keyCodes.slice(14, 29).reverse())}</li>
        <li class="keyboard-row">${this.makeKeyArray(this.keyCodes.slice(29, 42))}</li>
        <li class="keyboard-row">${this.makeKeyArray(this.keyCodes.slice(42, 54).reverse())}</li>
        <li class="keyboard-row">${this.makeKeyArray(this.keyCodes.slice(54))}</li>
      </ul>
    </main>
    <p class="keyboard-addition">
      <b><span class="keyboard-addition__lang" aria-live="polite">${this.lang}</span></b>
      <br>Press Ctrl + Shift to change language. On screen: Shift, then Ctrl.
    </p>`;
  }

  updateLayout() {
    const descriptions = layout.merge(this.lang);
    for (const [code, description] of Object.entries(descriptions)) {
      const base = description.activeValue;
      if (/^[a-zа-яё]$/i.test(base)) {
        description.activeValue = this.isShiftActive !== this.isCapsActive ? base.toUpperCase() : base;
      } else if (this.isShiftActive && description.addition) {
        description.activeValue = description.addition;
      }

      const node = document.querySelector(`[data-code="${code}"]`);
      if (!node) continue;
      node.className = Key.makeClassList(base);
      node.querySelector(".key-main-value").textContent = description.shortcut || description.activeValue;
      node.setAttribute("aria-label", description.activeValue);
      const addition = node.querySelector(".key-addition-value");
      if (addition) addition.remove();
      if (description.addition) {
        const hint = document.createElement("span");
        hint.className = "key-addition-value";
        hint.textContent = this.isShiftActive ? base : description.addition;
        node.append(hint);
      }
      if (base === "Shift" || base === "CapsLock") {
        const active = base === "Shift" ? this.isShiftActive : this.isCapsActive;
        node.classList.toggle("active", active);
        node.setAttribute("aria-pressed", String(active));
      }
    }
    this.keyDescriptions = descriptions;
  }

  switchLang() {
    this.lang = this.lang === "ENG" ? "RU" : "ENG";
    try {
      window.localStorage.setItem("lang", this.lang);
    } catch {
      // Language switching does not depend on persistence.
    }
    document.querySelector(".keyboard-addition__lang").textContent = this.lang;
    this.updateLayout();
  }

  static toggleKeyAnimation(node) {
    node.classList.add("pressed");
    setTimeout(() => node.classList.remove("pressed"), 300);
  }

  static checkPositionToConcat(keyName, textArea) {
    const { selectionStart: start, selectionEnd: end, value } = textArea;
    const length = value.length;
    switch (keyName) {
      case "Delete":
        return [start, start === end ? Math.min(end + 1, length) : end];
      case "Backspace":
        return [start === end ? Math.max(start - 1, 0) : start, end];
      case "ArrowLeft": {
        const position = start === end ? Math.max(start - 1, 0) : start;
        return [position, position];
      }
      case "ArrowRight": {
        const position = start === end ? Math.min(end + 1, length) : end;
        return [position, position];
      }
      case "ArrowUp":
      case "ArrowDown": {
        const position = keyName === "ArrowUp" ? start : end;
        const lineStart = value.slice(0, position).lastIndexOf("\n") + 1;
        const column = position - lineStart;
        const lineEnd = value.indexOf("\n", position);
        let nextPosition;
        if (keyName === "ArrowUp") {
          const previousStart = value.slice(0, Math.max(lineStart - 1, 0)).lastIndexOf("\n") + 1;
          nextPosition = lineStart > 0 ? previousStart + Math.min(column, lineStart - previousStart - 1) : 0;
        } else {
          const nextStart = lineEnd < 0 ? length : lineEnd + 1;
          const nextEnd = value.indexOf("\n", nextStart);
          nextPosition = nextStart + Math.min(column, (nextEnd < 0 ? length : nextEnd) - nextStart);
        }
        return [nextPosition, nextPosition];
      }
      default:
        return [start, end];
    }
  }

  changeTextarea(keyName, code) {
    if (keyName === "Control" || keyName === "Alt") return;
    const textArea = document.getElementById("text");
    textArea.focus();
    const [start, end] = Keyboard.checkPositionToConcat(keyName, textArea);
    if (keyName.startsWith("Arrow")) {
      textArea.setSelectionRange(start, end);
      return;
    }
    const description = this.keyDescriptions[code];
    textArea.setRangeText(description.value ?? description.activeValue, start, end, "end");
    textArea.dispatchEvent(new Event("input", { bubbles: true }));
    textArea.scrollTop = textArea.scrollHeight;
  }

  activateKey(code) {
    const key = this.keyDescriptions[code].activeValue;
    if (key === "Shift") {
      this.virtualShift = !this.virtualShift;
      this.updateLayout();
    } else if (key === "CapsLock") {
      this.isCapsActive = !this.isCapsActive;
      this.updateLayout();
    } else if (key === "Control" && this.isShiftActive) {
      this.virtualShift = false;
      this.switchLang();
    } else {
      this.changeTextarea(key, code);
      if (key.length === 1 && this.virtualShift) {
        this.virtualShift = false;
        this.updateLayout();
      }
    }
    Keyboard.toggleKeyAnimation(document.querySelector(`[data-code="${code}"]`));
  }

  addListener() {
    document.addEventListener("keydown", (event) => {
      if (event.isComposing || !this.keyDescriptions[event.code]) return;
      if (event.code === "Tab") return;

      const isShift = event.code.startsWith("Shift");
      const isControl = event.code.startsWith("Control");
      if (isShift) {
        this.physicalShifts.add(event.code);
        this.updateLayout();
      }
      if ((isShift && event.ctrlKey) || (isControl && event.shiftKey)) {
        event.preventDefault();
        if (!event.repeat) this.switchLang();
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isShift) {
        event.preventDefault();
        return;
      }

      // Let the browser handle button activation and native caret navigation.
      if (event.target.closest?.(".key") && (event.code === "Enter" || event.code === "Space")) return;
      if (event.target.id === "text" && event.code.startsWith("Arrow")) return;
      if (event.repeat && event.code === "CapsLock") return;
      event.preventDefault();
      this.activateKey(event.code);
    });

    document.addEventListener("keyup", (event) => {
      if (this.physicalShifts.delete(event.code)) this.updateLayout();
    });

    window.addEventListener("blur", () => {
      this.physicalShifts.clear();
      this.updateLayout();
    });

    // Keep the caret and selection when clicking a virtual key.
    document.addEventListener("mousedown", (event) => {
      if (event.button === 0 && event.target.closest(".key")) event.preventDefault();
    });

    document.addEventListener("click", (event) => {
      const target = event.target.closest(".key");
      if (target) this.activateKey(target.dataset.code);
    });
  }
}
