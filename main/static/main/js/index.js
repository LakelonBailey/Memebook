// Toggle like on a meme element
const toggleLike = async likeEl => {
    // Gather elements
    const likeData = likeEl.data();
    const likeIcon = likeEl.find('i');

    // Gather like count
    let likeCount = parseInt(likeEl.find('.like-count').text());

    // Handle add like
    if (likeData.action == 'add') {
        // Adjust icon style
        likeIcon.removeClass('fa-regular').addClass('fa-solid');

        // Increment like count and adjust action property
        likeCount++;
        likeEl.data('action', 'delete');

        // Add like
        sendPost('/likes/', {
            meme_uuid: likeData.memeuuid
        });
    }

    // Handle remove like
    else {

        // Adjust icon style
        likeIcon.removeClass('fa-solid').addClass('fa-regular');

        // Decrement like count and adjust action property
        likeCount--;
        likeEl.data('action', 'add');

        // Delete like
        sendDelete('/likes/', {
            meme_uuid: likeData.memeuuid
        });
    }

    // Set new like count
    likeEl.find('.like-count').text(likeCount.toString());
}

// Given a container and list of memes, display all memes in a consistent format
const listMemes = (el, memes) => {
    el.append(memes.map(memeListItem).join(''));
}

// Create element string for meme list item
const memeListItem = meme => {
    return `
    <div class="meme-list-item">
        <a class="section-load" data-section="view-meme" data-meme_uuid="${meme.uuid}">
            <img src="${meme.image}">
        </a>
        <div class="meme-info">
            <a class="section-load" data-section="profile" data-profileuuid="${meme.profile.uuid}">
                ${meme.profile.first_name} ${meme.profile.last_name}
            </a>
            <div class="meme-info-icons">
                <p class="like-meme" data-memeuuid="${meme.uuid}" data-action="${meme.liked_by_user ? 'delete' : 'add'}"><i class="${meme.liked_by_user ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: #ff0000;"></i> <span class="like-count">${meme.like_count}</span></p>
                <p><i class="${meme.commented_by_user ? 'fa-solid' : 'fa-regular'} fa-comment" style="color: gray;"></i> <span>${meme.comment_count}</span></p>
            </div>
        </div>
    </div>
    `
}

const generateFriendList = async profiles => {
    // Generate the HTML elements for each search result profile
    let profileEls = [];
    for (let profile of profiles) {
        // Load the friendship status button for the profile
        const friendStatusEl = await loadFriendshipStatusButton({
            el: $('<div></div>'),
            profile: profile,
        });

        // Construct the HTML element for the search result profile
        profileEls.push(`
             <div class="search-list-item">
                 <div>
                     <a class="section-load" data-section="profile" data-profileuuid="${profile.uuid}">${profile.first_name} ${profile.last_name}</a>
                 </div>
                 <div class="friendship-status-buttons">
                     ${friendStatusEl.html()}
                 </div>
             </div>
         `);
    }

    // Convert the HTML elements to strings and display them
    profileEls = await Promise.all(profileEls);
    return profileEls;
}
/***************************
Friendship Status Functions
****************************/

// Respond to friend request
const decideFriendship = async decisionData => {
    await sendPost('/decide-friendship/', decisionData);
}

// Send friend request
const requestFriend = async friendData => {
    await sendPost('/request-friendship/', friendData);
}

// Remove existing friend
const removeFriend = async friendData => {
    await sendPost('/remove-friend/', friendData);
}

// Cancel friend request
const cancelFriendRequest = async friendData => {
    await sendPost('/cancel-friend-request/', friendData);
}


