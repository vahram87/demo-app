// import { Controller } from "@hotwired/stimulus"

// export default class extends Controller {
//   static targets = ["input", "list", "empty", "template"]
//   static values = {
//     resources: String,   // JSON: [{name,url}]
//     prefetch: { type: Boolean, default: true }
//   }

//   connect() {
//     // Parse resources (default to Posts if none provided)
//     this.resources = this._parseResources(this.resourcesValue) || [
//       { name: "Posts", url: "/search/posts" },
//     ]

//     // Try to disable built-in client filtering so the palette doesn't re-filter remote results
//     this.element.setFilterCallback?.(() => true)

//     // references
//     this.dialog = this.element.closest("dialog") || document.getElementById("dialog")

//     // debounce + cancellation
//     this._run = this._debounce((q) => this._searchAll(q), 180)
//     this._aborter = null

//     // events
//     this.inputTarget.addEventListener("input", (e) => this._run(e.target.value))
//     this.dialog?.addEventListener("close", () => this._reset())

//     // Preload default results so palette isn't empty on open
//     if (this.prefetchValue) this._searchAll("")
//   }

//   disconnect() {
//     // nothing to tear down (abort happens per request)
//   }

//   // ————— helpers —————
//   _parseResources(str) {
//     if (!str) return null
//     try { return JSON.parse(str) } catch { return null }
//   }

//   _debounce(fn, ms = 150) {
//     let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
//   }

//   _reset() {
//     if (this.inputTarget) this.inputTarget.value = ""
//     this.listTarget.replaceChildren()
//     this.emptyTarget.hidden = true
//   }

//   _setLoading() {
//     this.listTarget.replaceChildren()
//     this.emptyTarget.hidden = true
//     for (let i = 0; i < 3; i++) {
//       const sh = document.createElement("div")
//       sh.className = "px-4 py-2 animate-pulse"
//       sh.innerHTML = `
//         <div class="h-4 w-40 rounded bg-gray-100 mb-1"></div>
//         <div class="h-3 w-56 rounded bg-gray-50"></div>`
//       this.listTarget.appendChild(sh)
//     }
//   }

//   async _searchAll(q) {
//     // cancel previous
//     this._aborter?.abort?.()
//     this._aborter = new AbortController()
//     const { signal } = this._aborter

//     this._setLoading()

//     // run all resources concurrently
//     const results = await Promise.allSettled(
//       this.resources.map(async (res) => {
//         const url = `${res.url}?q=${encodeURIComponent(q || "")}`
//         const r = await fetch(url, { headers: { Accept: "application/json" }, signal })
//         const data = await r.json()
//         // normalize items; each backend can return {id,title,subtitle?,url?}
//         const items = (data || []).map((item) => ({
//           title: item.title || item.name || "Untitled",
//           subtitle: item.subtitle || item.email || "",
//           url: item.url || (item.id ? this._guessUrl(res.url, item.id) : "#"),
//         }))
//         return { name: res.name, items }
//       })
//     )

//     if (signal.aborted) return

//     const groups = results
//       .filter((r) => r.status === "fulfilled")
//       .map((r) => r.value)

//     this._renderGroups(groups)
//   }

//   _guessUrl(baseUrl, id) {
//     // crude guess for REST show path based on /search/<resource>
//     // e.g. /search/posts -> /posts/:id
//     const m = baseUrl.match(/^\/search\/([^/?#]+)/)
//     return m ? `/${m[1]}/${id}` : "#"
//   }

//   _renderGroups(groups) {
//     this.listTarget.replaceChildren()
//     let total = 0

//     groups.forEach(({ name, items }) => {
//       if (!items || !items.length) return
//       total += items.length

//       // Group header (non-focusable)
//       const header = document.createElement("div")
//       header.className = "px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500"
//       header.textContent = name
//       this.listTarget.appendChild(header)

//       // Items using your anchor template (keeps keyboard nav via <el-command-palette>)
//       items.forEach(({ title, subtitle, url }) => {
//         const node = this.templateTarget.content.firstElementChild.cloneNode(true)
//         node.href = url || "#"
//         const t = node.querySelector("[data-title]")
//         if (t) t.textContent = subtitle ? `${title} — ${subtitle}` : title
//         node.addEventListener("click", () => this.dialog?.close?.())
//         this.listTarget.appendChild(node)
//       })
//     })

