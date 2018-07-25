// let eventApi;
// const domainUrl = document.getElementById('domainName').innerText;


// if(document.getElementById('event')){
//     eventCreate = axios.create({
//         baseUrl: domainUrl + 'events/create'
//     });
// }

// if(document.getElementById('group-event')){
//     eventCreate = axios.create({
//         baseUrl: domainUrl + 'groups/events/create/'
//     });
// }

if(document.getElementById('submit')){
document.getElementById('submit').onclick = function() {
    document.getElementById('map').style="";
    
    const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: undefined
    });

    const geocoder = new google.maps.Geocoder();

    geocodeAddress(geocoder, map);

    function geocodeAddress(geocoder, resultsMap) {
    let address = document.getElementsByName('street')[0].value + 
        document.getElementsByName('apt')[0].value + 
        document.getElementsByName('city')[0].value + 
        document.getElementsByName('state')[0].value +
        document.getElementsByName('zip')[0].value;

    geocoder.geocode({'address': address}, function(results, status) {

    if (status === 'OK') {
        document.getElementById('latitude').value = results[0].geometry.location.lat();
        document.getElementById('longitude').value = results[0].geometry.location.lng();
        let eventAddress = {lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()};
        map.setCenter(eventAddress);

        new google.maps.Marker({
            position: eventAddress,
            map: map,
            title: "You are here"
          });
    } else {
        alert('Geocode was not successful for the following reason: ' + status);
        }
    });
    }

    // if (document.getElementById('group-event')) eventCreate.post(document.getElementById(''))
};
}

function showMap(){
    document.getElementById('event-map').style="";

    let location = document.getElementById('location').value.split(',');
    // Store Event's coordinates
  const eventAddress = { lat: Number(location[0]),  lng: Number(location[1]) };

  // Map initialization
  const map = new google.maps.Map(document.getElementById('event-map'), {
    zoom: 13,
    center: eventAddress
  });

  // Add a marker for Event
  const eventAddressMarker = new google.maps.Marker({
    position: {
      lat: eventAddress.lat,
      lng: eventAddress.lng
    },
    map: map,
    title: "Yay!"
  });

  document.getElementById('showMap').style="display:none";
  document.getElementById('hideMap').style="";

}

function hideMap(){
    document.getElementById('event-map').style="display:none";
    document.getElementById('showMap').style="";
    document.getElementById('hideMap').style="display:none";
}