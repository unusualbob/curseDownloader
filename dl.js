'use strict';
var fs = require('fs');
var path = require('path');

var async = require('async');
var ProgressBar = require('progress');
var request = require('request');

if (!process.argv[2]) {
  console.log('Please specify the directory where the manifest.json file is, for example:');
  console.log('node dl.js C:\\Users\\unusualbob\\Downloads\\FTBPresentsSkyfactory3-3.0.7-1.10.2\\manifest.json');
}

var manifest;
var manifestPath;
var minecraftPath;
var modPath;

var fileCount = 0;
var inputPath = path.parse(process.argv[2]);

//Allow posting the directory or the file
if (inputPath.base === 'manifest.json') {
  manifestPath = path.normalize(process.argv[2]);
}
else {
  manifestPath = path.resolve(process.argv[2], 'manifest.json');
}

//Verify this is a legitimate path
if (!fs.existsSync(manifestPath)) {
  return console.log('Either that directory does not exist, or there is no manifest.json there. (Check spelling, copy' +
    ' & paste instead, etc)');
}

try {
  manifest = require(manifestPath);
  console.log('Starting downloader for project:', manifest.name);
  console.log('Project version:', manifest.version);
  console.log('Total files to download:', manifest.files.length);
}
catch (e) {
  return console.log('Error reading manifest.json file, it is either corrupt or this is the wrong directory.' +
    'If you\'re sure this is the right directory, try re-downloading and unzipping the pack to a new folder');
}

//Check to see if the mod path exists and if not, create it
minecraftPath = path.join(manifestPath, '/../', '/minecraft');
modPath = path.join(minecraftPath, '/mods');

if (!fs.existsSync(minecraftPath)) {
  console.log('No minecraft directory found in project folder, creating.');
  fs.mkdirSync(minecraftPath);
}
if (!fs.existsSync(modPath)) {
  console.log('No mod directory found in project folder, creating.');
  fs.mkdirSync(modPath);
}

async.eachLimit(manifest.files, 3, function (file, callback) {
  var projectName;
  var filename;
  var fileNumber = (fileCount += 1);

  var projectNameReq = request.get(
    'https://minecraft.curseforge.com/projects/' + file.projectID,
    function (err, response) {

      if (err) {
        return callback(err);
      }
      if (projectNameReq.uri && projectNameReq.uri.pathname.indexOf('/projects/') !== -1) {
        projectName = projectNameReq.uri.pathname.substr(projectNameReq.uri.pathname.lastIndexOf('/') + 1);
      }

      var downloadStream = request.get('https://minecraft.curseforge.com/projects/' + projectName + '/files/' + file.fileID + '/download');

      downloadStream.on('response', function (res) {
        var contentLength = res.headers['content-length'];
        var fileWriteStream;

        if (downloadStream.uri && downloadStream.uri.pathname.indexOf('.jar') !== -1) {
          filename = decodeURIComponent(downloadStream.uri.pathname.substr(downloadStream.uri.pathname.lastIndexOf('/') + 1));
        }

        var bar = new ProgressBar('Downloading [#' + fileNumber + '] ' + filename + ' [:bar] :percent :etas (' + formatSizeUnits(contentLength) + ')', {
          complete: '=',
          incomplete: ' ',
          width: 30,
          total: parseInt(contentLength)
        });

        //Download progress events
        res.on('data', function (data) {
            bar.tick(data.length);
        });

        //Initiate our file writeStream and add its close listener
        fileWriteStream = fs.createWriteStream(path.join(modPath, filename));
        fileWriteStream.once('close', function () {
          callback();
        });

        //Pipe the download to the file
        downloadStream.pipe(fileWriteStream);
      });
  });
}, function (err) {
  if (err) {
    return console.log('Error downloading files', err);
  }
  console.log('Downloads complete');
});

//Thanks to https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
function formatSizeUnits(bytes){
  if      (bytes>=1000000000) {bytes=(bytes/1000000000).toFixed(2)+' GB';}
  else if (bytes>=1000000)    {bytes=(bytes/1000000).toFixed(2)+' MB';}
  else if (bytes>=1000)       {bytes=(bytes/1000).toFixed(2)+' KB';}
  else if (bytes>1)           {bytes=bytes+' bytes';}
  else if (bytes===1)          {bytes=bytes+' byte';}
  else                        {bytes='0 byte';}
  return bytes;
}
