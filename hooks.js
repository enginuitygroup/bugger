// TODO : Permission to log in and actually get the diff from a private repo.
// TODO : push up a status.

var http = require("http");
var https = require("https");
var exec = require("child_process").exec;

http.createServer(function(request, response) {
  if (request.method == "POST") {

    // Parse the JSON of the payload.
    var data = "";
    request.on("data", function(chunk) {
      data += chunk;
    });
    request.on("end", function() {
      var postBody = JSON.parse(data);
      shaOfLastCommit = postBody.commits[postBody.commits.length-1].sha;
      console.log(shaOfLastCommit);
    });

    if (data.action != "closed") {
      var diff = "";
//      https.get(data.pull_request.diff_url, function(res) {
      https.get("https://github.com/enginuitygroup/street-smart/pull/734.diff", function(res) {
	res.on("data", function(chunk) {
	  diff += chunk;
	});
	res.on("end", function() {
	  console.log(diff);
	  if (/^\+.*binding.pry/.test(diff)) {
	    console.log("NO matches found");
	  } else {
	    console.log("Matches found");
	  }
	});
      });
    }

    response.end();


  }
}).listen(8888);
