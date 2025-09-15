class Lead < ApplicationRecord
  include AlgoliaSearch

  algoliasearch do
    attributes :name, :email, :created_at, :id
    searchableAttributes %w[name email]
    attributesForFaceting []
  end
end
