let eventApi;
const domainUrl = document.getElementById('domainName').innerText;


if(document.getElementById('event')){
    eventCreate = axios.create({
        baseUrl: domainUrl + 'events/create'
    });
}

if(document.getElementById('group-event')){
    eventCreate = axios.create({
        baseUrl: domainUrl + 'groups/events/create/'
    });
}

document.getElementById('submit').onclick = function() {
    
    const map = new google.maps.Map(document.getElementById('map'));

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
    } else {
        alert('Geocode was not successful for the following reason: ' + status);
        }
    });
    }

};
