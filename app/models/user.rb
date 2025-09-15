class User < ApplicationRecord
  has_one_attached :image

   scope :text_search, ->(q) {
    next all if q.blank?
    like = "%#{q}%"
    if ActiveRecord::Base.connection.adapter_name =~ /postg/i
      where("name ILIKE :like OR email ILIKE :like OR phone ILIKE :like", like: like)
    else
      where("LOWER(name) LIKE :like OR LOWER(email) LIKE :like OR phone LIKE :like", like: like.downcase)
    end
  }
end
