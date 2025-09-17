import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "results", "defaults", "noResults", "previews"]
  static values  = {
    endpoint: String,
    debounce: { type: Number, default: 200 },
    minChars: { type: Number, default: 1 },
    param:    { type: String, default: "q" }
  }

  connect() {
    this._debounced = this._debounce(this.search.bind(this), this.debounceValue)
  }

  debouncedInput() { this._debounced() }

  onKeydown(e) {
    if (!["ArrowDown","ArrowUp","Enter"].includes(e.key)) return
    const items = Array.from(this.resultsTarget.querySelectorAll("a[data-kind='user']"))
    if (!items.length) return
    const idx = items.findIndex(el => el.getAttribute("aria-selected") === "true")
    let next = idx

    if (e.key === "ArrowDown") next = Math.min(items.length - 1, idx + 1)
    if (e.key === "ArrowUp")   next = Math.max(0, (idx === -1 ? 0 : idx - 1))
    if (e.key === "Enter" && idx >= 0) { items[idx].click(); return }

    this._select(items[next] || items[0])
    e.preventDefault()
  }

  async search() {
    const q = this.inputTarget.value.trim()
    if (q.length < this.minCharsValue) {
      this._show(this.defaultsTarget)
      this._hide(this.resultsTarget, this.noResultsTarget, this.previewsTarget)
      this.resultsTarget.innerHTML = ""
      this.previewsTarget.innerHTML = ""
      return
    }

    const url = new URL(this.endpointValue, window.location.origin)
    url.searchParams.set(this.paramValue, q)

    const res = await fetch(url, { headers: { "Accept": "application/json" } })
    const users = await res.json()

    this.resultsTarget.innerHTML = ""
    this.previewsTarget.innerHTML = ""

    if (!users.length) {
      this._hide(this.defaultsTarget, this.resultsTarget, this.previewsTarget)
      this._show(this.noResultsTarget)
      return
    }

    const group = document.createElement("el-command-group")
    group.className = "sm:h-96"
    users.forEach((u, i) => {
      const id = `user-${u.id}`
      const a = document.createElement("a")
      a.id = id
      a.href = u.url || "#"
      a.dataset.kind = "user"
      a.className = "group cursor-default select-none items-center rounded-md p-2 focus:outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 [&:not([hidden])]:flex"
      a.innerHTML = `
        <img src="${u.image_url}" alt="" class="size-6 flex-none rounded-full bg-gray-100 outline outline-1 -outline-offset-1 outline-black/5" />
        <span class="ml-3 flex-auto truncate">${u.name}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="ml-3 hidden size-5 flex-none text-gray-400 group-aria-selected:block">
          <path d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
        </svg>
      `
      a.addEventListener("mouseenter", () => this._select(a))
      a.addEventListener("focus",     () => this._select(a))
      group.appendChild(a)

      const preview = document.createElement("el-command-preview")
      preview.setAttribute("for", id)
      preview.hidden = true
      preview.className = "h-96 w-full flex-none flex-col divide-y divide-gray-100 overflow-y-auto sm:[&:not([hidden])]:flex"
      preview.innerHTML = `
        <div class="flex-none p-6 text-center">
          <img src="${u.image_url}" alt="" class="mx-auto size-16 rounded-full bg-gray-100 outline outline-1 -outline-offset-1 outline-black/5" />
          <h2 class="mt-3 font-semibold text-gray-900">${u.name}</h2>
          <p class="text-sm/6 text-gray-500">${u.title || ""}</p>
        </div>
        <div class="flex flex-auto flex-col justify-between p-6">
          <dl class="grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-gray-700">
            <dt class="col-end-1 font-semibold text-gray-900">Phone</dt>
            <dd>${u.phone || "—"}</dd>
            <dt class="col-end-1 font-semibold text-gray-900">URL</dt>
            <dd class="truncate">${u.url ? `<a href="${u.url}" class="text-indigo-600 underline">${u.url}</a>` : "—"}</dd>
            <dt class="col-end-1 font-semibold text-gray-900">Email</dt>
            <dd class="truncate">${u.email ? `<a href="mailto:${u.email}" class="text-indigo-600 underline">${u.email}</a>` : "—"}</dd>
          </dl>
          <a href="${u.url || "#"}" class="mt-6 w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Open profile</a>
        </div>
      `
      this.previewsTarget.appendChild(preview)
    })

    this.resultsTarget.appendChild(group)

    this._hide(this.defaultsTarget, this.noResultsTarget)
    this._show(this.resultsTarget, this.previewsTarget)

    // select first item so a preview is visible
    const first = group.querySelector("a[data-kind='user']")
    if (first) this._select(first)
  }

  _select(el) {
    this.resultsTarget.querySelectorAll("a[aria-selected='true']").forEach(n => n.setAttribute("aria-selected","false"))
    this.previewsTarget.querySelectorAll("el-command-preview").forEach(p => p.hidden = true)

    // set selection + show preview
    el.setAttribute("aria-selected","true")
    const preview = this.previewsTarget.querySelector(`el-command-preview[for="${el.id}"]`)
    if (preview) preview.hidden = false
  }

  _show(...els){ els.forEach(el => el.hidden = false) }
  _hide(...els){ els.forEach(el => el.hidden = true) }

  _debounce(fn, wait){
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait) }
  }
}
