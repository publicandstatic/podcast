$(document).ready(function () {
    let currentSort = {field: 'publishedAt', ascending: false};
    let videosData = [];

    function fetchVideosData() {
        return $.getJSON('videos.json', function (data) {
            videosData = data;
            updateCounters(videosData);
            init();
        });
    }

    function renderTable(videos) {
        const tableBody = $('#videoTable');
        tableBody.empty();

        videos.forEach(video => {
            tableBody.append(`
                <tr>
               <td>
    <div class="clearfix">
        <a href="https://www.youtube.com/watch?v=${video.videoId}" target="_blank">
            <img src="${video.thumbnail}" alt="${video.title}" height="150" class="float-start me-3">
        </a>

        <div>
            <div class="d-flex justify-content-between align-items-start">
                <a href="https://www.youtube.com/watch?v=${video.videoId}" target="_blank" class="fw-bold title">
                    ${video.title}
                </a>
                <a href="https://studio.youtube.com/video/${video.videoId}/edit" target="_blank" class="btn btn-link btn-sm">
                    <i class="bi bi-pencil"></i>
                </a>
            </div>

            <span class="description">${getDescriptionPreview(video.description)}</span>
        </div>
    </div>
</td>

                    <td>${formatDuration(video.duration)}</td>
                    <td>${video.viewCount || 0}</td>
                    <td>${video.likeCount || 0}</td>
                    <td>${video.commentCount || 0}</td>
                    <td>${getDaysSincePublished(video.publishedAt)}</td>
                    <td>${formatPublishedDate(video.publishedAt)}</td>
                </tr>
            `);
        });
    }

    function getDaysSincePublished(dateString) {
        const date = new Date(dateString); // Перетворюємо строку у Date
        const now = new Date(); // Поточний час

        // Встановлюємо Київський часовий пояс (Europe/Kiev)
        const options = { timeZone: "Europe/Kiev" };
        const kievNow = new Date(now.toLocaleString("en-US", options));
        const kievDate = new Date(date.toLocaleString("en-US", options));

        // Рахуємо кількість днів між датами
        const diffTime = kievNow - kievDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }


    function formatPublishedDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString("uk-UA", {
            timeZone: "Europe/Kiev",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }

    function getDescriptionPreview(description) {
        // if (!description) return '';
        // const parts = description.split("\n\n");
        // return parts[0] + '\n' + parts[1] + '\n' + parts[2] || '';
        return description;
    }

    function sortVideos(videos, field, ascending) {
        return videos.sort((a, b) => {
            if (field === 'publishedAt') {
                return ascending ? new Date(a[field]) - new Date(b[field]) : new Date(b[field]) - new Date(a[field]);
            }
            if (a[field] > b[field]) return ascending ? 1 : -1;
            if (a[field] < b[field]) return ascending ? -1 : 1;
            return 0;
        });
    }
    function updateCounters(videos) {
        let totalVideos = videos.length;
        let totalDuration = formatDuration(videos.reduce((sum, video) => sum + (video.duration || 0), 0));
        let totalViewCount = videos.reduce((sum, video) => sum + (video.viewCount || 0), 0);
        let totalLikeCount = videos.reduce((sum, video) => sum + (video.likeCount || 0), 0);
        let totalCommentCount = videos.reduce((sum, video) => sum + (video.commentCount || 0), 0);

        $('#totalVideos').text(totalVideos);
        $('#totalDuration').text(totalDuration);
        $('#totalViewCount').text(totalViewCount);
        $('#totalLikeCount').text(totalLikeCount);
        $('#totalCommentCount').text(totalCommentCount);
    }

    function filterVideos(videos, titleSearch) {
        return videos.filter(video => {
            const matchesTitle = video.title.toLowerCase().includes(titleSearch.toLowerCase());
            const matchesDescription = video.description.toLowerCase().includes(titleSearch.toLowerCase());
            return matchesTitle || matchesDescription;
        });
    }

    function updateTable() {
        const titleSearch = $('#titleSearch').val();
        let filteredVideos = filterVideos(videosData, titleSearch);
        if (currentSort.field) {
            filteredVideos = sortVideos(filteredVideos, currentSort.field, currentSort.ascending);
        }
        renderTable(filteredVideos);
        updateSortIndicators();
    }

    function updateSortIndicators() {
        $('.sortable').removeClass('asc desc');
        if (currentSort.field) {
            const sortColumn = currentSort.field === 'duration' ? '#sortByDuration' :
                currentSort.field === 'viewCount' ? '#sortByViewCount' :
                    currentSort.field === 'likeCount' ? '#sortByLikeCount' :
                            currentSort.field === 'commentCount' ? '#sortByCommentCount' : '#sortByCommentPublishedAt';

            if (sortColumn) {
                $(sortColumn).addClass(currentSort.ascending ? 'asc' : 'desc');
            }
        }
    }

    function init() {
        updateTable();
        $('#titleSearch').on('input', updateTable);
        $('#sortByDuration').on('click', function () {
            currentSort.field = 'duration';
            currentSort.ascending = !currentSort.ascending;
            updateTable();
        });
        $('#sortByViewCount').on('click', function () {
            currentSort.field = 'viewCount';
            currentSort.ascending = !currentSort.ascending;
            updateTable();
        });
        $('#sortByLikeCount').on('click', function () {
            currentSort.field = 'likeCount';
            currentSort.ascending = !currentSort.ascending;
            updateTable();
        });
        $('#sortByCommentCount').on('click', function () {
            currentSort.field = 'commentCount';
            currentSort.ascending = !currentSort.ascending;
            updateTable();
        });
        $('#sortByCommentPublishedAt').on('click', function () {
            currentSort.field = 'publishedAt';
            currentSort.ascending = !currentSort.ascending;
            updateTable();
        });
        $('#sortByDaysAgo').on('click', function () {
            currentSort.field = 'publishedAt';
            currentSort.ascending = !currentSort.ascending;
            updateTable();
        });
    }

    function formatDuration(seconds) {
        if (isNaN(seconds) || seconds < 0) return "0:00";

        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        return (hrs > 0 ? hrs + ":" : "") +
            (mins < 10 && hrs > 0 ? "0" : "") + mins + ":" +
            (secs < 10 ? "0" : "") + secs;
    }

    fetchVideosData();
});

var canvas = document.getElementById('background-сanvas');
var context = canvas.getContext('2d');
var colors = ["#00bfcb", "#18d3bc", "#5b82c8", "#3396cf"];
var fps = 15;
var now;
var then = Date.now();
var num = 2;
var delta;
var tamanho = 50;
var ismobile = false;
var varpi = 2 * Math.PI;
var interval = 1000/fps;
var objforDraw = new Array();

document.addEventListener("DOMContentLoaded", function() {
    window.requestAnimFrame = (function() {
        return window.requestAnimationFrame || window
                .webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
            function(callback) {
                return window.setTimeout(callback,
                    1000 / fps)
            }
    })();
    window.cancelRequestAnimFrame = (function() {
        return window.cancelAnimationFrame || window.webkitCancelRequestAnimationFrame ||
            window.mozCancelRequestAnimationFrame ||
            window.oCancelRequestAnimationFrame ||
            window.msCancelRequestAnimationFrame ||
            clearTimeout
    })();
    var ShadowObject = function(color) {
        this.x = ((Math.random() * canvas.width) + 10);
        this.y = ((Math.random() * canvas.height) + 10);
        this.color = color;
        this.size = tamanho;
        this.dirX = Math.random() < 0.5 ? -1 : 1;
        this.dirY = Math.random() < 0.5 ? -1 : 1;
        this.checkIsOut = function() {
            if ((this.x > canvas.width + (this.size /
                2)) || (this.x < 0 - (this.size /
                2))) {
                this.dirX = this.dirX * -1
            };
            if ((this.y > canvas.height + (this.size /
                2)) || (this.y < 0 - (this.size /
                2))) {
                this.dirY = this.dirY * -1
            }
        };
        this.move = function() {

            this.x += this.dirX*2;
            this.y += this.dirY*2

        }
    };

    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        var len = objforDraw.length;
        for (i = 0; i < len; i++) {
            context.beginPath();
            context.arc(objforDraw[i].x, objforDraw[i].y, objforDraw[i].size, 0, varpi, false);
            context.fillStyle = objforDraw[i].color;
            context.shadowColor = objforDraw[i].color;
            if(ismobile == false){
                context.shadowBlur = 50;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
            }
            context.fill();
            objforDraw[i].checkIsOut();
            objforDraw[i].move()
        }
    };

    function animloop() {
        requestAnimFrame(animloop);
        now = Date.now();
        delta = now - then;
        if (delta > interval) {
            draw();
            then = now - (delta % interval)
        }
    };
    document.body.onload = function(e) {
        for (i = 0; i < colors.length * num; i++) {
            var color = ((i >= colors.length) ? colors[(i -
                colors.length)] : colors[i]);
            objforDraw.push(new ShadowObject(color))
        };
        animloop()
    };
});
