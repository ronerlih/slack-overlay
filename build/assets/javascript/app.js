var osWindowProcess = require('electron').ipcRenderer;
let isMenuCollapsed = true;
let windowState = localStorage.windowState || "corner";

// api vars
const usersEndPoint = "https://slack.com/api/users.list";
const conversationHistoryEndPoint = `https://slack.com/api/conversations.history?inclusive=true&channel=${process.env.channel}`;
const slackOptions = { headers: { Authorization: `Bearer ${process.env.token}` } };

// document vars
const sliderEl = document.querySelector("#brightness-slider");
const threadsEl = document.querySelector("#threads");
const miniTitleEl = document.querySelector("#mini-title");
const collapseWindowEl = document.querySelector("#collapse-window");
const collapseMenuEl = document.querySelector("#collapse-menu");
const headerEl = document.querySelector("header");
const body = document.body;
const bodyStyle = document.body.style;

const MAX_HEIGHT_OFFSET = 38;
// local vars
let backgroundOpacity = 0.0;
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
      document.onclick = function (e) {

         // bg color
         if (e.target.parentElement && e.target.parentElement.classList.contains("bg-selection")){
            bodyStyle.background = "rgba(" + e.target.parentElement.dataset.color.substring(5, e.target.parentElement.dataset.color.lastIndexOf(",") + 1) + backgroundOpacity + ")";
            miniTitleEl.style.color = e.target.parentElement.dataset.miniTitleColor;
         }

         // collapse menu
         if(e.target.id === "collapse-menu"){

            if(isMenuCollapsed) {
               e.target.style.transform = "rotate(180deg)";
               headerEl.style.height = "46px";
            } else {
               e.target.style.transform = "rotate(0deg)";
               headerEl.style.height = "20px";
            }
            isMenuCollapsed = !isMenuCollapsed;

         }

         // collapse window
         if(e.target.id === "collapse-window"){
            
            // save to local storage
            localStorage.windowState = windowState;

            switch (windowState){
               case "initial":
                  windowState = "side";
                  osWindowProcess.send('collapse', windowState);
                  e.target.style.transform = "rotate(270deg)";
                  break;
               case "side":
                  windowState = "swipped";
                  osWindowProcess.send('collapse', windowState);
                  e.target.style.transform = "rotate(180deg)";
                  break;
               case "swipped":
                  windowState = "corner";
                  osWindowProcess.send('collapse', windowState);
                  e.target.style.transform = "rotate(90deg)";
                  
                  break;
               case "corner":
                  windowState = "initial";
                  osWindowProcess.send('collapse', windowState);
                  e.target.style.transform = "rotate(0deg)";

                  break;
               default: console.warning( "DEFAULTED switch on app.js:87")

            } 
            
         return;
      } else {
         if (windowState === "swipped") {
                  windowState = "side";
                  osWindowProcess.send('collapse', windowState);
                  collapseWindowEl.style.transform = "rotate(270deg)";
         }

      };

      document.onkeypress = function (e) {
         e = e || window.event;
         if (e.key.toLowerCase() === "t")
            collapseWindowEl.click();
     };
   }

   // trigger last window mode
   // collapseWindowEl.click();
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
         console.log(historyThread)
         if (historyThread.messages)
         historyThread.messages.reverse().map(async (thread) => {
            if (thread.type === "message") {
               threadsEl.appendChild(newMessage(thread));
            }
         });
      })
      .then(scrollToBottom);
}

// ..fetch users
function fetchUsers() {
   return fetch(usersEndPoint, slackOptions)
      .then((response) => response.json())
      .then((usersList) => {
         console.log({usersList})
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
         this.classList.add('zoom-in')

      } else {
         this.classList.remove('zoom-in')
         this.setAttribute("data-zoom", "false");
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
      reactionContainerEl.style.marginLeft = "32px";
      message.reactions.forEach((reaction) => {
         const reactionEl = document.createElement("div");
         reactionContainerEl.appendChild(reactionEl);
         reactionEl.innerHTML = `${emojis[":" + reaction.name + ":"]} <span style="font-size:12px; margin-left:-4px; font-family:Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif">${reaction.count}</span>`;
         reactionEl.style.display = "inline";
         reactionEl.style.color = "#5639caad";
         reactionEl.style.margin = "2px";
      });
   }
   return reactionContainerEl;
}

function createCollapsThreadBtn() {
   const collapsThreadBtn = document.createElement("i");
   collapsThreadBtn.classList.add("fas","fa-chevron-circle-right") 
   collapsThreadBtn.style.padding = "5px 5px 2px 14px";
   collapsThreadBtn.style.position = "absolute";
   collapsThreadBtn.style.color = "#5639caad";
   collapsThreadBtn.style.zIndex = 5;

   collapsThreadBtn.onclick =  e => {
      // container.style.maxHeight = `calc(${container.firstElementChild.clientHeight}px + 24px)`;
      e.stopPropagation();
      console.log(e.target.parentElement)
      const collapsed = e.target.parentElement.classList.contains("collapse"); 
            if (collapsed){
               console.log(e.target.parentElement)
               e.target.parentElement.classList.remove("collapse")
               e.target.parentElement.style.maxHeight = `${e.target.parentElement.children.length * 100}px`;
               e.target.style.transform = "";
               e.target.style.transform = "rotate(90deg)"

               console.log( "notCollapsed")
 
            } else {
               e.target.parentElement.classList.add("collapse")
               e.target.style.transform = "rotate(0deg)"
               e.target.parentElement.style.maxHeight = `${e.target.parentElement.firstElementChild.clientHeight + MAX_HEIGHT_OFFSET}px`;

     }
   }
   return collapsThreadBtn;
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
   // 12b9c958
   // reply style
   isReply ? (messageEl.style.border = "solid 1px #b213cb") : (messageEl.style.border = "solid 1px #1cb7a2");
   isReply ? (messageEl.style.backgroundColor = "#3950caad") : 0;
   isReply ? (messageContainerEl.style.margin = "20px 0px 0px 30px") : (messageContainerEl.style.margin = "80px 0px 10px 0px");

   // isReply ? (messageContainerEl.style.display = "none") : (messageContainerEl.style.display = "block")

   
   // files
   if (message.files)
      message.files.forEach(async (file) => messageContainerEl.appendChild(await newFile(file, rootThreads[message.thread_ts])));
 
   // get thread
   if (message.thread_ts && !rootThreads[message.thread_ts]) {
      messageContainerEl.appendChild(createCollapsThreadBtn());
      messageContainerEl.classList.add("collapse");
      messageContainerEl.style.transition =  "max-height 0.5s ease-in-out";

      getThread(message, messageContainerEl);

   }
  
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
               container.classList.add("collapse");
               container.style.transition = "max-height 0.5s cubic-bezier(0.99, 0.01, 0.01, 0.99) 0s";
               container.style.overflow = "hidden";
               container.style.maxHeight = `${container.firstElementChild.clientHeight + MAX_HEIGHT_OFFSET}px`;
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
      if(msg.event.type === "message")
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