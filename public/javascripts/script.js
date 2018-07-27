document.addEventListener('DOMContentLoaded', () => {

  console.log('IronGenerator JS imported successfully!');

}, false);

// This function is for the phone number input, ideally want dashes between the numbers
function addSpaces(initial){
  initial.replace("/([0-9]{3})/","\1 ");
  initial.replace("/[0-9]{3} ([0-9]{3})/","\1 ");
  return initial;
}

// Capitalizes first letter of word and keeps rest lowercase. For Usernames
function capitalize(val) {
  if (typeof val !== 'string') val = '';
  return val.charAt(0).toUpperCase() + val.substring(1).toLowerCase();
}

/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function showMembersInput() {
  document.getElementById("myDropdown").classList.toggle("show");
}

// Sifts through all the users in user model while user is searching for friends to add
function filterFunction() {
  var input, filter, ul, li, a, i;
  input = document.getElementById("userInput");
  filter = input.value.toUpperCase();
  div = document.getElementById("myDropdown");
  a = div.getElementsByTagName("a");
  for (i = 0; i < a.length; i++) {
    if (a[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
      a[i].style.display = "";
    } else {
      a[i].style.display = "none";
    }
  }
}

// This adds the friend added to a form on the page so user can see who they're adding
// and it'll be uploaded through post method
function addMember(){
    const field = document.getElementById('usersField');
    const input = capitalize(document.getElementById('userInput').value);
    let checkbox = document.createElement('input');
    let label = document.createElement('label');

    checkbox.type = 'checkbox';
    checkbox.value = input;
    checkbox.name = 'users';
    checkbox.checked = true;

    label.innerText = input;
    console.log(label);

    field.appendChild(checkbox);
    field.appendChild(label);
  
}

// Deletes button and shows edit form for certain CRUD applications
function showForm(hideButton, displayForm, hidebutton2, hidebutton3){
  const Button = document.getElementById(hideButton);
  const Form = document.getElementById(displayForm);
  const button2 = document.getElementById(hidebutton2);
  const button3 = document.getElementById(hidebutton3);
  Button.style = 'display:none';
  Form.style = '';
  button2.style= 'display:none';
  button3.style= '';
}

// Function to delete edit button, show done button and show edit button for respective elements of list
function showList(button1, button2, listItems){
  const firstButton = document.getElementById(button1);
  const secondButton = document.getElementById(button2);
  const list = document.getElementsByClassName(listItems);
  firstButton.style="display:none";
  secondButton.style="";
  for (i=0; i<list.length; i++){
    // console.log('List item style: ', list[i].style.cssText)
    if (list[i].style.cssText == "display: none;"){
      list[i].style="";
    } else {
      list[i].style="display:none"
    }
  }
}

// Tried turning all those onclick variables into one function. 
  // More time than necessary
// function clickVar(fun){

//   yeet = `${fun}`
// console.log(yeet)
//   let onclick = function onclick(event){
//     yeet;
//   } 
//   return onclick
// }

function showGuests(){
  const onclick = function onclick(event) {
    hideGuests();
  };

  document.getElementById('guests').style="";
  // Changes button's words and its onclick function
  document.getElementById('show-guests-button').value="Hide Guests";
  document.getElementById('show-guests-button').outerHTML=`<input type="button" id="show-guests-button" value="Hide Guests" class="btn" onclick="hideGuests()">`;
  document.getElementById('show-guests-button').onclick=onclick;
  // Finessed the fuck out of this: instead of having two buttons on the html,
    // just have one button and change its values. It does add another line
    // of code but I feel its better than having two buttons in the html 
  // document.getElementById('show-guests-button').style="display:none";
  // document.getElementById('hide-guests-button').style="";
}

function hideGuests(){
  const onclick = function onclick(event) {
    showGuests();
  };

  document.getElementById('guests').style="display:none";
  document.getElementById('show-guests-button').value="Guests";
  document.getElementById('show-guests-button').onclick=onclick;
  // document.getElementById('show-guests-button').style="";
  // document.getElementById('hide-guests-button').style="display:none";
}

function showComments(commentsId){
  const onclick = function onclick(event) {
    hideComments(commentsId);
  };

  document.getElementById(`${commentsId}-comments`).style="";
  document.getElementById(`${commentsId}-comments-button`).value="Hide Comments";
  document.getElementById(`${commentsId}-comments-button`).onclick=onclick;
}

function hideComments(commentsId){
  const onclick = function onclick(event) {
    showComments(commentsId);
  };

  document.getElementById(`${commentsId}-comments`).style="display:none";
  document.getElementById(`${commentsId}-comments-button`).value="Comments";
  document.getElementById(`${commentsId}-comments-button`).onclick=onclick;  
}

// Function to toggle between showing event grid or list in groups. WIll add to events view
function showEventsGrid(button, show, hide){
  const changeButton = document.getElementById(button);
  const showElement = document.getElementById(show);
  const hideElement = document.getElementById(hide);
  let onclick;

  if(changeButton.value==="List View"){
    onclick = function onclick(event) {
      showEventsGrid(button,hide, show);
    };

    changeButton.value="Grid View";
    changeButton.onclick=onclick;
  } else if(changeButton.value==="Grid View"){
    onclick = function onclick(event) {
      showEventsGrid(button, hide, show);
    };

    changeButton.value="List View";
    changeButton.onclick=onclick;
  }

  showElement.style="";
  hideElement.style="display:none";
}


/* Set the width of the side navigation to 250px */
function openNav() {
  document.getElementById("mySidenav").style.width = "370px";
}

/* Set the width of the side navigation to 0 */
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}




