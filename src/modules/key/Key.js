export default class Key {
  constructor(key, object) {
    this.keyObject = object[key];
    this.value = this.keyObject.activeValue;
    this.addition = this.keyObject.addition;
    this.shortcut = this.keyObject.shortcut;
    this.classList = Key.makeClassList(this.value);
    this.key = key;
  }

  static makeClassList(value) {
    let classList = "key";
    if (value.length > 1) {
      classList += ` key_special key_${value.toLowerCase()}`;
    } else {
      classList += /^[a-zа-яё]$/i.test(value) ? " key_letters" : " key_digits";
    }

    return classList;
  }

  static escapeHTML(value) {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  }

  makeKeyHTML() {
    const pressed = ["Shift", "CapsLock"].includes(this.value) ? ' aria-pressed="false"' : "";
    return `<button type="button" data-code="${this.key}" class="${this.classList}" aria-label="${Key.escapeHTML(this.value)}"${pressed}>
      <span class="key-main-value">${Key.escapeHTML(this.shortcut || this.value)}</span
      >${this.addition ? `<span class="key-addition-value">${Key.escapeHTML(this.addition)}</span>` : ""}
    </button>`;
  }
}
