const API_URL = 'https://web-production-aa38e.up.railway.app';

// Chat state
let currentChatType = 'public';
let selectedReceiverId = null;
let selectedReceiverUsername = null;
let typingTimeout = null;
let isTyping = false;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let replyingToMessageId = null;
let replyingToMessage = null;

// Send message and add to screen
$(document).ready(function() {
    const userId = parseInt(localStorage.getItem('userId'));
    const username = localStorage.getItem('username') || 'User';
    $('#currentUsername').text(username);
    $('#chatTitle').text('Public Chat');
    
    // Load messages on page load
    loadMessages();
    
    // Load active users on page load
    loadActiveUsers();
    
    // Load messages every 2 seconds
    setInterval(loadMessages, 2000);
    
    // Load active users every 5 seconds
    setInterval(loadActiveUsers, 5000);
    
    // Chat type tabs
    $('.tab-btn').on('click', function() {
        const chatType = $(this).data('chat');
        switchChatType(chatType);
    });
    
    $('#sendBtn').on('click', function() {
        const messageText = $('#messageInput').val().trim();
        if (messageText) {
            sendMessageToServer(messageText, userId, username);
        }
    });
    
    $('#messageInput').on('keypress', function(e) {
        if (e.which === 13) {
            const messageText = $('#messageInput').val().trim();
            if (messageText) {
                sendMessageToServer(messageText, userId, username);
                hideTypingIndicator();
            }
        }
    });
    
    // Typing indicator
    $('#messageInput').on('input', function() {
        const messageText = $(this).val();
        if (messageText.trim()) {
            showTypingIndicator();
        }
    });
    
    // Hide typing when input is cleared
    $('#messageInput').on('blur', function() {
        if (!$(this).val().trim()) {
            hideTypingIndicator();
        }
    });
    
    // Logout button
    $('#logoutBtn').on('click', function() {
        logout();
    });
    
    // Message options button
    $(document).on('click', '.message-options-btn', function(e) {
        e.stopPropagation();
        const messageId = $(this).data('message-id');
        const messageElement = $(this).closest('.message');
        const messageRect = messageElement[0].getBoundingClientRect();
        const menu = $('#messageOptionsMenu');
        
        // Position menu
        menu.css({
            top: messageRect.top + 'px',
            left: (messageRect.right - 150) + 'px',
            display: 'block'
        }).attr('data-message-id', messageId);
    });
    
    // Close menu when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#messageOptionsMenu, .message-options-btn').length) {
            $('#messageOptionsMenu').hide();
        }
    });
    
    // Menu item actions
    $(document).on('click', '.menu-item', function() {
        const action = $(this).data('action');
        const messageId = $('#messageOptionsMenu').attr('data-message-id');
        const messageElement = $(`.message[data-message-id="${messageId}"]`);
        
        if (action === 'reply') {
            replyMessage(messageId, messageElement);
        } else if (action === 'star') {
            starMessage(messageId, messageElement);
        } else if (action === 'copy') {
            copyMessage(messageElement);
        } else if (action === 'forward') {
            forwardMessage(messageId, messageElement);
        } else if (action === 'delete') {
            deleteMessage(messageId, messageElement);
        }
        
        $('#messageOptionsMenu').hide();
    });
    
    // Cancel reply
    $('#cancelReply').on('click', function() {
        cancelReply();
    });
    
    // Emoji button
    $('#emojiBtn').on('click', function(e) {
        e.stopPropagation();
        $('#emojiPicker').toggleClass('show');
    });
    
    // Close emoji picker when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#emojiBtn, #emojiPicker').length) {
            $('#emojiPicker').removeClass('show');
        }
    });
    
    // Insert emoji on click
    $(document).on('click', '.emoji', function() {
        const emoji = $(this).text();
        const input = $('#messageInput');
        const currentValue = input.val();
        const cursorPos = input[0].selectionStart || currentValue.length;
        const newValue = currentValue.substring(0, cursorPos) + emoji + currentValue.substring(cursorPos);
        input.val(newValue);
        input.focus();
        input[0].setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    });
    
    // Voice message button
    $('#voiceBtn').on('mousedown touchstart', function(e) {
        e.preventDefault();
        startRecording();
    });
    
    $('#voiceBtn').on('mouseup mouseleave touchend', function(e) {
        e.preventDefault();
        stopRecording();
    });
});

