
> ## 🛠 Status: In Development

# EduGIS-Viewer

EduGIS, http://www.edugis.nl, and http://kaart.edugis.nl is an application to introduce Geographical Information Systems (GIS) to students, without the need to first install software or data.


## Prerequisites
* git
* node with npm  
* file src/keys.js (see [below](#Add-API-keys))

## Get source and dependencies
```bash
# get source from github
git clone [this_repository]
cd this_repository
# add dependencies
npm install
```

## Add API keys
copy `src/keys.js.example` to `src/keys.js`  
and optionally update `src/keys.js` with your keys in order to use services that require such API keys


## Local run and develop
```
npm start
```
If the browser does not open automatically, then click the URL displayed on the terminal

## Build for static http server

```
npm run build
```
The resulting static web files are generated under `build/`


## TODOs

see [issues](https://github.com/edugis-repo/edugis-viewer/issues)