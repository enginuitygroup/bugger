# Bugger

This is a project to respond to a GitHub pull-request webhook and look for debugging statements before they creep into the master branch.

## How to use

- Install Docker
- `cd` into the project directory
- run `docker build -t your_image_name .`
- Add your personal access token to the `environment_variables` file
- Edit your `debug_match.json` file or create a new file that has the javascript regexes that you want to look for.
- run `sudo docker run --env-file=environment_variables -p port_you_want_to_expose_to_the_internet:8888 -d your_image_name`
- point your github webhook to the machine's IP and port.

## What happens

When a PR is made or modified, the webhook will fire a payload over to this app.  The app will pull in the latest commit for this PR, do a regex-search on the diffs of all the files in the commit, and update the status of that commit to GitHub, which will reflect in the "Merge this PR" section of the PR-page.
