
$(document).ready(function() {

// Custom autocomplete instance.
$.widget( "app.autocomplete", $.ui.autocomplete, {

// Which class get's applied to matched text in the menu items.
options: {
highlightClass: "bold-text"
},

_renderItem: function( ul, item ) {

// Replace the matched text with a custom span. This
// span uses the class found in the "highlightClass" option.
var re = new RegExp( "(" + this.term + ")", "gi" ),
cls = this.options.highlightClass,
template = "<span class='" + cls + "'>$1</span>",
label = item.label.replace( re, template ),
$li = $( "<li/>" ).appendTo( ul );

// Create and return the custom menu item content.
$( "<a/>" ).attr( "href", "#" )
.html( label )
.appendTo( $li );

return $li;

}
});

function openInfowindow(layer, latlng, cartodb_id) {
layer.trigger('featureClick', null, latlng, null, {cartodb_id:cartodb_id}, 0);
};

var blocksData;
var lotsData;
var map;

$( "#blocks-autocomplete" ).focus(function(){
    $(this).val('');
$(this).autocomplete('search', $(this).val());
$("#leaflet-control-geosearch-qry").val('');

});
$( "#lots-autocomplete" ).focus(function(){
        $(this).val('');
$(this).autocomplete('search', $(this).val())

});
    
var reference = L.tileLayer('http://a.tiles.mapbox.com/v3/nzlur.33ed1f4a/{z}/{x}/{y}.png', {zIndex: 150});
    
var sql = new cartodb.SQL({ user: 'nzlur' });


cartodb.createVis('map', 'http://nzlur.cartodb.com/api/v2/viz/00f582aa-824c-11e4-886f-0e018d66dc29/viz.json', {

//set options for visualization
//layer_selector: false,
//legends: false,
scrollwheel: false,
tiles_loader: true,
cartodb_logo: false
//zoom: 13
}).done(function (vis, layers, layer) {


//get native leaflet map to add overlays and layers (createVis does not return a leaflet object)
var map = vis.getNativeMap();
    
var basemap = layers[0];



//get native leaflet map to add overlays and layers (createVis does not return a leaflet object)
map = vis.getNativeMap();

map.addLayer(reference);

box = $('#w');    

var NewarkZoning = layers[1];

zoningLayer = layers[1].getSubLayer(0);
console.log(zoningLayer);
//    zoningLayer.hide();
console.log(map);

//info = zoningLayer.getSQL();
//    sql.getBounds("SELECT * FROM zoning WHERE blockno='333'").done(function(bounds) {
//map.fitBounds(bounds);
//});  


map.on("geosearch_showlocation", function(data) {

//console.log(data.Location.Y, data.Location.X);
var lat = (data.Location.Y);
var lng = (data.Location.X);

//now that the location is known, we need the cartodb_id for our infowindow popup function to work
function getCartdb_id(latlng) {
//when the geosearch pans the map to the new location, we query our cartodb zoning table for the cartodb_id of the data at that location (in other words, when the marker falls we would like to know what polygon geometry it falls on, or intersects with
//this requires postgis, which we we can use in our url sql query and which would look like this otherwise
//                      
//                  SELECT cartodb_id FROM zoning 
//                  where ST_intersects(the_geom, cdb_latlng(lat,lng))

//documentation for ST_Intersects: http://postgis.net/docs/ST_Intersects.html

//improve statement to find NEAREST data to lat + lng, this is to avoid  popups not opening when marker falls on street
//new postgis sql uses distance from search results to find nearest data to marker and open popup
$.getJSON("http://zenontc.cartodb.com/api/v2/sql?q=SELECT cartodb_id, blockno, lotno, ST_Distance(the_geom::geography, ST_SetSRID(ST_Point("+lng+","+lat+"),4326)::geography) as dist FROM public.newarkzoning ORDER BY dist LIMIT 1",  function(data) {
//  $.getJSON("http://nzlur.cartodb.com/api/v2/sql?q=SELECT cartodb_id FROM zoning where ST_intersects(the_geom, cdb_latlng("+lat+","+lng+"))", function(data) {

//the results of our query should return a single-row json, test with url query or in cartodb editor

// we assign a variable to all items in that row (columns in cartodb editor)
var items = data.rows[0];

// get that cartodb_id, man!
var cartodb_id = items.cartodb_id;
var blockno = items.blockno;
var lotno = items.lotno;
    
    console.log(blockno);
    console.log(lotno);
//pan the map to the coordinates of our geosearch result and zoom in to point
map.setView([lat, lng], 15, false);

//append block and lot values in respective inputs
    
$("#blocks-autocomplete").val('Block '+blockno);
$('#lots-searchfield').fadeTo('slow', 1);

$("#lots-autocomplete").val('Lot '+lotno);
    

//open the infowindow for the data found at that location, what up 920 broad street
openInfowindow(NewarkZoning, [lat, lng], cartodb_id);
});
};
getCartdb_id();
});
    
    
//OVERLAYS

//add leaflet geosearch plugin here
//documentation: 

//SMEIJER PLUGIN GIThttps://github.com/smeijer/L.GeoSearch
//GOOGLE GEOCODING API https://developers.google.com/maps/documentation/geocoding/
new L.Control.GeoSearch({
provider: new L.GeoSearch.Provider.Google({

componentRestrictions: {"locality":"Newark"}

}),
position: 'topleft'
}).addTo(map);



$.getJSON("http://zenontc.cartodb.com/api/v2/sql?q=SELECT DISTINCT ON (blockno) cartodb_id, blockno FROM public.newarkzoning where blockno != 0", function(data){
blocksData = $.map(data.rows, function(item) {

return {
data:"block " +JSON.stringify(item.blockno),
value:"block " +JSON.stringify(item.blockno),
actual:item.blockno,
id:item.cartodb_id

}
});

}).done(function(){

$('#lots-searchfield').fadeTo('slow', 0.4);

$( "#blocks-autocomplete" ).autocomplete({
source: function(request, response) {
    var results = $.ui.autocomplete.filter(blocksData, request.term);
    response(results.slice(0,10));
},
minLength:1,
select: function( event, ui ) {
//log( ui.item ?
//"Selected: " + ui.item.actual + " aka " + ui.item.id :
//"Nothing selected, input was " + this.value );

$.getJSON("http://zenontc.cartodb.com/api/v2/sql?q=SELECT ST_Y(ST_Centroid(the_geom)) as latitude, ST_X(ST_Centroid(the_geom)) as longitude, cartodb_id, lotno FROM public.newarkzoning WHERE blockno='"+ui.item.actual+"'", function(data){

//replicate autocomplete build and look up matching lots
lotsData = $.map(data.rows, function(item) {

return {
data:"lot " +JSON.stringify(item.lotno),
value:"lot " +JSON.stringify(item.lotno),
actual:item.lotno,
id:item.cartodb_id,
lat:item.latitude,
lng:item.longitude

}

});
sql.getBounds("SELECT * FROM zoning WHERE cartodb_id="+ui.item.id+"").done(function(bounds) {
map.fitBounds(bounds).setZoom(14);
}); 
$('#lots-searchfield').fadeTo('slow', 1);

}).done(function(){

$('#lots-autocomplete').autocomplete({
highlightClass: "bold-text",
source: lotsData,
minLength:0,
select: function (event, ui){

lat = ui.item.lat;
lng = ui.item.lng;

console.log(ui.item.id);
var cartodb_id = ui.item.id;
map.setZoom(17);

openInfowindow(NewarkZoning,[lat, lng],cartodb_id);
}
})
}
).done(function(){
nextBox = $('#lots-autocomplete');
nextBox.focus();
nextBox.select();
event.preventDefault();
return false;
});

}
});

//.data('ui-autocomplete')._renderItem = function( ul, item ) {
//return $( "<li></li>" )
//.data( "ui-menu-item", item )
//.append( '<a>' + item.label + '</a>' )
//.appendTo( ul );
//};


});

//define behaviour for basemap selector
//"selected style of basemap is chosen according to the id of the list items, namely satellite and streets"
selectedStyle = $('li.selected').attr('id');

//create and overlay the selector
//hover styles and background images in css/stylesheet.css
createSelector(map);



function createSelector(layers) {
var $options = $('#layer_selector li');
$options.click(function(e) {
// get the area of the selected layer
var $li = $(e.target);
var id = $li.attr('id');
if(id == 'sat' ){
// change the basemap url in the layer[0] to toggle to sat img
// MUST APPLY SELECTED STYLE TO "SATTELITE BUTTON", push style in click event?
console.log("satellite layer selected");
var changetoSat = basemap.setUrl('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')
selectedStyle = id;
};         
if(id == 'streets' ){
//change the basemap url in the layer[0] to toggle back to the basemap from cartodb editor
console.log("streets layer selected");
var changetoStreets = basemap.setUrl("http://a.tiles.mapbox.com/v4/nzlur.kgh9n3dp/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibnpsdXIiLCJhIjoiUFh0MzlIWSJ9.1mVHwMcRhliArgC-uE9S1w");
selectedStyle = id;
}

});
}
});
});
