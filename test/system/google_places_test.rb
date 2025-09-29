require "application_system_test_case"

class GooglePlacesTest < ApplicationSystemTestCase
  setup do
    @google_place = google_places(:one)
  end

  test "visiting the index" do
    visit google_places_url
    assert_selector "h1", text: "Google places"
  end

  test "should create google place" do
    visit google_places_url
    click_on "New google place"

    fill_in "Address", with: @google_place.address
    fill_in "Data", with: @google_place.data
    fill_in "Google maps uri", with: @google_place.google_maps_uri
    fill_in "Icon background color", with: @google_place.icon_background_color
    fill_in "Icon mask base uri", with: @google_place.icon_mask_base_uri
    fill_in "Latitude", with: @google_place.latitude
    fill_in "Longitude", with: @google_place.longitude
    check "Open now" if @google_place.open_now
    fill_in "Phone international", with: @google_place.phone_international
    fill_in "Phone national", with: @google_place.phone_national
    fill_in "Photo ref", with: @google_place.photo_ref
    fill_in "Place", with: @google_place.place_id
    fill_in "Plus code compound", with: @google_place.plus_code_compound
    fill_in "Plus code global", with: @google_place.plus_code_global
    fill_in "Price level", with: @google_place.price_level
    fill_in "Primary type", with: @google_place.primary_type
    fill_in "Primary type display name", with: @google_place.primary_type_display_name
    fill_in "Rating", with: @google_place.rating
    fill_in "Short address", with: @google_place.short_address
    fill_in "Title", with: @google_place.title
    fill_in "Types", with: @google_place.types
    fill_in "User ratings total", with: @google_place.user_ratings_total
    fill_in "Website uri", with: @google_place.website_uri
    click_on "Create Google place"

    assert_text "Google place was successfully created"
    click_on "Back"
  end

  test "should update Google place" do
    visit google_place_url(@google_place)
    click_on "Edit this google place", match: :first

    fill_in "Address", with: @google_place.address
    fill_in "Data", with: @google_place.data
    fill_in "Google maps uri", with: @google_place.google_maps_uri
    fill_in "Icon background color", with: @google_place.icon_background_color
    fill_in "Icon mask base uri", with: @google_place.icon_mask_base_uri
    fill_in "Latitude", with: @google_place.latitude
    fill_in "Longitude", with: @google_place.longitude
    check "Open now" if @google_place.open_now
    fill_in "Phone international", with: @google_place.phone_international
    fill_in "Phone national", with: @google_place.phone_national
    fill_in "Photo ref", with: @google_place.photo_ref
    fill_in "Place", with: @google_place.place_id
    fill_in "Plus code compound", with: @google_place.plus_code_compound
    fill_in "Plus code global", with: @google_place.plus_code_global
    fill_in "Price level", with: @google_place.price_level
    fill_in "Primary type", with: @google_place.primary_type
    fill_in "Primary type display name", with: @google_place.primary_type_display_name
    fill_in "Rating", with: @google_place.rating
    fill_in "Short address", with: @google_place.short_address
    fill_in "Title", with: @google_place.title
    fill_in "Types", with: @google_place.types
    fill_in "User ratings total", with: @google_place.user_ratings_total
    fill_in "Website uri", with: @google_place.website_uri
    click_on "Update Google place"

    assert_text "Google place was successfully updated"
    click_on "Back"
  end

  test "should destroy Google place" do
    visit google_place_url(@google_place)
    click_on "Destroy this google place", match: :first

    assert_text "Google place was successfully destroyed"
  end
end
