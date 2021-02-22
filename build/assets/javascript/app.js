// api vars
const usersEndPoint = "https://slack.com/api/users.list";
const conversationHistoryEndPoint = `https://slack.com/api/conversations.history?inclusive=true&channel=${process.env.channel}`;
const slackOptions = { headers: { Authorization: `Bearer ${process.env.token}` } };

// document vars
const sliderEl = document.querySelector("#brightness-slider");
const threadsEl = document.querySelector("#threads");
const miniTitleEl = document.querySelector("#mini-title");
const bgSelection = document.querySelectorAll(".bg-selection");
const bodyStyle = document.body.style;

// local vars
let backgroundOpacity = 0.234;
const rootThreads = {};
let users = {};

init();

// start
function init(){

   // event handlers
   setupEventHandlers();

   // SocketIO
   setupSocketIO();

   // SLIDER
   setupSlider();

   // fetch users
   fetchUsers()
   
   // fetch history
   .then(fetchHistory);

}

// theme color event handlers
function setupEventHandlers() {
   // event handlers
   bgSelection.forEach((elem) => {
      elem.style.cursor = "pointer";
      elem.onclick = function () {
         bodyStyle.background = "rgba(" + elem.dataset.color.substring(5, elem.dataset.color.lastIndexOf(",") + 1) + backgroundOpacity + ")";
         console.log(this.dataset.miniTitleColor);
         miniTitleEl.style.color = this.dataset.miniTitleColor;
      };
   });
}

// brightness slider
function setupSlider() {
   sliderEl.value = backgroundOpacity;

   sliderEl.oninput = function (e) {
      backgroundOpacity = e.target.value / 100;
      bodyStyle.background =
         "rgba(" + bodyStyle.background.substring(5, bodyStyle.background.lastIndexOf(",") + 1) + backgroundOpacity + ")";
      "rgba(" + bodyStyle.background.substring(5, bodyStyle.background.lastIndexOf(",") + 1) + backgroundOpacity + ")";
   };
}

// ..fetch users
function fetchHistory() {
   fetch(conversationHistoryEndPoint, slackOptions)
      .then((response) => response.json())
      .then((historyThread) => {
         historyThread.messages.reverse().map(async (thread) => {
            if (thread.type === "message") {
               threadsEl.appendChild(newMessage(thread));
            }
         });
      });
}

// ..fetch users
function fetchUsers() {
   return fetch(usersEndPoint, slackOptions)
      .then((response) => response.json())
      .then((usersList) => {
         return usersList.members.reduce((members, current) => {
            return {
               ...members,
               [current.id]: {
                  name: current.name,
                  avatar: current.profile.image_512,
               },
            };
         }, {});
      })
      .then((members) => {
         users = members;
      });
}

// new file (handle only images, TO-DO: unfurl linnks)
async function newFile(file, isReply) {
   const response = await fetch(file.url_private, slackOptions);
   const image = await response.blob();

   return createImg(image, isReply);
}

// new image file
function createImg(image, isReply) {
   const publicUrl = URL.createObjectURL(image);
   const imgEl = document.createElement("img");

   imgEl.setAttribute("data-zoom", "false");
   imgEl.classList.add("img");
   imgEl.onclick = function () {
      if (this.dataset.zoom === "false") {
         this.setAttribute("data-zoom", "true");
         this.style.width = "50%";
      } else {
         this.setAttribute("data-zoom", "false");
         this.style.width = "100%";
      }
   };

   imgEl.src = publicUrl;
   imgEl.alt = "file";

   // imgEl.style.border = "2px solid #1cb7a2"
   isReply ? (imgEl.style.border = "solid 1px #b213cb") : (imgEl.style.border = "solid 1px #1cb7a2");

   return imgEl;
}

// avatar
function createAvatar(message, isReply) {
   const userEl = document.createElement("div");
   const avatarEl = document.createElement("img");
   avatarEl.src = users[message.user].avatar;
   avatarEl.width = 30;
   avatarEl.style.display = "inline-block";
   isReply ? (avatarEl.style.border = "solid 1px #b213cb") : (avatarEl.style.border = "solid 1px #1cb7a2");
   avatarEl.style.borderRadius = "2px";
   avatarEl.style.lineHeight = "100%";
   avatarEl.style.verticalAlign = "top";
   return avatarEl;
}

