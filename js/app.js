$(document).ready(function () {
    let currentSort = {field: 'publishedAt', ascending: false};
    let videosData = [];
    let tagCounts = {};
    let tagViews = {};
    let topTags = {};

    function getRandomBetween(min, max) {
        return Math.floor(Math.random() * (max - min - 1)) + min + 1;
    }

    function fetchVideosData() {
        return $.getJSON('videos.json', function (data) {
            data.forEach(video => {
                video.daysSincePublished = getDaysSincePublished(video.publishedAt);
                video.daysSinceUpdated = getDaysSincePublished(video.updated_at);
                video.fresh = video.daysSinceUpdated < 1;
                let tagsArray = JSON.parse(video.tags);
                tagsArray.forEach(tag => {
                    tag = tag.trim().toLowerCase();
                    if (tag) {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        tagViews[tag] = (tagViews[tag] || 0) + video.viewCount;
                    }
                });
            });

            let tagCountsForFilterMin = getRandomBetween(1, 5);
            let tagCountsForFilterMax = getRandomBetween(5, 10);

            let filteredTagCounts = Object.entries(tagCounts)
                .filter(([tag, count]) => count < tagCountsForFilterMax &&  count > tagCountsForFilterMin)
                .reduce((acc, [tag, count]) => {
                    acc[tag] = count;
                    return acc;
                }, {});

            let tagScores = Object.keys(filteredTagCounts).map(tag => ({
                tag: tag,
                count: tagCounts[tag],
                totalViews: tagViews[tag],
                score:  tagViews[tag] / tagCounts[tag]
            }));

            tagScores.sort((a, b) => b.score - a.score);
            topTags = tagScores.slice(0, 7);

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
            <img src="${video.thumbnail}" alt="${video.title} " height="150" class="fixed-aspect-ratio float-start me-3">
        </a>
        <div>
            <div class="d-flex justify-content-between align-items-start">
                <a href="https://www.youtube.com/watch?v=${video.videoId}" target="_blank" class="fw-bold title">
                    ${video.title}
                </a>
                <a href="https://studio.youtube.com/video/${video.videoId}/edit" target="_blank" class="btn btn-sm">
                    ${video.fresh ? '<i class="bi bi-pencil-fill"></i>' : '<i class="bi bi-pencil"></i>'}
                </a>
            </div>

            <span class="description">${video.description}</span>
             <span class="tags">${formatTags(video.tags)}</span>
        </div>
    </div>
</td>
                    <td>${formatDuration(video.duration)}</td>
                    <td>${video.viewCount || 0}</td>
                    <td>${video.likeCount || 0}</td>
                    <td>${video.commentCount || 0}</td>
                    <td>${video.daysSincePublished}</td>
                    <td>${video.daysSinceUpdated}</td>
                    <td>${formatPublishedDate(video.publishedAt)}</td>
                </tr>
            `);
        });
    }

    function getDaysSincePublished(dateString) {
        const date = new Date(dateString);
        const now = new Date();

        const options = {timeZone: "Europe/Kiev"};
        const kievNow = new Date(now.toLocaleString("en-US", options));
        const kievDate = new Date(date.toLocaleString("en-US", options));

        const diffTime = kievNow - kievDate;

        return Math.floor(diffTime / (1000 * 60 * 60 * 24));;
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

    function sortVideos(videos, field, ascending) {
        return videos.sort((a, b) => {
            if (field === 'publishedAt') {
                return ascending ? new Date(a[field]) - new Date(b[field]) : new Date(b[field]) - new Date(a[field]);
            }
            if (field === 'updated_at') {
                return ascending ? new Date(a[field]) - new Date(b[field]) : new Date(b[field]) - new Date(a[field]);
            }
            if (a[field] > b[field]) return ascending ? 1 : -1;
            if (a[field] < b[field]) return ascending ? -1 : 1;
            return 0;
        });
    }

    function updateCounters(unfilteredVideos) {

        console.log(unfilteredVideos);

        let totalUnfilteredVideos = unfilteredVideos.length;


        let totalUnfilteredDuration = formatDuration(unfilteredVideos.reduce((sum, video) => sum + (video.duration || 0), 0));
        let oldestDate = unfilteredVideos.reduce((oldest, video) => {
            let videoDate = new Date(video.publishedAt);
            return videoDate < oldest ? videoDate : oldest;
        }, new Date());

        let videos = unfilteredVideos.filter(video => video.viewCount > 0);
        console.log(videos);
        let totalVideos = videos.length;
        let totalDuration = formatDuration(videos.reduce((sum, video) => sum + (video.duration || 0), 0));

        let now = new Date();
        let totalDays = Math.floor((now - oldestDate) / (1000 * 60 * 60 * 24));

        let totalViewCount = videos.reduce((sum, video) => sum + (video.viewCount || 0), 0);
        let totalLikeCount = videos.reduce((sum, video) => sum + (video.likeCount || 0), 0);
        let totalCommentCount = videos.reduce((sum, video) => sum + (video.commentCount || 0), 0);

        let awrViewCount = Math.floor(totalViewCount / totalDays);
        let awrLikeCount = Math.floor(totalLikeCount / totalDays);
        let awrCommentCount = Math.floor(totalCommentCount / totalDays);

        let awr2ViewCount = Math.floor(totalViewCount / totalVideos);
        let awr2LikeCount = Math.floor(totalLikeCount / totalVideos);
        let awr2CommentCount = Math.floor(totalCommentCount / totalVideos);

        let filteredVideos = unfilteredVideos.filter(video => video.updated_at);
        let newestVideo = filteredVideos.reduce((latest, current) => {
            return new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest;
        }, filteredVideos[0]);
        $('#lastUpdated').text(newestVideo?.updated_at || '—');

        $('#totalVideos').text(totalUnfilteredVideos + ' (' + (totalUnfilteredVideos - totalVideos) +')');
        $('#totalDuration').text(totalUnfilteredDuration + ' (' + (formatDuration(unfilteredVideos.reduce((sum, video) => sum + (video.duration || 0), 0)-videos.reduce((sum, video) => sum + (video.duration || 0), 0))) +')');
        $('#totalDays').text(totalDays);
        $('#totalViewCount').text(totalViewCount);
        $('#totalLikeCount').text(totalLikeCount);
        $('#totalCommentCount').text(totalCommentCount);
        $('#awrViewCount').text(awrViewCount);
        $('#awrLikeCount').text(awrLikeCount);
        $('#awrCommentCount').text(awrCommentCount);
        $('#awr2ViewCount').text(awr2ViewCount);
        $('#awr2LikeCount').text(awr2LikeCount);
        $('#awr2CommentCount').text(awr2CommentCount);

        const filterRecent = (days) => videos.filter(video => (now - new Date(video.publishedAt)) <= days * 24 * 60 * 60 * 1000);

        function daysAgo(days) {
            let d = new Date(now);
            d.setDate(d.getDate() - days);
            return d;
        }

        function formatNumber(value) {
            return isNaN(value) ? 0 : value;
        }

        function parseDurationToSeconds(durationStr) {
            if (!durationStr) return 0;
            const parts = durationStr.split(':').map(Number).reverse();
            let seconds = 0;
            if (parts[0]) seconds += parts[0];
            if (parts[1]) seconds += parts[1] * 60;
            if (parts[2]) seconds += parts[2] * 3600;
            return seconds;
        }
        function compareMetrics(current, previous, suffix) {
            function arrow(val, prev) {
                if (val > prev) return ' ↑';
                if (val < prev) return ' ↓';
                return '';
            }

            function set(id, val, prev) {
                $('#' + id + suffix).text(val + arrow(val, prev));
            }
            $('#totalVideos' + suffix).text(current.countTotal + ' (' + current.countSponsored + ')' + arrow(current.countTotal, previous.countTotal));
            const durSecCur = parseDurationToSeconds(current.durationTotal);
            const durSecPrev = parseDurationToSeconds(previous.durationTotal);
            $('#totalDuration' + suffix).text(current.durationTotal + ' (' + current.durationSponsored + ')' + arrow(durSecCur, durSecPrev));
            set('totalDays', current.days, previous.days);
            set('totalViewCount', current.views, previous.views);
            set('totalLikeCount', current.likes, previous.likes);
            set('totalCommentCount', current.comments, previous.comments);
            set('awrViewCount', current.awrView, previous.awrView);
            set('awrLikeCount', current.awrLike, previous.awrLike);
            set('awrCommentCount', current.awrComment, previous.awrComment);
            set('awr2ViewCount', current.awr2View, previous.awr2View);
            set('awr2LikeCount', current.awr2Like, previous.awr2Like);
            set('awr2CommentCount', current.awr2Comment, previous.awr2Comment);
        }


        function getStatsForPeriod(startDate, endDate, days) {
            let vids = videos.filter(video => {
                let date = new Date(video.publishedAt);
                return date >= startDate && date < endDate;
            });

            let vidsUnfiltered = unfilteredVideos.filter(video => {
                let date = new Date(video.publishedAt);
                return date >= startDate && date < endDate;
            });

            let count = vids.length;
            let duration = formatDuration(vids.reduce((sum, v) => sum + (v.duration || 0), 0));
            let views = vids.reduce((sum, v) => sum + (v.viewCount || 0), 0);
            let likes = vids.reduce((sum, v) => sum + (v.likeCount || 0), 0);
            let comments = vids.reduce((sum, v) => sum + (v.commentCount || 0), 0);

            let countTotal = vidsUnfiltered.length;
            let durationTotal = formatDuration(vidsUnfiltered.reduce((sum, v) => sum + (v.duration || 0), 0));
            let countSponsored = vidsUnfiltered.length - vids.length;
            let durationSponsored = formatDuration(vidsUnfiltered.reduce((sum, v) => sum + (v.duration || 0), 0) - vids.reduce((sum, v) => sum + (v.duration || 0), 0));

            return {
                count,
                duration,
                views,
                likes,
                comments,
                days,
                awrView: Math.floor(views / days),
                awrLike: Math.floor(likes / days),
                awrComment: Math.floor(comments / days),
                awr2View: Math.floor(views / Math.max(1, count)),
                awr2Like: Math.floor(likes / Math.max(1, count)),
                awr2Comment: Math.floor(comments / Math.max(1, count)),
                countTotal,
                durationTotal,
                countSponsored,
                durationSponsored,
            };
        }

        const stats30 = getStatsForPeriod(daysAgo(30), now, 30);
        const stats60_30 = getStatsForPeriod(daysAgo(60), daysAgo(30), 30);
        compareMetrics(stats30, stats60_30, '30');

        const stats7 = getStatsForPeriod(daysAgo(7), now, 7);
        const stats14_7 = getStatsForPeriod(daysAgo(14), daysAgo(7), 7);
        compareMetrics(stats7, stats14_7, '7');

    }

    function filterVideos(videos, titleSearch) {
        return videos.filter(video => {
            const matchesTitle = video.title.toLowerCase().includes(titleSearch.toLowerCase());
            const matchesDescription = video.description.toLowerCase().includes(titleSearch.toLowerCase());
            let matchesTags = false;

            if (video.tags) {
                try {
                    let tagsArray = JSON.parse(video.tags);
                    if (Array.isArray(tagsArray)) {
                        matchesTags = tagsArray.some(tag => tag.toLowerCase().includes(titleSearch.toLowerCase()));
                    }
                } catch (e) {
                    console.error("Error parsing tags: ", e);
                }
            }

            return matchesTitle || matchesDescription || matchesTags;
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
        updateAutocomplete(titleSearch);
    }

    function extractUniqueWords(text) {
        return [...new Set(text.match(/[@#][\wа-яА-ЯіІїЇєЄґҐ0-9]+/gu) || [])];
    }

    function getLongWords(text) {
        return (text.match(/[\p{L}\p{N}]{4,}/gu) || []);
    }

    function updateAutocomplete(input) {
        const words = new Set();
        const words2 = new Set();
        const wordsAll = new Set();
        videosData.forEach(video => {
            getLongWords(video.title).forEach(word => {
                wordsAll.add(word)
            });
            getLongWords(video.description).forEach(word => {
                wordsAll.add(word)
            });
            extractUniqueWords(video.title).forEach(word => {
                if (word.startsWith('@') && word !== '@publicandstatic') {
                    words.add(word);
                }
                if (word.startsWith('#') && word !== '#publicandstatic') {
                    words2.add(word);
                }
            });
            extractUniqueWords(video.description).forEach(word => {
                wordsAll.add(word)
                if (word.startsWith('@') && word !== '@publicandstatic') {
                    words.add(word);
                }
                if (word.startsWith('#') && word !== '#publicandstatic') {
                    words2.add(word);
                }
            });

            if (video.tags) {
                try {
                    let tagsArray = JSON.parse(video.tags);
                    if (Array.isArray(tagsArray)) {
                        tagsArray.forEach(tag => {
                            wordsAll.add(tag)
                            if (tag.startsWith('@') && tag !== '@publicandstatic') {
                                words.add(tag);
                            }
                            if (tag.startsWith('#') && tag !== '#publicandstatic') {
                                words2.add(tag);
                            }
                        });
                    }
                } catch (e) {
                    console.error("Error parsing tags: ", e);
                }
            }
        });

        topTags.forEach(tag => {
            words2.add(tag.tag);
        });

        let buttonContainer2 = $('#mention-buttons2');
        if (!buttonContainer2.length) {
            if (words2.size > 8) {
                $('#searchHelper').after('<div id="mention-buttons2" class="m-2 d-flex flex-wrap justify-content-between"></div>');
            } else {
                $('#searchHelper').after('<div id="mention-buttons2" class="m-2 d-flex flex-wrap justify-content-center"></div>');
            }
            buttonContainer2 = $('#mention-buttons2');
        }

        buttonContainer2.empty();
        if (words2.size === 0) {
            buttonContainer2.hide();
        }

        words2.forEach(word => {
            buttonContainer2.append(`<button type="button" class="btn btn-outline-secondary btn-sm m-1 mention-btn">${word}</button>`);
        });
        buttonContainer2.show();

        let buttonContainer = $('#mention-buttons');
        if (!buttonContainer.length) {
            if (words.size > 8) {
                $('#mention-buttons2').after('<div id="mention-buttons" class="m-2 d-flex flex-wrap justify-content-between"></div>');
            } else {
                $('#mention-buttons2').after('<div id="mention-buttons" class="m-2 d-flex flex-wrap justify-content-center"></div>');
            }
            buttonContainer = $('#mention-buttons');
        }

        buttonContainer.empty();
        if (words.size === 0) {
            buttonContainer.hide();
        }

        words.forEach(word => {
            buttonContainer.append(`<button type="button" class="btn btn-outline-secondary btn-sm m-1 mention-btn">${word}</button>`);
        });
        buttonContainer.show();

        if (!input) {
            $('#autocomplete-list').hide();
            return;
        }
        const searchWords = [...wordsAll].filter(word => word.toLowerCase().includes(input.toLowerCase()));

        let autoCompleteList = $('#autocomplete-list');
        autoCompleteList.empty();

        if (searchWords.length === 0) {
            autoCompleteList.hide();
        }

        searchWords.forEach(word => {
            let item = $(`<button type="button">${word}</button>`);
            item.on('click', function () {
                $('#titleSearch').val(word);
                autoCompleteList.hide();
                updateTable();
            });
            autoCompleteList.append(item);
        });

        autoCompleteList.show();
    }

    function formatTags(tags) {
        try {
            let tagsArray = JSON.parse(tags);
            if (Array.isArray(tagsArray)) {
                return tagsArray.map(tag => `<a class="tag-btn">${tag}</a>`).join("     ");
            }
        } catch (e) {
            console.error("Error parsing tags: ", e);
        }
        return "";
    }

    $(document).on('click', '.mention-btn, .tag-btn', function () {
        let currentText = $('#titleSearch').val();
        $('#titleSearch').val($(this).text()).trigger('input');
        updateTable();
    });

    $(document).on('click', '#autocomplete-list button', function () {
        $('#titleSearch').val($(this).text());
        $('#autocomplete-list').hide();
        updateTable();
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#titleSearch, #autocomplete-list').length) {
            $('#autocomplete-list').hide();
        }
    });

    function updateSortIndicators() {
        $('.sortable').removeClass('asc desc');
        if (currentSort.field) {
            const sortColumn = currentSort.field === 'duration' ? '#sortByDuration' :
                currentSort.field === 'viewCount' ? '#sortByViewCount' :
                    currentSort.field === 'likeCount' ? '#sortByLikeCount' :
                        currentSort.field === 'evergreen' ? '#sortByAwrViewCount' :
                            currentSort.field === 'commentCount' ? '#sortByCommentCount' : '#sortByPublishedAt';

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
        $('#sortByAwrViewCount').on('click', function () {
            currentSort.field = 'evergreen';
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
        $('#sortByPublishedAt').on('click', function () {
            currentSort.field = 'publishedAt';
            currentSort.ascending = !currentSort.ascending;
            updateTable();
        });
        $('#sortByDaysAgo').on('click', function () {
            currentSort.field = 'publishedAt';
            currentSort.ascending = !currentSort.ascending;
            updateTable();
        });
        $('#sortByUpdatedAt').on('click', function () {
            currentSort.field = 'updated_at';
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
var interval = 1000 / fps;
var objforDraw = new Array();

document.addEventListener("DOMContentLoaded", function () {
    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame || window
                .webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
            function (callback) {
                return window.setTimeout(callback,
                    1000 / fps)
            }
    })();
    window.cancelRequestAnimFrame = (function () {
        return window.cancelAnimationFrame || window.webkitCancelRequestAnimationFrame ||
            window.mozCancelRequestAnimationFrame ||
            window.oCancelRequestAnimationFrame ||
            window.msCancelRequestAnimationFrame ||
            clearTimeout
    })();
    var ShadowObject = function (color) {
        this.x = ((Math.random() * canvas.width) + 10);
        this.y = ((Math.random() * canvas.height) + 10);
        this.color = color;
        this.size = tamanho;
        this.dirX = Math.random() < 0.5 ? -1 : 1;
        this.dirY = Math.random() < 0.5 ? -1 : 1;
        this.checkIsOut = function () {
            if ((this.x > canvas.width + (this.size /
                2)) || (this.x < 0 - (this.size /
                2))) {
                this.dirX = this.dirX * -1
            }
            ;
            if ((this.y > canvas.height + (this.size /
                2)) || (this.y < 0 - (this.size /
                2))) {
                this.dirY = this.dirY * -1
            }
        };
        this.move = function () {

            this.x += this.dirX * 2;
            this.y += this.dirY * 2

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
            if (ismobile == false) {
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
    document.body.onload = function (e) {
        for (i = 0; i < colors.length * num; i++) {
            var color = ((i >= colors.length) ? colors[(i -
                colors.length)] : colors[i]);
            objforDraw.push(new ShadowObject(color))
        }
        ;
        animloop()
    };
});

document.addEventListener("DOMContentLoaded", function () {
    const thead = document.querySelector("thead");
    const table = document.querySelector("table");

    window.addEventListener("scroll", function () {
        if (table.getBoundingClientRect().top <= 0) {
            thead.classList.add("sticky");
        } else {
            thead.classList.remove("sticky");
        }
    });
});