function sendMessageToServer(messageText, userId, username) {
    // Check if private chat and receiver is selected
    if (currentChatType === 'private' && !selectedReceiverId) {
        alert('Please select a user to chat with');
        return;
    }
    
    // Clear input and reply preview
    $('#messageInput').val('');
    cancelReply();
    
    // Add message to screen immediately (optimistic update)
    const now = new Date();
    const time = formatTime12Hour(now);
    
    // Check if replying to a message
    let replyPreview = '';
    if (replyingToMessage) {
        const replyText = replyingToMessage.text.length > 50 ? replyingToMessage.text.substring(0, 50) + '...' : replyingToMessage.text;
        replyPreview = `
            <div class="reply-preview-inline">
                <i class="fas fa-reply"></i>
                <span class="reply-username">${escapeHtml(replyingToMessage.username)}</span>
                <span class="reply-text">${escapeHtml(replyText)}</span>
            </div>
        `;
    }
    
    const tempMessageHtml = $(`
        <div class="message own" data-temp-message="true">
            ${replyPreview}
            <div class="message-header">
                <span class="username">${escapeHtml(username)}</span>
                <span class="time">${time}</span>
            </div>
            <div class="message-content">${escapeHtml(messageText)}</div>
        </div>
    `);
    
    $('#messagesList').append(tempMessageHtml);
    const messagesContainer = $('.messages-container');
    messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
    
    // Prepare data
    const data = {
        sender_id: userId,
        message: messageText,
        chat_type: currentChatType
    };
    
    if (currentChatType === 'private') {
        data.receiver_id = selectedReceiverId;
    }
    
    if (replyingToMessageId) {
        data.reply_to_id = replyingToMessageId;
    }
    
    // Send to server
    $.ajax({
        url: `${API_URL}/messages`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            // Remove temp message - it will be replaced by real one from server
            // Don't reload immediately, let the interval handle it
        },
        error: function(xhr) {
            // Remove temp message on error
            $('[data-temp-message="true"]').last().remove();
            alert('Error sending message: ' + (xhr.responseJSON?.message || 'Unknown error'));
        }
    });
}

function loadMessages() {
    const userId = parseInt(localStorage.getItem('userId'));
    
    const data = {
        chat_type: currentChatType
    };
    
    if (currentChatType === 'public') {
        // Public chat - no additional params needed
    } else {
        // Private chat - need user_id and receiver_id
        if (!userId || !selectedReceiverId) {
            return; // Don't load if no receiver selected
        }
        data.user_id = userId;
        data.receiver_id = selectedReceiverId;
    }
    
    $.ajax({
        url: `${API_URL}/messages`,
        method: 'GET',
        data: data,
        success: function(response) {
            if (response.success && response.messages) {
                displayMessages(response.messages);
            }
        },
        error: function(xhr) {
            // Silent error - don't interrupt user
        }
    });
}

function displayMessages(messages) {
    const container = $('#messagesList');
    
    // Reverse messages to show oldest first
    // Public messages come DESC from server, private messages come ASC
    if (currentChatType === 'public') {
        messages.reverse();
    }
    // Private messages are already in ASC order
    
    // Get existing message IDs to avoid duplicates
    const existingIds = new Set();
    container.find('[data-message-id]').each(function() {
        existingIds.add($(this).attr('data-message-id'));
    });
    
    // Remove temp messages
    container.find('[data-temp-message="true"]').remove();
    
    // Add only new messages
    const userId = parseInt(localStorage.getItem('userId'));
    let addedNew = false;
    messages.forEach(function(msg) {
        if (!existingIds.has(msg.id.toString())) {
            const messageHtml = createMessageHtml(msg, userId);
            container.append(messageHtml);
            addedNew = true;
        }
    });
    
    // Scroll to bottom only if new messages were added
    if (addedNew) {
        const messagesContainer = $('.messages-container');
        messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
    }
}

function formatTime12Hour(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    const minutesStr = minutes.toString().padStart(2, '0');
    return `${hours}:${minutesStr} ${ampm}`;
}