// Load a friendship status button in to the given container based
// on the current friendship status between the authenticated user
// and the provided profile
const loadFriendshipStatusButton = async ({ el, profile, profileUUID, reloadProfile } = { reloadProfile: true }) => {

    // Ignore if invalid el
    if (el == undefined) {
        return;
    }

    // Ignore if no profile indicator is provided
    if (profileUUID == undefined && profile == undefined) {
        return;
    }

    // Retrieve friendship status and friend profile using profile UUID
    if (profileUUID && profile == undefined) {
        const response = await sendGet(`/friendship-status/${profileUUID}/`);
        if (!response.ok) {
            return;
        }
        profile = response.data;
    }

    // Develop status button based on friendship status
    let buttonEl;
    if (profile.is_friend) {
        buttonEl = `
        <button class="button is-small remove-friend-button" data-friend_uuid="${profile.uuid}">
            <span class="icon">
              <i class="fa-solid fa-xmark"></i>
            </span>
            <span>Remove Friend</span>
        </button>
        `
    }
    else if (profile.user_requested_friendship) {
        buttonEl = `
        <button class="button is-small friend-request-button" data-action="cancel" data-requestee_uuid="${profile.uuid}">
            <span class="icon">
            <i class="fa-solid fa-xmark"></i>
            </span>
            <span>Cancel Request</span>
        </button>
        `;
    }
    else if (profile.requested_user_friendship) {
        buttonEl = `
        <div class="field friendship-decision-cont">
            <label class="label is-small">${profile.first_name} wants to be your friend:</label>
            <div class="buttons">
                <button class="button is-small friendship-decision-button is-success" data-action="accept" data-requester_uuid="${profile.uuid}">Accept</button>
                <button class="button is-small friendship-decision-button" data-action="ignore" data-requester_uuid="${profile.uuid}">Ignore</button>
            </div>
        </div>
        `;
    }
    else {
        buttonEl = `
        <button class="button is-small friend-request-button is-success" data-action="request" data-requestee_uuid="${profile.uuid}">
            <span class="icon">
              <i class="fa-solid fa-plus"></i>
            </span>
            <span>Add Friend</span>
        </button>
        `
    }

    // Fill element with status button
    el.html(buttonEl);

    // Reload profile page if necessary
    if (reloadProfile && window.CURRENT_SECTION == 'profile') {
        loadProfile(profile.uuid);
    }

    return el;
}

