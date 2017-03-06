# curseDownloader
Automatically downloads all mod dependencies for a given curse project manifest.json. I made this because I didn't want to make a curse account and run their client, and [the python version made by portablejim](https://github.com/portablejim/curseDownloader) didn't work for me.

#Requirements
* [Node.js](https://nodejs.org/)

# Setup
```
git clone git@github.com:unusualbob/curseDownloader.git
cd curseDownloader
npm install
```
# Usage
```
node dl.js /path/to/mod/manifest.json
```

This downloader will attempt to download all mods to the `/path/to/mod/mods` directory. It will create the `mods` directory if it doesn't already exist. This downloader will also never check for existing files, it will replace any mod in the mods directory if one exists by the same name.

If you think a feature would be useful you can request them via the issues page, but I can't promise anything.
