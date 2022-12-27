var minderModule = (function () {

    const url = "http://96.126.120.113:8000/graphql";
    const options = {
        body: '',
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        method: "POST"
    }
    const defaultItem = {
        id: "60d36d8739c4ec57b0727874",
        message: "La cantidad de agua diaria recomendada son 2Lt. ¿Qué tal si comenzamos con un vaso?",
        timer_long: 30,
        url_image: "https://media.tenor.com/images/0b631d0205d7248e4c4a76ec03c3ef6e/tenor.gif",
        frequency: "daily"
    };

    const $titleContent = $('.title-habit');
    const $actionContent = $('.action-habit');
    const $timerContent = $('.timer-habit');
    const $timeContent = $('#time');
    const $timerContainer = $('#timer');
    const $imageHabit = $('#img-habit');
    const $videoHabit = $('#video-habit');
    const $imageDiv = $('.img-habit-div');
    const $videoDiv = $('.video-habit-div');
    const $complementaryInfo = $('.complementary-info');

    const $acceptBtn = $('#accept-habit');
    const $rejectBtn = $('#reject-habit');

    const timerReadyClass = 'timer-ready';

    var habitId;
    var storage = {};
    var initializeStorage = function (localStorage) {
        storage = localStorage;
    }

    var getRandomHabitFromAPI = async function () {
        addLoader($titleContent);
        try {
            let query = { "query": `query {habitToDo(userId:"${storage.user.id}"){id,message,timer_long,url_image,url_video,frequency,complementary_information}}` };
            options['body'] = JSON.stringify(query);
            const response = await fetch(url, options);
            const habit = await response.json();
            await showHabit(habit);
        } catch (error) {
            console.error(error);
            $titleContent.text(defaultItem.message);
            $acceptBtn.data(defaultItem.timer_long);
            $timeContent.text(defaultItem.timer_long);
        }
    }

    var showHabit = async (res) => {
        let item = res.data.habitToDo;
        if (!item.timer_long){
            location.reload();
            return;
        }
        habitId = item.id;
        $titleContent.text(item.message);
        $acceptBtn.data("timer", item.timer_long);
        $timeContent.text(item.timer_long);
        if (item.complementary_information){
            $complementaryInfo.html(`
                <p>Para más información sobre este hábito <a href="${item.complementary_information}" target="_blank"> clic aquí</a></p>
                `
            );
        }
        if (item.url_video){
            $videoHabit.attr("src", item.url_video);
            $videoDiv.show();
        } else if (item.url_image){
            $imageHabit.attr("src", item.url_image);
            $imageDiv.show();
        } else {
            $imageHabit.attr("src", defaultItem.url_image);
            $imageDiv.show();
        }
    }

    var acceptHabit = function () {
        $acceptBtn.on("click", function () {
            trackeHabit(habitId, 'Done', storage.user.id);
            let timer = $(this).data("timer");
            $actionContent.hide();
            $timerContent.show();
            counter(timer);
        });
    }

    var rejectHabit = function () {
        $rejectBtn.on("click", function () {
            trackeHabit(habitId, 'Undone', storage.user.id);
            goToBlockedUrl();
        });
    }

    var counter = function (counter = 5) {
        if (!counter) counter = 5;
        var interval = setInterval(function () {
            counter--;
            // Display 'counter' wherever you want to display it.
            if (counter <= 0) {
                clearInterval(interval);
                $timerContainer.html(`
                    <h3>Listo</h3>
                    <p>Desde ahora podrás acceder a las urls por tiempo limitado</p>
                    `
                );
                storage.blocked.forEach(url => {
                    $timerContainer.append(`
                        <li>
                            <a href="http://${url}">${url}</a>
                        </li>
                    `);
                });
                temporarilyEnableUrls();
                return;
            } else {
                $timeContent.text(counter);
            }
        }, 1000);
    }

    var addLoader = function ($content) {
        $content.html('<i class="fa fa-spinner fa-spin"></i>');
    }

    var goToBlockedUrl = function () {
        window.location.href = "http://" + storage.blockedUrl, "_self";
    }

    var temporarilyEnableUrls = function () {
        if (storage.temporarilyEnabled.length == 0) {
            chrome.storage.local.set({ temporarilyEnabled: storage.blocked });
            chrome.storage.local.set({ blocked: [] });
            let currentTime = (new Date()).toJSON();
            chrome.storage.local.set({ doneHabitAt: currentTime });
            chrome.storage.local.set({ dateToAlert: currentTime });
        }
    }

    var trackeHabit = async function (habit, action, user) {
        try {
            let date = dateToDMY(new Date());
            options['body'] = `{
                "query":"mutation createHabitTrack($input: HabitsTrackInput) {createHabitTrack(input: $input) {  id}}",
                "variables":{"input":{
                    "habitSelected":"${habit}",
                    "action":"${action}",
                    "date":"${date}",
                    "user":"${user}"
                }}
            }`;
            const response = await fetch(url, options);
            const id = await response.json();
        } catch (error) {
            console.log(error);
        }
    }

    var dateToDMY = function (date) {
        var d = date.getDate();
        var m = date.getMonth() + 1;
        var y = date.getFullYear();
        return '' + (d <= 9 ? '0' + d : d) + '-' + (m <= 9 ? '0' + m : m) + '-' + y;
    }

    return {
        initializeStorage: initializeStorage,
        getRandomHabitFromAPI: getRandomHabitFromAPI,
        acceptHabit: acceptHabit,
        rejectHabit: rejectHabit,
    }
})();


$(document).ready(function () {
    chrome.storage.local.get(function (data) {
        storage = data;
        init(storage);
    });
});

function init(storage) {
    minderModule.initializeStorage(storage);
    minderModule.getRandomHabitFromAPI();
    minderModule.acceptHabit();
    minderModule.rejectHabit();
};
