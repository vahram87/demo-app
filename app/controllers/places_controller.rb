# app/controllers/places_controller.rb
class PlacesController < ApplicationController
  require "net/http"
  require "json"
  require "uri"

  def search
    q = params[:q].to_s.strip
    return render json: [] if q.blank?

    key = ENV["PLACES_API_KEY"]
    return render json: [] unless key.present?

    uri = URI.parse("https://places.googleapis.com/v1/places:searchText?key=#{CGI.escape(key)}")

    req = Net::HTTP::Post.new(uri)
    req["Content-Type"] = "application/json"
    req["X-Goog-FieldMask"] = %w[
      places.id
      places.displayName
      places.formattedAddress
      places.shortFormattedAddress
      places.location
      places.primaryType
      places.primaryTypeDisplayName
      places.websiteUri
      places.googleMapsUri
      places.internationalPhoneNumber
      places.rating
      places.userRatingCount
      places.photos
    ].join(",")

    req.body = { textQuery: q, languageCode: "en" }.to_json

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    res  = http.request(req)

    body = JSON.parse(res.body) rescue {}
    places = Array(body["places"]).map do |p|
      photo = p.dig("photos", 0, "name")
      {
        id:                   p["id"],
        title:                p.dig("displayName", "text"),
        address:              p["formattedAddress"],
        short_address:        p["shortFormattedAddress"],
        latitude:             p.dig("location", "latitude"),
        longitude:            p.dig("location", "longitude"),
        category:             p.dig("primaryTypeDisplayName", "text") || p["primaryType"],
        website_uri:          p["websiteUri"],
        google_maps_uri:      p["googleMapsUri"],
        phone:                p["internationalPhoneNumber"],
        rating:               p["rating"],
        user_ratings_total:   p["userRatingCount"],
        image_url:            (photo ? "https://places.googleapis.com/v1/#{photo}/media?key=#{CGI.escape(key)}&maxHeightPx=96&maxWidthPx=96" : nil),
        data:                 p
      }.compact
    end

    render json: places
  rescue => e
    Rails.logger.error "Places#search #{e.class}: #{e.message}"
    render json: []
  end
end
