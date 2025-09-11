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