$(document).ready(function () {

    // Set default pagination variables
    window.MEME_PAGINATION_SIZE = 9;
    window.MEME_PAGINATION_PAGE = 1;

    // Initialize global section loading function
    window.LOAD_SECTION = async function (section, data = {}) {
        if (section != window.CURRENT_SECTION || section == 'profile') {

            // Remove the active classes from the current section.
            $('section.tab.active').removeClass('active');
            $(`.section-load`).removeClass('active');

            // Scroll to the top.
            $('#sections').scrollTop(0);

            window.CURRENT_SECTION = section;

            // Show loader section while section loads
            $(`section.tab[data-section="loader-view"]`).addClass('active');
            $('.navbar-item').removeClass('is-active');

            // Adjust navbar link visibility
            const navBarEl = $(`#navbar-main .navbar-item[data-section="${section}"]`);
            if (section != 'profile' || (section == 'profile' && !data.profileuuid)) {
                navBarEl.addClass('is-active');
            }

            // Load section data
            await window.LOAD_SECTION_DATA(data);

            // Set new section to visible
            $(`section.tab[data-section="loader-view"]`).removeClass('active');
            $(`section.tab[data-section="${section}"]`).addClass('active');
            localStorage.setItem('section', window.CURRENT_SECTION);

        }

    }

    // Load necessary data for a section
    window.LOAD_SECTION_DATA = async (data) => {
        const section = window.CURRENT_SECTION;

        // Assign functions to each section
        const loaders = {
            'create-meme': loadCreateMeme,
            'profile': async (data) => { await loadProfile(data.profileuuid) },
            'view-meme': async (data) => {
                if (data.meme_uuid == undefined) {
                    window.LOAD_SECTION('feed');
                }
                await loadViewMeme(data.meme_uuid);
            },
            'feed': loadFeed,
            'search': loadSearch,
            'messaging': loadMessaging
        }

        // Get loader
        const loader = loaders[section];

        // Loader if loader exists
        if (loader) {
            await loader(data);
        }

        // Save section data
        localStorage.setItem(
            'sectionData',
            JSON.stringify(data)
        );
    }

    // Determine first section to load
    const mainSection = 'profile';
    const hiddenSections = ['loader-view'];

    let section = localStorage.getItem('section') || mainSection;
    section = hiddenSections.includes(section) ? mainSection : section;

    const sectionData = JSON.parse(localStorage.getItem('sectionData') || "{}");
    window.LOAD_SECTION(section, sectionData);



    /******************************
     *           EVENTS           *
     ******************************/

    // Handle section link click
    $(document).on('click', '.section-load', function () {
        const el = $(this);
        const { section, ...data } = el.data();
        if (el.hasClass('navbar-item')) {
            $('a.navbar-item').removeClass('is-active');
            $(`#navbar-main .navbar-item[data-section="${section}"]`).addClass('is-active');
        }
        window.LOAD_SECTION(section || 'create-meme', data);
    });

    // Handle like meme icon click
    $(document).on('click', '.like-meme', function () {
        toggleLike($(this));
    })

    // Handle "View More" button click
    // NOTE: View more button is used to paginate
    //       meme lists in a simplistic manner
    $('.view-more-button').on('click', async function () {
        const button = $(this);
        button.addClass('is-loading');

        // Load proper meme list
        const section = button.data('section');
        if (section == 'feed') {
            await loadFeedMemes();
        }
        else if (section == 'profile') {
            await loadProfileMemes();
        }
        button.removeClass('is-loading');
    })

    // Switch between section tabs
    $('.section-tab').on('click', async function () {

        // Gather necessary variables
        const tabEl = $(this);
        const tabName = tabEl.data('tab');
        const section = tabEl.closest('section.tab').data('section');

        // Don't reload the current tab
        if (tabName == window.CURRENT_TAB) {
            return;
        }

        // Initializer loader element in the meme list container
        $(`#${section}-memes`).html('<div class="lds-roller"><div></div><div></div><div></div><div></div></div>');

        // Set active tab
        $('.section-tab').closest('li').removeClass('is-active');
        $(`.tab[data-section="${section}"] .view-more-button`).hide();
        tabEl.closest('li').addClass('is-active');

        // Load correct feed
        const pageLoaders = {
            'friends': loadFriendsFeed,
            'popular': loadPopularFeed,
            'profile-memes': loadStandardProfileMemes,
            'liked': loadLikedMemes
        }
        const loader = pageLoaders[tabName];
        if (loader) {
            await loader();
        }

        // Set new current tab
        window.CURRENT_TAB = tabName;
    });

    // Handle frienship decision click
    $(document).on('click', '.friendship-decision-button', async function () {

        // Gather elements
        const button = $(this);
        const container = button.closest('.friendship-status-buttons');
        button.addClass('is-loading');

        // Decide friendship
        await decideFriendship(button.data());

        // Load new friendship status button
        await loadFriendshipStatusButton({
            el: container,
            profileUUID: button.data('requester_uuid'),
            reloadProfile: button.data('action') == 'accept'
        });
    })

    // Handle cancel request and send request button clicks
    $(document).on('click', '.friend-request-button', async function () {
        const button = $(this);
        const container = button.closest('.friendship-status-buttons');
        button.addClass('is-loading');

        // Request friendship
        if (button.data('action') == 'request') {
            await requestFriend(button.data());
        }

        // Cancel request
        else {
            await cancelFriendRequest(button.data());
        }

        // Reload friendship status button
        await loadFriendshipStatusButton({
            el: container,
            profileUUID: button.data('requestee_uuid'),
            reloadProfile: false
        });
    })

    // Handle remove friend button click
    $(document).on('click', '.remove-friend-button', async function () {

        // Gather confirmation on action
        const { isConfirmed } = await swalConfirm.fire({
            title: 'Are you sure?',
            icon: 'warning',
            text: "Are you sure you want to remove this friend?",
            showDenyButton: true,
            confirmButtonText: 'Yes',
            denyButtonText: `No`,
        });
        if (!isConfirmed) {
            return;
        }

        // Gather elements
        const button = $(this);
        const container = button.closest('.friendship-status-buttons');
        button.addClass('is-loading');

        // Remove friend
        await removeFriend(button.data());

        // Reload friendship status button
        await loadFriendshipStatusButton({
            el: container,
            profileUUID: button.data('friend_uuid')
        });
    })
})