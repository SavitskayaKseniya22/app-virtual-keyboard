import Key from "../key/Key.js";
import layout from "./layout.js";

export default class Keyboard {
  constructor() {
    const savedLang = window.localStorage.getItem("lang");
    this.lang = savedLang === "RU" ? "RU" : "ENG";
    this.keyCodes = layout.codes;
    this.keyDescriptions = layout.merge(this.lang);
    this.isShiftActive = false;
    this.isCapsActive = false;
    this.physicalShiftDown = false;
  }

  makeKey(element, object) {
    const key = new Key(element, object);
    this.keyContent = key.makeKeyHTML();
    return this.keyContent;
  }

  makeKeyArray(array, object) {
    this.keyboardContent = [];
    array.forEach((element) => {
      this.keyboardContent.push(this.makeKey(element, object));
    });

    return this.keyboardContent.join("");
  }

  makeKeyboardHTML() {
    return `
    <div class="keyboard-container">
    <div class="textarea-container">
    <textarea id="text" name="text" class="keyboard-textarea" placeholder="Type something..." aria-label="Text input" cols="60"></textarea>
    </div>
    
      <ul class="keyboard">
        <li class="keyboard-row">
        ${this.makeKeyArray(this.keyCodes.slice(0, 14), this.keyDescriptions)}</li>
        <li class="keyboard-row">
        ${this.makeKeyArray(this.keyCodes.slice(14, 29).reverse(), this.keyDescriptions)}</li>
        <li class="keyboard-row">
        ${this.makeKeyArray(this.keyCodes.slice(29, 42), this.keyDescriptions)}</li>
        <li class="keyboard-row">
        ${this.makeKeyArray(this.keyCodes.slice(42, 54).reverse(), this.keyDescriptions)}</li>
        <li class="keyboard-row">
        ${this.makeKeyArray(this.keyCodes.slice(54, this.keyCodes.length), this.keyDescriptions)}</li>
      </ul>
    </div>
    <p class="keyboard-addition">
   <b><span class="keyboard-addition__lang">${this.lang}</span></b>
    <br> Press Shift and then Ctrl to change language</p>`;
  }

  applySpecialBehaviour(keyName, code) {
    Keyboard.toggleSpecialButton(keyName);
    this.makeSpecialAction(keyName, code);
  }

  makeSpecialAction(keyName, code) {
    if (keyName === "Shift") {
      this.isShiftActive = !this.isShiftActive;
      this.updateDigitsKeyboardLayout();
      this.updateCaseKeyboardLayout(this.isShiftActive !== this.isCapsActive);
    } else if (keyName === "CapsLock") {
      this.isCapsActive = !this.isCapsActive;
      this.updateCaseKeyboardLayout(this.isShiftActive !== this.isCapsActive);
    } else if (keyName === "Control" && this.isShiftActive) {
      this.applySpecialBehaviour("Shift", code);
      this.switchLang();
      this.updateCaseKeyboardLayout(this.isShiftActive !== this.isCapsActive);
    } else {
      this.changeTextarea(keyName, code);
    }
    return keyName;
  }

  static toggleSpecialButton(keyName) {
    const keys = document.querySelectorAll(`.key_${keyName.toLowerCase()}`);
    keys.forEach((element) => {
      element.classList.toggle("active");

      if (keyName === "Shift" || keyName === "CapsLock") {
        return;
      }

      setTimeout(() => {
        element.classList.toggle("active");
      }, 300);
    });
  }

  updateCaseKeyboardLayout(triggerCase) {
    const letters = document.querySelectorAll(".key_letters");
    letters.forEach((elem) => {
      const code = elem.getAttribute("data-code");
      const { activeValue } = this.keyDescriptions[code];
      const changedValue = triggerCase ? activeValue.toUpperCase() : activeValue.toLowerCase();
      const elemToChange = elem.querySelector(".key-main-value");
      elemToChange.innerText = changedValue;
      this.keyDescriptions[code].activeValue = changedValue;
    });
  }

  updateDigitsKeyboardLayout() {
    const digits = document.querySelectorAll(".key_digits");
    digits.forEach((elem) => {
      const code = elem.getAttribute("data-code");
      if (!(code === "Backquote" && this.lang === "RU")) {
        const mainElemToChange = elem.querySelector(".key-main-value");
        const addElemToChange = elem.querySelector(".key-addition-value");
        const { addition, activeValue, ru, eng } = this.keyDescriptions[code];

        if (addition !== activeValue) {
          this.keyDescriptions[code].activeValue = addition;
        } else {
          this.keyDescriptions[code].activeValue = this.lang === "RU" ? ru : eng;
        }

        mainElemToChange.innerText = this.keyDescriptions[code].activeValue;
        addElemToChange.innerText = activeValue;
      }
    });
  }

