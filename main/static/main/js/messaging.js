let chatSocket;
let isTyping = false;
let isMobileFormat;
const loadMessaging = async () => {
    await loadFriends();
}


const isMedia = () => {
    return window.innerWidth <= 786;
}


const listFriends = friends => {
    return friends.map(friend => {
        let recentMessage = friend.recent_message;
        if (recentMessage) {
            recentMessage = recentMessage.slice(0, 20);
            if (recentMessage.length >= 20) {
                recentMessage += '...';
            }
        }
        else {
            recentMessage = 'No Messages Yet.'
        }

        return `
        <div class="friend-list-item" data-friend_uuid="${friend.uuid}">
            <p class="friend-name">${friend.first_name} ${friend.last_name}</p>
            <p class="friend-recent-message">${recentMessage}</p>
        </div>
        `;
    }).join('');
}


const loadChat = async (friendUUID, friendName) => {
    if (chatSocket != undefined && chatSocket.readyState != undefined) {
        if (chatSocket.readyState == WebSocket.OPEN) {
            chatSocket.close();
        }
    }
    $('#recipient-name').text(friendName);

    // Initialize the WebSocket connection
    chatSocket = new WebSocket(
        window.WEBSOCKET_PROTOCOL + window.location.host +
        '/ws/messages/' + window.PROFILE.uuid + '/' + friendUUID + '/'
    );



    // Add event listeners for the WebSocket
    chatSocket.onopen = (event) => {
        // console.log('WebSocket connection opened:', event);
    };

    chatSocket.onmessage = (event) => {
        const {type, ...data} = JSON.parse(event.data);
        if (type == 'chat_message') {
            const messageData = data.message;
            messageData.is_user = messageData.recipient.uuid == window.RECIPIENT_UUID;
            const messagesContainer = $('#message-list');
            messagesContainer.append(messageListItem(messageData));
            scrollBottomMessages();
        }
        else if (type == 'start_typing') {
            $('.typing-cont').remove();
            if (data.typer_id == window.RECIPIENT_UUID) {
                $('#message-list').append(typingElement(false));
            }
            scrollBottomMessages();
        }
        else if (type == 'stop_typing') {
            $('.typing-cont').remove();
            scrollBottomMessages();
        }
    };

    chatSocket.onclose = (event) => {
        // console.log('WebSocket connection closed:', event);
    };

    chatSocket.onerror = (event) => {
        // console.log('WebSocket error:', event);
    };

    window.RECIPIENT_UUID = friendUUID;

    const response = await sendGet(`/messages/${friendUUID}/`);
    const messages = response.data.messages;
    listMessages(messages);
}

const scrollBottomMessages = () => {
    const messagesContainer = $('#message-list');
    messagesContainer.scrollTop(messagesContainer.prop('scrollHeight'));
}

const listMessages = messages => {
    const messagesContainer = $('#message-list');
    messagesContainer.html(messages.map(messageListItem).join(''));
    $('.chat-container').show();
}

const typingElement = isUser => {
    return `
    <div class="message-list-item typing-cont ${isUser ? 'user-message' : 'friend-message'}">
        <div class="notification">
            <div class="typing-indicator"><div></div><div></div><div></div></div>
        </div>
    </div>
    `
}


const messageListItem = message => {
    return `
    <div class="message-list-item ${message.is_user ? 'user-message' : 'friend-message'}">
        <div class="notification">
            <p>${message.text}</p>
        </div>
    </div>
    `
}

const stopTyping = () => {
    chatSocket.send(JSON.stringify({
        action: 'stop_typing',
        typer_id: window.PROFILE.uuid,
    }));
    isTyping = false;
}

const startTyping = () => {
    chatSocket.send(JSON.stringify({
        action: 'start_typing',
        typer_id: window.PROFILE.uuid,
    }));
    isTyping = true;
}

const handleTyping = (text) => {
    if (!text && isTyping) {
        stopTyping();
    }
    else if (text && !isTyping) {
        startTyping();
    }
}


const sendMessage = messageText => {
    if (!(messageText && window.RECIPIENT_UUID)) {
        return;
    }

    stopTyping();
    $('#chat-message-input').val('');

    chatSocket.send(JSON.stringify({
        action: 'message',
        message: messageText,
        recipient_id: window.RECIPIENT_UUID
    }));
}



const loadFriends = async searchInput => {
    let url = '/friends/';
    url += searchInput ? `?search_input=${searchInput}` : '';
    const response = await sendGet(url);
    const friends = response.data.friends;

    $('.friends-list').html(listFriends(friends));
}

const adjustMediaFormat = () => {
    if (isMedia() && !isMobileFormat) {
        $('.recipients').removeClass('is-one-quarter');
        $('.recipients').show();
        $('.messages').hide();
        $('#back-to-recipients').show();
        isMobileFormat = true;
    }
    else if (isMobileFormat && !isMedia()) {
        $('.recipients').addClass('is-one-quarter');
        $('.recipients').show();
        $('.messages').show();
        $('#back-to-recipients').hide();
        isMobileFormat = false;
    }
}





$(document).ready(function() {
    if (isMedia()) {
        adjustMediaFormat();
        isMobileFormat = true;
    }
    else {
        isMobileFormat = false;
    }

    $(window).on('resize', function() {
        adjustMediaFormat();
    })

    $(document).on('click', '.friend-list-item', async function() {
        const friendUUID = $(this).data('friend_uuid');
        const friendName = $(this).find('.friend-name').text();
        await loadChat(friendUUID, friendName);
        if (isMedia()) {
            $('.recipients').hide();
            $('.messages').show();
        }
        scrollBottomMessages();
    })

    $('#back-to-recipients').on('click', function() {
        $('.recipients').show();
        $('.messages').hide();
    })

    $('#friend-search-input').on('input', function() {
        const input = $(this).val();
        loadFriends(input);
    });

    $('#chat-message-submit').on('click', function() {
        sendMessage($('#chat-message-input').val());
    })

    $('#chat-message-form').on('submit', function(event) {
        event.preventDefault();
        sendMessage($('#chat-message-input').val());
    })

    $('#chat-message-form').on('input', function(event) {
        const text = $('#chat-message-input').val();
        handleTyping(text);
    })
})