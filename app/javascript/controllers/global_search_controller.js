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

import { Controller } from "@hotwired/stimulus";
import algoliasearch from "algoliasearch/lite"; // v4 default import

export default class extends Controller {
  static targets = ["input", "list", "empty", "template"];
  static values  = { prefetch: { type: Boolean, default: true } };

  connect() {
    this.appId   = window.algolia_app_id;
    this.apiKey  = window.algolia_search_api_key;
    this.postsIx = window.post_index_name;
    this.leadsIx = window.lead_index_name;

    if (!this.appId || !this.apiKey || !this.postsIx || !this.leadsIx) {
      console.error("[GlobalSearch] Missing Algolia config or index names");
      return;
    }

    this.client = algoliasearch(this.appId, this.apiKey);

    this.groups = [
      { label: "Posts", index: this.postsIx, titleAttr: "title", snippet: "content", href: (id) => `/posts/${id}` },
      { label: "Leads", index: this.leadsIx, titleAttr: "name",  snippet: "email",   href: (id) => `/leads/${id}` },
    ];

    this.element.setFilterCallback?.(() => true);

    this._debounced = this._debounce((q) => this._searchAll(q), 160);
    this.inputTarget.addEventListener("input", (e) => this._debounced(e.target.value));

    if (this.prefetchValue) this._searchAll("");
  }

  _debounce(fn, ms = 150) { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

  _setLoading() {
    this.listTarget.replaceChildren();
    this.emptyTarget.hidden = true;
    for (let i = 0; i < 3; i++) {
      const sh = document.createElement("div");
      sh.className = "px-4 py-2 animate-pulse";
      sh.innerHTML = `
        <div class="h-4 w-40 rounded bg-gray-100 mb-1"></div>
        <div class="h-3 w-56 rounded bg-gray-50"></div>`;
      this.listTarget.appendChild(sh);
    }
  }

  async _searchAll(query) {
    this._setLoading();

    const queries = this.groups.map((g) => ({
      indexName: g.index,
      query: query || "",
      params: {
        hitsPerPage: 6,
        attributesToHighlight: ["*"],
        attributesToSnippet: [`${g.snippet}:50`],
        snippetEllipsisText: "…",
      },
    }));

    try {
      const res = await this.client.search(queries);
      const grouped = this.groups.map((g, i) => ({ group: g, hits: res?.results?.[i]?.hits || [] }));
      this._render(grouped);
    } catch (err) {
      console.error("[GlobalSearch] Algolia error:", err);
      this.listTarget.replaceChildren();
      this.emptyTarget.hidden = false;
    }
  }

  _render(groupResults) {
    this.listTarget.replaceChildren();
    let total = 0;

    groupResults.forEach(({ group, hits }) => {
      if (!hits.length) return;
      total += hits.length;

      const header = document.createElement("div");
      header.className = "px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500";
      header.textContent = group.label;
      this.listTarget.appendChild(header);

      hits.forEach((hit) => {
        const node = this.templateTarget.content.firstElementChild.cloneNode(true);
        node.href = group.href(hit.objectID);

        const titleEl = node.querySelector("[data-title]");
        const subEl   = node.querySelector("[data-subtitle]");

        const hl = hit._highlightResult || {};
        const sn = hit._snippetResult || {};

        const titleHtml = hl[group.titleAttr]?.value ?? (hit[group.titleAttr] || "Untitled");
        const subHtml   = sn[group.snippet]?.value ?? hit[group.snippet] ?? hit.email ?? hit.phone ?? "";

        titleEl.innerHTML = titleHtml;
        subEl.innerHTML   = subHtml;

        const dlg = this.element.closest("dialog") || document.getElementById("dialog");
        node.addEventListener("click", () => dlg?.close?.());

        this.listTarget.appendChild(node);
      });
    });

    const hasAny = total > 0;
    this.emptyTarget.hidden = hasAny;
    if (!hasAny) this.listTarget.replaceChildren();
  }
}


