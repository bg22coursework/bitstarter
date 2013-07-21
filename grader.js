#!/usr/bin/env node

/*
  Original file given in the class.
  Modified to support url fetching using restler
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json:";

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if (!fs.existsSync(instr)) {
    console.log("%s does not exist. Exiting.", instr);
    process.exit(1);
  }
  return instr;
}

var buildFn = function(checksfile) { 
  return function(response) {
    if (response instanceof Error) {
      console.log("Error fetching url. Exiting");
      process.exit(1);
    } else {
      var checkJson = checkHtmlResponse(response, checksfile);
      outputJson(checkJson);
    }
  };
}

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
}

var checkHtmlResponse = function (response, checksfile) {
  $ = cheerio.load(response); 
  return checkHtml($, checksfile);
}

var checkHtmlFile = function (htmlfile, checksfile) {
  $ = cheerio.load(fs.readFileSync(htmlfile));
  return checkHtml($, checksfile);
}

var checkHtml = function(cheerioObject, checksfile) {
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for (var ii in checks) {
    var present = cheerioObject(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  return out;
}

var clone = function (fn) {
  // Workaround for commander.js issue.
  return fn.bind({});
};

var outputJson = function(obj) {
  var outJson = JSON.stringify(obj, null, 4);
  console.log(outJson);
}

if (require.main === module) {
  program
    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
    .option('-u, --url <url_to_html_file>', 'URL to html file') 
    .parse(process.argv);

  if (program.file != undefined) {
    var checkJson = checkHtmlFile(program.file, program.checks);
    outputJson(checkJson);
  }

  if (program.url != undefined) {
    var checkFn = buildFn(program.checks);
    rest.get(program.url).on('complete', checkFn);
  }
} else {
  exports.checkHtmlFile = checkHtmlFile;
}
