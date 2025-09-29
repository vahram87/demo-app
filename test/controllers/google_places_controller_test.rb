require "test_helper"

class GooglePlacesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @google_place = google_places(:one)
  end

  test "should get index" do
    get google_places_url
    assert_response :success
  end

  test "should get new" do
    get new_google_place_url
    assert_response :success
  end

  test "should create google_place" do
    assert_difference("GooglePlace.count") do
      post google_places_url, params: { google_place: { address: @google_place.address, data: @google_place.data, google_maps_uri: @google_place.google_maps_uri, icon_background_color: @google_place.icon_background_color, icon_mask_base_uri: @google_place.icon_mask_base_uri, latitude: @google_place.latitude, longitude: @google_place.longitude, open_now: @google_place.open_now, phone_international: @google_place.phone_international, phone_national: @google_place.phone_national, photo_ref: @google_place.photo_ref, place_id: @google_place.place_id, plus_code_compound: @google_place.plus_code_compound, plus_code_global: @google_place.plus_code_global, price_level: @google_place.price_level, primary_type: @google_place.primary_type, primary_type_display_name: @google_place.primary_type_display_name, rating: @google_place.rating, short_address: @google_place.short_address, title: @google_place.title, types: @google_place.types, user_ratings_total: @google_place.user_ratings_total, website_uri: @google_place.website_uri } }
    end

    assert_redirected_to google_place_url(GooglePlace.last)
  end

  test "should show google_place" do
    get google_place_url(@google_place)
    assert_response :success
  end

  test "should get edit" do
    get edit_google_place_url(@google_place)
    assert_response :success
  end

  test "should update google_place" do
    patch google_place_url(@google_place), params: { google_place: { address: @google_place.address, data: @google_place.data, google_maps_uri: @google_place.google_maps_uri, icon_background_color: @google_place.icon_background_color, icon_mask_base_uri: @google_place.icon_mask_base_uri, latitude: @google_place.latitude, longitude: @google_place.longitude, open_now: @google_place.open_now, phone_international: @google_place.phone_international, phone_national: @google_place.phone_national, photo_ref: @google_place.photo_ref, place_id: @google_place.place_id, plus_code_compound: @google_place.plus_code_compound, plus_code_global: @google_place.plus_code_global, price_level: @google_place.price_level, primary_type: @google_place.primary_type, primary_type_display_name: @google_place.primary_type_display_name, rating: @google_place.rating, short_address: @google_place.short_address, title: @google_place.title, types: @google_place.types, user_ratings_total: @google_place.user_ratings_total, website_uri: @google_place.website_uri } }
    assert_redirected_to google_place_url(@google_place)
  end

  test "should destroy google_place" do
    assert_difference("GooglePlace.count", -1) do
      delete google_place_url(@google_place)
    end

    assert_redirected_to google_places_url
  end
end
