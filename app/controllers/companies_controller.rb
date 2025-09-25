class CompaniesController < ApplicationController
  require "mechanize"
  require "nokogiri"

  BASE = "https://www.handelsregister.de".freeze
  NORMAL_HOME_PATH = "/rp_web/normalesuche/welcome.xhtml".freeze

  def search
    q = params[:q].to_s.strip
    return render json: [] if q.blank?
    mode_id = { "all"=>"1", "min"=>"2", "exact"=>"3" }[params[:mode]] || (q.length <= 4 ? "2" : "1")

    agent = build_agent
    page  = agent.get("#{BASE}#{NORMAL_HOME_PATH}")

    form = page.form_with(name: "form") || page.forms.first
    return render json: [] unless form

    form["form:schlagwoerter"]      = q
    (form.field_with(name: "form:schlagwortOptionen") rescue nil)&.value = mode_id
    form["form:suchTyp"]            = "n"
    form["form:ergebnisseProSeite"] = "25"
    form["form:btnSuche"]           = "Suchen"
    if (form.field_with(name: "javax.faces.ViewState") rescue nil).nil?
      vs = form.page.at_xpath('//input[@name="javax.faces.ViewState"]/@value')&.text
      form.add_field!("javax.faces.ViewState", vs) if vs
    end

    btn = form.button_with(value: /Suchen|Search/i) || form.buttons.first
    html = agent.submit(form, btn).body

    render json: extract_rows(html)
  rescue => e
    Rails.logger.error "[Companies#search] #{e.class}: #{e.message}"
    render json: []
  end

  private

  def build_agent
    a = Mechanize.new
    a.user_agent_alias = "Mac Safari"
    a.request_headers  = { "Accept-Language"=>"en-GB,en;q=0.9", "Accept-Encoding"=>"gzip,deflate" }
    a.open_timeout = 12; a.read_timeout = 40; a.keep_alive = false; a.max_history = 2
    a
  end

  def extract_rows(html)
    doc   = Nokogiri::HTML.parse(html)
    table = doc.at_css('table[role="grid"]') ||
            doc.at_css("div.ui-datatable div.ui-datatable-tablewrapper table")
    return [] unless table

    rows = table.css("tr[data-ri]")
    rows = table.css("tbody tr") if rows.empty?

    rows.filter_map do |tr|
      tds = tr.css("td"); next if tds.size < 5
      link = tds[2].at_css("a[href]"); href = link ? absolutize(link["href"]) : nil

      name   = tds[2].text.gsub(/\s+/, " ").strip.sub(/^\d+\.\)\s*/, "")
      court  = tds[1].text.gsub(/\s+/, " ").strip
      state  = tds[3].text.gsub(/\s+/, " ").strip
      status = tds[4].text.gsub(/\s+/, " ").strip
      reg_no = "#{tds[1].text} #{tds[2].text}"[/\b(HRB|HRA|VR|GnR)\s*\d[\d.\-\/]*/i]

      { name: name, register_court: court, register_number: reg_no, state: state, status: status, source_href: href }.compact
    end
  end

  def absolutize(href)
    uri = URI(href); return href if uri.absolute?; URI.join(BASE, href).to_s
  end
end
