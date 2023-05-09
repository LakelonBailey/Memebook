# Memebook

## Description:
- Memebook is a meme social media that allows users to create, like, and comment on memes.
- Memebook has a bare-bones friend system, allowing users to request friends, remove friends, etc.

## How to use:
- Simply visit the publicly hosted application and then create an account.
- Public Application: https://ltb-memebook.herokuapp.com/
- GitHub: https://github.com/LakelonBailey/Memebook

## Known Bugs/Errors
- Meme top and bottom text stretches outside the bounds of template image when viewing meme preview on mobile screen sizes
- When viewing friends list modal from profile, if the user clicks on one of their friends' name, it will redirect to that profile but will not close the modal.

## Page Descriptions
- ### Feed
    - The feed page allows users to view "For You" and "Friends". Both of these algorithms use the relevancy sorting algorithm. "For You" picks from the pool of public memes. "Friends" picks from the pool of memes created by the user's friends.
- ### Create Meme
    - This page is pretty self explanatory. It allows users to create a meme by selecting a template and entering top and bottom text.
- ### Profile
    - This page is used to either view the user's profile or view another user's profile. When viewing a profile, users can see friend count, meme count, and like count.
    - If the profile is not the user's profile, the user can view this profile's memes if the are public and liked memes based on the profile's liked memes privacy setting (Public, Friends Only, or Private)
    - If the profile is the user's profile, they are able to edit profile settings (privacy and liked memes privacy), as well as view a friend list and friend request list. The user is also always able to view all of their liked memes and created memes.
    - All profile memes are sorted from newest to oldest.
- ### Messaging
    - This page allows the logged-in user to message anyone on their friends list.
    - This messaging service implements live read receipts and typing indicators.
    - Unfortunately, users currently will not receive a notification or indication of any sort when they receive a message unless they either reload their messages page or are viewing the chat they recieved the message in.
- ### Search Page
    - The search page is very simple. It allows users to search for other profiles and adjust their friendship status with those profiles or visit those profiles' profile page by clicking on the name.
- ### Other pages
    - View Meme: When users click on a meme on any page, they will be taken to a page where they can view that meme and any comments on it, as well as add a comment to the meme.
    - Loader View: This is a page that shows temporarily in between pages while loading is occuring.
    - Login: Allows users to log in
    - Signup: Allows users to sign up

## Missing Features
- There is not currently a way for users to delete memes they create.
- Like count is not displayed for a meme on the View Meme page.
- No notifications are received for incoming messages (see details in Messaging page description)

## Grading
- The most important files in terms of functionality, unless specified otherwise, are as follows:
    - Any file called views.py, urls.py, or models.py
    - Any .cpp file
    - main/class_views.py
    - memebook/consumers.py
    - Any file in the lib/ folder
    - Any JavaScript file
    - CSS and HTML files are of course relevant to the functionality of the website, but essentially irrelevant to any content discussed in this course. Thus, they can be ignored.
