import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["dialog", "loadingTemplate", "content"]

  connect() {
    this.boundBeforeCache = this.beforeCache.bind(this)
    document.addEventListener("turbo:before-cache", this.boundBeforeCache)
  }

  disconnect() {
    document.removeEventListener("turbo:before-cache", this.boundBeforeCache)
  }

  open() {
    this.dialogTarget.classList.add("dialog")
    this.dialogTarget.classList.add("ease-out", "duration-300", "backdrop:ease-out", "backdrop:duration-300")
    this.dialogTarget.classList.add("translate-y-4", "sm:translate-y-0", "sm:scale-95")
    this.dialogTarget.classList.add("opacity-0", "backdrop:opacity-0")
    this.contentTarget.innerHTML = this.loadingTemplateTarget.innerHTML
    this.dialogTarget.showModal()
    setTimeout(() => {
      this.dialogTarget.classList.remove("opacity-0", "backdrop:opacity-0")
    }, 0)
  }

  openAsSlideOver({ params: { size = "sm" } }) {
    // For now we only support sm (default size) and xl (extra large)
    // sm:max-w-lg is applied by default, so we only have to prepend another class for xl to override the max width
    // How to use: <%= link_to ... , data: { turbo_frame: "dialog_content", action: "dialog#openAsSlideOver", dialog_size_param: "xl" }
    if (size == "xl") {
      this.dialogTarget.classList.add("sm:max-w-6xl")
    }
    this.dialogTarget.classList.add("slideover")
    this.dialogTarget.classList.add("translate-x-full", "backdrop:opacity-0")
    this.contentTarget.innerHTML = this.loadingTemplateTarget.innerHTML
    this.dialogTarget.showModal()
    setTimeout(() => {
      this.dialogTarget.classList.remove("translate-x-full", "backdrop:opacity-0")
    }, 0)
  }

  close() {
    if (this.dialogTarget.classList.contains("slideover")) {
      this.dialogTarget.classList.add("translate-x-full", "backdrop:opacity-0")
      setTimeout(() => {
        this.dialogTarget.close()
        this.dialogTarget.classList.remove("slideover")
        this.dialogTarget.classList.remove("translate-x-full", "backdrop:opacity-0")
      }, 500)
    } else {
      this.dialogTarget.classList.remove("ease-out", "duration-300", "backdrop:ease-out", "backdrop:duration-300")
      this.dialogTarget.classList.add("ease-in", "duration-200", "backdrop:ease-in", "backdrop:duration-200")
      this.dialogTarget.classList.add("opacity-0", "backdrop:opacity-0")
      setTimeout(() => {
        this.dialogTarget.close()
        this.dialogTarget.classList.remove("dialog")
        this.dialogTarget.classList.remove("opacity-0", "backdrop:opacity-0")
        this.dialogTarget.classList.remove("ease-in", "duration-200", "backdrop:ease-in", "backdrop:duration-200")
        this.dialogTarget.classList.remove("translate-y-4", "sm:translate-y-0", "sm:scale-95")
      }, 200)
    }
  }

  backdropClick(event) {
    if (event.target.nodeName == "DIALOG") {
      this.close()
    }
  }

  beforeCache() {
    if (this.dialogTarget.open) {
      this.dialogTarget.close()
    }
  }
}
