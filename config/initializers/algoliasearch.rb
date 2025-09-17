# config/initializers/algoliasearch.rb

# Don’t configure Algolia during tests
if Rails.env.test?
  Rails.logger.info("[Algolia] Skipping initialization in test")
  return
end

app_id =
  ENV["ALGOLIA_APPLICATION_ID"].presence ||
  Rails.application.credentials.dig(:algolia, :application_id)

api_key =
  ENV["ALGOLIA_API_KEY"].presence ||
  Rails.application.credentials.dig(:algolia, :api_key)

if app_id.present? && api_key.present?
  AlgoliaSearch.configuration = {
    application_id: app_id,
    api_key: api_key
  }
else
  Rails.logger.warn("[Algolia] Credentials missing; not configuring")
end