function formatLastSeen(lastSeenStr) {
    if (!lastSeenStr) return '';
    
    // Parse SQLite timestamp
    let date;
    try {
        const timestampStr = lastSeenStr.replace(' ', 'T');
        date = new Date(timestampStr);
        
        if (isNaN(date.getTime())) {
            // Try manual parsing
            const parts = lastSeenStr.split(' ');
            if (parts.length === 2) {
                const datePart = parts[0].split('-');
                const timePart = parts[1].split(':');
                if (datePart.length === 3 && timePart.length >= 2) {
                    date = new Date(
                        parseInt(datePart[0]),
                        parseInt(datePart[1]) - 1,
                        parseInt(datePart[2]),
                        parseInt(timePart[0]),
                        parseInt(timePart[1]),
                        timePart[2] ? parseInt(timePart[2]) : 0
                    );
                }
            }
        }
        
        // Add 3 hours for timezone
        date.setHours(date.getHours() + 3);
        
        if (isNaN(date.getTime())) {
            return '';
        }
    } catch (e) {
        return '';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) {
        return 'Now';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
        return formatTime12Hour(date);
    }
}

function createMessageHtml(msg, currentUserId) {
    // Parse the timestamp - handle SQLite TIMESTAMP format
    let date;
    if (msg.created_at) {
        // SQLite TIMESTAMP format: "YYYY-MM-DD HH:MM:SS"
        // Parse manually to ensure correct timezone handling
        const timestampStr = msg.created_at;
        // Try ISO format first (replace space with T)
        let parsed = new Date(timestampStr.replace(' ', 'T'));
        
        // If invalid, try parsing the SQLite format manually
        if (isNaN(parsed.getTime())) {
            // Parse "YYYY-MM-DD HH:MM:SS" format
            const parts = timestampStr.split(' ');
            if (parts.length === 2) {
                const datePart = parts[0].split('-');
                const timePart = parts[1].split(':');
                if (datePart.length === 3 && timePart.length >= 2) {
                    parsed = new Date(
                        parseInt(datePart[0]),
                        parseInt(datePart[1]) - 1, // Month is 0-indexed
                        parseInt(datePart[2]),
                        parseInt(timePart[0]),
                        parseInt(timePart[1]),
                        timePart[2] ? parseInt(timePart[2]) : 0
                    );
                }
            }
        }
        date = parsed;
        
        // Final fallback
        if (isNaN(date.getTime())) {
            date = new Date();
        }
    } else {
        date = new Date();
    }
    
    // Add 3 hours to fix timezone offset
    date.setHours(date.getHours() + 3);
    
    // Format time in 12-hour format
    const time = formatTime12Hour(date);
    
    // Determine if message is from current user
    const isOwnMessage = msg.sender_id === currentUserId;
    const messageClass = isOwnMessage ? 'own' : 'other';
    const isStarred = msg.is_starred || false;
    
    let replyPreview = '';
    if (msg.reply_to_id && msg.reply_to_message) {
        const replyText = msg.reply_to_message.length > 50 ? msg.reply_to_message.substring(0, 50) + '...' : msg.reply_to_message;
        replyPreview = `
            <div class="reply-preview-inline">
                <i class="fas fa-reply"></i>
                <span class="reply-username">${escapeHtml(msg.reply_to_username || 'User')}</span>
                <span class="reply-text">${escapeHtml(replyText)}</span>
            </div>
        `;
    }
    
    return $(`
        <div class="message ${messageClass}" data-message-id="${msg.id}" data-sender-id="${msg.sender_id}">
            ${replyPreview}
            <div class="message-header">
                <span class="username">${escapeHtml(msg.sender_username)}</span>
                <span class="time">${time}</span>
                <button class="message-options-btn" data-message-id="${msg.id}">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                ${isStarred ? '<i class="fas fa-star starred-icon"></i>' : ''}
            </div>
            <div class="message-content">${escapeHtml(msg.message)}</div>
        </div>
    `);
}


function switchChatType(chatType) {
    currentChatType = chatType;
    
    // Update tab buttons
    $('.tab-btn').removeClass('active');
    $(`.tab-btn[data-chat="${chatType}"]`).addClass('active');
    
    // Update UI
    if (chatType === 'public') {
        $('#chatTitle').text('Public Chat');
        $('#chatWithUser').text('');
        $('#activeUsersList').closest('.users-section').show();
        $('#allUsersSection').hide();
        selectedReceiverId = null;
        selectedReceiverUsername = null;
        $('#messagesList').empty();
        loadMessages();
        loadActiveUsers();
    } else {
        $('#activeUsersList').closest('.users-section').hide();
        $('#allUsersSection').show();
        loadAllUsers();
        
        if (!selectedReceiverId) {
            $('#chatTitle').text('Private Chat');
            $('#chatWithUser').text('Select a user to start chatting');
            $('#messagesList').empty();
        } else {
            $('#chatTitle').text(selectedReceiverUsername);
            $('#chatWithUser').text('');
        }
    }
}

