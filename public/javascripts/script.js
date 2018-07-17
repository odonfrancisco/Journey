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

// const commentApiUrl = process.env.DOMAIN + 'api/events/pictures/comment';

// function console(){
//   console.log(req)
// }

const commentApi = axios.create({
  baseURL: 'http://localhost:3000/api/events/pictures/comment'
});

function addComment(id){
  commentApi.post(id, {
    commentContent: document.getElementById(`${id}-addComment`).value
  })
  .then(response => {
      // console.log(response)
      window.location.reload();
    });
}

function deleteComment(picId, commentId){
  commentApi.post('/delete/' + picId + '/' + commentId)
    .then(response => {
      window.location.reload();
    });
}

function editComment(picId, commentId){
  commentApi.post('/edit/' + picId + '/' + commentId, {
    commentContent: document.getElementById(`${commentId}-editComment`).value
  })
    .then(response => {
      window.location.reload();
    });
}

const groupApi = axios.create({
  baseURL: 'http://localhost:3000/groups'
});

function usersToArray(){
  this.usersArray = [];
  let users = document.getElementsByName('users');
  for (i=0; i<users.length; i++){
    usersArray.push(users[i].value)
  }
}

function addGroupMember(groupId){
  usersToArray();
  groupApi.post('/members/add/' + groupId, {
    users: usersArray
  })
  .then(response => {
    window.location.reload();
  });

}