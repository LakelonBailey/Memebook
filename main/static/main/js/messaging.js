// Initialize changing variables
let chatSocket;
let isTyping = false;
let isMobileFormat;

// Initialize constant variables
const typingElement = `
    <div class="message-list-item typing-cont friend-message">
        <div class="notification">
            <div class="typing-indicator"><div></div><div></div><div></div></div>
        </div>
    </div>
`;

// Load messaging
const loadMessaging = async () => {
    await loadFriends();
}

// Determine if screen is media screen with
const isMedia = () => {
    return window.innerWidth <= 786;
}

// List friends as clickable chat options
const listFriends = friends => {
    return friends.map(friend => {

        // Preview recent message
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

        // Create element
        return `
        <div class="friend-list-item" data-friend_uuid="${friend.uuid}">
            <p class="friend-name-cont"><span class="friend-name">${friend.first_name} ${friend.last_name}</span> ${friend.num_unread ? `<span class="notif-count">${friend.num_unread}</span>` : ''}</p>
            <p class="friend-recent-message">${recentMessage}</p>
        </div>
        `;
    }).join('');
}

// Load chat with friend
const loadChat = async (friendUUID, friendName) => {

    // Close current chat socket
    if (chatSocket != undefined && chatSocket.readyState != undefined) {
        if (chatSocket.readyState == WebSocket.OPEN) {
            chatSocket.close();
        }
    }

    // Set friend name
    $('#recipient-name').text(friendName);

    // Initialize the WebSocket connection
    chatSocket = new WebSocket(
        window.WEBSOCKET_PROTOCOL + window.location.host +
        '/ws/messages/' + window.PROFILE.uuid + '/' + friendUUID + '/'
    );

    // Read messages when chat socket opens
    chatSocket.onopen = (event) => {
        readMessages();
    };

    // Handle incoming actions
    chatSocket.onmessage = (event) => {

        // Gather data
        const {type, ...data} = JSON.parse(event.data);

        // Handle new chat message
        if (type == 'chat_message') {
            const messageData = data.message;
            messageData.is_user = messageData.recipient.uuid == window.RECIPIENT_UUID;

            // Add message to list
            const messagesContainer = $('#message-list');
            messagesContainer.append(messageListItem(messageData));

            // Scroll bottom and reload friends
            scrollBottomMessages();
            loadFriends();

            // If user recieves message, read it
            if (!messageData.is_user) {
                readMessages();
            }
        }

        // Handle start typing
        else if (type == 'start_typing') {

            // Remove existing typing elements
            $('.typing-cont').remove();

            // Show typing element
            if (data.typer_id == window.RECIPIENT_UUID) {
                $('#message-list').append(typingElement());
            }

            // Scroll bottom
            scrollBottomMessages();
        }

        // Handle stop typing
        else if (type == 'stop_typing') {

            // Remove typing elements
            $('.typing-cont').remove();

            // Scroll bottom
            scrollBottomMessages();
        }

        // Handle read messages
        else if (type == 'read_messages' && data.profile_id == window.RECIPIENT_UUID) {

            // List messages with updated read receipts
            const messages = data.messages.map(message => {
                message.is_user = message.sender == window.PROFILE.uuid
                return message;
            });
            listMessages(messages);
        }
    };

    // Set recipient id
    window.RECIPIENT_UUID = friendUUID;

    // Display messages
    const response = await sendGet(`/messages/${friendUUID}/`);
    const messages = response.data.messages;
    listMessages(messages);
}


// Send websocket message to read all messages
const readMessages = () => {
    chatSocket.send(JSON.stringify({
        action: 'read_messages',
        profile_id: window.PROFILE.uuid,
        recipient_id: window.RECIPIENT_UUID
    }));
}

// Scroll to the bottom of messages container
const scrollBottomMessages = () => {
    const messagesContainer = $('#message-list');
    messagesContainer.scrollTop(messagesContainer.prop('scrollHeight'));
}

// List messages
const listMessages = messages => {
    const messagesContainer = $('#message-list');
    const numUserMessages = messages.filter(message => message.is_user).length;
    let userMessageIndex = 0;
    messagesContainer.html(messages.map((message) => {
        let isLastUserMessage = false;
        if (message.is_user) {
            isLastUserMessage = userMessageIndex == numUserMessages - 1;
            userMessageIndex += 1;
        }
        return messageListItem(message, isLastUserMessage);
    }).join(''));

    $('.chat-container').show();
}