function loadAllUsers() {
    const userId = parseInt(localStorage.getItem('userId'));
    const currentUsername = localStorage.getItem('username');
    
    $.ajax({
        url: `${API_URL}/users`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.users) {
                displayAllUsers(response.users, currentUsername);
            }
        },
        error: function(xhr) {
            // Silent error
        }
    });
}

function displayAllUsers(users, currentUsername) {
    const container = $('#allUsersList');
    container.empty();
    
    users.forEach(function(user) {
        // Don't show current user
        if (user.username === currentUsername) {
            return;
        }
        
        const isSelected = selectedReceiverId === user.id;
        const lastSeen = formatLastSeen(user.last_seen);
        const isActive = user.last_seen && isUserActive(user.last_seen);
        
        const userHtml = $(`
            <div class="user-item ${isSelected ? 'selected' : ''}" data-user-id="${user.id}" data-username="${escapeHtml(user.username)}">
                <div class="user-info">
                    ${isActive ? '<span class="status"></span>' : ''}
                    <div class="user-details">
                        <span class="username">${escapeHtml(user.username)}</span>
                        ${lastSeen ? `<span class="last-seen">${lastSeen}</span>` : ''}
                    </div>
                </div>
            </div>
        `);
        
        userHtml.on('click', function() {
            selectPrivateChatUser(user.id, user.username);
        });
        
        container.append(userHtml);
    });
}

function isUserActive(lastSeenStr) {
    if (!lastSeenStr) return false;
    
    try {
        let date;
        const timestampStr = lastSeenStr.replace(' ', 'T');
        date = new Date(timestampStr);
        
        if (isNaN(date.getTime())) {
            const parts = lastSeenStr.split(' ');
            if (parts.length === 2) {
                const datePart = parts[0].split('-');
                const timePart = parts[1].split(':');
                if (datePart.length === 3 && timePart.length >= 2) {
                    date = new Date(
                        parseInt(datePart[0]),
                        parseInt(datePart[1]) - 1,
                        parseInt(datePart[2]),
                        parseInt(timePart[0]),
                        parseInt(timePart[1]),
                        timePart[2] ? parseInt(timePart[2]) : 0
                    );
                }
            }
        }
        
        if (isNaN(date.getTime())) {
            return false;
        }
        
        // Add 3 hours for timezone
        date.setHours(date.getHours() + 3);
        
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        
        // Active if last seen within last 5 minutes
        return diffMinutes <= 5;
    } catch (e) {
        return false;
    }
}

function selectPrivateChatUser(receiverId, receiverUsername) {
    selectedReceiverId = receiverId;
    selectedReceiverUsername = receiverUsername;
    
    // Update UI
    $('#chatTitle').text(escapeHtml(receiverUsername));
    $('#chatWithUser').text('');
    
    // Update selected user in list
    $('#allUsersList .user-item').removeClass('selected');
    $(`#allUsersList .user-item[data-user-id="${receiverId}"]`).addClass('selected');
    
    // Clear and load messages
    $('#messagesList').empty();
    loadMessages();
}

function loadActiveUsers() {
    const userId = parseInt(localStorage.getItem('userId'));
    
    $.ajax({
        url: `${API_URL}/active-users`,
        method: 'GET',
        data: { user_id: userId },
        success: function(response) {
            if (response.success && response.active_users) {
                displayActiveUsers(response.active_users);
            }
        },
        error: function(xhr) {
            // Silent error
        }
    });
}

function displayActiveUsers(activeUsers) {
    const container = $('#activeUsersList');
    const currentUsername = localStorage.getItem('username');
    
    container.empty();
    
    activeUsers.forEach(function(user) {
        const lastSeen = formatLastSeen(user.last_seen);
        const isCurrentUser = user.username === currentUsername;
        const typingText = isCurrentUser && isTyping ? 'typing...' : '';
        
        const userHtml = $(`
            <div class="user-item" data-username="${escapeHtml(user.username)}">
                <div class="user-info">
                    <span class="status"></span>
                    <div class="user-details">
                        <span class="username">${escapeHtml(user.username)}</span>
                        <span class="last-seen ${typingText ? 'typing' : ''}">${typingText || lastSeen}</span>
                    </div>
                </div>
            </div>
        `);
        
        container.append(userHtml);
    });
}

