// TODO : Permission to log in and actually get the diff from a private repo.
// TODO : push up a status.

var fs = require("fs");
var fspath = require("path");
var http = require("http");
var https = require("https");
var exec = require("child_process").exec;
var url = require("url");

http.createServer(function(request, response) {
  if (request.method == "POST") {

    // Parse the JSON of the payload.
    var webhook_payload = "";
    request.on("data", function(chunk) {
      webhook_payload += chunk;
    });
    request.on("end", function() {
      webhook_payload = JSON.parse(webhook_payload);
      var shaOfLastCommit = null;
      if (webhook_payload.action != "closed") {
	var hostname = url.parse(webhook_payload.pull_request.commits_url).host
	var path = url.parse(webhook_payload.pull_request.commits_url).pathname + "?access_token=" + process.env.BUGGER_PERSONAL_ACCESS_TOKEN
	https.get({
	  hostname: hostname
	  ,path: path
	  ,headers: {"User-Agent": "Mozilla/5.0"}
	}, function(res){
	  var data = "";
	  res.on("data", function(chunk){
	    data += chunk;
	  });
	  res.on("end", function(){
	    data = JSON.parse(data);
	    shaOfLastCommit = data[data.length - 1].sha
	    matches_found(webhook_payload, shaOfLastCommit, update_status);
	  })
	});
      }
    });

    response.end();
  }
}).listen(8888);

function matches_found(webhook_payload, shaOfLastCommit, update_status_callback){
  var diff_json = "";
  var path = "/repos/enginuitygroup/street-smart/compare/staging..." + webhook_payload.pull_request.head.ref + "?access_token=" + process.env.BUGGER_PERSONAL_ACCESS_TOKEN
  var file = "";
  fs.readFile(process.env.BUGGER_WATCH_LIST, {encoding: "utf8"}, function(err, data){
    file += data;

    var listOfRegex = JSON.parse(file);
    var finalRegex = new RegExp(listOfRegex.join("|"));
    console.log(finalRegex);

    https.get({
      hostname: "api.github.com"
      ,path: path
      ,headers: {"User-Agent": "Mozilla/5.0"}
    },function(res) {
      res.on("data", function(chunk) {
	diff_json += chunk;
      });
      res.on("end", function() {
	var numberOfMatchesFound = 0;
	diff_json = JSON.parse(diff_json);
	diff_json.files.forEach(function(element) {
	  if (finalRegex.test(element.patch)) {
	    numberOfMatchesFound++;
	  }
	});

	var match_found = false;
	if (numberOfMatchesFound > 0) {
	  match_found = true;
	}

	update_status_callback(match_found, shaOfLastCommit);

      });
    }).on("error", function(e){
      console.error(e)
    });
  });
}

function update_status(match_found, shaOfLastCommit) {
  var state;
  var description;
  if (match_found == true){
    state = "failure";
    description = "The Bugger found a match for 'binding.pry'"
  } else {
    state = "success";
    description = "The Bugger found no match for 'binding.pry'"
  };

  var statusString = JSON.stringify({
    state: state
    ,description: description
  });
  console.log("YHYHYH" + statusString);

  var path = "/repos/enginuitygroup/street-smart/statuses/" + shaOfLastCommit + "?access_token=" + process.env.BUGGER_PERSONAL_ACCESS_TOKEN
  var req = https.request({
    hostname: "api.github.com"
    ,path: path
    ,method: "POST"
    ,headers: {
      "User-Agent": "Mozilla/5.0"
    }
  }, function(res){});
  req.write(statusString);
  req.end();
}