// AXIOS WATTUP

const domainUrl = document.getElementById('domainName').innerText;

// Axios set up for comments CRUD
const commentApi = axios.create({
  baseURL: domainUrl + 'api/events/pictures/comment'
});

function addComment(id){
  // Axios Post request to add comment
  commentApi.post('/' + id, {
    // Value of the input user comments
    commentContent: document.getElementById(`${id}-addComment`).value
  })
  .then(response => {
      // console.log(response)
      window.location.reload();
    });
}

function deleteComment(picId, commentId){
  // Axios post request to delete comment
  commentApi.post('/delete/' + picId + '/' + commentId)
    .then(response => {
      window.location.reload();
    });
}

function editComment(picId, commentId){
  // Axios post request to edit comment
  commentApi.post('/edit/' + picId + '/' + commentId, {
    // Content with what user update
    commentContent: document.getElementById(`${commentId}-editComment`).value
  })
    .then(response => {
      window.location.reload();
    });
}


// Axios set up to manipulate groups using axios
const groupApi = axios.create({
  baseURL: domainUrl + 'groups'
});

// This function gets the value of all the members added to group
function usersToArray(){
  // Array to store username of each user added
  this.usersArray = [];
  // Captures all usernames 
  let users = document.getElementsByName('users');
  // Goes through all the usernames and adds each one to the usersArray
  for (i=0; i<users.length; i++){
    usersArray.push(users[i].value)
  }
}

// This function uses axios to add a group member
function addGroupMember(groupId){
  // Calls previous function to receive array with all usernames
  usersToArray();
  // Axios post request to add a member
  groupApi.post('/members/add/' + groupId, {
    // sends the array of users in the req.body
    users: usersArray
  })
  .then(response => {
    window.location.reload();
  });

}

function joinGroup(){
  groupApi.post('/join', {
    groupId: document.getElementById('groupId').value
  })
  .then(res => {
    window.location.reload();
  })
}

// Axios setup for events
const eventApi = axios.create({
  baseURL: domainUrl + 'events'
});

function joinEvent(){
  // Axios post request to have user join an event
  eventApi.post('/join', {
    // Passes the eventId in the req.body
    eventId: document.getElementById('eventId').value
  })
    .then(res => {
      window.location.reload();
    });
}

function addPic(eventId){
  let formData = new FormData();
  let pictures = document.getElementsByName('pictures')[0];
  for (i=0; i<pictures.files.length; i++){
    formData.append('image', pictures.files[i]);
  }
  // formData.append('image', pictures.files[1]);
  // Axios post request to add picture to an event
  eventApi.post('pictures/add/' + eventId, formData, { headers: {'Content-type':'multipart/form-data' }})
    .then(res => {
      window.location.reload();
      window.scrollTo(0, document.body.scrollHeight);
      // window.setTimeout(function(){window.scrollTo(0, document.body.scrollHeight)}, 5000);
    });

}

function removePic(picId){
  eventApi.get('pictures/delete/' + picId)
    .then(res => {
      window.location.reload();
    });
}

function removeInvitedUser(userId, eventId){
  eventApi.post('/remove/' + userId + '/' + eventId)
    .then(req => {
      window.location.reload();
    })
}
