# Suppress verbose MongoDB driver logs in development
if Rails.env.development?
  # Set MongoDB driver logger to warn level to reduce noise
  # This suppresses INFO level logs (every operation) but keeps warnings and errors
  Mongo::Logger.logger.level = Logger::WARN
end

# Suppress dotenv loading messages
# Set environment variable to silence dotenv output
ENV['DOTENV_SILENT'] = 'true' if Rails.env.development?
