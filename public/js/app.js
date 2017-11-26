$("document").ready(function () {
    var URL = 'http://localhost:3000';
    var socket = io.connect(URL);
    socket.on("status", function (a) {
        $(".container-loading").addClass("active");
        $(".slider").removeClass("active");
        $(".container-message").removeClass("active");
        $(".slider").html("");
        var status = JSON.parse(a);
        $(".status").text("Sincronizando.. " + Math.round(status.PERCENTAGE) + "% / " + status.DOWNLOADS + " de " + status.FILES)
        $(".determinate").width(status.PERCENTAGE + "%");
    });
    socket.on("data", (a) => {
        $(".container-loading").removeClass("active");
        $(".slider").addClass("active");
        startAnimation(JSON.parse(a));
    })

    $(".full-screen").click(function () {
        if (isFullScreen()) {
            $(this).children("i").text("fullscreen");
            exitFullScreen();
        }
        else {
            $(this).children("i").text("fullscreen_exit");
            requestFullScreen(document.documentElement);
        }
    });

    function isFullScreen() {
        return (document.fullScreenElement && document.fullScreenElement !== null)
            || document.mozFullScreen
            || document.webkitIsFullScreen;
    }

    function requestFullScreen(element) {
        if (element.requestFullscreen)
            element.requestFullscreen();
        else if (element.msRequestFullscreen)
            element.msRequestFullscreen();
        else if (element.mozRequestFullScreen)
            element.mozRequestFullScreen();
        else if (element.webkitRequestFullscreen)
            element.webkitRequestFullscreen();
    }

    function exitFullScreen() {
        if (document.exitFullscreen)
            document.exitFullscreen();
        else if (document.msExitFullscreen)
            document.msExitFullscreen();
        else if (document.mozCancelFullScreen)
            document.mozCancelFullScreen();
        else if (document.webkitExitFullscreen)
            document.webkitExitFullscreen();
    }

    function startAnimation(data) {
        if (data.length != 0) {
            $(".container-message").removeClass("active");
            var i = 0;
            var changeSlide = function () {
                $(".slider").html("");
                if ($(".slider").hasClass("active")) {
                    var file = data[i];
                    var fileName = URL + "/Media/" + file.FILE;
                    if (file.TYPE == "IMAGE") {
                        duration = 10;
                        if (file.FILE == "Tekus_BG1.jpg") {
                            duration = 5;
                        }
                        $(".slider").append("<img src='" + fileName + "' class='slide'/>");
                        setTimeout(changeSlide, duration * 1000);
                    } else {
                        duration = 0;
                        if (file.FILE == "Cronometro.mp4") {
                            duration = 60;
                        }

                        var video = document.createElement("video");
                        video.src = fileName;
                        if (duration == 0) {
                            video.addEventListener("ended", function () {
                                video.pause();
                                video.currentTime = 0;
                                changeSlide();
                            })
                        } else {
                            video.addEventListener("timeupdate", function () {
                                if (video.currentTime >= duration) {
                                    video.pause();
                                    video.currentTime = 0;
                                    changeSlide();
                                }
                            }, false)
                        }
                        $(".slider")[0].appendChild(video);
                        video.play();
                    }
                    i += 1
                    if (i == data.length) {
                        i = 0;
                    }
                }
            }
            changeSlide();
        } else {
            $(".container-message").addClass("active");
        }
    }
});