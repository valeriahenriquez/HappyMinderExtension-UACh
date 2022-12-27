var optionsModule = (function () {

    const url = "http://96.126.120.113:8000/graphql";
    const options = {
        body: '',
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        method: "POST"
    }

    const $primaryContent = $('#primary-content');
    const $loginContent = $('#login-content');
    const $userIdProfile = $('#user-id');
    const $userNameProfile = $('#user-name');

    const $habitsMenu = $('.habits');
    const $linksMenu = $('.links');
    const $profileMenu = $('.profile');
    const $formMenu = $('.form');

    const $habitsBtn = $('#show-habits');
    const $linksBtn = $('#show-links');
    const $profileBtn = $('#show-profile');
    const $formBtn = $('#show-form');
    const onBtnClass = 'bg-color-dark';
    const offBtnClass = 'bg-color-lighter';
    const $saveCategoryBtn = $('#category-save');

    const $categoryList = $('#category-habits');

    const $urlDataTable = $('#t-url');
    const $urlInput = $('#input-url');
    const $freeTimeInput = $('#input-free-time');
    const $alertTimeInput = $('#input-alert-time');

    var allUserCategories;

    var storage = {};
    var initializeStorage = function (localStorage) {
        storage = localStorage;
    }

    var showCategoriesMenu = function () {
        $habitsMenu.show();
        $habitsBtn.removeClass(offBtnClass);
        $habitsBtn.addClass(onBtnClass);

        $linksMenu.hide();
        $linksBtn.addClass(offBtnClass);
        $linksBtn.removeClass(onBtnClass);

        $profileMenu.hide();
        $profileBtn.addClass(offBtnClass);
        $profileBtn.removeClass(onBtnClass);

        $formMenu.hide();
        $formBtn.addClass(offBtnClass);
        $formBtn.removeClass(onBtnClass);
    };

    var showLinksMenu = function () {
        $habitsMenu.hide();
        $habitsBtn.addClass(offBtnClass);
        $habitsBtn.removeClass(onBtnClass);

        $linksMenu.show();
        $linksBtn.removeClass(offBtnClass);
        $linksBtn.addClass(onBtnClass);

        $profileMenu.hide();
        $profileBtn.addClass(offBtnClass);
        $profileBtn.removeClass(onBtnClass);

        $formMenu.hide();
        $formBtn.addClass(offBtnClass);
        $formBtn.removeClass(onBtnClass);
    };

    var showProfileMenu = function () {
        $habitsMenu.hide();
        $habitsBtn.addClass(offBtnClass);
        $habitsBtn.removeClass(onBtnClass);

        $linksMenu.hide();
        $linksBtn.addClass(offBtnClass);
        $linksBtn.removeClass(onBtnClass);

        $profileMenu.show();
        $profileBtn.removeClass(offBtnClass);
        $profileBtn.addClass(onBtnClass);

        $formMenu.hide();
        $formBtn.addClass(offBtnClass);
        $formBtn.removeClass(onBtnClass);
    };

    var showFormMenu = function () {
        $habitsMenu.hide();
        $habitsBtn.addClass(offBtnClass);
        $habitsBtn.removeClass(onBtnClass);

        $linksMenu.hide();
        $linksBtn.addClass(offBtnClass);
        $linksBtn.removeClass(onBtnClass);

        $profileMenu.hide();
        $profileBtn.addClass(offBtnClass);
        $profileBtn.removeClass(onBtnClass);

        $formMenu.show();
        $formBtn.removeClass(offBtnClass);
        $formBtn.addClass(onBtnClass);
    };

    var loadContentByUser = function () {
        if (storage.user) {
            $primaryContent.show();
            $loginContent.hide();
            $userIdProfile.html(storage.user.id);
            $userNameProfile.html(storage.user.name);
        } else {
            $primaryContent.hide();
            $loginContent.show();
            $loginContent.html(
                `
                <div class="form-group">
                    <input type="text" class="form-control" id="username" placeholder="Ingresa tu nombre">
                </div>
                <button id="login-in" type="button" class="btn btn-secondary">
                    Ingresar
                </button>
                `
            );
            $('#login-in').on("click", function () { createUser() })
        }
    }

    var createUser = async function () {
        try {
            let username = $('#username').val();
            if (username.length == 0) username = 'user';
            options['body'] = `{"query":"mutation createNewUser($input: UserInput) {createNewUser(input: $input) {id, user_name}}","variables":{"input":{"user_name":"${username}"}}}`;
            const response = await fetch(url, options);
            const user = await response.json();
            await registerUserStorage(user);
        } catch (error) {
            console.log(error);
            $loginContent.html(
                `<div class="alert alert-danger" role="alert">
                Sin conexión
                </div>`
            );
        }
    }

    var registerUserStorage = async (user) => {
        let idUser = user.data.createNewUser.id;
        let nameUser = user.data.createNewUser.user_name;
        chrome.storage.local.set({ user: { id: idUser, name: nameUser } }, function () {
            console.log('User ID is set to ' + idUser);
        });
        location.reload();
    }

    var fetchCategories = async function () {
        try {
            options['body'] = '{"query":"{desiredImpacts}"}';
            const response = await fetch(url, options);
            const categories = await response.json();
            await showCategories(categories);

            let query = { "query": `query {desiredImpactsByUser (userId:"${storage.user.id}")}` };
            options['body'] = JSON.stringify(query);
            const r = await fetch(url, options);
            const userCategories = await r.json();
            await selectUserCategories(userCategories);

        } catch (error) {
            console.error(error)
            $saveCategoryBtn.prop("disabled", true);
            $categoryList.html(
                `<div class="alert alert-danger" role="alert">
                Sin conexión
                </div>`
            );
        }
    }

    var showCategories = async (categories) => {
        let items = [];
        let count = 1;
        $saveCategoryBtn.prop("disabled", false);
        categories.data.desiredImpacts.forEach((category) => {
            if (category !== null){
                let id = "category" + count;
                items.push(
                    `<div class="funkyradio-default">
                    <input type="checkbox" name="checkbox" class="category-checkbox" id="${id}" value="${category}"/>
                    <label for="${id}">${category}</label>
                    </div>`
                );
                count += 1;
            }
        });
        $categoryList.html(items.join(''));
    };

    var selectUserCategories = async (categories) => {
        allUserCategories = categories.data.desiredImpactsByUser;
        categories.data.desiredImpactsByUser.forEach((category) => {
            $(`:checkbox[value="${category}"]`).prop('checked', true);
        });
    };

    var saveCategoryUser = function () {
        let selectedCategories = [];
        $('.category-checkbox:checked').each(function (i) {
            selectedCategories[i] = $(this).val();
        });
        let add = selectedCategories.filter(x => !allUserCategories.includes(x));
        let remove = allUserCategories.filter(x => !selectedCategories.includes(x));

        add.forEach((category) => {
            createHabitsUser(storage.user.id, category);
        });
        remove.forEach((category) => {
            removeHabitsUser(storage.user.id, category);
        });
        $.notify("Guardado exitosamente", "success");
    };

    var createHabitsUser = async function (user, category) {
        try {
            options['body'] = `{
                "query":"mutation createHabitsUser ($input: HabitsDesiredImpactInput){createHabitsUser(input:$input)}",
                "variables":{"input":{"user":"${user}","desiredImpact":"${category}"}}
            }`;
            const response = await fetch(url, options);
            const id = await response.json();
        } catch (error) {
            console.error(error);
        }
    }

    var removeHabitsUser = async function (user, category) {
        try {
            options['body'] = `{
                "query":"mutation deleteHabitsUserByCategory ($input: HabitsDesiredImpactInput){deleteHabitsUserByCategory(input:$input)}",
                "variables":{"input":{"user":"${user}","desiredImpact":"${category}"}}
            }`;
            const response = await fetch(url, options);
            const id = await response.json();
        } catch (error) {
            console.error(error);
        }
    }

    var initializeUrlDataTable = function () {
        let items = [];
        storage.blocked.forEach(url => {
            items.push(`
            <tr>
                <td>${url}</td>
                <td>
                    <button type="button" data-url="${url}" class="btn btn-sm btn-secondary remove-url">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
            `)
        });
        if (items.length > 0) {
            $('#tbody-url').html(items.join(''));
        }
        $urlDataTable.DataTable({
            "lengthChange": false,
            "pageLength": 5,
        });
        $('.remove-url').on("click", function () { removeUrl($(this).data('url')) });
    }

    var saveUrl = function () {
        var url = $urlInput.val();
        url = url.replace("https://", "");
        url = url.replace("http://", "");
        url = url.replace("www.", "");
        blockedUrl = storage.blocked;
        blockedUrl.push(url);
        chrome.storage.local.set({ blocked: blockedUrl });
        location.reload();
    };

    var removeUrl = function (url) {
        blockedUrl = storage.blocked;
        const index = blockedUrl.indexOf(url);
        if (index > -1) {
            blockedUrl.splice(index, 1);
        }
        chrome.storage.local.set({ blocked: blockedUrl });
        location.reload();
    };

    var initializeFreeTimeModal = function () {
        $freeTimeInput.val(storage.freeTime)
    };

    var updateFreeTime = function () {
        const freeTime = $freeTimeInput.val();
        chrome.storage.local.set({ freeTime: freeTime });
        location.reload();
    };

    var initializeAlertTimeModal = function () {
        $alertTimeInput.val(storage.alertTime);
    };

    var updateAlertTime = function () {
        const alertTime = $alertTimeInput.val();
        chrome.storage.local.set({ alertTime: alertTime });
        location.reload();
    };

    var tripettoForm = function () {
        var tripetto = TripettoServices.init({
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiS0IrZnJXNENlRDZwYVFQdXZZb1lmcDZDdVRtUnNDVy9QWFI5c2RYR1lGMD0iLCJkZWZpbml0aW9uIjoiY0VpTmtSUU5WcUovdThtMHAwY2U3b3BwNnFyZUdPWVo3MlZiTmRVdytUND0iLCJ0eXBlIjoiY29sbGVjdCJ9.GH822_qVmo2etby6lxYPJoyjn-2kT0Fy4RuVor69spU"
        });

        TripettoChat.run({
        element: document.getElementById("tripetto"),
        definition: tripetto.definition,
        styles: tripetto.styles,
        l10n: tripetto.l10n,
        locale: tripetto.locale,
        translations: tripetto.translations,
        attachments: tripetto.attachments,
        onSubmit: tripetto.onSubmit
        });
    };

    return {
        initializeStorage: initializeStorage,
        showCategories: showCategoriesMenu,
        showLinks: showLinksMenu,
        showProfile: showProfileMenu,
        showForm: showFormMenu,
        fetchCategories: fetchCategories,
        loadContentByUser: loadContentByUser,
        createUser: createUser,
        saveCategoryUser: saveCategoryUser,
        initializeUrlDataTable: initializeUrlDataTable,
        saveUrl: saveUrl,
        removeUrl: removeUrl,
        initializeFreeTimeModal: initializeFreeTimeModal,
        updateFreeTime: updateFreeTime,
        initializeAlertTimeModal: initializeAlertTimeModal,
        updateAlertTime: updateAlertTime,
        tripettoForm: tripettoForm,
    };
})();

$(document).ready(function () {
    chrome.storage.local.get(function (data) {
        storage = data;
        init(storage);
        optionsModule.tripettoForm();
    });
});

function init(storage) {
    optionsModule.initializeStorage(storage);
    $('#show-habits').on("click", function () { optionsModule.showCategories() });
    $('#show-links').on("click", function () { optionsModule.showLinks() });
    $('#show-profile').on("click", function () { optionsModule.showProfile() });
    $('#show-form').on("click", function () { optionsModule.showForm() });
    $('#category-save').on("click", function () { optionsModule.saveCategoryUser() });
    $('#add-url').on("click", function () { optionsModule.saveUrl() });
    $('#modal-set-free-time').on('shown.bs.modal', function () { optionsModule.initializeFreeTimeModal() });
    $('#update-free-time').on("click", function () { optionsModule.updateFreeTime() });
    $('#modal-set-alert-time').on('shown.bs.modal', function () { optionsModule.initializeAlertTimeModal() });
    $('#update-alert-time').on("click", function () { optionsModule.updateAlertTime() });
    optionsModule.loadContentByUser();
    optionsModule.fetchCategories();
    optionsModule.initializeUrlDataTable();
}
