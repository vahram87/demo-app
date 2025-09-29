// app/javascript/controllers/place_search_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "results", "defaults", "noResults", "previews"]
  static values  = {
    endpoint: String,
    debounce: { type: Number, default: 200 },
    minChars: { type: Number, default: 1 },
    param:    { type: String, default: "q" },
    formSelector: { type: String, default: "" },
    newUrl:   { type: String, default: "/google_places/new" }
  }

  connect() {
    this._debounced = this._debounce(this.search.bind(this), this.debounceValue)
    this._lastResults = []
  }

  debouncedInput() { this._debounced() }

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
      this._lastResults = []
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
    this._lastResults = []

    if (!Array.isArray(places) || places.length === 0) {
      this._hide(this.defaultsTarget, this.resultsTarget, this.previewsTarget)
      this._show(this.noResultsTarget)
      return
    }

    const group = document.createElement("el-command-group")
    group.className = "sm:h-96"

    const header = document.createElement("h2")
    header.className = "mx-2 mb-2 mt-3 text-xs font-semibold text-gray-500"
    header.textContent = "Places"
    group.appendChild(header)

    places.forEach((p, i) => {
      const place = this._normalizePlace(p)
      this._lastResults.push(place)
      const id = `place-${place.id ?? i}`

      const a = document.createElement("a")
      a.id = id
      a.href = "#"
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

      const preview = document.createElement("el-command-preview")
      preview.setAttribute("for", id)
      preview.hidden = true
      preview.className = "h-96 w-full flex-none flex-col divide-y divide-gray-100 overflow-y-auto sm:[&:not([hidden])]:flex"
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
            ${place.phone_international ? `<dt class="col-end-1 font-semibold text-gray-900">Phone</dt><dd>${this._escape(place.phone_international)}</dd>` : ""}
            ${place.address ? `<dt class="col-end-1 font-semibold text-gray-900">Address</dt><dd>${this._escape(place.address)}</dd>` : ""}
            <dt class="col-end-1 font-semibold text-gray-900">Website</dt>
            <dd class="truncate">${place.website_uri ? `<a href="${place.website_uri}" class="text-indigo-600 underline">${this._escape(place.website_uri)}</a>` : "—"}</dd>
          </dl>
          <button
             type="button"
             data-action="place-search#choose"
             data-index="${i}"
             class="mt-6 w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Use this place
          </button>
        </div>
      `
      this.previewsTarget.appendChild(preview)
    })

    this.resultsTarget.appendChild(group)

    this._hide(this.defaultsTarget, this.noResultsTarget)
    this._show(this.resultsTarget, this.previewsTarget)

    const first = group.querySelector("a[data-kind='place']")
    if (first) this._select(first)
  }

  choose(e) {
    const idx = parseInt(e.currentTarget.dataset.index, 10)
    const place = this._lastResults[idx]
    if (!place) return

    const form = this.formSelectorValue
      ? document.querySelector(this.formSelectorValue)
      : document.querySelector("form[action*='google_places']") || document.querySelector("form[id^='new_google_place']")

    // Helper that attempts both name and id selectors
    const findInput = (formEl, name) =>
      formEl.querySelector(`[name="google_place[${name}]"]`) ||
      formEl.querySelector(`#google_place_${name}`)

    if (form) {
      const setValue = (name, val) => {
        const el = findInput(form, name)
        if (!el || val == null) return
        if (el.type === "checkbox") el.checked = !!val
        else el.value = val
      }

      // Fill everything your strong params allow
      setValue("place_id", place.place_id)
      setValue("title", place.title)
      setValue("address", place.address)
      setValue("short_address", place.short_address)
      setValue("latitude", place.latitude)
      setValue("longitude", place.longitude)
      setValue("phone_international", place.phone_international)
      setValue("phone_national", place.phone_national)
      setValue("website_uri", place.website_uri)
      setValue("google_maps_uri", place.google_maps_uri)
      setValue("primary_type", place.primary_type)
      setValue("primary_type_display_name", place.primary_type_display_name)
      setValue("types", Array.isArray(place.types) ? place.types.join(", ") : (place.types || ""))
      setValue("rating", place.rating)
      setValue("user_ratings_total", place.user_ratings_total)
      setValue("price_level", place.price_level)
      setValue("icon_mask_base_uri", place.icon_mask_base_uri)
      setValue("icon_background_color", place.icon_background_color)
      setValue("plus_code_global", place.plus_code_global)
      setValue("plus_code_compound", place.plus_code_compound)
      setValue("open_now", !!place.open_now)
      setValue("photo_ref", place.photo_ref)
      setValue("data", place.data ? JSON.stringify(place.data) : "")

      const dlg = document.getElementById("places-dialog") || this.element.querySelector("dialog")
      if (dlg?.close) dlg.close()
      return
    }

    // Fallback: navigate with query params
    const params = new URLSearchParams()
    const set = (k, v) => v != null && params.set(`google_place[${k}]`, v)

    set("place_id", place.place_id)
    set("title", place.title)
    set("address", place.address)
    set("short_address", place.short_address)
    set("latitude", place.latitude)
    set("longitude", place.longitude)
    set("phone_international", place.phone_international)
    set("phone_national", place.phone_national)
    set("website_uri", place.website_uri)
    set("google_maps_uri", place.google_maps_uri)
    set("primary_type", place.primary_type)
    set("primary_type_display_name", place.primary_type_display_name)
    set("types", Array.isArray(place.types) ? place.types.join(", ") : (place.types || ""))
    set("rating", place.rating)
    set("user_ratings_total", place.user_ratings_total)
    set("price_level", place.price_level)
    set("icon_mask_base_uri", place.icon_mask_base_uri)
    set("icon_background_color", place.icon_background_color)
    set("plus_code_global", place.plus_code_global)
    set("plus_code_compound", place.plus_code_compound)
    set("open_now", place.open_now ? "1" : "")
    set("photo_ref", place.photo_ref)

    window.location.href = `${this.newUrlValue}?${params.toString()}`
  }

  _normalizePlace(raw) {
    const place_id = raw.place_id || raw.id || raw.idToken || raw.resourceName || null

    const title = raw.title || raw.displayName?.text || raw.name || ""

    const address =
      raw.address ||
      raw.formatted_address ||
      raw.formattedAddress ||
      raw.shortFormattedAddress ||
      raw.vicinity ||
      raw.vicinityDescription ||
      ""
    const short_address =
      raw.short_address ||
      raw.shortFormattedAddress ||
      raw.secondaryText ||
      null

    const latitude  =
      raw.latitude ??
      raw.location?.lat ??
      raw.location?.latitude ??
      raw.geometry?.location?.lat ??
      null

    const longitude =
      raw.longitude ??
      raw.location?.lng ??
      raw.location?.longitude ??
      raw.geometry?.location?.lng ??
      null

    const phone_international =
      raw.phone ||
      raw.international_phone_number ||
      raw.internationalPhoneNumber ||
      raw.primaryPhone ||
      raw.formattedPhoneNumber ||
      null

    const phone_national =
      raw.phone_national ||
      raw.national_phone_number ||
      raw.nationalPhoneNumber ||
      raw.secondaryPhoneNumber ||
      null

    const website_uri =
      raw.website_uri ||
      raw.href ||
      raw.websiteUri ||
      raw.website_url ||
      raw.url ||
      raw.website || null;

    const google_maps_uri =
      raw.googleMapsUri ||
      raw.google_maps_uri ||
      raw.mapsUri ||
      raw.mapsUrl ||
      null

    const primary_type_display_name =
      raw.primary_type_display_name ||
      raw.primaryTypeDisplayName?.text ||
      null
    const primary_type =
      raw.primary_type ||
      raw.primaryType ||
      (Array.isArray(raw.types) ? raw.types[0] : null) ||
      null
    const types = raw.types || raw.type || null

    const rating = raw.rating || raw.googleRating || null
    const user_ratings_total = raw.user_ratings_total || raw.userRatingsTotal || null
    const price_level = raw.price_level || raw.priceLevel || null

    const icon_mask_base_uri = raw.icon_mask_base_uri || raw.iconMaskBaseUri || raw.iconMaskBaseURI || null
    const icon_background_color = raw.icon_background_color || raw.iconBackgroundColor || null

    const plus_code_global =
      raw.plus_code_global ||
      raw.plus_code?.global_code ||
      raw.plusCode?.globalCode ||
      null
      
    const plus_code_compound =
      raw.plus_code_compound ||
      raw.plus_code?.compound_code ||
      raw.plusCode?.compoundCode ||
      null

    const open_now =
      raw.open_now ??
      raw.opening_hours?.open_now ??
      raw.currentOpeningHours?.openNow ??
      null

    const photo_ref =
      raw.photo_ref ||
      raw.photos?.[0]?.name ||
      raw.photos?.[0]?.photo_reference ||
      null

    const image_url = raw.image_url || raw.photo_url || raw.photoUrl || null

    return {
      place_id,
      title,
      address,
      short_address,
      latitude,
      longitude,
      phone_international,
      phone_national,
      website_uri,
      google_maps_uri,
      primary_type,
      primary_type_display_name,
      types,
      rating,
      user_ratings_total,
      price_level,
      icon_mask_base_uri,
      icon_background_color,
      plus_code_global,
      plus_code_compound,
      open_now,
      photo_ref,
      image_url,
      data: raw
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
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
  }

  _escape(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  }
}
