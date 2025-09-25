import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "results", "defaults", "noResults", "previews"]
  static values  = {
    endpoint: String,
    debounce: { type: Number, default: 200 },
    minChars: { type: Number, default: 3 },
    param:    { type: String,  default: "q" },
    mode:     { type: String,  default: "all" },
    type:     { type: String,  default: "normal" }
  }

  connect() {
    this._debounced = this._debounce(this.search.bind(this), this.debounceValue)
  }

  debouncedInput() { this._debounced() }

  onKeydown(e) {
    if (!["ArrowDown","ArrowUp","Enter"].includes(e.key)) return
    const items = Array.from(this.resultsTarget.querySelectorAll("a[data-kind='company']"))
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
    url.searchParams.set("type", this.typeValue)
    url.searchParams.set("mode", this.modeValue)
    url.searchParams.set(this.paramValue, q)

    let companies = []
    try {
      const res = await fetch(url, { headers: { "Accept": "application/json" } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      companies = await res.json()
    } catch (err) {
      console.error("[company-search] fetch error:", err)
      companies = []
    }

    this.resultsTarget.innerHTML = ""
    this.previewsTarget.innerHTML = ""

    if (!Array.isArray(companies) || companies.length === 0) {
      this._hide(this.defaultsTarget, this.resultsTarget, this.previewsTarget)
      this._show(this.noResultsTarget)
      return
    }

    const group = document.createElement("el-command-group")
    group.className = "sm:h-96"

    const header = document.createElement("h2")
    header.className = "mx-2 mb-2 mt-3 text-xs font-semibold text-gray-500"
    header.textContent = "Companies"
    group.appendChild(header)

    companies.forEach((raw, i) => {
      const c = this._normalizeCompany(raw)
      const safe = (c.id || c.title || "").toString().replace(/[^a-z0-9_-]/gi, "").slice(0, 24)
      const id   = `company-${i}-${safe || "row"}`

      const a = document.createElement("a")
      a.id = id
      a.href = c.href || "#"
      a.dataset.kind = "company"
      a.className = "group cursor-default select-none items-center rounded-md p-2 focus:outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 [&:not([hidden])]:flex"
      a.innerHTML = `
        <div class="flex size-6 items-center justify-center flex-none rounded-full bg-indigo-50 ring-1 ring-black/5 text-[11px] font-semibold">HR</div>
        <span class="ml-3 flex-auto truncate">
          ${this._escape(c.title)}
          ${c.register_number ? `<span class="ml-2 text-gray-500">(${this._escape(c.register_number)})</span>` : ""}
        </span>
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
             class="ml-3 hidden size-5 flex-none text-gray-400 group-aria-selected:block">
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
        <div class="flex-none p-6">
          <h2 class="font-semibold text-gray-900">${this._escape(c.title)}</h2>
          <p class="text-sm/6 text-gray-500">
            ${[c.register_court, c.state].filter(Boolean).map(this._escape).join(" • ")}
          </p>
        </div>
        <div class="flex flex-auto flex-col justify-between p-6">
          <dl class="grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-gray-700">
            ${c.register_number ? `<dt class="col-end-1 font-semibold text-gray-900">Register no.</dt><dd>${this._escape(c.register_number)}</dd>` : ""}
            ${c.status ? `<dt class="col-end-1 font-semibold text-gray-900">Status</dt><dd>${this._escape(c.status)}</dd>` : ""}
            ${c.register_court ? `<dt class="col-end-1 font-semibold text-gray-900">Court</dt><dd>${this._escape(c.register_court)}</dd>` : ""}
            ${c.state ? `<dt class="col-end-1 font-semibold text-gray-900">State</dt><dd>${this._escape(c.state)}</dd>` : ""}
            ${c.href ? `<dt class="col-end-1 font-semibold text-gray-900">Source</dt><dd class="truncate"><a class="text-indigo-600 underline" href="${c.href}">${this._escape(c.href)}</a></dd>` : ""}
          </dl>
          <a href="${c.href || "#"}"
             class="mt-6 w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Open
          </a>
        </div>
      `
      this.previewsTarget.appendChild(preview)
    })

    this.resultsTarget.appendChild(group)

    this._hide(this.defaultsTarget, this.noResultsTarget)
    this._show(this.resultsTarget, this.previewsTarget)

    const first = group.querySelector("a[data-kind='company']")
    if (first) this._select(first)
  }

  _normalizeCompany(raw) {
    return {
      id: raw.id || null,
      title: raw.name || "",
      register_court: raw.register_court || null,
      register_number: raw.register_number || null,
      state: raw.state || null,
      status: raw.status || null,
      href: raw.source_href || null
    }
  }

  _select(el) {
    this.resultsTarget.querySelectorAll("a[aria-selected='true']").forEach(n => n.setAttribute("aria-selected","false"))
    this.previewsTarget.querySelectorAll("el-command-preview").forEach(p => p.hidden = true)
    el.setAttribute("aria-selected","true")
    const preview = this.previewsTarget.querySelector(`el-command-preview[for="${el.id}"]`)
    if (preview) preview.hidden = false
  }

  _show(...els){ els.forEach(el => el.hidden = false) }
  _hide(...els){ els.forEach(el => el.hidden = true) }

  _debounce(fn, wait){
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait) }
  }

  _escape(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  }
}
