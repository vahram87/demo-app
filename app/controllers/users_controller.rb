class UsersController < ApplicationController
  before_action :set_user, only: %i[ show edit update destroy ]

  # GET /users or /users.json
  def index
    @users = User.all
  end

  # GET /users/1 or /users/1.json
  def show
  end

  # GET /users/new
  def new
    @user = User.new
  end

  # GET /users/1/edit
  def edit
  end

  # POST /users or /users.json
  def create
    @user = User.new(user_params)

    respond_to do |format|
      if @user.save
        format.html { redirect_to @user, notice: "User was successfully created." }
        format.json { render :show, status: :created, location: @user }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /users/1 or /users/1.json
  def update
    respond_to do |format|
      if @user.update(user_params)
        format.html { redirect_to @user, notice: "User was successfully updated.", status: :see_other }
        format.json { render :show, status: :ok, location: @user }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /users/1 or /users/1.json
  def destroy
    @user.destroy!

    respond_to do |format|
      format.html { redirect_to users_path, notice: "User was successfully destroyed.", status: :see_other }
      format.json { head :no_content }
    end
  end

  def search
    users = User.order(:name).text_search(params[:q].to_s.strip)
    limit = params.fetch(:limit, 25).to_i.clamp(1, 100)

    render json: users.limit(limit).map { |u|
      {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        url: user_url(u),
        image_url: avatar_url_for(u)
      }
    }
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_user
      @user = User.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def user_params
      params.expect(user: [ :name, :email, :phone ])
    end

    def avatar_url_for(user)
      if user.image.attached? && user.image.content_type&.start_with?("image/")
        # no variants – return the original blob URL
        rails_blob_url(user.image, only_path: false)
      else
        # fallback image:
        # put `user.png` in app/assets/images/user.png
        helpers.image_url("user.png")
        # (if you actually put it in /public, use "/user.png")
      end
    end
end
