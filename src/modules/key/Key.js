export default class Key {
  constructor(key, object) {
    this.keyObject = object[key];
    this.value = this.keyObject.activeValue;
    this.addition = this.keyObject.addition;
    this.shortcut = this.keyObject.shortcut;
    this.classList = Key.makeClassList(this.value, key);
    this.key = key;
  }

  static makeClassList(value, key) {
    let classList = "key";
    if (value.length > 1) {
      classList += ` key_special key_${value.toLowerCase()}`;
    } else {
      classList += /^[0-9-=\\]$/.test(value) ? " key_digits" : " key_letters";
    }

    classList += key === "Backquote" ? " key_digits" : "";
    return classList;
  }

  makeKeyHTML() {
    return `<button type="button" data-code="${this.key}" class="${this.classList}" aria-label="${this.value}">
      <span class="key-main-value">${this.shortcut || this.value}</span
      >${this.addition ? `<span class="key-addition-value">${this.addition}</span>` : ""}
    </button>`;
  }
}
