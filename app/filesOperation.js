var request = require("request");
var progress = require("request-progress");
var http = require("http");
var fs = require("fs");
var path = require("path");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const URL = "http://cdn.tekus.co/Media/";
const fileName = path.join(__dirname, "public/Media/data.json");


getUrlJsonFiles = function (callback) {
    return new Promise((done,reject) => {
        console.log("Getting JSON URL...");
        http.get(URL, function (response) {
            response.on("data", (a) => {
                var document = (new JSDOM(a)).window.document;
                var htmlFiles = document.querySelectorAll("a");
                var resu = [];
                for (var i = 1; i < htmlFiles.length; i++) {
                    var name = htmlFiles[i].innerHTML;
                    var type = typeFiles(name);
                    if (type == "VIDEO" || type == "IMAGE") {
                        resu.push({ FILE: name, TYPE: type })
                    }
                }    
                done(resu);
            });
        }).on('error', (err) => {
            reject(err.message);
        })
    })
}


function typeFiles(fname) {
    var ext = fname.toString().slice((Math.max(0, fname.lastIndexOf(".")) || Infinity) + 1);
    switch (ext) {
        case "avi":
        case "flv":
        case "m4v":
        case "mov":
        case "mp4":
        case "mpg":
        case "rm":
        case "swf":
        case "vob":
        case "wmv":
            return "VIDEO"
            break;
        case "jpg":
        case "png":
        case "bmp":
        case "gif":
            return "IMAGE"
            break;
    }
}

getJsonFiles = function () {
    return new Promise(function (done) {
        console.log("Get Json Local..");
        return fs.readFile(fileName, 'utf-8', function (err, data) {
            if (err) {
                done([]);
            } else if (data != "") {
                done(JSON.parse(data));
            } else {
                done([]);
            }
        });
    });
}

operationFiles = function (socket) {
    return new Promise((done, reject) => {
        console.log("started operation...");
        getUrlJsonFiles().then((URLfiles) => {
            getJsonFiles().then((localFiles) => {
                let resu = JSON.parse(JSON.stringify(localFiles));
                if (localFiles.length > 0) {
                    for (var i in localFiles) {
                        if (URLfiles.filter(x => x.FILE == localFiles[i].FILE).length == 0) {
                            resu.splice(resu.findIndex(x => x.FILE == localFiles[i].FILE), 1);
                            removeLocalFiles(localFiles[i].FILE);
                        }
                    }
                }
                var newFiles = [];
                for (var i in URLfiles) {
                    if (localFiles.filter(x => x.FILE == URLfiles[i].FILE).length == 0) {
                        newFiles.push(URLfiles[i]);
                        resu.push(URLfiles[i]);
                    }
                }
                if (newFiles.length != 0) {
                    saveLocalFiles(newFiles, socket).then(() => {
                        console.log("finally sync...");
                        fs.writeFile(fileName, JSON.stringify(resu), () => {
                            done(JSON.stringify(resu));
                        });
                    });
                } else {
                    fs.writeFile(fileName, JSON.stringify(resu), () => {
                        done(JSON.stringify(resu));
                    });
                    done(JSON.stringify(resu));
                };
            })
        });

    });
}

function removeLocalFiles(a) {
    fs.unlink(path.join(__dirname, "public/Media/" + a));
}

function saveLocalFiles(files, socket) {
    return new Promise(function (done, reject) {
        console.log("saving files..")
        var cont = 0;
        var percent = 0;
        var status = { PERCENTAGE: 0, FILES: files.length, DOWNLOADS: 0 };
        var finalPercent = 0;
        var donwload = function () {
            var file = fs.createWriteStream(path.join(__dirname, "public/Media/" + files[cont].FILE));

            progress(request(URL + files[cont].FILE))
                .on('progress', state => {
                    state.percent = state.percent * 100;
                    if (state.percent != 0) {
                        percent = (Math.round(state.percent) / files.length);
                        status.PERCENTAGE = finalPercent + percent;
                        status.DOWNLOADS = cont;
                        socket.sendStatus(JSON.stringify(status));
                    }
                })
                .on('error', function (err) { console.log(err) })
                .on('end', () => {
                    console.log("ends -->" + files[cont].FILE + " uploads files " + (parseInt(cont) + 1));
                    cont += parseInt(1);
                    finalPercent += percent;
                    status.DOWNLOADS = cont;
                    if (cont == files.length) {
                        status.PERCENTAGE = 100;
                        socket.sendStatus(JSON.stringify(status));
                        done();
                    } else {
                        socket.sendStatus(JSON.stringify(status));
                        donwload();
                    }
                })
                .pipe(file);
        }
        donwload();
    });
}


module.exports = { operationFiles }