function showTypingIndicator() {
    const currentUsername = localStorage.getItem('username');
    const container = $('#activeUsersList');
    
    // Clear existing timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    
    // Set typing state
    isTyping = true;
    
    // Find current user in list and update last-seen to "typing..."
    const userItem = container.find(`[data-username="${escapeHtml(currentUsername)}"]`);
    if (userItem.length) {
        userItem.find('.last-seen').text('typing...').addClass('typing');
    }
    
    // Set timeout to hide typing after 3 seconds of no typing
    typingTimeout = setTimeout(function() {
        hideTypingIndicator();
    }, 3000);
}

function hideTypingIndicator() {
    const currentUsername = localStorage.getItem('username');
    const container = $('#activeUsersList');
    
    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
    }
    
    // Remove typing state
    isTyping = false;
    
    // Remove typing indicator
    const userItem = container.find(`[data-username="${escapeHtml(currentUsername)}"]`);
    if (userItem.length) {
        userItem.find('.last-seen').removeClass('typing');
        // Reload active users to get correct last-seen
        loadActiveUsers();
    }
}

async function startRecording() {
    if (isRecording) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = function(event) {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = function() {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            sendVoiceMessage(audioBlob);
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        $('#voiceBtn').addClass('recording');
        $('#voiceBtn i').removeClass('fa-microphone').addClass('fa-stop');
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Microphone access denied. Please allow microphone access to send voice messages.');
    }
}

function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    
    if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    
    isRecording = false;
    $('#voiceBtn').removeClass('recording');
    $('#voiceBtn i').removeClass('fa-stop').addClass('fa-microphone');
}

function sendVoiceMessage(audioBlob) {
    const userId = parseInt(localStorage.getItem('userId'));
    const username = localStorage.getItem('username') || 'User';
    
    // Check if private chat and receiver is selected
    if (currentChatType === 'private' && !selectedReceiverId) {
        alert('Please select a user to chat with');
        return;
    }
    
    const formData = new FormData();
    formData.append('sender_id', userId);
    formData.append('chat_type', currentChatType);
    formData.append('audio', audioBlob, 'voice-message.webm');
    
    if (currentChatType === 'private') {
        formData.append('receiver_id', selectedReceiverId);
    }
    
    // Show voice message in chat
    const now = new Date();
    const time = formatTime12Hour(now);
    const voiceMessageHtml = $(`
        <div class="message own" data-temp-voice="true">
            <div class="message-header">
                <span class="username">${escapeHtml(username)}</span>
                <span class="time">${time}</span>
            </div>
            <div class="message-content voice-message">
                <i class="fas fa-microphone"></i> Voice Message
                <audio controls style="width: 100%; margin-top: 5px;">
                    <source src="${URL.createObjectURL(audioBlob)}" type="audio/webm">
                </audio>
            </div>
        </div>
    `);
    
    $('#messagesList').append(voiceMessageHtml);
    const messagesContainer = $('.messages-container');
    messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
    
    // Send to server
    $.ajax({
        url: `${API_URL}/messages`,
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            // Remove temp message - it will be replaced by real one from server
        },
        error: function(xhr) {
            $('[data-temp-voice="true"]').last().remove();
            alert('Error sending voice message: ' + (xhr.responseJSON?.message || 'Unknown error'));
        }
    });
}

function starMessage(messageId, messageElement) {
    const userId = parseInt(localStorage.getItem('userId'));
    const senderId = parseInt(messageElement.attr('data-sender-id'));
    
    // Only allow starring own messages for now
    if (senderId !== userId) {
        alert('You can only star your own messages');
        return;
    }
    
    $.ajax({
        url: `${API_URL}/messages/${messageId}/star`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ user_id: userId }),
        success: function(response) {
            if (response.success) {
                const starIcon = messageElement.find('.starred-icon');
                if (starIcon.length) {
                    starIcon.remove();
                } else {
                    messageElement.find('.message-header').append('<i class="fas fa-star starred-icon"></i>');
                }
            }
        },
        error: function(xhr) {
            alert('Error: ' + (xhr.responseJSON?.message || 'Unknown error'));
        }
    });
}

