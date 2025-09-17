20.times do
  Post.create!(
    title:   Faker::Book.title,
    content: Faker::Lorem.paragraphs(number: 4).join("\n\n")
  )
end
puts "Creating 20 posts..."

20.times do
  Lead.create!(
    name:  Faker::Name.name,
    email: Faker::Internet.unique.email,
    phone: (Faker::PhoneNumber.cell_phone_in_e164 rescue Faker::PhoneNumber.phone_number)
  )
end

puts "Creating 20 leads..."
# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# frozen_string_literal: true

require "faker"

COUNT = 20
image_path = Rails.root.join("public", "user.png")
raise "Missing image at #{image_path}" unless File.exist?(image_path)

# Reuse an existing blob if found; otherwise create it once
default_blob =
  ActiveStorage::Blob.find_by(filename: "user.png") ||
  ActiveStorage::Blob.create_and_upload!(
    io: File.open(image_path, "rb"),
    filename: "user.png",
    content_type: "image/png"
  )

COUNT.times do
  email = Faker::Internet.unique.email
  user  = User.find_or_initialize_by(email: email)
  user.name  = Faker::Name.name
  user.phone = (Faker::PhoneNumber.cell_phone_in_e164 rescue Faker::PhoneNumber.phone_number)
  user.save!

  # Give everyone the same image blob
  user.image.attach(default_blob) unless user.image.attached?
end

Faker::UniqueGenerator.clear
puts "Seeded #{COUNT} users with shared image."
