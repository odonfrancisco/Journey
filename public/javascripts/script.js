document.addEventListener('DOMContentLoaded', () => {

  console.log('IronGenerator JS imported successfully!');

}, false);

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

function addMember(){
  const field = document.getElementById('usersField');
  // console.log(document.getElementById('userInput').value)
  // if(document.getElementById('userInput').value.length > 0){
    const input = document.getElementById('userInput').value;
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = input;
    checkbox.name = 'users';
    checkbox.checked = true;
    field.appendChild(checkbox);
  // }
  
}