function copyMessage(messageElement) {
    const messageText = messageElement.find('.message-content').text();
    navigator.clipboard.writeText(messageText).then(function() {
        // Show temporary feedback
        const btn = messageElement.find('.message-options-btn');
        const originalHtml = btn.html();
        btn.html('<i class="fas fa-check"></i>');
        setTimeout(function() {
            btn.html(originalHtml);
        }, 1000);
    }).catch(function() {
        alert('Failed to copy message');
    });
}

function forwardMessage(messageId, messageElement) {
    const messageText = messageElement.find('.message-content').text();
    if (currentChatType === 'private' && selectedReceiverId) {
        // Forward to current chat
        const userId = parseInt(localStorage.getItem('userId'));
        const username = localStorage.getItem('username') || 'User';
        sendMessageToServer('Fwd: ' + messageText, userId, username);
    } else {
        alert('Please select a chat to forward the message');
    }
}

function replyMessage(messageId, messageElement) {
    const messageText = messageElement.find('.message-content').text();
    const senderUsername = messageElement.find('.username').text();
    
    replyingToMessageId = messageId;
    replyingToMessage = {
        id: messageId,
        text: messageText,
        username: senderUsername
    };
    
    // Show reply preview
    $('#replyPreview').show();
    $('#replyPreview .reply-preview-username').text(senderUsername);
    $('#replyPreview .reply-preview-text').text(messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText);
    
    // Focus input
    $('#messageInput').focus();
}

function cancelReply() {
    replyingToMessageId = null;
    replyingToMessage = null;
    $('#replyPreview').hide();
}

function deleteMessage(messageId, messageElement) {
    const userId = parseInt(localStorage.getItem('userId'));
    const senderId = parseInt(messageElement.attr('data-sender-id'));
    
    // Only allow deleting own messages
    if (senderId !== userId) {
        alert('You can only delete your own messages');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }
    
    // Log the request details
    console.log('Deleting message:', {
        url: `${API_URL}/messages/${messageId}/delete`,
        messageId: messageId,
        userId: userId
    });
    
    $.ajax({
        url: `${API_URL}/messages/${messageId}/delete`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ user_id: userId }),
        timeout: 10000, // 10 seconds timeout
        success: function(response) {
            console.log('Delete success:', response);
            if (response && response.success) {
                messageElement.fadeOut(300, function() {
                    $(this).remove();
                });
            } else {
                alert('Error: ' + (response?.message || 'Failed to delete message'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Delete error details:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText,
                error: error,
                statusParam: status,
                url: `${API_URL}/messages/${messageId}/delete`
            });
            
            let errorMsg = 'Unknown error';
            
            // Try to parse error from response
            if (xhr.responseJSON) {
                errorMsg = xhr.responseJSON.message || xhr.responseJSON.error || 'Unknown error';
            } else if (xhr.responseText) {
                try {
                    const errorObj = JSON.parse(xhr.responseText);
                    errorMsg = errorObj.message || errorObj.error || errorMsg;
                } catch (e) {
                    // If not JSON, use response text
                    if (xhr.responseText.trim()) {
                        errorMsg = xhr.responseText;
                    }
                }
            }
            
            // Add status code info
            if (xhr.status === 404) {
                errorMsg = 'Message not found';
            } else if (xhr.status === 403) {
                errorMsg = 'You can only delete your own messages';
            } else if (xhr.status === 400) {
                errorMsg = 'Invalid request: ' + errorMsg;
            } else if (xhr.status === 0 || status === 'error') {
                errorMsg = 'Cannot connect to server. Please check:\n1. Server is running\n2. URL is correct: ' + API_URL + '\n3. Check browser console for details';
            } else if (xhr.status >= 500) {
                errorMsg = 'Server error: ' + errorMsg;
            } else if (status === 'timeout') {
                errorMsg = 'Request timeout. Server may be slow or unavailable.';
            }
            
            alert('Error (' + (xhr.status || 'Network') + '): ' + errorMsg);
        }
    });
}

function logout() {
    // Clear localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    
    // Redirect to login page
    window.location.href = 'login-register.html';
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