//     const has = total > 0
//     this.emptyTarget.hidden = has
//     if (!has) this.listTarget.replaceChildren()
//   }
// }

// import { Controller } from "@hotwired/stimulus";
// import algoliasearch from "algoliasearch/lite"; // v4 default import

// export default class extends Controller {
//   static targets = ["input", "list", "empty", "template"];
//   static values  = { prefetch: { type: Boolean, default: true } };

//   connect() {
//     this.appId   = window.algolia_app_id;
//     this.apiKey  = window.algolia_search_api_key;
//     this.postsIx = window.post_index_name;
//     this.leadsIx = window.lead_index_name;

//     if (!this.appId || !this.apiKey || !this.postsIx || !this.leadsIx) {
//       console.error("[GlobalSearch] Missing Algolia config or index names");
//       return;
//     }

//     this.client = algoliasearch(this.appId, this.apiKey);

//     this.groups = [
//       { label: "Posts", index: this.postsIx, titleAttr: "title", snippet: "content", href: (id) => `/posts/${id}` },
//       { label: "Leads", index: this.leadsIx, titleAttr: "name",  snippet: "email",   href: (id) => `/leads/${id}` },
//     ];

//     this.element.setFilterCallback?.(() => true);

//     this._debounced = this._debounce((q) => this._searchAll(q), 160);
//     this.inputTarget.addEventListener("input", (e) => this._debounced(e.target.value));

//     if (this.prefetchValue) this._searchAll("");
//   }

//   _debounce(fn, ms = 150) { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

//   _setLoading() {
//     this.listTarget.replaceChildren();
//     this.emptyTarget.hidden = true;
//     for (let i = 0; i < 3; i++) {
//       const sh = document.createElement("div");
//       sh.className = "px-4 py-2 animate-pulse";
//       sh.innerHTML = `
//         <div class="h-4 w-40 rounded bg-gray-100 mb-1"></div>
//         <div class="h-3 w-56 rounded bg-gray-50"></div>`;
//       this.listTarget.appendChild(sh);
//     }
//   }

//   async _searchAll(query) {
//     this._setLoading();

//     const queries = this.groups.map((g) => ({
//       indexName: g.index,
//       query: query || "",
//       params: {
//         hitsPerPage: 6,
//         attributesToHighlight: ["*"],
//         attributesToSnippet: [`${g.snippet}:50`],
//         snippetEllipsisText: "…",
//       },
//     }));

//     try {
//       const res = await this.client.search(queries);
//       const grouped = this.groups.map((g, i) => ({ group: g, hits: res?.results?.[i]?.hits || [] }));
//       this._render(grouped);
//     } catch (err) {
//       console.error("[GlobalSearch] Algolia error:", err);
//       this.listTarget.replaceChildren();
//       this.emptyTarget.hidden = false;
//     }
//   }

//   _render(groupResults) {
//     this.listTarget.replaceChildren();
//     let total = 0;

//     groupResults.forEach(({ group, hits }) => {
//       if (!hits.length) return;
//       total += hits.length;

//       const header = document.createElement("div");
//       header.className = "px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500";
//       header.textContent = group.label;
//       this.listTarget.appendChild(header);

//       hits.forEach((hit) => {
//         const node = this.templateTarget.content.firstElementChild.cloneNode(true);
//         node.href = group.href(hit.objectID);

//         const titleEl = node.querySelector("[data-title]");
//         const subEl   = node.querySelector("[data-subtitle]");

//         const hl = hit._highlightResult || {};
//         const sn = hit._snippetResult || {};

//         const titleHtml = hl[group.titleAttr]?.value ?? (hit[group.titleAttr] || "Untitled");
//         const subHtml   = sn[group.snippet]?.value ?? hit[group.snippet] ?? hit.email ?? hit.phone ?? "";

//         titleEl.innerHTML = titleHtml;
//         subEl.innerHTML   = subHtml;

//         const dlg = this.element.closest("dialog") || document.getElementById("dialog");
//         node.addEventListener("click", () => dlg?.close?.());

//         this.listTarget.appendChild(node);
//       });
//     });

//     const hasAny = total > 0;
//     this.emptyTarget.hidden = hasAny;
//     if (!hasAny) this.listTarget.replaceChildren();
//   }
// }


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