// Get formatted read receipt
function getReadReceipt(datetime) {
    const dateObj = new Date(datetime);
    const now = new Date();
    const millisecondsPerDay = 86400000;
    const millisecondsPerWeek = 604800000;
    const timeString = dateObj.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
    const weekdayString = dateObj.toLocaleDateString([], {weekday: 'long'});
    const dateString = dateObj.toLocaleDateString();

    const timeDiff = now.getTime() - dateObj.getTime();

    // Show time
    if (timeDiff < millisecondsPerDay) {
      return timeString;
    }

    // Show weekday
    else if (timeDiff < millisecondsPerWeek) {
      return weekdayString;
    }

    // Show date
    else {
      return dateString;
    }
  }


// Create message list item
const messageListItem = (message, isLastUserMessage) => {

    // Display read receipt if it's the most recent user message and it's read
    return `
    <div class="message-list-item ${message.is_user ? 'user-message' : 'friend-message'} ${isLastUserMessage ? 'last-user-message' : ''}">
        <div class="notification">
            <p>${message.text}</p>
        </div>
        <p class="read-receipt"> ${message.is_read && isLastUserMessage ? `Read ${getReadReceipt(message.read_time)}` : ''}</p>
    </div>
    `
}

// Send websocket message to stop typing indicator
const stopTyping = () => {
    chatSocket.send(JSON.stringify({
        action: 'stop_typing',
        typer_id: window.PROFILE.uuid,
    }));
    isTyping = false;
}

// Send websocket message to start typing indicator
const startTyping = () => {
    chatSocket.send(JSON.stringify({
        action: 'start_typing',
        typer_id: window.PROFILE.uuid,
    }));
    isTyping = true;
}

// Track typing state
const handleTyping = (text) => {
    if (!text && isTyping) {
        stopTyping();
    }
    else if (text && !isTyping) {
        startTyping();
    }
}

// Send message
const sendMessage = messageText => {

    // Ignore empty messages
    if (!(messageText && window.RECIPIENT_UUID)) {
        return;
    }

    // Stop typing and clear chat message input
    stopTyping();
    $('#chat-message-input').val('');

    // Send websocket message
    chatSocket.send(JSON.stringify({
        action: 'message',
        message: messageText,
        recipient_id: window.RECIPIENT_UUID
    }));
}

// Load friend chat links
const loadFriends = async searchInput => {
    let url = '/friends/';
    url += searchInput ? `?search_input=${searchInput}` : '';
    const response = await sendGet(url);
    const friends = response.data.friends;

    $('.friends-list').html(listFriends(friends));
}

// Adjust screen state
const adjustMediaFormat = () => {
    if (isMedia() && !isMobileFormat) {
        $('.recipients').removeClass('is-one-quarter');
        $('.recipients').show();
        $('.messages').hide();
        $('#back-to-recipients').show();
        $('#chat-message-form').addClass('is-mobile');
        isMobileFormat = true;
    }
    else if (isMobileFormat && !isMedia()) {
        $('.recipients').addClass('is-one-quarter');
        $('.recipients').show();
        $('.messages').show();
        $('#back-to-recipients').hide();
        $('#chat-message-form').removeClass('is-mobile');
        isMobileFormat = false;
    }
}


$(document).ready(function() {

    // Set initial screen state
    if (isMedia()) {
        adjustMediaFormat();
        isMobileFormat = true;
    }
    else {
        isMobileFormat = false;
    }

    // Track resizing, adjusting screen state
    $(window).on('resize', function() {
        adjustMediaFormat();
    })

    // Load chat when a friend is clicked
    $(document).on('click', '.friend-list-item', async function() {
        const friendUUID = $(this).data('friend_uuid');
        const friendName = $(this).find('.friend-name').text();
        await loadChat(friendUUID, friendName);
        if (isMedia()) {
            $('.recipients').hide();
            $('.messages').show();
        }
        $('#chat-message-input').val('');
        $('#chat-message-input').focus();
        scrollBottomMessages();
    })

    $('#back-to-recipients').on('click', function() {
        $('.recipients').show();
        $('.messages').hide();
        loadFriends();
    })

    // Search for friends on friend search input
    $('#friend-search-input').on('input', function() {
        const input = $(this).val();
        loadFriends(input);
    });

    // Handle clicking of send button
    $('#chat-message-submit').on('click', function() {
        sendMessage($('#chat-message-input').val());
    })

    // Handle submission of chat message
    $('#chat-message-form').on('submit', function(event) {
        event.preventDefault();
        sendMessage($('#chat-message-input').val());
    })

    // Monitor typing and toggle as needed
    $('#chat-message-form').on('input', function(event) {
        const text = $('#chat-message-input').val();
        handleTyping(text);
    })

    // Focus on message input anytime message list is clicked
    $('#message-list').on('click', function() {
        $('#chat-message-input').focus();
    })
})