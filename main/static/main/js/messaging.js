const loadMessaging = async () => {
    await loadFriends();
}


const listFriends = friends => {
    return friends.map(friend => {

        return `
        <div class="friend-list-item" data-friend_uuid="${friend.uuid}">
            <p class="friend-name">${friend.first_name} ${friend.last_name}</p>
        </div>
        `;
    }).join('');
}


const loadChat = async friendUUID => {
    // Initialize the WebSocket connection
    const chatSocket = new WebSocket(
        'ws://' + window.location.host +
        '/ws/messages/' + window.PROFILE.uuid + '/'
    );

    // Add event listeners for the WebSocket
    chatSocket.onopen = (event) => {
        console.log('WebSocket connection opened:', event);
    };

    chatSocket.onmessage = (event) => {
        console.log('WebSocket message received:', event);
    };

    chatSocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
    };

    chatSocket.onerror = (event) => {
        console.log('WebSocket error:', event);
    };

    chatSocket.send(JSON.stringify({
        message: 'Testing',
        recipient_id: friendUUID
    }));

    window.RECIPIENT_UUID = friendUUID;

    const response = await sendGet(`/messages/${friendUUID}/`);
    const messages = response.data.messages;
    listMessages(messages);
    const messagesContainer = document.getElementById("message-list");
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

const listMessages = messages => {
    const messagesContainer = $('#message-list');
    messagesContainer.html(messages.map(message => {
        return `
        <div class="message-list-item ${message.is_user ? 'user-message' : 'friend-message'}">
            <div class="notification">
                <p>${message.text}</p>
            </div>
        </div>
        `
    }).join(''));
}



const loadFriends = async searchInput => {
    let url = '/friends/';
    url += searchInput ? `?search_input=${searchInput}` : '';
    const response = await sendGet(url);
    const friends = response.data.friends;

    $('.friends-list').html(listFriends(friends));
}


$(document).ready(function() {
    $('#friend-search-input').on('input', function() {
        const input = $(this).val();
        loadFriends(input);
    });

    $(document).on('click', '.friend-list-item', function() {
        const friendUUID = $(this).data('friend_uuid');
        loadChat(friendUUID);
    })
})