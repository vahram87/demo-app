class GooglePlacesController < ApplicationController
  before_action :set_google_place, only: %i[ show edit update destroy ]

  # GET /google_places or /google_places.json
  def index
    @google_places = GooglePlace.all
  end

  # GET /google_places/1 or /google_places/1.json
  def show
  end

  # GET /google_places/new
  def new
    prefill = params[:google_place].is_a?(ActionController::Parameters) ? params[:google_place].permit(
      :place_id, :title, :address, :short_address, :latitude, :longitude, :phone_international,
      :phone_national, :website_uri, :google_maps_uri, :primary_type, :primary_type_display_name,
      :types, :rating, :user_ratings_total, :price_level, :icon_mask_base_uri, :icon_background_color,
      :plus_code_global, :plus_code_compound, :open_now, :photo_ref, :data
    ) : {}
    @google_place = GooglePlace.new(prefill)
  end

  # GET /google_places/1/edit
  def edit
  end

  # POST /google_places or /google_places.json
  def create
    @google_place = GooglePlace.new(google_place_params)

    respond_to do |format|
      if @google_place.save
        format.html { redirect_to @google_place, notice: "Google place was successfully created." }
        format.json { render :show, status: :created, location: @google_place }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @google_place.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /google_places/1 or /google_places/1.json
  def update
    respond_to do |format|
      if @google_place.update(google_place_params)
        format.html { redirect_to @google_place, notice: "Google place was successfully updated.", status: :see_other }
        format.json { render :show, status: :ok, location: @google_place }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @google_place.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /google_places/1 or /google_places/1.json
  def destroy
    @google_place.destroy!

    respond_to do |format|
      format.html { redirect_to google_places_path, notice: "Google place was successfully destroyed.", status: :see_other }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_google_place
      @google_place = GooglePlace.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def google_place_params
      params.expect(google_place: [ :place_id, :title, :address, :short_address, :latitude, :longitude, :phone_international, :phone_national, :website_uri, :google_maps_uri, :primary_type, :primary_type_display_name, :types, :rating, :user_ratings_total, :price_level, :icon_mask_base_uri, :icon_background_color, :plus_code_global, :plus_code_compound, :open_now, :photo_ref, :data ])
    end
end
