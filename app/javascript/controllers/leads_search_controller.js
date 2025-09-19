import { Controller } from "@hotwired/stimulus";
import algoliasearch from "algoliasearch/lite";

export default class extends Controller {
  static targets = ["input", "list", "empty", "template"];
  static values = {
    prefetch: { type: Boolean, default: true },
    debounce: { type: Number, default: 250 },
    skeletonDelay: { type: Number, default: 200 }
  };

  connect() {
    this.appId   = window.algolia_app_id;
    this.apiKey  = window.algolia_search_api_key;
    this.leadsIx = window.lead_index_name;
    if (!this.appId || !this.apiKey || !this.leadsIx) return;

    this.client = algoliasearch(this.appId, this.apiKey);
    this.element.setFilterCallback?.(() => true);

    this._seq = 0;
    this._loadingTimer = null;

    this._debounced = this._debounce((q) => this._searchLeads(q), this.debounceValue);
    this.inputTarget.addEventListener("input", (e) => this._debounced(e.target.value));

    if (this.prefetchValue) this._searchLeads("");
  }

  _debounce(fn, ms = 150) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  _startLoading({ allowSkeleton = true } = {}) {
    this.emptyTarget.hidden = true;
    if (!allowSkeleton) return;
    clearTimeout(this._loadingTimer);
    this._loadingTimer = setTimeout(() => {
      if (this.listTarget.children.length > 0) return;
      this._clearSkeleton();
      for (let i = 0; i < 3; i++) {
        const sh = document.createElement("div");
        sh.dataset.skeleton = "true";
        sh.className = "px-4 py-2 animate-pulse";
        sh.innerHTML = `<div class="h-4 w-40 rounded bg-gray-100 mb-1"></div><div class="h-3 w-56 rounded bg-gray-50"></div>`;
        this.listTarget.appendChild(sh);
      }
    }, this.skeletonDelayValue);
  }

  _stopLoading() {
    clearTimeout(this._loadingTimer);
    this._loadingTimer = null;
    this._clearSkeleton();
  }

  _clearSkeleton() {
    this.listTarget.querySelectorAll("[data-skeleton='true']").forEach(n => n.remove());
  }

  async _searchLeads(query) {
    const currentSeq = ++this._seq;
    const isInitial = query == null || query === "";
    this._startLoading({ allowSkeleton: !isInitial });

    const queries = [{
      indexName: this.leadsIx,
      query: query || "",
      params: {
        hitsPerPage: 10,
        attributesToHighlight: ["*"],
        attributesToSnippet: ["email:50", "phone:30"],
        snippetEllipsisText: "…"
      }
    }];

    try {
      const res = await this.client.search(queries);
      if (currentSeq !== this._seq) return;
      const hits = res?.results?.[0]?.hits || [];
      this._renderLeads(hits);
    } catch {
      if (currentSeq !== this._seq) return;
      if (this.listTarget.children.length === 0) this.emptyTarget.hidden = false;
    } finally {
      if (currentSeq === this._seq) this._stopLoading();
    }
  }

  _renderLeads(hits) {
    if (!hits.length) {
      this.listTarget.replaceChildren();
      this.emptyTarget.hidden = false;
      return;
    }

    this.emptyTarget.hidden = true;
    const frag = document.createDocumentFragment();

    const header = document.createElement("div");
    header.className = "px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500";
    header.textContent = "Leads";
    frag.appendChild(header);

    hits.forEach((hit) => {
      const node = this.templateTarget.content.firstElementChild.cloneNode(true);
      node.href = `/leads/${hit.objectID}`;

      const titleEl = node.querySelector("[data-title]");
      const subEl   = node.querySelector("[data-subtitle]");

      const hl = hit._highlightResult || {};
      const sn = hit._snippetResult || {};

      titleEl.innerHTML = hl.name?.value ?? (hit.name || "Unnamed");
      subEl.innerHTML   = sn.email?.value ?? hit.email ?? sn.phone?.value ?? hit.phone ?? "";

      const dlg = this.element.closest("dialog") || document.getElementById("dialog");
      node.addEventListener("click", () => dlg?.close?.());

      frag.appendChild(node);
    });

    this.listTarget.replaceChildren(frag);
  }
}
