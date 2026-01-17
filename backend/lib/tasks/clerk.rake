# lib/tasks/clerk.rake
namespace :clerk do
  desc "Sync a single user from Clerk by Clerk ID (e.g., rake clerk:sync_user[user_2abc123def])"
  task :sync_user, [:clerk_id] => :environment do |t, args|
    unless args[:clerk_id]
      puts "ERROR: Clerk ID required. Usage: rake clerk:sync_user[user_2abc123def]"
      exit 1
    end

    clerk_id = args[:clerk_id]
    puts "Syncing user with Clerk ID: #{clerk_id}..."

    sync_result = SyncUserFromClerkService.new(clerk_id).call

    if sync_result.success?
      user = sync_result.data
      puts "✓ User synced successfully:"
      puts "  - Email: #{user.email}"
      puts "  - Name: #{user.name || '(not set)'}"
      puts "  - Clerk ID: #{user.clerk_id}"
      puts "  - MongoDB ID: #{user.id}"
    else
      puts "✗ Sync failed:"
      sync_result.errors.each { |error| puts "  - #{error}" }
      exit 1
    end
  end

  desc "Sync all users from Clerk to MongoDB (with safety limit)"
  task :sync_all_users => :environment do
    puts "Starting bulk user sync from Clerk..."
    puts "=" * 60

    begin
      client = ClerkApiClient.new
      offset = 0
      limit = 100
      total_fetched = 0
      total_synced = 0
      total_failed = 0
      max_users = 1000 # Safety limit

      loop do
        puts "\nFetching users (offset: #{offset}, limit: #{limit})..."

        users_response = client.list_users(limit: limit, offset: offset)
        users = users_response.is_a?(Array) ? users_response : []

        break if users.empty?

        puts "Fetched #{users.length} users from Clerk"

        users.each do |clerk_user|
          clerk_id = clerk_user['id']
          total_fetched += 1

          sync_result = SyncUserFromClerkService.new(clerk_id).call

          if sync_result.success?
            total_synced += 1
            user = sync_result.data
            puts "  ✓ #{user.email} (#{clerk_id})"
          else
            total_failed += 1
            puts "  ✗ Failed to sync #{clerk_id}: #{sync_result.errors.join(', ')}"
          end

          # Safety check
          if total_fetched >= max_users
            puts "\n⚠️  Safety limit reached (#{max_users} users). Stopping."
            break
          end
        end

        # Break if we've hit the safety limit
        break if total_fetched >= max_users

        # Break if we got fewer users than the limit (last page)
        break if users.length < limit

        offset += limit

        # Small delay to avoid rate limiting
        sleep(0.5)
      end

      puts "\n" + "=" * 60
      puts "Bulk sync complete!"
      puts "  - Total fetched: #{total_fetched}"
      puts "  - Successfully synced: #{total_synced}"
      puts "  - Failed: #{total_failed}"
      puts "=" * 60

    rescue StandardError => e
      puts "\n✗ Bulk sync failed: #{e.message}"
      puts e.backtrace.first(5).join("\n")
      exit 1
    end
  end

  desc "Audit users - list Clerk users not in MongoDB"
  task :audit_missing_users => :environment do
    puts "Auditing user sync status..."
    puts "=" * 60

    begin
      client = ClerkApiClient.new
      offset = 0
      limit = 100
      missing_users = []
      total_checked = 0
      max_users = 1000 # Safety limit

      loop do
        users_response = client.list_users(limit: limit, offset: offset)
        users = users_response.is_a?(Array) ? users_response : []

        break if users.empty?

        users.each do |clerk_user|
          clerk_id = clerk_user['id']
          total_checked += 1

          # Check if user exists in MongoDB
          unless User.exists?(clerk_id: clerk_id)
            email = clerk_user.dig('email_addresses', 0, 'email_address') || 'unknown'
            missing_users << { clerk_id: clerk_id, email: email }
          end

          # Safety check
          break if total_checked >= max_users
        end

        # Break if we've hit the safety limit
        break if total_checked >= max_users

        # Break if we got fewer users than the limit (last page)
        break if users.length < limit

        offset += limit
      end

      puts "Total Clerk users checked: #{total_checked}"
      puts "Missing from MongoDB: #{missing_users.length}"
      puts "=" * 60

      if missing_users.any?
        puts "\nMissing users:"
        missing_users.each do |user|
          puts "  - #{user[:email]} (#{user[:clerk_id]})"
        end
        puts "\nRun 'rake clerk:sync_all_users' to sync missing users"
      else
        puts "\n✓ All Clerk users exist in MongoDB"
      end

    rescue StandardError => e
      puts "\n✗ Audit failed: #{e.message}"
      puts e.backtrace.first(5).join("\n")
      exit 1
    end
  end
end
