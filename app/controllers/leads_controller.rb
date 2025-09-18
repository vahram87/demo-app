class LeadsController < ApplicationController
  before_action :set_lead, only: %i[ show edit update destroy ]

  # GET /leads or /leads.json
  def index
    @leads = Lead.all
  end

  # GET /leads/1 or /leads/1.json
  def show
  end

  # GET /leads/new
  def new
    @lead = Lead.new
  end

  # GET /leads/1/edit
  def edit
  end

  # POST /leads or /leads.json
  def create
    @lead = Lead.new(lead_params)

    respond_to do |format|
      if @lead.save
        format.html { redirect_to @lead, notice: "Lead was successfully created." }
        format.json { render :show, status: :created, location: @lead }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @lead.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /leads/1 or /leads/1.json
  def update
    respond_to do |format|
      if @lead.update(lead_params)
        format.html { redirect_to @lead, notice: "Lead was successfully updated.", status: :see_other }
        format.json { render :show, status: :ok, location: @lead }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @lead.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /leads/1 or /leads/1.json
  def destroy
    @lead.destroy!

    respond_to do |format|
      format.html { redirect_to leads_path, notice: "Lead was successfully destroyed.", status: :see_other }
      format.json { head :no_content }
    end
  end

  # def search
  #   q = params[:q].to_s.strip
  #   scope = Lead.order(updated_at: :desc)
  #   scope = scope.where("name ILIKE :q OR email ILIKE :q OR phone ILIKE :q", q: "%#{q}%") if q.present?
  #   render json: scope.limit(8).select(:id, :name, :email).map { |l|
  #     { id: l.id, title: l.name, subtitle: l.email, url: lead_path(l) }
  #   }
  # end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_lead
      @lead = Lead.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def lead_params
      params.expect(lead: [ :name, :email, :phone ])
    end
end
