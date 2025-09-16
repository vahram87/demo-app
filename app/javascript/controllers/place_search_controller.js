// app/javascript/controllers/place_search_controller.js
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

  // bound in HTML: input->place-search#debouncedInput
  debouncedInput() { this._debounced() }

  // bound in HTML: keydown->place-search#onKeydown
  onKeydown(e) {
    if (!["ArrowDown","ArrowUp","Enter"].includes(e.key)) return
    const items = Array.from(this.resultsTarget.querySelectorAll("a[data-kind='place']"))
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

    let places = []
    try {
      const res = await fetch(url, { headers: { "Accept": "application/json" } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      places = await res.json()
    } catch (err) {
      console.error("[place-search] fetch error:", err)
      places = []
    }

    this.resultsTarget.innerHTML = ""
    this.previewsTarget.innerHTML = ""

    if (!Array.isArray(places) || places.length === 0) {
      this._hide(this.defaultsTarget, this.resultsTarget, this.previewsTarget)
      this._show(this.noResultsTarget)
      return
    }

    // Build the list group
    const group = document.createElement("el-command-group")
    group.className = "sm:h-96"

    // Optional section header
    const header = document.createElement("h2")
    header.className = "mx-2 mb-2 mt-3 text-xs font-semibold text-gray-500"
    header.textContent = "Places"
    group.appendChild(header)

    places.forEach((p, i) => {
      const place = this._normalizePlace(p)
      const id = `place-${place.id ?? i}`

      // List item
      const a = document.createElement("a")
      a.id = id
      a.href = place.href || "#"
      a.dataset.kind = "place"
      a.className = "group cursor-default select-none items-center rounded-md p-2 focus:outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 [&:not([hidden])]:flex"
      a.innerHTML = `
        <img src="${place.image_url || this._placeholder()}" alt=""
             class="size-6 flex-none rounded-full bg-gray-100 outline outline-1 -outline-offset-1 outline-black/5" />
        <span class="ml-3 flex-auto truncate">${this._escape(place.title)}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
             class="ml-3 hidden size-5 flex-none text-gray-400 group-aria-selected:block">
          <path d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
        </svg>
      `
      a.addEventListener("mouseenter", () => this._select(a))
      a.addEventListener("focus",     () => this._select(a))
      group.appendChild(a)

      // Preview
      const preview = document.createElement("el-command-preview")
      preview.setAttribute("for", id)
      preview.hidden = true
      preview.className = "h-96 w-1/2 flex-none flex-col divide-y divide-gray-100 overflow-y-auto sm:[&:not([hidden])]:flex"
      preview.innerHTML = `
        <div class="flex-none p-6 text-center">
          <img src="${place.image_url || this._placeholder()}" alt=""
               class="mx-auto size-16 rounded-full bg-gray-100 outline outline-1 -outline-offset-1 outline-black/5" />
          <h2 class="mt-3 font-semibold text-gray-900">${this._escape(place.title)}</h2>
          <p class="text-sm/6 text-gray-500">${this._escape(place.category || "")}</p>
        </div>
        <div class="flex flex-auto flex-col justify-between p-6">
          <dl class="grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-gray-700">
            ${place.rating ? `<dt class="col-end-1 font-semibold text-gray-900">Rating</dt><dd>${this._escape(place.rating)}${place.user_ratings_total ? ` (${this._escape(place.user_ratings_total)} reviews)` : ""}</dd>` : ""}
            ${place.phone ? `<dt class="col-end-1 font-semibold text-gray-900">Phone</dt><dd>${this._escape(place.phone)}</dd>` : ""}
            ${place.address ? `<dt class="col-end-1 font-semibold text-gray-900">Address</dt><dd>${this._escape(place.address)}</dd>` : ""}
            <dt class="col-end-1 font-semibold text-gray-900">Website</dt>
            <dd class="truncate">${place.href ? `<a href="${place.href}" class="text-indigo-600 underline">${this._escape(place.href)}</a>` : "—"}</dd>
          </dl>
          <a href="${place.href || "#"}"
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

    // Auto-select the first item so a preview is visible
    const first = group.querySelector("a[data-kind='place']")
    if (first) this._select(first)
  }

  // --- helpers ---------------------------------------------------------------

  _normalizePlace(raw) {
    // Expecting your /places/search.json to already map Google fields to these keys:
    // { id, title, address, href, image_url, phone, rating, user_ratings_total, category }
    // But we also handle common Google field names defensively.
    const title = raw.title || raw.displayName?.text || raw.name || ""
    const address = raw.address || raw.formatted_address || raw.formattedAddress || raw.shortFormattedAddress || ""
    const href = raw.href || raw.websiteUri || raw.website_url || raw.url || null
    const image_url = raw.image_url || raw.photo_url || raw.photoUrl || null
    const phone = raw.phone || raw.international_phone_number || raw.internationalPhoneNumber || raw.primaryPhone || null
    const rating = raw.rating || raw.googleRating || null
    const user_ratings_total = raw.user_ratings_total || raw.userRatingsTotal || null
    const category = raw.category || raw.primaryTypeDisplayName?.text || raw.primaryType || null

    return {
      id: raw.id || raw.place_id || raw.idToken || null,
      title,
      address,
      href,
      image_url,
      phone,
      rating,
      user_ratings_total,
      category
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

  _placeholder() {
    // 1x1 transparent gif so broken images don't show an icon
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
  }

  _escape(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  }
}