  updateLangKeyboardLayout() {
    const letters = document.querySelectorAll(".key_letters");
    letters.forEach((elem) => {
      const code = elem.getAttribute("data-code");
      const elemToChange = elem.querySelector(".key-main-value");
      const changedValue = this.lang === "ENG" ? this.keyDescriptions[code].ru : this.keyDescriptions[code].eng;
      elemToChange.innerText = changedValue;
      this.keyDescriptions[code].activeValue = changedValue;
    });
  }

  switchLang() {
    this.updateLangKeyboardLayout();
    this.lang = this.lang === "ENG" ? "RU" : "ENG";
    Keyboard.saveLang(this.lang);
  }

  static saveLang(langValue) {
    window.localStorage.setItem("lang", langValue);
    document.querySelector(".keyboard-addition__lang").innerText = langValue;
  }

  static toggleKeyAnimation(node) {
    node.classList.add("pressed");

    setTimeout(() => {
      node.classList.remove("pressed");
    }, 300);
  }

  checkValueToConcat(keyName, code) {
    const { value, activeValue } = this.keyDescriptions[code];
    return value !== undefined ? value : activeValue;
  }

  static checkPositionToConcat(keyName, textArea) {
    let [start, end] = [textArea.selectionStart, textArea.selectionEnd];
    const textLength = textArea.value.length;
    const upValue =
      textArea.selectionEnd - Number(textArea.getAttribute("cols")) < 0
        ? 0
        : textArea.selectionEnd - Number(textArea.getAttribute("cols"));
    const positions = {
      Delete: [start, start === end ? Math.min(end + 1, textLength) : end],
      Backspace: [start === end ? Math.max(start - 1, 0) : start, end],
      ArrowLeft: [start === end ? Math.max(start - 1, 0) : start, start === end ? Math.max(end - 1, 0) : start],
      ArrowUp: [upValue, upValue],
      ArrowDown: [
        Math.min(Number(textArea.getAttribute("cols")) + end, textLength),
        Math.min(Number(textArea.getAttribute("cols")) + end, textLength),
      ],
      ArrowRight: [start === end ? Math.min(start + 1, textLength) : end, start === end ? Math.min(end + 1, textLength) : end],
    };

    if (positions[keyName]) {
      if (
        (keyName === "Backspace" || keyName === "ArrowLeft" || keyName === "ArrowUp") &&
        start === 0 && end === 0
      ) {
        return [start, end];
      }
      [start, end] = positions[keyName];
    }

    return [start, end];
  }

  changeTextarea(keyName, code) {
    const textArea = document.getElementById("text");
    textArea.focus();
    const valueToConcat = this.checkValueToConcat(keyName, code);
    const [start, end] = Keyboard.checkPositionToConcat(keyName, textArea);
    textArea.setRangeText(valueToConcat, start, end, "end");
    textArea.scrollTop = textArea.scrollHeight;
  }

  addListener() {
    document.addEventListener("keydown", (event) => {
      if (!this.keyDescriptions[event.code]) {
        return;
      }

      // Keep Tab available for keyboard navigation; the on-screen Tab key still inserts a tab.
      if (event.code === "Tab") {
        return;
      }

      if (event.code.startsWith("Control") && event.shiftKey && this.isShiftActive) {
        event.preventDefault();
        this.applySpecialBehaviour("Control", event.code);
        return;
      }

      // Keep browser and operating system shortcuts such as copy and paste available.
      if (event.ctrlKey || event.metaKey) {
        return;
      }

      const key = this.keyDescriptions[event.code].activeValue;
      const target = document.querySelector(`[data-code="${event.code}"]`);
      if (!target) {
        return;
      }

      if (event.repeat && (key === "Shift" || key === "CapsLock")) {
        return;
      }

      event.preventDefault();
      if (key === "Shift") {
        this.physicalShiftDown = true;
      }
      if (target.classList.contains("key_special")) {
        this.applySpecialBehaviour(key, event.code);
      } else {
        this.changeTextarea(key, event.code);
        if (this.isShiftActive) {
          this.applySpecialBehaviour("Shift", event.code);
        }
      }

      Keyboard.toggleKeyAnimation(target);
    });

    document.addEventListener("keyup", (event) => {
      if (event.code.startsWith("Shift") && this.physicalShiftDown) {
        this.physicalShiftDown = false;
        if (this.isShiftActive) {
          this.applySpecialBehaviour("Shift", event.code);
        }
      }
    });

    document.addEventListener("click", (event) => {
      const target = event.target.closest(".key");
      if (target) {
        const code = target.getAttribute("data-code");
        const key = this.keyDescriptions[code].activeValue;
        if (target.classList.contains("key_special")) {
          this.applySpecialBehaviour(key, code);
        } else {
          this.changeTextarea(key, code);
          if (this.isShiftActive) {
            this.applySpecialBehaviour("Shift", code);
          }
        }
        Keyboard.toggleKeyAnimation(target);
      }
    });
  }
}
