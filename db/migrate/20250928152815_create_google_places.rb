class CreateGooglePlaces < ActiveRecord::Migration[8.0]
  def change
    create_table :google_places do |t|
      t.string :place_id
      t.string :title
      t.string :address
      t.string :short_address
      t.decimal :latitude
      t.decimal :longitude
      t.string :phone_international
      t.string :phone_national
      t.string :website_uri
      t.string :google_maps_uri
      t.string :primary_type
      t.string :primary_type_display_name
      t.text :types
      t.decimal :rating
      t.integer :user_ratings_total
      t.integer :price_level
      t.string :icon_mask_base_uri
      t.string :icon_background_color
      t.string :plus_code_global
      t.string :plus_code_compound
      t.boolean :open_now
      t.string :photo_ref
      t.jsonb :data

      t.timestamps
    end
  end
end
