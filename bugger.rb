require "sinatra"
require "json"
require "pry"
require "sinatra/reloader" if development?
require "faraday"
require "dotenv"
Dotenv.load

set :port, 9494
set :environment, :production

get "/" do
  "This is the Bugger.  https://github.com/enginuitygroup/bugger"
end

post "/payload" do
  webhook_payload = JSON.parse(request.body.read, symbolize_names: true)

  if webhook_payload[:action] != "closed"
    sha_of_last_commit = webhook_payload[:pull_request][:head][:sha]

    update_status(
      matches_found?(webhook_payload, sha_of_last_commit),
      webhook_payload[:pull_request][:head][:repo][:statuses_url],
      sha_of_last_commit
    )
  end
end

def matches_found? webhook_payload, sha_of_last_commit
  puts "Looking for matches in commit #{sha_of_last_commit}"
  path = webhook_payload[:pull_request][:head][:repo][:compare_url].
    gsub("{base}", webhook_payload[:pull_request][:head][:repo][:default_branch]).
    gsub("{head}", webhook_payload[:pull_request][:head][:ref])
  regexes = Regexp.union JSON.parse(File.read(ENV["BUGGER_WATCH_LIST"]))
  final_regex = /\+.*#{regexes}/
  number_of_matches = 0

  diff = JSON.parse(Faraday.get(path, {access_token: ENV["BUGGER_PERSONAL_ACCESS_TOKEN"]}).body, symbolize_names: true)

  diff[:files].each do |file|
    if final_regex =~ file[:patch]
      number_of_matches += 1
    end
  end

  if 0 < number_of_matches
    true
  else
    false
  end
end

def update_status match_found, statuses_url, sha_of_last_commit
  status =
    if match_found
      {
        state: "failure",
        description: "The Bugger found a debugging statement in this pull request."
      }
    else
      {
        state: "success",
        description: "The Bugger found no debugging statements in this pull request."
      }
    end

  puts "Updating status of #{sha_of_last_commit} to #{status[:state]} with the following message: #{status[:description]}"

  post_response = Faraday.post(statuses_url.gsub("{sha}", sha_of_last_commit)) do |req|

    req.params = {access_token: ENV["BUGGER_PERSONAL_ACCESS_TOKEN"]}
    req.body = JSON.dump(status)
  end
end
