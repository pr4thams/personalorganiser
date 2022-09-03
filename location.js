module.exports=getLocation;
function  getLocation(){
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(showPosition);
        }
        var latitude=position.coords.latitude;
        var longitude=position.coords.longitude;
        return latitude, longitude;
}