# app/controllers/places_controller.rb
class PlacesController < ApplicationController
  require "net/http"
  require "json"
  require "uri"

  # GET /places/search.json?q=coffee%20in%20boston
  def search
    q = params[:q].to_s.strip
    return render json: [] if q.blank?

    key = "AIzaSyBd54PDz6KAkMxIXxbbwB4gRJJpEJOmz8g"
    unless key.present?
      Rails.logger.error "Places: PLACES_API_KEY missing"
      return render json: []
    end

    begin
      uri = URI.parse("https://places.googleapis.com/v1/places:searchText?key=#{CGI.escape(key)}")
      req = Net::HTTP::Post.new(uri)
      req["Content-Type"]    = "application/json"
      # Field mask is REQUIRED in v1
      req["X-Goog-FieldMask"] = [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.internationalPhoneNumber",
        "places.websiteUri",
        "places.photos"
      ].join(",")

      req.body = { textQuery: q }.to_json

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      res  = http.request(req)

      Rails.logger.info "Places: status=#{res.code}"
      body = JSON.parse(res.body)

      places = Array(body["places"]).map do |p|
        name = p.dig("displayName", "text") || ""
        photo_name = p.dig("photos", 0, "name") # like "places/XXX/photos/YYY"

        image_url =
          if photo_name.present?
            # Photo media endpoint (no field mask needed here)
            "https://places.googleapis.com/v1/#{photo_name}/media?key=#{key}&maxHeightPx=96&maxWidthPx=96"
          else
            # SVG data URI fallback (no Propshaft dependency)
            "data:image/svg+xml;utf8," + ERB::Util.url_encode(%(
              <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
                <rect width="100%" height="100%" fill="#eef2ff"/>
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                      font-family="system-ui,Segoe UI,Roboto,Helvetica,Arial" font-size="28" fill="#4f46e5">🏬</text>
              </svg>
            ).strip)
          end

        {
          id:    p["id"],
          name:  name,
          address: p["formattedAddress"],
          phone:   p["internationalPhoneNumber"],
          url:     p["websiteUri"],
          image_url: image_url
        }
      end

      Rails.logger.info "Places: returned #{places.size} items (q=#{q.inspect})"
      render json: places
    rescue => e
      Rails.logger.error "Places search exception: #{e.class}: #{e.message}"
      render json: []
    end
  end
end
