document.addEventListener('DOMContentLoaded', () => {

  console.log('IronGenerator JS imported successfully!');

}, false);

// This function is for the phone number input, ideally want dashes between the numbers
function addSpaces(initial){
  initial.replace("/([0-9]{3})/","\1 ");
  initial.replace("/[0-9]{3} ([0-9]{3})/","\1 ");
  return initial;
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
    const input = document.getElementById('userInput').value.toLowerCase();
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
function showForm(hideButton, displayForm, hidebutton2){
  const Button = document.getElementById(hideButton);
  const Form = document.getElementById(displayForm);
  const button2 = document.getElementById(hidebutton2);
  Form.style = '';
  Button.style = 'display:none';
  button2.style= 'display:none';
}