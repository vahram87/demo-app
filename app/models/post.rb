class Post < ApplicationRecord
  include AlgoliaSearch

  algoliasearch do
    attributes :title, :content, :created_at, :id
    searchableAttributes %w[title content]
    attributesForFaceting []
  end
end