// user div
function createUserEl(message) {
   const userNameEl = document.createElement("div");
   userNameEl.innerHTML = `<strong>${users[message.user].name}</strong> <font style="font-size: 13px">${timeStampToDate(message.ts)}</font>`;
   userNameEl.style.display = "inline-block";
   userNameEl.style.marginBottom = "5px";
   userNameEl.style.verticalAlign = "top";
   return userNameEl;
}

// reactions
function createReactions(message) {
   const reactionContainerEl = document.createElement("div");
   if (message.reactions && message.reactions.length > 0) {
      message.reactions.forEach((reaction) => {
         const reactionEl = document.createElement("div");
         reactionContainerEl.appendChild(reactionEl);

         reactionEl.textContent = emojis[":" + reaction.name + ":"];
         reactionEl.style.display = "inline";
         reactionEl.style.margin = "2px";
      });
   }
   return reactionContainerEl;
}

// new message block
function newMessage(message, isReply) {
   const messageContainerEl = document.createElement("div");
   const messageEl = document.createElement("div");

   const messageWrapEl = document.createElement("div");
   const messageTextEl = document.createElement("div");
   messageWrapEl.classList.add("messageWrap");
   messageEl.classList.add("message-el");

   const avatarEl = createAvatar(message, isReply);

   // avatar
   messageEl.append(avatarEl);

   // username + date
   const userNameEl = createUserEl(message, isReply);

   // main div and text
   messageContainerEl.appendChild(messageEl);
   messageTextEl.textContent = message.text;
   messageWrapEl.appendChild(userNameEl);
   messageWrapEl.appendChild(messageTextEl);
   messageEl.appendChild(messageWrapEl);

   // reply style
   isReply ? (messageEl.style.border = "solid 1px #b213cb") : (messageEl.style.border = "solid 1px #1cb7a2");
   isReply ? (messageContainerEl.style.marginLeft = "10px") : (messageContainerEl.style.marginTop = "20px");

   // files
   if (message.files)
      message.files.forEach(async (file) => messageContainerEl.appendChild(await newFile(file, rootThreads[message.thread_ts])));
 
   // get thread
   if (message.thread_ts && !rootThreads[message.thread_ts]) getThread(message, messageContainerEl);

   // reaction
   messageContainerEl.appendChild(createReactions(message));

   return messageContainerEl;
}

// ..get thread
function getThread(message, container) {
   rootThreads[message.thread_ts] = true;

   fetch(`https://slack.com/api/conversations.replies?inclusive=true&channel=${process.env.channel}&ts=${message.thread_ts}`, slackOptions)
      .then((response) => response.json())
      .then((completeThread) => {
         completeThread.messages.map((block) => {
            container.appendChild(newMessage(block, true));
         });
         scrollToBottom();
      });
}

// socketIO
function setupSocketIO() {
   const socket = io("https://slack-overlay-service.herokuapp.com/");

   socket.on("connect", () => console.log("websocket conection"));
   socket.on("broadcast", async (msg) => {
      console.log(msg);
      threadsEl.appendChild(newMessage(msg.event));
      scrollToBottom();
   });
}

// date util
function timeStampToDate(ts) {
   let unix_timestamp = 1549312452;
   // Create a new JavaScript Date object based on the timestamp
   // multiplied by 1000 so that the argument is in milliseconds, not seconds.
   var date = new Date(unix_timestamp * 1000);
   // Hours part from the timestamp
   var hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();

   // Minutes part from the timestamp
   var minutes = "0" + date.getMinutes();

   // Will display time in 10:30:23 format
   var formattedTime = hours + ":" + minutes.substr(-2) + (date.getHours() > 12 ? "pm" : "am");

   return formattedTime;
}

// scorll utillity 
function scrollToBottom() {
   setTimeout(() => window.scrollTo(0, document.body.clientHeight), 500);
}